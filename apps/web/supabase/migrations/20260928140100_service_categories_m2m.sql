-- service_categories — many-to-many bridge between catalog services and
-- catalog categories.
--
-- Change: catalog-v2 (PR A, commit 2). Applied via Supabase MCP `apply_migration`.
-- Apply AFTER 20260928140000_catalog_public_visibility.sql.
--
-- WHY A BRIDGE TABLE:
--   `catalog_services.category_id` models one category per service. The catalog
--   v2 design requires a service to belong to SEVERAL categories (a service can
--   sit in both "Facial" and "Packs"). The bridge table becomes the single
--   source of truth for the service↔category relation; `category_id` is
--   retired in a LATER migration (see DEPLOY ORDER below).
--
-- SHAPE: deliberately mirrors `service_staff`, the sibling M:M table introduced
--   in Phase 3b (id / organization_id / service_id / <target>_id / created_at),
--   so both bridges read the same way.
--
-- ORGANIZATION_ID IS DENORMALIZED ON PURPOSE:
--   It is derivable by joining catalog_services, but carrying it here lets every
--   tenant-scoped query filter the bridge directly and lets RLS express tenant
--   isolation without a join. Same trade-off `service_staff` already makes.
--
-- UNIQUE (service_id, category_id):
--   A service must not appear twice under the same category. Without this, a
--   double-submit in the multi-select would render duplicate entries in the
--   public accordion. Note `service_staff` lacks the equivalent constraint —
--   that is a pre-existing gap, tracked separately, not fixed here.
--
-- BACKFILL: every service that currently has a category_id gets exactly one
--   bridge row, so the relation after this migration is observably identical to
--   the relation before it. Services with a NULL category_id stay orphans, which
--   is the behaviour `getCategoriesWithServices()` already handles.
--
-- RLS — READ THIS BEFORE ASSUMING THE TABLE IS COVERED:
--   Row level security is ENABLED with NO policies, which denies all access to
--   the anon and authenticated roles (fail closed). This is intentional and safe
--   for the application: the Drizzle client connects through DATABASE_URL as the
--   table owner, which bypasses RLS entirely, so tenant isolation for app code
--   continues to come from the explicit organization_id predicate in every
--   query. The policies that mirror `service_staff` are NOT written here because
--   this repository contains no CREATE POLICY statements at all — the live
--   policy bodies exist only in the production database and could not be read
--   while the Supabase MCP server was disconnected. Inventing them would risk a
--   weaker predicate than the one service_staff actually uses. Add them in a
--   follow-up migration once the live definitions have been dumped.
--
-- DEPLOY ORDER — WHY category_id IS NOT DROPPED IN THIS FILE:
--   Dropping the column is destructive and must come AFTER the code that still
--   reads it is gone. `category_id` is still referenced by domains/catalog/
--   service.ts, domains/catalog/schema.ts, ServiceDrawer.tsx, domains/booking/
--   seed.ts and the Drizzle schema; Drizzle names every declared column in its
--   SELECT list, so dropping it now takes production down on the next query.
--   The correct sequence is:
--     1. this migration (additive, safe ahead of any deploy)
--     2. deploy the code that reads and writes the bridge instead of category_id
--     3. a separate migration that drops catalog_services.category_id
--   Do not collapse steps 1 and 3 into one file.
--
-- MANUAL ROLLBACK:
--   DROP TABLE IF EXISTS service_categories;
-- (Safe: nothing depends on it until the code deploy in step 2.)

CREATE TABLE IF NOT EXISTS service_categories (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id)      ON DELETE CASCADE,
  service_id      uuid NOT NULL REFERENCES catalog_services(id)   ON DELETE CASCADE,
  category_id     uuid NOT NULL REFERENCES catalog_categories(id) ON DELETE CASCADE,
  created_at      timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT service_categories_service_id_category_id_unique
    UNIQUE (service_id, category_id)
);

CREATE INDEX IF NOT EXISTS idx_service_categories_org_id
  ON service_categories (organization_id);
CREATE INDEX IF NOT EXISTS idx_service_categories_service_id
  ON service_categories (service_id);
CREATE INDEX IF NOT EXISTS idx_service_categories_category_id
  ON service_categories (category_id);

ALTER TABLE service_categories ENABLE ROW LEVEL SECURITY;

INSERT INTO service_categories (organization_id, service_id, category_id)
SELECT organization_id, id, category_id
FROM catalog_services
WHERE category_id IS NOT NULL
ON CONFLICT (service_id, category_id) DO NOTHING;
