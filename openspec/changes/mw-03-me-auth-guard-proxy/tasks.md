# Tasks: mw-03-me-auth-guard-proxy (TICKET MW-03)

## Phase 1 — proxy.ts
- [x] 1.1 Add `AUTH_REQUIRED_PREFIXES = ['/dashboard', '/admin', '/me']`
- [x] 1.2 Swap both guard conditions (`!user`, `!tenantSlug`) from `isPrivate` to `requiresAuth`
- [x] 1.3 Confirmed `isPrivate`'s locale-branch and cookie-seed uses are untouched
- [x] 1.4 Updated `UNREWRITTEN_PREFIXES`'s docstring (`/me` now also proxy-guarded)

## Phase 2 — me/layout.tsx
- [x] 2.1 Updated the `if (!user) redirect(...)` comment to note redundant defense-in-depth, matching `DashboardShell`'s style

## Phase 3 — Tests
- [x] 3.1 Unauthenticated `/me` on tenant host → redirects
- [x] 3.2 Authenticated `/me` on tenant host → passes through
- [x] 3.3 Authenticated `/me` on apex → redirects to `/`
- [x] 3.4 Locale-chain isolation: `DASHBOARD_LOCALE` never leaks into `/me`'s resolution
- [x] 3.5 `NEXT_LOCALE` cookie still seeded for `/me` on first visit — all 5 passed on first run

## Phase 4 — Validation
- [x] 4.1 `pnpm check-types` — exit 0
- [x] 4.2 `npm run build` — exit 0, route table unchanged (26/26)
- [x] 4.3 `pnpm test` — 55/55 passed (5 new; proves zero `/dashboard`/`/admin` regression)
- [x] 4.4 `eslint` on all 3 changed files — 1 pre-existing warning (`NODE_ENV` turbo-env, already tracked in TEST-04, confirmed via `git diff` outside changed lines), 0 new

**Actual**: 3 files, 73 insertions / 10 deletions = 83 changed lines. Low risk, single PR.
