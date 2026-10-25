-- =========================================================================
-- Thoughts2Lyfe - Saved custom designs from the Design Studio
-- Run in the Supabase SQL Editor AFTER schema.sql, admin.sql, studio.sql.
-- Safe to re-run.
--
-- The Design Studio lets a customer build a garment, but nothing is persisted
-- today, so a custom piece can't actually be added to a cart or ordered. This
-- table stores a finished custom design (guest or signed-in) so it can be
-- priced, attached to an order, and sent to production.
-- =========================================================================

create table if not exists public.custom_designs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users (id) on delete set null,   -- null for guests
  garment_id uuid references public.garments (id) on delete set null,
  garment_color text,
  size text,
  layers jsonb not null default '{}'::jsonb,   -- placed artwork/text per view (studio output)
  preview jsonb not null default '{}'::jsonb,  -- flattened preview image URLs per view
  computed_price integer not null default 0,   -- cents: garment base + print/text fees
  name text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists custom_designs_user_id_idx on public.custom_designs (user_id);

drop trigger if exists custom_designs_set_updated_at on public.custom_designs;
create trigger custom_designs_set_updated_at
before update on public.custom_designs
for each row execute function public.set_updated_at();

alter table public.custom_designs enable row level security;

-- A signed-in user can read / manage their own saved designs.
drop policy if exists "custom_designs_select_own" on public.custom_designs;
create policy "custom_designs_select_own"
on public.custom_designs for select
using (auth.uid() = user_id);

drop policy if exists "custom_designs_insert_own" on public.custom_designs;
create policy "custom_designs_insert_own"
on public.custom_designs for insert
with check (auth.uid() = user_id);

drop policy if exists "custom_designs_update_own" on public.custom_designs;
create policy "custom_designs_update_own"
on public.custom_designs for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

-- Admins can see everything (fulfilment / production).
drop policy if exists "custom_designs_all_admin" on public.custom_designs;
create policy "custom_designs_all_admin"
on public.custom_designs for all
using (public.is_admin())
with check (public.is_admin());

-- Data API grants (required for tables created on/after Oct 30, 2026).
-- Guest designs are created server-side with the service_role key, so no anon grant.
grant select, insert, update, delete on public.custom_designs to authenticated;
grant select, insert, update, delete on public.custom_designs to service_role;
