-- =========================================================================
-- Thoughts2Lyfe - Events
-- Run this in the Supabase SQL Editor AFTER schema.sql, admin.sql, storage.sql.
-- Safe to re-run. Lets the owner post events from the admin dashboard; the
-- public Events page shows the active ones.
-- =========================================================================

create table if not exists public.events (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text not null default '',
  image text,                       -- public URL from the images bucket
  event_at timestamptz,             -- date/time of the event
  venue text,
  perks text,                       -- optional
  active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists events_set_updated_at on public.events;
create trigger events_set_updated_at
before update on public.events
for each row execute function public.set_updated_at();

alter table public.events enable row level security;

-- Anyone can read ACTIVE events (for the public Events page).
drop policy if exists "events_select_active" on public.events;
create policy "events_select_active"
on public.events for select
using (active = true);

-- Admins can do everything, including inactive events.
drop policy if exists "events_all_admin" on public.events;
create policy "events_all_admin"
on public.events for all
using (public.is_admin())
with check (public.is_admin());
