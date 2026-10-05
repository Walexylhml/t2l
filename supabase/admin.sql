-- =========================================================================
-- Thoughts2Lyfe - Admin role + order-management policies
-- Run this in the Supabase SQL Editor AFTER schema.sql.
-- Safe to re-run: uses "if not exists" / "create or replace" / "drop ... if exists".
--
-- What it does:
--   1. Adds an is_admin flag to profiles (default false).
--   2. Adds a helper is_admin() that says whether the current user is an admin.
--   3. Lets admins READ every order + order item, and UPDATE order status
--      (e.g. mark fulfilled) from the browser. Normal users are unaffected -
--      they still only see their own orders.
--
-- After running this, make YOUR account an admin with (replace the email):
--   update public.profiles set is_admin = true
--   where id = (select id from auth.users where lower(email) = lower('you@example.com'));
-- =========================================================================

-- 1. Admin flag on profiles ------------------------------------------------
alter table public.profiles
  add column if not exists is_admin boolean not null default false;

-- 2. Helper: is the currently signed-in user an admin? ---------------------
-- SECURITY DEFINER so it can read profiles regardless of row-level security
-- (this avoids any policy recursion).
create or replace function public.is_admin()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select coalesce(
    (select p.is_admin from public.profiles p where p.id = auth.uid()),
    false
  );
$$;

-- 3. Admin read/update policies -------------------------------------------
-- These are ADDED alongside the existing "own orders" policies. Postgres
-- combines permissive policies with OR, so a normal user still sees only
-- their own orders, while an admin sees all.

drop policy if exists "orders_select_admin" on public.orders;
create policy "orders_select_admin"
on public.orders for select
using (public.is_admin());

drop policy if exists "order_items_select_admin" on public.order_items;
create policy "order_items_select_admin"
on public.order_items for select
using (public.is_admin());

drop policy if exists "orders_update_admin" on public.orders;
create policy "orders_update_admin"
on public.orders for update
using (public.is_admin())
with check (public.is_admin());
