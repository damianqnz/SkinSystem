# Proposal: i18n-dashboard-locale-db-fallback (Huecos A/B, Phase 36 deuda)

## Intent

Implement the target locale-resolution chain for the dashboard — `profiles.locale` → `organizations.locale` → `DEFAULT_LOCALE` — for the case the `DASHBOARD_LOCALE` cookie is absent (new device, cleared cookies, expired session). Today `proxy.ts`'s `detectDashboardLocale()` has no DB access and silently degrades to the public `NEXT_LOCALE`/Accept-Language chain in that case, which can show a staff member's dashboard in the wrong language.

## Scope decision: layout-mount, not `proxy.ts`

`CLAUDE.md` §2 prohibits modifying `proxy.ts`/`src/i18n/request.ts` without a dedicated, HEARTBEAT-approved middleware-scope ticket (matching the precedent set by MW-01/MW-02). This debt's own note offered two paths — `proxy.ts` or a Server Component at layout mount — and the user explicitly chose **layout mount**, avoiding the middleware red line entirely: no `proxy.ts`/`request.ts` edit in this change.

## Approach

`(dashboard)/layout.tsx`'s `DashboardShell` already calls `resolveTenantOrgId()` for its RBAC gate, which already queries both `profiles` and (via `getOrganizationBySlug`) `organizations` for this exact tenant/user. Both tables are queried anyway — the fix only widens the existing `profiles` SELECT to include `locale`, and forwards the already-fetched `organizations.locale`. Zero new DB round-trips.

`DashboardShell` then checks whether the `DASHBOARD_LOCALE` cookie is present (via `cookies()`, read-only, no middleware involved):
- **Present** (~95% of requests): unchanged — `locale` from the `x-locale` header, `messages` from `getMessages()`.
- **Absent**: `locale` from a new pure helper `resolveDashboardFallbackLocale(profileLocale, orgLocale)`, `messages` loaded via a direct dynamic import of that locale's JSON (mirroring `src/i18n/request.ts`'s own pattern, since `getMessages()` can't be redirected to an arbitrary locale from here).

## Non-goals

- `proxy.ts`/`src/i18n/request.ts` — untouched, no middleware-scope ticket opened.
- `<html lang>` in the OUTER `DashboardLayout` (the statically-cacheable shell) is **not** corrected by this change — it has no DB access today and adding it would mean duplicating the RBAC/DB round-trip in the outer shell, which A11Y-01 deliberately kept free of DB work. In the rare fallback scenario, `<html lang>` may show the header-derived (public-chain) locale while the actual rendered content correctly shows the DB-resolved one. Disclosed limitation, not fixed here — same class of tradeoff as every "candidate 1, not candidate 2" decision this session.
- Cookie is **not** re-seeded by this fix (Next.js only allows `cookies().set()` from a Server Action/Route Handler, not a Server Component render) — the DB lookup repeats on every request until the user's next login re-seeds `DASHBOARD_LOCALE`, or they change their language via the existing `DashboardLanguageSelector`. Matches the debt's own "Estimated effort: S. Blocking: no" framing; a cookie-reseeding follow-up is a separate, larger change (would need a client-side effect calling a Server Action).

## Risk / size

Low risk, small diff (5 files, ~66 net lines). No new component, no UI change — purely a data-resolution correction on an already-narrow edge case.
