-- 003_customer_order_status.sql
-- Lets the anonymous customer app check ONE order's status by its public code,
-- so it no longer needs realtime SELECT access to the whole orders table.

create index if not exists orders_public_code_idx on public.orders (public_code);

create or replace function public.order_status(p_public_code text)
returns table (status text, payment_status text)
language sql stable security definer set search_path = public as $$
  select o."Status"::text, o.payment_status::text
  from public.orders o
  where upper(o.public_code) = upper(p_public_code)
  limit 1
$$;
grant execute on function public.order_status(text) to anon, authenticated;
