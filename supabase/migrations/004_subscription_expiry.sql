-- 004_subscription_expiry.sql
-- Deactivates restaurants whose subscription lapsed (3-day grace). Grandfathered restaurants (no period end) are never touched.

create or replace function public.mw_expire_subscriptions() returns integer
language plpgsql security definer set search_path = public as $$
declare n integer;
begin
  update public.subscriptions set status = 'past_due', updated_at = now()
  where status = 'active' and current_period_end is not null
    and current_period_end < now() - interval '3 days';

  with d as (
    update public.restaurants r set is_active = false
    from public.subscriptions s
    where s.restaurant_id = r.id
      and s.status in ('past_due','cancelled')
      and s.current_period_end is not null
      and s.current_period_end < now() - interval '3 days'
      and r.is_active
    returning r.id
  ) select count(*) into n from d;
  return n;
end $$;
revoke all on function public.mw_expire_subscriptions() from public, anon, authenticated;

-- Hourly schedule. Requires the pg_cron extension (Dashboard → Database → Extensions → pg_cron).
do $$ begin
  if exists (select 1 from pg_extension where extname = 'pg_cron') then
    perform cron.schedule('mw-expire-subscriptions', '0 * * * *', 'select public.mw_expire_subscriptions()');
  else
    raise notice 'pg_cron not enabled: enable it, then re-run this file, or call mw_expire_subscriptions() another way.';
  end if;
end $$;
