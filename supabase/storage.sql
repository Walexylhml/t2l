-- =========================================================================
-- Thoughts2Lyfe - Image storage bucket for admin uploads (products, events)
-- Run this ONCE in the Supabase SQL Editor (after the other SQL files).
-- Creates a public "images" bucket; only admins can upload, everyone can view.
-- =========================================================================

-- Public bucket that holds admin-uploaded images.
insert into storage.buckets (id, name, public)
values ('images', 'images', true)
on conflict (id) do nothing;

-- Anyone can view files in the images bucket (needed so the store/site can
-- display them).
drop policy if exists "images_public_read" on storage.objects;
create policy "images_public_read"
on storage.objects for select
using (bucket_id = 'images');

-- Only admins can upload / replace / delete images.
drop policy if exists "images_admin_insert" on storage.objects;
create policy "images_admin_insert"
on storage.objects for insert to authenticated
with check (bucket_id = 'images' and public.is_admin());

drop policy if exists "images_admin_update" on storage.objects;
create policy "images_admin_update"
on storage.objects for update to authenticated
using (bucket_id = 'images' and public.is_admin())
with check (bucket_id = 'images' and public.is_admin());

drop policy if exists "images_admin_delete" on storage.objects;
create policy "images_admin_delete"
on storage.objects for delete to authenticated
using (bucket_id = 'images' and public.is_admin());
