-- 005_OPTIONAL_lock_down_anon_orders.sql
-- Run ONLY after: (a) 000_audit shows anon has SELECT on public.orders, and
-- (b) the patched customer app (polling via order_status) is deployed and working.
-- This stops anonymous visitors from reading other customers' names/orders.
-- Staff use the `authenticated` role and are unaffected; checkout inserts use the service role.
revoke select on public.orders from anon;
-- If any RLS policy on orders is still granted TO public/anon, drop it manually after reviewing 000_audit output.
