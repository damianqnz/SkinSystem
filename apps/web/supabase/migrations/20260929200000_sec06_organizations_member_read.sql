-- sec06_organizations_member_read — closes TICKET SEC-06 (HEARTBEAT.md, 2026-09-29 #4).
--
-- Applied via Supabase MCP `apply_migration`.
--
-- ── The gap ──
--
-- SEC-02 dropped `orgs_public_read` (`SELECT ... USING (is_active = true)`)
-- because it let anyone list every tenant's row, including `tax_id` and
-- `stripe_account_id`. That left `organizations` as the only table in the
-- schema with RLS enabled and no SELECT/ALL policy at all: its remaining policy
-- is `orgs_owner_update`, which is UPDATE. RLS then denies every read, so an
-- authenticated member gets 0 rows for their OWN organization over the Data API.
--
-- The other ten tables whose `*_public_read` was dropped in SEC-02 keep their
-- org-scoped `FOR ALL` write policy, which also covers SELECT, so they were
-- unaffected. `organizations` was the only table whose sole read path was the
-- policy that had to go — the asymmetry was introduced by SEC-02, not
-- pre-existing.
--
-- ── Why this is a fix and not a reopening ──
--
-- The policy is scoped with the helper SEC-02 added, so it grants exactly one
-- row: the caller's own organization. The public, cross-tenant read is NOT
-- restored. A deactivated member resolves to NULL and still reads nothing.
--
-- ── Impact ──
--
-- Inert for the application today: every read of `organizations` goes through
-- Drizzle as the table owner, which bypasses RLS. This makes the Data API
-- behave correctly for a future client-side read (brand/theme) instead of
-- silently returning nothing.

CREATE POLICY orgs_member_read ON public.organizations
  FOR SELECT
  USING (id = (SELECT private.current_org_id()));
