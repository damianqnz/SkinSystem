# Tasks: i18n-dashboard-locale-db-fallback (Huecos A/B)

## Phase 1 — Pure helper + tests
- [x] 1.1 Add `resolveDashboardFallbackLocale(profileLocale, orgLocale)` to `detect-locale.ts`
- [x] 1.2 Unit tests: profile wins, org wins when profile null, both unsupported → `DEFAULT_LOCALE`, unsupported profile falls through to valid org locale

## Phase 2 — Widen `resolveTenantOrgId()`
- [x] 2.1 `resolve-tenant-types.ts`: add `profileLocale`/`orgLocale` to `ResolveTenantOk`
- [x] 2.2 `resolve-tenant-org-id.ts`: widen `profiles` SELECT to include `locale`; return `profileLocale`/`orgLocale` (reusing the already-fetched `orgResult.data.locale`, zero new queries)

## Phase 3 — `DashboardShell` wiring
- [x] 3.1 Add `cookies()` read
- [x] 3.2 Move RBAC gate before locale resolution
- [x] 3.3 Branch `locale`/`messages` on `DASHBOARD_LOCALE` cookie presence

## Phase 4 — Validation
- [x] 4.1 `pnpm check-types` — exit 0
- [x] 4.2 `npm run build` — exit 0, route table unchanged (26/26)
- [x] 4.3 `pnpm test` — 42/42 passed (4 new)
- [x] 4.4 `eslint` on all touched files — 2 pre-existing warnings (RBAC switch fallthrough, already disclosed in A11Y-01's follow-up), 0 new

**Actual**: 5 files, 66 net lines. Low risk, single PR.
