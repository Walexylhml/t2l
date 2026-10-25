-- =========================================================================
-- Thoughts2Lyfe - Data API grants for the "public" schema
--
-- Why this file exists:
-- From Oct 30, 2026 Supabase no longer AUTO-grants Data API access to tables
-- created in "public". Your current tables keep their grants in THIS database,
-- but a fresh project, a preview branch, or a local `supabase db reset`
-- recreates every table and they come back WITHOUT grants. Running this file as
-- part of the normal setup sequence (after all the other SQL files) keeps the
-- whole schema reachable through supabase-js / PostgREST everywhere.
--
-- RLS still decides WHICH ROWS each role sees; these GRANTs decide whether a
-- role may touch the table at all. Safe to re-run.
-- =========================================================================

-- --- Publicly readable catalog / content (anon + authenticated SELECT; RLS
--     already limits anon to active rows). -------------------------------------
grant select on public.products        to anon, authenticated;
grant select on public.events          to anon, authenticated;
grant select on public.garments        to anon, authenticated;
grant select on public.designs         to anon, authenticated;
grant select on public.discounts       to anon, authenticated;
grant select on public.studio_settings to anon, authenticated;

-- --- Admin writes to the above happen while signed in (RLS policy is_admin()). -
grant insert, update, delete on public.products  to authenticated;
grant insert, update, delete on public.events    to authenticated;
grant insert, update, delete on public.garments  to authenticated;
grant insert, update, delete on public.designs   to authenticated;
grant insert, update, delete on public.discounts to authenticated;
grant update                 on public.studio_settings to authenticated;

-- --- User-scoped data (no anon). RLS limits rows to the owner / admin. --------
grant select, insert, update on public.profiles    to authenticated;
grant select, update          on public.orders      to authenticated;  -- admin fulfilment; RLS guards
grant select                  on public.order_items to authenticated;

-- --- The server (service_role key) bypasses RLS and does all order writes.
--     Give it full access to every current table so checkout / webhooks keep
--     working after a schema rebuild. -----------------------------------------
grant select, insert, update, delete on all tables in schema public to service_role;

-- -------------------------------------------------------------------------
-- TEMPLATE for every NEW table from here on. Put these lines in the SAME file
-- that creates the table, right after the create + RLS policies:
--
--   grant select                         on public.<table> to anon;          -- only if publicly readable
--   grant select, insert, update, delete on public.<table> to authenticated; -- RLS guards the rows
--   grant select, insert, update, delete on public.<table> to service_role;
-- -------------------------------------------------------------------------
