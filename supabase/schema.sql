-- =========================================================================
-- Thoughts2Lyfe - database schema for guest checkout + email order claiming
-- Run this in the Supabase SQL Editor (SQL Editor -> New query -> Run).
-- Safe to re-run: uses "if not exists" and "create or replace".
-- =========================================================================

-- Extensions ---------------------------------------------------------------
create extension if not exists "pgcrypto";

-- Orders -------------------------------------------------------------------
-- One row per order. Guests are allowed: user_id is nullable and is filled in
-- later when a user signs up with the same (verified) email.
create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users (id) on delete set null,
  email text not null,
  phone text,
  full_name text,
  shipping_address jsonb,
  status text not null default 'pending',
  amount_total integer not null default 0,
  currency text not null default 'usd',
  stripe_session_id text unique,
  stripe_payment_intent text,
  claimed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
  );

-- Store email lowercased so claiming matches reliably.
create unique index if not exists orders_stripe_session_idx on public.orders (stripe_session_id);
create index if not exists orders_email_idx on public.orders (lower(email));
create index if not exists orders_user_id_idx on public.orders (user_id);

-- Order items --------------------------------------------------------------
create table if not exists public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders (id) on delete cascade,
  product_id text not null,
  slug text,
  name text not null,
  size text,
  image text,
  unit_amount integer not null,
  quantity integer not null default 1,
  created_at timestamptz not null default now()
  );

create index if not exists order_items_order_id_idx on public.order_items (order_id);

-- Keep updated_at fresh ----------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
new.updated_at = now();
return new;
end;
$$;

drop trigger if exists orders_set_updated_at on public.orders;
create trigger orders_set_updated_at
before update on public.orders
for each row execute function public.set_updated_at();

-- Email normalisation ------------------------------------------------------
-- Force every stored email to lowercase/trimmed so matching is consistent.
create or replace function public.normalize_order_email()
returns trigger
language plpgsql
as $$
begin
new.email = lower(trim(new.email));
return new;
end;
$$;

drop trigger if exists orders_normalize_email on public.orders;
create trigger orders_normalize_email
before insert or update on public.orders
for each row execute function public.normalize_order_email();

-- =========================================================================
-- Verified-email order claiming
-- When a user confirms their email in Supabase Auth, email_confirmed_at is
-- set on auth.users. At that moment we attach any guest orders that used the
-- same email to that user. We ONLY claim on a verified email to stop someone
-- claiming another person's orders with an unconfirmed address.
-- =========================================================================
create or replace function public.claim_orders_for_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
if new.email_confirmed_at is not null
and (old.email_confirmed_at is null or old.email is distinct from new.email)
then
update public.orders
set user_id = new.id,
claimed_at = now()
where user_id is null
and lower(email) = lower(new.email);
end if;
return new;
end;
$$;

drop trigger if exists on_auth_user_email_confirmed on auth.users;
create trigger on_auth_user_email_confirmed
after update on auth.users
for each row execute function public.claim_orders_for_user();

-- =========================================================================
-- Row level security
-- Writes happen server-side with the service role key (bypasses RLS).
-- These policies let a signed-in user read ONLY their own claimed orders.
-- =========================================================================
alter table public.orders enable row level security;
alter table public.order_items enable row level security;

drop policy if exists "orders_select_own" on public.orders;
create policy "orders_select_own"
on public.orders for select
using (auth.uid() = user_id);

drop policy if exists "order_items_select_own" on public.order_items;
create policy "order_items_select_own"
on public.order_items for select
using (
  exists (
  select 1 from public.orders o
  where o.id = order_items.order_id and o.user_id = auth.uid()
  )
  );
