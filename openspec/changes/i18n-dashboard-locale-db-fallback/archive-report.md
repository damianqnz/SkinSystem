# Archive report: i18n-dashboard-locale-db-fallback (Huecos A/B)

**Status**: DONE. Archived 2026-09-16.

## Summary

Implements the Phase 36 deuda's target locale-resolution chain for the dashboard — `profiles.locale` → `organizations.locale` → `DEFAULT_LOCALE` — for the one case it was missing: when the `DASHBOARD_LOCALE` cookie itself is absent (new device, cleared cookies, expired session). Both Huecos A and B closed in one change, since they're the same fallback chain.

## Scope decision: layout-mount, not `proxy.ts`

The user was asked explicitly and chose the layout-mount path over a `proxy.ts` middleware edit, respecting `CLAUDE.md`'s "No Unauthorized Middleware Edits" red line without needing a new MW-0x ticket. `proxy.ts`/`src/i18n/request.ts` are untouched.

## Value found during design: zero new DB queries

`(dashboard)/layout.tsx`'s existing RBAC gate (`resolveTenantOrgId()`) already queries both `profiles` and `organizations` for this exact tenant/user on every dashboard request — the fix only widens the existing `profiles` SELECT to include `locale`, and forwards the `organizations.locale` that `getOrganizationBySlug()` (called internally) already fetches. No performance cost added to the RBAC gate.

## Disclosed non-goals

- `<html lang>` in the outer, statically-cacheable `DashboardLayout` is not corrected in the fallback scenario — adding DB access there would duplicate the RBAC round-trip A11Y-01 deliberately kept out of that shell. Narrow edge case, not a regression.
- The `DASHBOARD_LOCALE` cookie is not re-seeded by this fix (Next.js restricts `cookies().set()` to Server Actions/Route Handlers) — the DB lookup repeats every request without the cookie, until the next login or a manual language change re-seeds it. Matches the original debt's own "Estimated effort: S" framing; a cookie-reseeding follow-up would be a separate, larger change.

## Scope

5 files, 66 net lines: `detect-locale.ts` (+16, new pure helper), `detect-locale.test.ts` (+20, 4 new tests), `resolve-tenant-types.ts` (+4, additive fields), `resolve-tenant-org-id.ts` (+10/-2, widened SELECT + return), `(dashboard)/layout.tsx` (+22/-4, wiring).

## Validation

`pnpm check-types` exit 0, `npm run build` exit 0 (26/26 routes — empirically confirms the dynamic message import works inside the existing Suspense/cacheComponents-sensitive shell), `pnpm test` 42/42 (4 new), `eslint` clean save for the 2 pre-existing RBAC-switch warnings already disclosed during A11Y-01's follow-up.
