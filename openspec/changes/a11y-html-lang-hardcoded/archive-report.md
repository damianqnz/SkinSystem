# Archive report: a11y-html-lang-hardcoded (TICKET A11Y-01)

**Status**: DONE. Archived 2026-09-16.

## Summary

`(dashboard)/layout.tsx` and `(auth)/layout.tsx` both hardcoded `<html lang="es">` regardless of the visitor's/staff's actual resolved locale (`DEFAULT_LOCALE` is `'pt'`) — a WCAG 3.1.1 violation. Both now call `getLocale()` from `next-intl/server` and render `<html lang={locale}>`.

`(dashboard)/layout.tsx`'s fix was the open architectural question: a code comment claimed Next 16's `cacheComponents` previously rejected dynamic request data in this statically-cacheable outer layout, which is why locale resolution had been pushed into the Suspense-wrapped `DashboardShell` instead. Exploration found two working counter-examples already shipped in this codebase (`(marketing)/layout.tsx` and `(tenant)/[tenant]/layout.tsx`, both calling dynamic APIs directly in an async root layout with no Suspense split) as grounds to attempt the minimal fix first, with `npm run build` as the empirical arbiter. **The minimal fix (candidate 1) passed on the first attempt** — the feared fallback restructure (merging `DashboardLayout`/`DashboardShell`, candidate 2) was never needed.

## Value chosen over the feared full restructure

Converting only the outer `DashboardLayout` to `async` and adding one `getLocale()` call left `DashboardShell` — its RBAC gate, `headers()` call, redirect logic, and Suspense boundary — completely untouched, confirmed via `git diff` showing the changed hunk is exactly the import line plus the `DashboardLayout` function body. Zero behavioral risk to the existing auth/tenant-resolution flow.

## Scope

Exactly 2 files, 8 net changed lines (+4/-2 each). No new i18n keys (the fix reuses next-intl's existing per-request locale resolution, already wired via `src/i18n/request.ts` and the `x-locale` header the proxy already sets for both `/dashboard` and `/login`/`/auth`). No test-infra gap: this fix has no new pure logic to unit-test, same precedent as A11Y-02.

## Disclosed verify note

`eslint` reports 2 pre-existing `no-fallthrough` warnings in `DashboardShell`'s RBAC `switch` statement — confirmed via `git diff` to sit outside every changed hunk, present on `HEAD` before this change. Not fixed, out of scope, same triage pattern already established for I18N-05's pre-existing unused-var warnings.

## Non-goals honored

`(marketing)` and `(tenant)/[tenant]` (already correct) untouched. No `NextIntlClientProvider` added to `(auth)`. No proxy/middleware edits. `PERF-01` and `PR4` (`INTL_LOCALE_MAP` dedup) untouched — separate tickets.

## Validation

`pnpm check-types` exit 0, `npm run build` exit 0 (26/26 routes, twice — once per candidate-1 gate, once final), `pnpm test` 38/38 passed, `rg 'lang="es"'` zero matches on both files.
