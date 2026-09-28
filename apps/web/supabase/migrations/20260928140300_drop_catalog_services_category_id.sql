-- drop_catalog_services_category_id — removes the legacy single-category
-- column now that service_categories (M:M bridge) is the single source of
-- truth. Step 3 of the sequence documented in
-- 20260928140100_service_categories_m2m.sql (DEPLOY ORDER).
--
-- Change: catalog-v2 (PR B, code deploy). Applied via Supabase MCP `apply_migration`.
--
-- PRE-CONDITION (verified before applying): 0 references to
-- catalogServices.categoryId / catalog_services.category_id left in the app
-- layer. domains/catalog/service.ts no longer selects it; domains/booking/
-- seed.ts writes to service_categories instead; the Drizzle schema
-- (infrastructure/db/schema/catalog.ts) no longer declares the column.
--
-- MANUAL ROLLBACK: not reversible without a backup — the column and its data
-- are gone. If ever needed again, re-add as nullable and backfill from
-- service_categories (arbitrarily picking one category per service, since
-- the M:M relation has no single "primary" category anymore).

ALTER TABLE catalog_services DROP COLUMN IF EXISTS category_id;
