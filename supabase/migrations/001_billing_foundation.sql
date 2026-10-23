-- 001_billing_foundation.sql
-- Plans, subscriptions, billing idempotency, order_items, rate limiting, tier limits.
-- Additive and idempotent: safe to re-run. Does not alter existing columns' types.

create extension if not exists pgcrypto;

-- ---------- helpers (SECURITY DEFINER so they can read `staff` without RLS recursion) ----------
create or replace function public.mw_current_restaurant_id() returns bigint
language sql stable security definer set search_path = public as $$
  select restaurant_id::bigint from public.staff where id = auth.uid() limit 1
$$;

create or replace function public.mw_is_platform_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.staff where id = auth.uid() and role::text = 'platform_admin')
$$;

grant execute on function public.mw_current_restaurant_id() to authenticated;
grant execute on function public.mw_is_platform_admin() to authenticated;

-- ---------- restaurants: ownership + "suspended by super admin" flag ----------
alter table public.restaurants add column if not exists admin_suspended boolean not null default false;
alter table public.restaurants add column if not exists owner_id uuid references auth.users(id) on delete set null;

-- ---------- plans ----------
create table if not exists public.plans (
  tier               text primary key,              -- must equal restaurants.tier values: tier1 | tier2 | tier3
  name               text not null,
  price_ngn          integer not null check (price_ngn >= 0),   -- whole naira per month
  paystack_plan_code text,                          -- PLN_xxx from the Paystack dashboard (set after you create the plans)
  max_menu_items     integer not null,
  max_tables         integer not null,
  features           jsonb not null default '[]'::jsonb,
  sort_order         integer not null default 0,
  is_public          boolean not null default true
);

-- PLACEHOLDER PRICES/LIMITS: edit freely, then create matching plans in Paystack.
insert into public.plans (tier, name, price_ngn, max_menu_items, max_tables, features, sort_order) values
  ('tier1', 'Starter', 15000,  50,  15, '["QR ordering","Cashier & kitchen screens","Basic sales stats"]', 1),
  ('tier2', 'Growth',  35000, 150,  50, '["Everything in Starter","Higher menu & table limits","Priority support"]', 2),
  ('tier3', 'Pro',     75000, 500, 200, '["Everything in Growth","Highest limits","Onboarding assistance"]', 3)
on conflict (tier) do nothing;

alter table public.plans enable row level security;
drop policy if exists "plans are public" on public.plans;
create policy "plans are public" on public.plans for select to anon, authenticated using (is_public);

-- ---------- subscriptions (written ONLY by Edge Functions using the service role) ----------
create table if not exists public.subscriptions (
  restaurant_id              bigint primary key references public.restaurants(id) on delete cascade,
  tier                       text not null default 'tier1',
  status                     text not null default 'incomplete'
                             check (status in ('incomplete','active','past_due','cancelled','grandfathered')),
  paystack_customer_code     text,
  paystack_subscription_code text,
  paystack_email_token       text,
  last_reference             text,
  current_period_end         timestamptz,
  created_at                 timestamptz not null default now(),
  updated_at                 timestamptz not null default now()
);
create index if not exists subscriptions_customer_idx on public.subscriptions (paystack_customer_code);

alter table public.subscriptions enable row level security;
drop policy if exists "own subscription readable" on public.subscriptions;
create policy "own subscription readable" on public.subscriptions for select to authenticated
  using (restaurant_id = public.mw_current_restaurant_id() or public.mw_is_platform_admin());

-- Existing restaurants keep working: mark them grandfathered (no expiry).
insert into public.subscriptions (restaurant_id, tier, status)
select id, coalesce(tier::text, 'tier1'), 'grandfathered' from public.restaurants
on conflict (restaurant_id) do nothing;

-- ---------- billing idempotency log (no client access at all) ----------
create table if not exists public.billing_events (
  id            bigserial primary key,
  event_key     text not null unique,
  event_type    text not null,
  restaurant_id bigint,
  payload       jsonb,
  created_at    timestamptz not null default now()
);
alter table public.billing_events enable row level security;

-- ---------- rate limiting (used by the checkout Edge Function) ----------
create table if not exists public.rate_limits (
  key          text primary key,
  window_start timestamptz not null,
  hits         integer not null
);
alter table public.rate_limits enable row level security;

create or replace function public.mw_rate_limit(p_key text, p_max integer, p_window_seconds integer)
returns boolean language plpgsql security definer set search_path = public as $$
declare v_hits integer;
begin
  insert into public.rate_limits as r (key, window_start, hits) values (p_key, now(), 1)
  on conflict (key) do update set
    hits = case when r.window_start < now() - make_interval(secs => p_window_seconds) then 1 else r.hits + 1 end,
    window_start = case when r.window_start < now() - make_interval(secs => p_window_seconds) then now() else r.window_start end
  returning hits into v_hits;
  return v_hits <= p_max;
end $$;
revoke all on function public.mw_rate_limit(text, integer, integer) from public, anon, authenticated;

-- ---------- order_items: structured line items (the old text `Order` column stays for compatibility) ----------
create table if not exists public.order_items (
  id            bigserial primary key,
  order_id      bigint not null references public.orders(id) on delete cascade,
  restaurant_id bigint not null,
  menu_item_id  bigint,
  name          text not null,
  unit_price    numeric(12,2) not null,
  quantity      integer not null check (quantity between 1 and 50),
  created_at    timestamptz not null default now()
);
create index if not exists order_items_order_idx on public.order_items (order_id);
create index if not exists order_items_restaurant_idx on public.order_items (restaurant_id);

alter table public.order_items enable row level security;
drop policy if exists "own order items readable" on public.order_items;
create policy "own order items readable" on public.order_items for select to authenticated
  using (restaurant_id = public.mw_current_restaurant_id() or public.mw_is_platform_admin());

-- ---------- tier enforcement: menu item cap per plan ----------
create or replace function public.mw_enforce_menu_limit() returns trigger
language plpgsql security definer set search_path = public as $$
declare v_max integer; v_count integer;
begin
  select p.max_menu_items into v_max
  from public.restaurants r join public.plans p on p.tier = r.tier::text
  where r.id = new.restaurant_id;
  if v_max is null then return new; end if;   -- unknown tier: don't block
  select count(*) into v_count from public.menu_items where restaurant_id = new.restaurant_id;
  if v_count >= v_max then
    raise exception 'Menu item limit (%) reached for your plan. Upgrade to add more items.', v_max;
  end if;
  return new;
end $$;

drop trigger if exists mw_menu_limit on public.menu_items;
create trigger mw_menu_limit before insert on public.menu_items
  for each row execute function public.mw_enforce_menu_limit();
