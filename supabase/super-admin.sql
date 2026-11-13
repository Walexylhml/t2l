-- =========================================================================
-- Thoughts2Lyfe - Super-admin role
-- Run this in the Supabase SQL Editor AFTER admin.sql.
-- Safe to re-run.
--
-- What it does:
--   1. Adds an is_super_admin flag to profiles (default false).
--   2. Adds a helper is_super_admin() for use in policies / server checks.
--   3. Promotes the store owners to admin + super admin. A super admin can
--      add or revoke other admins from the site (/admin/admins), so no one
--      ever has to touch SQL again after this.
--
-- NOTE: passwords are NEVER set here. They live in Supabase Auth (hashed).
--       Create a person in Authentication > Users (set their password there),
--       then this file - matching on email, case-insensitively - flags them.
-- =========================================================================

-- 1. Super-admin flag on profiles -----------------------------------------
alter table public.profiles
  add column if not exists is_super_admin boolean not null default false;

-- 2. Helper: is the currently signed-in user a super admin? ---------------
create or replace function public.is_super_admin()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select coalesce(
    (select p.is_super_admin from public.profiles p where p.id = auth.uid()),
    false
  );
$$;

-- 3. Promote the two owners -----------------------------------------------
-- Each person's auth user must exist first (Authentication > Users). Then this
-- flags them. Re-run after creating a new owner to flag them too.
update public.profiles set is_admin = true, is_super_admin = true
where id in (
  select id from auth.users
  where lower(email) in (
    lower('adebayolawale@gmail.com'),
    lower('SherrellLriley@gmail.com')
  )
);
