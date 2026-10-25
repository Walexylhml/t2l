-- =========================================================================
-- Thoughts2Lyfe - Discount usage tracking + limits
-- Run in the Supabase SQL Editor AFTER schema.sql, admin.sql, discounts.sql
-- and schema.sql (orders). Safe to re-run.
--
-- discounts.sql notes that applying a code at checkout is "a follow-up change".
-- This adds optional caps to a code and records each redemption against an
-- order, so a code can be limited (total uses, date window) and reported on.
-- =========================================================================

-- Optional caps on an existing promo code (null = unlimited / no window).
alter table public.discounts add column if not exists max_redemptions integer;
alter table public.discounts add column if not exists starts_at timestamptz;
alter table public.discounts add column if not exists ends_at timestamptz;

create table if not exists public.discount_redemptions (
  id uuid primary key default gen_random_uuid(),
  code text not null references public.discounts (code) on delete cascade,
  order_id uuid references public.orders (id) on delete set null,
  email text,
  amount_discounted integer not null default 0,   -- cents
  created_at timestamptz not null default now()
);

create index if not exists discount_redemptions_code_idx  on public.discount_redemptions (code);
create index if not exists discount_redemptions_order_idx on public.discount_redemptions (order_id);

alter table public.discount_redemptions enable row level security;

-- Redemptions are written server-side (checkout) with the service_role key;
-- only admins can read them from the browser.
drop policy if exists "discount_redemptions_all_admin" on public.discount_redemptions;
create policy "discount_redemptions_all_admin"
on public.discount_redemptions for all
using (public.is_admin())
with check (public.is_admin());

-- Data API grants (required for tables created on/after Oct 30, 2026).
-- No anon access; redemptions are recorded server-side.
grant select on public.discount_redemptions to authenticated;          -- admin reads (RLS guards)
grant select, insert, update, delete on public.discount_redemptions to service_role;
