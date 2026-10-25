-- =========================================================================
-- Thoughts2Lyfe - Newsletter / drop-alert signups
-- Run in the Supabase SQL Editor AFTER schema.sql, admin.sql. Safe to re-run.
-- Captures emails for drop announcements ("Drop 01 is live").
-- =========================================================================

create table if not exists public.newsletter_subscribers (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  source text,                                  -- where they signed up (footer, popup, checkout)
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create unique index if not exists newsletter_email_idx on public.newsletter_subscribers (lower(email));

alter table public.newsletter_subscribers enable row level security;

-- Anyone (logged-out visitors) can subscribe, but INSERT only - nobody reads the list.
drop policy if exists "newsletter_insert_any" on public.newsletter_subscribers;
create policy "newsletter_insert_any"
on public.newsletter_subscribers for insert
with check (true);

-- Only admins can read / manage subscribers.
drop policy if exists "newsletter_all_admin" on public.newsletter_subscribers;
create policy "newsletter_all_admin"
on public.newsletter_subscribers for all
using (public.is_admin())
with check (public.is_admin());

-- Data API grants (required for tables created on/after Oct 30, 2026).
grant insert on public.newsletter_subscribers to anon, authenticated;                   -- public signup
grant select, insert, update, delete on public.newsletter_subscribers to authenticated; -- admin (RLS guards)
grant select, insert, update, delete on public.newsletter_subscribers to service_role;
