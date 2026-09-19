-- customers_auth_identity — links a customer row to a Supabase auth identity and
-- makes (organization_id, lower(email)) unique per tenant.
--
-- Change: customer-identity-activation (PR A). Applied via Supabase MCP
-- `apply_migration` (drizzle-kit does not manage `auth.users`, so the FK can
-- only live in raw SQL).
--
-- PRE-FLIGHT AUDIT (run immediately before applying; BOTH must return zero):
--   SELECT organization_id, lower(email) AS email_ci, count(*)
--     FROM customers WHERE email IS NOT NULL GROUP BY 1, 2 HAVING count(*) > 1;
--   SELECT count(*) FROM customers
--     WHERE email IS NOT NULL AND email <> lower(email);
-- Non-zero on either means the unique index below cannot be built and a
-- dedup/merge migration is needed first — do NOT apply this file.
--
-- WHY `ON DELETE SET NULL` (not CASCADE / RESTRICT):
--   Deleting an auth user must orphan the identity link, never delete the
--   clinical customer record — appointments, skin profile and onboarding all
--   cascade off customers.id, so CASCADE would let an auth-side deletion
--   silently destroy health data. RESTRICT would make auth-user deletion fail
--   with a foreign-key error from a schema this app does not own.
--
-- WHY default NULLS DISTINCT (no `NULLS NOT DISTINCT`):
--   Any number of null-email rows may coexist per organization (phone-only
--   intake). This is deliberate. Do not add NULLS NOT DISTINCT.
--
-- NULLABLE, NO BACKFILL: every existing row stays NULL (guest) and links on
-- first verified sign-in.
--
-- LOCKING: CREATE UNIQUE INDEX takes a SHARE lock (blocks writes to customers
-- for the build). CONCURRENTLY is not usable because migrations run inside a
-- transaction. Acceptable at current table size.
--
-- DEPLOY ORDER: apply this migration BEFORE deploying the code that declares
-- `authUserId` (Drizzle's INSERT lists every declared column, so code shipped
-- first would fail INSERT INTO customers). The column add is additive.
--
-- MANUAL ROLLBACK:
--   DROP INDEX IF EXISTS uq_customers_org_email;
--   DROP INDEX IF EXISTS idx_customers_auth_user_id;
--   ALTER TABLE customers DROP CONSTRAINT IF EXISTS customers_auth_user_id_fkey;
--   ALTER TABLE customers DROP COLUMN IF EXISTS auth_user_id;
-- (Dropping the column discards identity links once any row has been activated.)

ALTER TABLE customers
  ADD COLUMN IF NOT EXISTS auth_user_id uuid;

ALTER TABLE customers
  ADD CONSTRAINT customers_auth_user_id_fkey
  FOREIGN KEY (auth_user_id) REFERENCES auth.users(id) ON DELETE SET NULL;

CREATE UNIQUE INDEX IF NOT EXISTS uq_customers_org_email
  ON customers (organization_id, lower(email));

CREATE INDEX IF NOT EXISTS idx_customers_auth_user_id
  ON customers (auth_user_id);
