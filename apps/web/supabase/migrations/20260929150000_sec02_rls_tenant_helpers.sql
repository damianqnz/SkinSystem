-- sec02_rls_tenant_helpers — closes TICKET SEC-02 (HEARTBEAT.md, 2026-09-28 #3).
--
-- Applied via Supabase MCP `apply_migration`.
--
-- ── The defect ──
--
-- `profiles_org_read` resolved the caller's tenant with a subquery on
-- `profiles` itself, and `profiles_super_admin_read` did the same. Every
-- org-scoped policy in the schema resolves the tenant through a subquery on
-- `profiles`, so ANY statement from `anon` or `authenticated` against ANY of
-- the 45 public tables raised `42P17 infinite recursion detected in policy for
-- relation "profiles"`. No policy was exercising access control; isolation came
-- only from the explicit `organization_id` predicate in application code
-- (Drizzle connects as the table owner and bypasses RLS).
--
-- ── Why the fix is more than the helper ──
--
-- `anon` and `authenticated` hold full table privileges on all 45 tables
-- (Supabase default). While every statement errored, the permissive policies
-- that never touch `profiles` were dead code. Breaking the recursion turns
-- them ALL on at once, and several are holes:
--
--   * `profiles_self_update` has no WITH CHECK: a staff member could set their
--     own `role` to 'super_admin' (privilege escalation) or move to another
--     organization.
--   * `*_public_read` (11 policies) filter only on `is_active`/`is_visible`/
--     `expires_at`, never on tenant: `anon` would list every tenant's active
--     coupon codes, the reason/title of every professional's blocked time,
--     booking session ids in `temporary_slots`, tax ids and Stripe account ids
--     in `organizations`, and services hidden by `is_public` (Catalog v2 made
--     `is_public` the visibility gate; the policy still reads `is_active`).
--   * Self-scoped writes (`profile_id = auth.uid()`) do not pin
--     `organization_id`, so a member could write rows into another tenant.
--   * `calendar_integrations_org_owner_read` exposes every staff member's
--     Google OAuth access/refresh tokens to the owner over the Data API.
--
-- Nothing in apps/web/src uses the Data API for table reads or writes: every
-- query is Drizzle (server-side, owner role) and every storage upload uses the
-- service-role admin client. So the unsafe policies are DROPPED rather than
-- rewritten — the same call SEC-01 made for its four `USING (true)` reads. A
-- future client-side read must add a tenant-scoped policy built on the helpers
-- below; do not reintroduce an unscoped read.
--
-- ── The helpers ──
--
-- `private.current_org_id()` / `private.current_profile_role()` are SECURITY
-- DEFINER, so they read `profiles` without re-entering its policies (that is
-- what breaks the recursion). They live in `private`, which PostgREST does not
-- expose, so they are not callable as RPC. Both require `is_active`: a
-- deactivated member (settings/team toggle) resolves to NULL and therefore
-- loses access through every policy at once, because every other org-scoped
-- policy reaches `profiles` through `profiles_org_read`.
--
-- Callers wrap them as `(SELECT private.fn())` so PostgreSQL evaluates them
-- once per statement (initplan) instead of once per row.
--
-- The remaining ~50 org-scoped policies are left untouched: with
-- `profiles_org_read` no longer recursive, their existing
-- `organization_id IN (SELECT organization_id FROM profiles WHERE id = auth.uid() …)`
-- subqueries resolve correctly. Rewriting them onto the helpers is a
-- performance refactor, not part of this defect.
--
-- PRIOR DEFINITIONS (forensic reference only — restoring them brings back the
-- recursion and every hole listed above; none of them lived in a migration):
--   profiles_org_read          SELECT organization_id = (SELECT p2.organization_id FROM profiles p2 WHERE p2.id = auth.uid())
--   profiles_super_admin_read  SELECT EXISTS (SELECT 1 FROM profiles p2 WHERE p2.id = auth.uid() AND p2.role = 'super_admin')
--   profiles_self_update       UPDATE id = auth.uid()
--   availability_public_read, blocked_intervals_public_read, custom_fields_public_read,
--   categories_public_read, services_public_read, coupons_public_read,
--   org_gallery_public_read, orgs_public_read, surcharges_public_read
--                              SELECT is_active = true
--   reviews_public_read        SELECT is_visible = true
--   temporary_slots_public_read SELECT expires_at > now()
--   calendar_integrations_org_owner_read
--                              SELECT organization_id IN (SELECT organization_id FROM profiles WHERE id = auth.uid() AND role = 'owner')
--   blocked_intervals_self_write, calendar_integrations_owner_manage,
--   ext_events_self_read, ext_events_self_write
--                              profile_id = auth.uid()
--   creator_or_owner_update_routines
--                              UPDATE created_by_profile_id = auth.uid() OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid()
--                                     AND organization_id = customer_routines.organization_id AND role = 'owner')
--   invitations_self_read      SELECT email = (SELECT email FROM auth.users WHERE id = auth.uid())

