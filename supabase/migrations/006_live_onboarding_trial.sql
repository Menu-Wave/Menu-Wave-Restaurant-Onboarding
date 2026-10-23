-- Menu-Wave live onboarding integration.
-- Uses the EXISTING subscription_plans + subscriptions architecture.
-- Pricing is already managed in public.subscription_plans.

create or replace function public.slug_available(p_slug text) returns boolean
language sql stable security definer set search_path = public as $$
  select p_slug ~ '^[a-z0-9][a-z0-9-]{1,38}[a-z0-9]$'
     and p_slug <> all (array['admin','api','app','www','login','register','onboarding','dashboard','billing','kitchen','cashier','staff','super','superadmin','menu','pricing','static','assets'])
     and not exists (select 1 from public.restaurants where slug = p_slug)
$$;
revoke all on function public.slug_available(text) from public;
grant execute on function public.slug_available(text) to anon, authenticated;

create or replace function public.register_restaurant(p_name text,p_slug text,p_table_count integer,p_order_code_prefix text,p_currency text default 'NGN')
returns bigint language plpgsql security definer set search_path=public as $$
declare v_uid uuid:=auth.uid(); v_id bigint; v_plan_id uuid; v_now timestamptz:=now(); v_prefix text:=upper(trim(p_order_code_prefix)); v_name text:=trim(p_name);
begin
 if v_uid is null then raise exception 'Please sign in first.'; end if;
 if exists(select 1 from public.staff where id=v_uid) then raise exception 'This account is already linked to a restaurant.'; end if;
 if length(v_name)<2 or length(v_name)>80 then raise exception 'Restaurant name must be 2–80 characters.'; end if;
 if not public.slug_available(p_slug) then raise exception 'That link is not available. Try another.'; end if;
 if p_table_count is null or p_table_count<1 or p_table_count>200 then raise exception 'Tables must be between 1 and 200.'; end if;
 if v_prefix !~ '^[A-Z]{2,5}$' then raise exception 'Order code prefix must be 2–5 letters.'; end if;
 if p_currency<>'NGN' then raise exception 'Menu-Wave subscriptions currently support NGN restaurants only.'; end if;
 select id into v_plan_id from public.subscription_plans where code='starter' and is_active=true limit 1;
 if v_plan_id is null then raise exception 'Starter plan is not configured.'; end if;
 insert into public.restaurants(name,slug,currency,table_count,order_code_prefix,is_active,tier,has_ai_analysis,has_ai_chatbot)
 values(v_name,p_slug,p_currency,p_table_count,v_prefix,true,'tier1',false,false) returning id into v_id;
 insert into public.staff(id,restaurant_id,role) values(v_uid,v_id,'owner');
 insert into public.subscriptions(restaurant_id,plan_id,status,trial_duration_days,trial_start,trial_end)
 values(v_id,v_plan_id,'trialing',14,v_now,v_now+interval '14 days');
 return v_id;
exception when unique_violation then raise exception 'That link was just taken. Try another.';
end $$;
revoke all on function public.register_restaurant(text,text,integer,text,text) from public,anon;
grant execute on function public.register_restaurant(text,text,integer,text,text) to authenticated;

drop policy if exists "Restaurant members can read own subscription" on public.subscriptions;
create policy "Restaurant members can read own subscription" on public.subscriptions for select to authenticated
using(exists(select 1 from public.staff s where s.id=(select auth.uid()) and (s.restaurant_id=subscriptions.restaurant_id or s.role='platform_admin')));

create or replace function public.select_trial_plan(p_plan_code text) returns void
language plpgsql security definer set search_path=public as $$
declare v_uid uuid:=auth.uid(); v_restaurant_id bigint; v_plan public.subscription_plans%rowtype; v_sub public.subscriptions%rowtype; v_menu_count integer; v_tier text;
begin
 if v_uid is null then raise exception 'Please sign in first.'; end if;
 select restaurant_id into v_restaurant_id from public.staff where id=v_uid and role in ('owner','manager') limit 1;
 if v_restaurant_id is null then raise exception 'Restaurant account not found.'; end if;
 select * into v_plan from public.subscription_plans where code=p_plan_code and is_active=true;
 if v_plan.id is null then raise exception 'Plan not found.'; end if;
 select * into v_sub from public.subscriptions where restaurant_id=v_restaurant_id for update;
 if v_sub.id is null or v_sub.status<>'trialing' or v_sub.trial_end<=now() then raise exception 'Plan can only be changed during an active trial.'; end if;
 select count(*) into v_menu_count from public.menu_items where restaurant_id=v_restaurant_id;
 if coalesce((v_plan.limits->>'menu_items')::integer,0)>0 and v_menu_count>(v_plan.limits->>'menu_items')::integer then raise exception 'Menu item limit exceeded for this plan.'; end if;
 if coalesce((v_plan.limits->>'tables')::integer,0)>0 and (select table_count from public.restaurants where id=v_restaurant_id)>(v_plan.limits->>'tables')::integer then raise exception 'Table limit exceeded for this plan.'; end if;
 v_tier:=case v_plan.code when 'starter' then 'tier1' when 'growth' then 'tier2' when 'pro' then 'tier3' else null end;
 if v_tier is null then raise exception 'Unsupported plan.'; end if;
 update public.subscriptions set plan_id=v_plan.id,updated_at=now() where id=v_sub.id;
 update public.restaurants set tier=v_tier,has_ai_analysis=coalesce((v_plan.features->>'ai_analysis')::boolean,false),has_ai_chatbot=coalesce((v_plan.features->>'ai_chatbot')::boolean,false),is_active=true where id=v_restaurant_id;
end $$;
revoke all on function public.select_trial_plan(text) from public,anon;
grant execute on function public.select_trial_plan(text) to authenticated;
