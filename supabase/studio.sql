-- =========================================================================
-- Thoughts2Lyfe - Design Studio (Phase 1: data)
-- Run this in the Supabase SQL Editor AFTER schema.sql, admin.sql, storage.sql.
-- Safe to re-run.
--
-- Creates:
--   garments        - the blank garment types customers design on (the 8 types)
--   designs         - the library of designs customers drag onto a garment
--   studio_settings - one row of configurable print pricing (edit in admin)
-- =========================================================================

-- -------------------------------------------------------------------------
-- 1. Garments: blank garment types + their base price, views, sizes, colors.
--    Mockup images are nullable for now (the studio shows a placeholder
--    outline until you upload real ones in admin).
-- -------------------------------------------------------------------------
create table if not exists public.garments (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  base_price integer not null default 0,              -- cents
  views text[] not null default '{front,back,arm}',   -- which views it supports
  sizes text[] not null default '{S,M,L,XL,2XL}',
  colors text[] not null default '{}',                -- optional
  image_front text,
  image_back text,
  image_arm text,
  active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists garments_set_updated_at on public.garments;
create trigger garments_set_updated_at
before update on public.garments
for each row execute function public.set_updated_at();

alter table public.garments enable row level security;

drop policy if exists "garments_select_active" on public.garments;
create policy "garments_select_active"
on public.garments for select
using (active = true);

drop policy if exists "garments_all_admin" on public.garments;
create policy "garments_all_admin"
on public.garments for all
using (public.is_admin())
with check (public.is_admin());

-- -------------------------------------------------------------------------
-- 2. Designs: the library customers pick from and drag onto a garment.
--    placement tags where the design is meant to go; "any" fits anywhere.
-- -------------------------------------------------------------------------
create table if not exists public.designs (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  image text not null,                 -- public URL from the images bucket
  placement text not null default 'any'
    check (placement in ('front', 'back', 'arm', 'any')),
  active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists designs_set_updated_at on public.designs;
create trigger designs_set_updated_at
before update on public.designs
for each row execute function public.set_updated_at();

alter table public.designs enable row level security;

drop policy if exists "designs_select_active" on public.designs;
create policy "designs_select_active"
on public.designs for select
using (active = true);

drop policy if exists "designs_all_admin" on public.designs;
create policy "designs_all_admin"
on public.designs for all
using (public.is_admin())
with check (public.is_admin());

-- -------------------------------------------------------------------------
-- 3. Studio settings: a single row of configurable print pricing (cents).
--    Price of a custom piece = garment.base_price + a fee for each place a
--    design is added + a fee per text block. Edit these in admin.
-- -------------------------------------------------------------------------
create table if not exists public.studio_settings (
  id integer primary key default 1 check (id = 1),
  print_fee_front integer not null default 0,
  print_fee_back integer not null default 0,
  print_fee_arm integer not null default 0,
  text_fee integer not null default 0,
  updated_at timestamptz not null default now()
);

insert into public.studio_settings (id) values (1) on conflict (id) do nothing;

drop trigger if exists studio_settings_set_updated_at on public.studio_settings;
create trigger studio_settings_set_updated_at
before update on public.studio_settings
for each row execute function public.set_updated_at();

alter table public.studio_settings enable row level security;

-- Anyone can read the fees (needed to show a live price in the studio).
drop policy if exists "studio_settings_select_all" on public.studio_settings;
create policy "studio_settings_select_all"
on public.studio_settings for select
using (true);

drop policy if exists "studio_settings_all_admin" on public.studio_settings;
create policy "studio_settings_all_admin"
on public.studio_settings for all
using (public.is_admin())
with check (public.is_admin());

-- -------------------------------------------------------------------------
-- 4. Seed the 8 garment types. Prices are PLACEHOLDERS in cents - edit them
--    (and sizes/colors) from the admin Garments tab. Safe to re-run.
-- -------------------------------------------------------------------------
insert into public.garments (slug, name, base_price, sizes, sort_order) values
  ('adult-tshirt',              'Adult T-Shirt',              2500, '{S,M,L,XL,2XL}', 1),
  ('youth-tshirt',              'Youth T-Shirt',              2000, '{XS,S,M,L,XL}',  2),
  ('adult-long-sleeve-tshirt',  'Adult Long Sleeve T-Shirt',  3000, '{S,M,L,XL,2XL}', 3),
  ('youth-long-sleeve-tshirt',  'Youth Long Sleeve T-Shirt',  2500, '{XS,S,M,L,XL}',  4),
  ('adult-crewneck-sweatshirt', 'Adult Crewneck Sweatshirt',  4000, '{S,M,L,XL,2XL}', 5),
  ('youth-crewneck-sweatshirt', 'Youth Crewneck Sweatshirt',  3500, '{XS,S,M,L,XL}',  6),
  ('adult-hoodie',              'Adult Hoodie',               5000, '{S,M,L,XL,2XL}', 7),
  ('youth-hoodie',              'Youth Hoodie',               4500, '{XS,S,M,L,XL}',  8)
on conflict (slug) do nothing;
