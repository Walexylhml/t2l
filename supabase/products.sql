-- =========================================================================
-- Thoughts2Lyfe - Products catalog in the database
-- Run this in the Supabase SQL Editor AFTER schema.sql and admin.sql.
-- Safe to re-run. Moves the hardcoded catalog into a table the owner can
-- edit from the admin dashboard. The store reads ACTIVE products from here.
-- =========================================================================

create table if not exists public.products (
  id text primary key,
  slug text unique not null,
  name text not null,
  price integer not null,            -- price in CENTS (Stripe unit_amount)
  category text not null,            -- horror | pop-culture | social-cause | originals
  garment text not null,             -- Tee | Hoodie | Crewneck
  image text not null,
  description text not null default '',
  featured boolean not null default false,
  badge text,
  active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists products_set_updated_at on public.products;
create trigger products_set_updated_at
before update on public.products
for each row execute function public.set_updated_at();

alter table public.products enable row level security;

-- Anyone (including logged-out shoppers) can read ACTIVE products.
drop policy if exists "products_select_active" on public.products;
create policy "products_select_active"
on public.products for select
using (active = true);

-- Admins can do everything, including seeing inactive products.
drop policy if exists "products_all_admin" on public.products;
create policy "products_all_admin"
on public.products for all
using (public.is_admin())
with check (public.is_admin());

-- Seed with the current catalog (only inserts rows that don't exist yet).
insert into public.products (id, slug, name, price, category, garment, image, description, featured, badge, sort_order) values
  ('p_midnight_slasher', 'midnight-slasher-hoodie', 'Midnight Slasher Hoodie', 6800, 'horror', 'Hoodie', '/images/products/midnight-slasher-hoodie.png', 'A love letter to late-night creature features. 450gsm heavyweight fleece, dropped shoulders, and a distressed moonlit print that only gets better with every wash.', true, 'Best Seller', 1),
  ('p_final_girl', 'final-girl-club-tee', 'Final Girl Club Tee', 3400, 'horror', 'Tee', '/images/products/final-girl-tee.png', 'For the ones who survive the third act. Garment-dyed washed black cotton with a retro slasher-poster graphic in blood red and cream.', true, null, 2),
  ('p_static_channel', 'static-channel-tee', 'Static Channel Tee', 3400, 'pop-culture', 'Tee', '/images/products/static-channel-tee.png', 'They are here. A glitched-out CRT graphic on a heavyweight off-white tee, printed with water-based inks for a soft, broken-in hand.', false, 'New', 3),
  ('p_arcade_ghosts', 'arcade-ghosts-hoodie', 'Arcade Ghosts Hoodie', 6800, 'pop-culture', 'Hoodie', '/images/products/arcade-ghosts-hoodie.png', 'Insert coin. Deep purple fleece with a pixel-art ghost squad in neon teal and magenta. Kangaroo pocket, ribbed cuffs, zero regrets.', true, null, 4),
  ('p_mind_over_matter', 'mind-over-matter-tee', 'Mind Over Matter Tee', 3600, 'social-cause', 'Tee', '/images/products/mind-over-matter-tee.png', 'Part of our mental health series. 20% of every sale goes directly to community mental health organizations. Wear the conversation.', false, 'Gives Back', 5),
  ('p_breathe_again', 'breathe-again-hoodie', 'Breathe Again Hoodie', 7200, 'social-cause', 'Hoodie', '/images/products/breathe-again-hoodie.png', 'Embroidered floral lungs on a cream heavyweight hoodie - a reminder to slow down. A portion of proceeds supports recovery programs.', true, 'Gives Back', 6),
  ('p_thoughts_become_things', 'thoughts-become-things-tee', 'Thoughts Become Things Tee', 3200, 'originals', 'Tee', '/images/products/thoughts-become-things-tee.png', 'The mantra that started it all. Heavy condensed type in an iridescent chrome print on a boxy-fit black tee.', false, null, 7),
  ('p_chrome_heart', 'chrome-heart-crewneck', 'Chrome Heart Crewneck', 5800, 'originals', 'Crewneck', '/images/products/chrome-heart-crewneck.png', 'Liquid-chrome heart on heather charcoal. Midweight loopback cotton with a relaxed fit made for layering.', false, 'Limited', 8)
on conflict (id) do nothing;