-- 1. Helpers --------------------------------------------------------------

CREATE SCHEMA IF NOT EXISTS private;
REVOKE ALL ON SCHEMA private FROM PUBLIC;
GRANT USAGE ON SCHEMA private TO anon, authenticated;

CREATE OR REPLACE FUNCTION private.current_org_id()
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT organization_id
  FROM public.profiles
  WHERE id = auth.uid() AND is_active
$$;

CREATE OR REPLACE FUNCTION private.current_profile_role()
RETURNS public.user_role
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT role
  FROM public.profiles
  WHERE id = auth.uid() AND is_active
$$;

REVOKE EXECUTE ON FUNCTION private.current_org_id()       FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION private.current_profile_role() FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION private.current_org_id()       TO anon, authenticated;
GRANT  EXECUTE ON FUNCTION private.current_profile_role() TO anon, authenticated;

-- 2. Break the recursion on profiles --------------------------------------

ALTER POLICY profiles_org_read ON public.profiles
  USING (organization_id = (SELECT private.current_org_id()));

ALTER POLICY profiles_super_admin_read ON public.profiles
  USING ((SELECT private.current_profile_role()) = 'super_admin');

-- Profile edits go through a server action; the Data API route had no
-- WITH CHECK and allowed self-promotion.
DROP POLICY IF EXISTS profiles_self_update ON public.profiles;

-- 3. Drop the unscoped reads that step 2 would otherwise activate ----------

DROP POLICY IF EXISTS availability_public_read      ON public.availability_rules;
DROP POLICY IF EXISTS blocked_intervals_public_read ON public.blocked_intervals;
DROP POLICY IF EXISTS custom_fields_public_read     ON public.booking_custom_fields;
DROP POLICY IF EXISTS categories_public_read        ON public.catalog_categories;
DROP POLICY IF EXISTS services_public_read          ON public.catalog_services;
DROP POLICY IF EXISTS coupons_public_read           ON public.coupons;
DROP POLICY IF EXISTS org_gallery_public_read       ON public.organization_gallery;
DROP POLICY IF EXISTS reviews_public_read           ON public.organization_reviews;
DROP POLICY IF EXISTS orgs_public_read              ON public.organizations;
DROP POLICY IF EXISTS surcharges_public_read        ON public.payment_surcharges;
DROP POLICY IF EXISTS temporary_slots_public_read   ON public.temporary_slots;

DROP POLICY IF EXISTS calendar_integrations_org_owner_read ON public.calendar_integrations;

-- 4. Pin the tenant on self-scoped policies --------------------------------

ALTER POLICY blocked_intervals_self_write ON public.blocked_intervals
  USING      (profile_id = (SELECT auth.uid()) AND organization_id = (SELECT private.current_org_id()))
  WITH CHECK (profile_id = (SELECT auth.uid()) AND organization_id = (SELECT private.current_org_id()));

ALTER POLICY calendar_integrations_owner_manage ON public.calendar_integrations
  USING      (profile_id = (SELECT auth.uid()) AND organization_id = (SELECT private.current_org_id()))
  WITH CHECK (profile_id = (SELECT auth.uid()) AND organization_id = (SELECT private.current_org_id()));

ALTER POLICY ext_events_self_read ON public.external_calendar_events
  USING (profile_id = (SELECT auth.uid()) AND organization_id = (SELECT private.current_org_id()));

ALTER POLICY ext_events_self_write ON public.external_calendar_events
  USING      (profile_id = (SELECT auth.uid()) AND organization_id = (SELECT private.current_org_id()))
  WITH CHECK (profile_id = (SELECT auth.uid()) AND organization_id = (SELECT private.current_org_id()));

ALTER POLICY creator_or_owner_update_routines ON public.customer_routines
  USING (
    organization_id = (SELECT private.current_org_id())
    AND (created_by_profile_id = (SELECT auth.uid()) OR (SELECT private.current_profile_role()) = 'owner')
  )
  WITH CHECK (organization_id = (SELECT private.current_org_id()));

-- 5. Invitee read without touching auth.users ------------------------------
--
-- The policy compared against `(SELECT email FROM auth.users WHERE id =
-- auth.uid())`, but neither `anon` nor `authenticated` may read `auth.users`,
-- so once the recursion is gone it fails with `42501 permission denied for
-- table users` instead of filtering. The verified email is already in the JWT.

ALTER POLICY invitations_self_read ON public.organization_invitations
  USING (lower(email) = lower((SELECT auth.jwt() ->> 'email')));
