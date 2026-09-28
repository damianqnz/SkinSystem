-- sec01_function_hardening_and_rls_scope — closes TICKET SEC-01
-- (HEARTBEAT.md, 2026-09-28 #2): one live exposure and one cross-tenant read gap.
--
-- Applied via Supabase MCP `apply_migration`.
--
-- ── 1. update_customer_statuses() was callable by anyone on the internet ──
--
-- It is SECURITY DEFINER with EXECUTE granted to PUBLIC (PostgreSQL's default
-- for new functions), so `anon` AND `authenticated` could invoke it through
-- `POST /rest/v1/rpc/update_customer_statuses` with no account at all. It runs
-- as its owner (`postgres`) and rewrites customer statuses across EVERY tenant.
--
-- The revoke is safe because the only caller is pg_cron job #1
-- (`0 3 * * *`, `SELECT update_customer_statuses()`, `username = postgres`).
-- `postgres` owns the function, and a function's owner always retains EXECUTE —
-- it cannot be revoked from the owner — so the nightly job is unaffected.
-- No code in apps/web/src references this function.
--
-- SECURITY DEFINER is kept deliberately: the function's job is a cross-tenant
-- maintenance sweep, which is exactly the case definer exists for, and with the
-- EXECUTE grant gone the definer class is no longer reachable by the anon or
-- authenticated roles. The mutable `search_path` was a separate escalation
-- vector (a caller-controlled schema earlier in the path could shadow the
-- unqualified `customers` / `appointments` references) and is pinned below.
--
-- ── 2. set_updated_at() had a mutable search_path ──
--
-- The advisor flags only the search_path here, not an anon exposure: it is NOT
-- SECURITY DEFINER, and a trigger function cannot be invoked outside trigger
-- context, so EXECUTE on it grants nothing. Its privileges are therefore left
-- alone and only the search_path is pinned. (Revoking EXECUTE on a trigger
-- function would also be needless risk: it backs 27 triggers.)
--
-- ── 3. Four tables exposed cross-tenant reads ──
--
-- `service_staff`, `service_categories`, `booking_settings` and
-- `organization_phones` each carried a `*_public_read` SELECT policy with
-- `USING (true)` — no tenant predicate at all, so any anon/authenticated
-- client could read every tenant's rows. This is a red-line violation of
-- "no query without organization_id = current_tenant".
--
-- They are DROPPED rather than rewritten. Each of these tables already has an
-- org-scoped `FOR ALL` policy (`*_org_write` / `booking_settings_owner_write`),
-- and PostgreSQL applies a FOR ALL policy to SELECT as well, so the public_read
-- policies were redundant for staff and only widened access beyond the tenant.
-- Removing them is the smaller change than writing four replacement policies
-- that would duplicate a predicate the tables already carry.
--
-- RESULTING STATE for anon/authenticated, verified after applying: the RPC route
-- is denied ("permission denied for function update_customer_statuses", 42501)
-- and reads on these four tables neither return rows nor leak cross-tenant data.
--
-- Be precise about WHY the reads fail, because the obvious explanation is wrong:
-- it is NOT that the org predicate rejects them. The remaining org-scoped
-- policies all resolve the tenant through a subquery on `profiles`, and
-- `profiles_org_read` is itself written as `organization_id = (SELECT
-- organization_id FROM profiles WHERE id = auth.uid())` — a self-reference.
-- PostgreSQL therefore raises `42P17 infinite recursion detected in policy for
-- relation "profiles"` for any non-owner role. That is PRE-EXISTING, not
-- caused by this migration (an untouched table such as catalog_services errors
-- identically), and it means these policies fail closed by erroring rather than
-- by filtering. Tracked as TICKET SEC-02: the fix is a SECURITY DEFINER helper
-- returning the caller's organization_id, which the policies call instead of
-- recursing into profiles. Nothing in the app is affected today because Drizzle
-- connects as the table owner and bypasses RLS wholesale.
--
-- CONSEQUENCE TO REMEMBER: if a future feature needs to read any of these four
-- tables client-side, it must add a properly scoped policy (or read through the
-- server, which is what every current surface does). Do not reintroduce
-- `USING (true)`. There is no functional impact today: `createSupabaseClient` in
-- infrastructure/supabase/client.ts is the only anon client and has zero call
-- sites in the repo.
--
-- MANUAL ROLLBACK (restores the exposure — only for debugging):
--   GRANT EXECUTE ON FUNCTION public.update_customer_statuses() TO PUBLIC;
--   ALTER FUNCTION public.update_customer_statuses() RESET search_path;
--   ALTER FUNCTION public.set_updated_at() RESET search_path;
--   CREATE POLICY service_staff_public_read ON service_staff FOR SELECT USING (true);
--   CREATE POLICY service_categories_public_read ON service_categories FOR SELECT USING (true);
--   CREATE POLICY booking_settings_public_read ON booking_settings FOR SELECT USING (true);
--   CREATE POLICY org_phones_public_read ON organization_phones FOR SELECT USING (true);

-- 1. Close the anon RPC exposure and pin the definer's search_path.
REVOKE EXECUTE ON FUNCTION public.update_customer_statuses() FROM PUBLIC, anon, authenticated;
ALTER FUNCTION public.update_customer_statuses() SET search_path = public;

-- 2. Pin the trigger function's search_path.
ALTER FUNCTION public.set_updated_at() SET search_path = public;

-- 3. Remove the unscoped read policies. Staff reads survive through each
--    table's existing org-scoped FOR ALL policy.
DROP POLICY IF EXISTS service_staff_public_read        ON public.service_staff;
DROP POLICY IF EXISTS service_categories_public_read   ON public.service_categories;
DROP POLICY IF EXISTS booking_settings_public_read     ON public.booking_settings;
DROP POLICY IF EXISTS org_phones_public_read           ON public.organization_phones;
