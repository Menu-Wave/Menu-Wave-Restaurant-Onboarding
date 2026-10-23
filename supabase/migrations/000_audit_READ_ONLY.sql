-- 000_audit_READ_ONLY.sql
-- Run this FIRST in the Supabase SQL editor. It changes nothing.
-- Send me the results of each query so I can check the later migrations against your real schema.

-- 1. Columns of the tables the migrations touch
select table_name, column_name, data_type, is_nullable, column_default
from information_schema.columns
where table_schema = 'public'
  and table_name in ('restaurants','staff','orders','menu_items','categories')
order by table_name, ordinal_position;

-- 2. Every RLS policy (who can read/write what)
select tablename, policyname, cmd, roles, qual, with_check
from pg_policies
where schemaname = 'public'
order by tablename, policyname;

-- 3. Triggers (e.g. whatever generates orders.public_code / restaurant_id today)
select event_object_table as table_name, trigger_name, action_timing, event_manipulation, action_statement
from information_schema.triggers
where trigger_schema = 'public'
order by 1, 2;

-- 4. Existing functions and views
select routine_name, routine_type from information_schema.routines where routine_schema = 'public' order by 1;
select table_name from information_schema.views where table_schema = 'public' order by 1;

-- 5. What the anon role can touch (this answers the "can anyone read all orders?" question)
select table_name, privilege_type
from information_schema.role_table_grants
where grantee = 'anon' and table_schema = 'public'
order by 1, 2;

-- 6. Constraints on restaurants / staff / orders (NOT NULL extras my inserts must satisfy)
select conrelid::regclass as table_name, conname, pg_get_constraintdef(oid) as definition
from pg_constraint
where conrelid in ('public.restaurants'::regclass, 'public.staff'::regclass, 'public.orders'::regclass);
