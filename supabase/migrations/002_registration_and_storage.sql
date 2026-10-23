-- 002_registration_and_storage.sql
-- Self-serve registration RPCs and the menu-image bucket.

create or replace function public.slug_available(p_slug text) returns boolean
language sql stable security definer set search_path = public as $$
  select p_slug ~ '^[a-z0-9][a-z0-9-]{1,38}[a-z0-9]$'
     and p_slug <> all (array['admin','api','app','www','login','register','onboarding','dashboard','billing',
                              'kitchen','cashier','staff','super','superadmin','menu','pricing','static','assets'])
     and not exists (select 1 from public.restaurants where slug = p_slug)
$$;
grant execute on function public.slug_available(text) to anon, authenticated;

-- Creates the restaurant + manager staff row + incomplete subscription for the calling user.
-- The restaurant stays is_active = false until the Paystack webhook confirms payment.
create or replace function public.register_restaurant(
  p_name text, p_slug text, p_table_count integer, p_order_code_prefix text, p_currency text default 'NGN'
) returns bigint language plpgsql security definer set search_path = public as $$
declare
  v_uid    uuid := auth.uid();
  v_id     bigint;
  v_prefix text := upper(trim(p_order_code_prefix));
  v_name   text := trim(p_name);
begin
  if v_uid is null then raise exception 'Please sign in first.'; end if;
  if exists (select 1 from public.staff where id = v_uid) then
    raise exception 'This account is already linked to a restaurant.';
  end if;
  if length(v_name) < 2 or length(v_name) > 80 then raise exception 'Restaurant name must be 2–80 characters.'; end if;
  if not public.slug_available(p_slug) then raise exception 'That link is not available. Try another.'; end if;
  if p_table_count is null or p_table_count < 1 or p_table_count > 200 then raise exception 'Tables must be between 1 and 200.'; end if;
  if v_prefix !~ '^[A-Z]{2,5}$' then raise exception 'Order code prefix must be 2–5 letters.'; end if;
  if p_currency not in ('NGN','USD','GBP','EUR') then raise exception 'Unsupported currency.'; end if;

  insert into public.restaurants (name, slug, currency, table_count, order_code_prefix, is_active, tier, owner_id)
  values (v_name, p_slug, p_currency, p_table_count, v_prefix, false, 'tier1', v_uid)
  returning id into v_id;

  insert into public.staff (id, restaurant_id, role) values (v_uid, v_id, 'manager');
  insert into public.subscriptions (restaurant_id, tier, status) values (v_id, 'tier1', 'incomplete');
  return v_id;
exception when unique_violation then
  raise exception 'That link was just taken. Try another.';
end $$;
revoke all on function public.register_restaurant(text, text, integer, text, text) from public, anon;
grant execute on function public.register_restaurant(text, text, integer, text, text) to authenticated;

-- ---------- menu image storage: public read, staff write only inside their own restaurant folder ----------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('menu-images', 'menu-images', true, 2097152, array['image/jpeg','image/png','image/webp'])
on conflict (id) do update set public = true, file_size_limit = excluded.file_size_limit,
                               allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "menu images public read" on storage.objects;
create policy "menu images public read" on storage.objects for select using (bucket_id = 'menu-images');

drop policy if exists "menu images staff insert" on storage.objects;
create policy "menu images staff insert" on storage.objects for insert to authenticated
  with check (bucket_id = 'menu-images' and (storage.foldername(name))[1] = public.mw_current_restaurant_id()::text);

drop policy if exists "menu images staff update" on storage.objects;
create policy "menu images staff update" on storage.objects for update to authenticated
  using (bucket_id = 'menu-images' and (storage.foldername(name))[1] = public.mw_current_restaurant_id()::text);

drop policy if exists "menu images staff delete" on storage.objects;
create policy "menu images staff delete" on storage.objects for delete to authenticated
  using (bucket_id = 'menu-images' and (storage.foldername(name))[1] = public.mw_current_restaurant_id()::text);
