-- =========================================================================
-- Thoughts2Lyfe - Discount / promo codes
-- Run this in the Supabase SQL Editor AFTER schema.sql, admin.sql, products.sql.
-- Safe to re-run. Lets the owner create promo codes in the admin dashboard.
-- (Applying a code at checkout is wired up in a follow-up change.)
-- =========================================================================

create table if not exists public.discounts (
  code text primary key,                       -- the promo code (stored UPPERCASE)
  type text not null default 'percent',        -- 'percent' or 'fixed'
  value integer not null,                      -- percent (1-100) OR fixed amount in CENTS
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists discounts_set_updated_at on public.discounts;
create trigger discounts_set_updated_at
before update on public.discounts
for each row execute function public.set_updated_at();

alter table public.discounts enable row level security;

-- Anyone can read ACTIVE codes (needed to validate a code at checkout).
drop policy if exists "discounts_select_active" on public.discounts;
create policy "discounts_select_active"
on public.discounts for select
using (active = true);

-- Admins can do everything.
drop policy if exists "discounts_all_admin" on public.discounts;
create policy "discounts_all_admin"
on public.discounts for all
using (public.is_admin())
with check (public.is_admin());
