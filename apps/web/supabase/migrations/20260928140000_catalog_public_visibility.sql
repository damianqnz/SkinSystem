-- catalog_public_visibility — separates "usable internally" from "visible to
-- clients" for both catalog services and catalog categories.
--
-- Change: catalog-v2 (PR A, commit 1). Applied via Supabase MCP `apply_migration`.
--
-- WHY A SECOND FLAG (is_active was not enough):
--   `is_active` is currently overloaded. `getActiveServices()` in
--   domains/catalog/service.ts is consumed by BOTH the public surface
--   (tenant landing `ServicesSection`, public booking `/book`) and internal
--   surfaces (calendar "new appointment", dashboard `AppointmentsList`).
--   Toggling `is_active` to hide a service from clients therefore also removes
--   it from the staff's own booking flow — the two concerns cannot be
--   expressed independently. After this migration:
--     is_active → the service/category exists and is usable INTERNALLY
--     is_public → the service/category is visible on the PUBLIC booking site
--   Public visibility requires BOTH.
--
-- CATEGORY CASCADE SEMANTICS (decided 2026-09-28, "OR" not "AND"):
--   A service may belong to several categories (see the companion
--   service_categories migration). Hiding a category hides that SECTION of the
--   public site, not the services themselves: a service in "Facial" (hidden)
--   and "Packs" (visible) still appears under "Packs". The alternative — any
--   hidden category hides the service everywhere — turns categories into an
--   invisible kill switch, where adding a service to an archived category
--   silently removes it from the public site. Do not "fix" this to AND.
--
-- PRE-FLIGHT AUDIT (both should return zero; non-zero is informational only,
-- it tells you how many rows the backfill below will set to false):
--   SELECT count(*) FROM catalog_services   WHERE is_active = false;
--   SELECT count(*) FROM catalog_categories WHERE is_active = false;
--
-- BACKFILL RATIONALE: `is_public = is_active` preserves exactly today's
-- observable behaviour. Nothing appears or disappears from the public site at
-- the moment this migration lands. Divergence starts only when a human flips
-- the new switch in the catalog UI.
--
-- LOCKING: `ADD COLUMN ... NOT NULL DEFAULT` is a metadata-only operation on
-- PostgreSQL 11+ (no table rewrite). The subsequent UPDATE takes a ROW
-- EXCLUSIVE lock and rewrites every row; acceptable at current catalog size
-- (tens of rows per tenant). Both statements run inside one transaction.
--
-- RLS: no new policies required. `is_public` is a column on tables that
-- already carry organization-scoped RLS, and PostgreSQL RLS is row-level —
-- existing policies cover the new column automatically.
--
-- DEPLOY ORDER: apply this migration BEFORE deploying the code that declares
-- `isPublic` in the Drizzle schema. Drizzle's INSERT lists every declared
-- column, so code shipped first would fail INSERT INTO catalog_services.
-- The column add is additive and safe to apply ahead of the deploy.
--
-- SECURITY NOTE (addressed in the same PR, not by this file):
--   `getLandingData.ts` currently calls `getCategoriesWithServices()` — the
--   dashboard-facing query, which applies NO visibility filter — and the
--   inactive rows are dropped client-side in `ServicesAccordion.tsx` via
--   `.filter(s => s.isActive)`. Inactive services therefore still travel in
--   the public RSC payload (name, price, description). Adding `is_public`
--   without moving that filter server-side would leave this new switch
--   equally decorative. The companion code change introduces
--   `getPublicCatalog()`, which filters in SQL.
--
-- MANUAL ROLLBACK:
--   ALTER TABLE catalog_services   DROP COLUMN IF EXISTS is_public;
--   ALTER TABLE catalog_categories DROP COLUMN IF EXISTS is_public;
-- (Safe: no other object depends on these columns until the code deploy.)

ALTER TABLE catalog_services
  ADD COLUMN IF NOT EXISTS is_public boolean NOT NULL DEFAULT true;

ALTER TABLE catalog_categories
  ADD COLUMN IF NOT EXISTS is_public boolean NOT NULL DEFAULT true;

UPDATE catalog_services   SET is_public = is_active WHERE is_public <> is_active;
UPDATE catalog_categories SET is_public = is_active WHERE is_public <> is_active;
