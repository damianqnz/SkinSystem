-- service_categories_policies — RLS policies for the service↔category bridge,
-- deferred from 20260928140100_service_categories_m2m.sql once the live policy
-- definitions on service_staff (its sibling M:M table) could be read.
--
-- Change: catalog-v2 (PR A, commit 3). Applied via Supabase MCP `apply_migration`.
--
-- Mirrors service_staff exactly (read live via Supabase MCP on 2026-09-28):
--   service_staff_org_write: ALL, organization_id IN (profiles.organization_id
--     WHERE profiles.id = auth.uid() AND profiles.role IN ('owner','staff'))
--   service_staff_public_read: SELECT, true (unrestricted)
--
-- These policies are DECORATIVE for the app itself — Drizzle connects via
-- DATABASE_URL as the table owner, which bypasses RLS, so tenant isolation
-- for app code continues to come from the explicit organization_id predicate
-- in every query. They matter for any future direct Supabase client access
-- (anon/authenticated roles), e.g. a public API or client-side Supabase call.
--
-- MANUAL ROLLBACK:
--   DROP POLICY IF EXISTS service_categories_org_write  ON service_categories;
--   DROP POLICY IF EXISTS service_categories_public_read ON service_categories;

CREATE POLICY service_categories_org_write ON service_categories
  FOR ALL
  USING (
    organization_id IN (
      SELECT profiles.organization_id
      FROM profiles
      WHERE profiles.id = auth.uid()
        AND profiles.role = ANY (ARRAY['owner'::user_role, 'staff'::user_role])
    )
  );

CREATE POLICY service_categories_public_read ON service_categories
  FOR SELECT
  USING (true);
