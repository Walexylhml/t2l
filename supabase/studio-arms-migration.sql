-- ---------------------------------------------------------------------------
-- Migration: split the single "arm" view into "left_arm" + "right_arm".
--
-- Run this ONCE against an existing database (Supabase SQL editor). It is
-- idempotent / safe to re-run. Fresh installs don't need it — supabase/studio.sql
-- already has the new shape.
--
-- What it does:
--   * adds garments.image_left_arm / image_right_arm (keeps the old image_arm
--     column untouched so nothing is lost; you can drop it later once happy)
--   * copies any existing image_arm into image_left_arm
--   * rewrites garments.views: "arm" -> "left_arm","right_arm"
--   * migrates designs tagged placement='arm' to 'any' (so they stay visible)
--     and widens the placement check to the new values
-- ---------------------------------------------------------------------------

-- 1. New image columns -------------------------------------------------------
alter table public.garments add column if not exists image_left_arm text;
alter table public.garments add column if not exists image_right_arm text;

-- Carry the old single arm mockup over to the left arm (non-destructive).
do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'garments' and column_name = 'image_arm'
  ) then
    update public.garments
      set image_left_arm = image_arm
      where image_left_arm is null and image_arm is not null;
  end if;
end $$;

-- 2. garments.views ----------------------------------------------------------
alter table public.garments
  alter column views set default '{front,back,left_arm,right_arm}';

-- Replace 'arm' with the two arm views (preserves the other views + order).
update public.garments
  set views = array_remove(views, 'arm') || array['left_arm', 'right_arm']
  where 'arm' = any(views) and not ('left_arm' = any(views));

-- Clean up any stray 'arm' left behind (e.g. from a partial earlier run).
update public.garments
  set views = array_remove(views, 'arm')
  where 'arm' = any(views);

-- 3. designs.placement -------------------------------------------------------
-- Move existing arm-only designs to 'any' so they still appear in the studio.
alter table public.designs drop constraint if exists designs_placement_check;

update public.designs set placement = 'any' where placement = 'arm';

alter table public.designs
  add constraint designs_placement_check
  check (placement in ('front', 'back', 'left_arm', 'right_arm', 'any'));

-- Done. (Optional, later, once you've confirmed everything looks right:
--   alter table public.garments drop column image_arm;)
