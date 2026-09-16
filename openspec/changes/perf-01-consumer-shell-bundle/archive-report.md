# Archive report: perf-01-consumer-shell-bundle (TICKET PERF-01)

**Status**: DONE. Archived 2026-09-16.

## Summary

`ConsumerShell.tsx` (shared by every `(tenant)` and `(account)` page) shipped the entire ~35KB i18n message bundle to the browser on every request, even though its Client Components only ever read 3 of its 8 top-level namespaces (~5KB, 85.9% waste). `(marketing)/layout.tsx` had the identical defect but worse — zero Client Components exist under `(marketing)` today, so it shipped the full bundle for zero consumers.

## Re-audit, not re-trust

The PR3/3 measurement this ticket was opened from was 5 weeks stale — I18N-04/05/07 had added new namespaces since (`calendar`, `tenant.openStatus`, `tenant.userMenu`) that the original number didn't account for. Every namespace claim in this change was re-verified fresh via `rg` over every real `'use client'` file, not copied from the old note.

## The reason PR3/3 deferred this: solved with a test, not just a narrower array

Narrowing `NextIntlClientProvider`'s `messages` prop is type-legal (`use-intl`'s `DeepPartial<Messages> | null`) but not compile-time safe — a future Client Component reading a namespace outside the subset compiles clean and fails silently at runtime. This change adds `client-namespace-audit.test.ts`, which statically scans the consumer-facing route groups for `useTranslations()` calls and fails the test suite the moment someone adds a client namespace without updating the allow-list. Verified this actually catches the failure mode: temporarily mis-pointed a real `useTranslations()` call during development, confirmed the test failed with an actionable message, then reverted.

## Scope

2 production files changed (+6/-2 net), 4 new files (a subsetting helper + its test, a standalone allow-list module, and the regression-guard test). `(dashboard)/layout.tsx` — which genuinely needs most of the bundle — is untouched.

## Disclosed limitation

The audit test's scan scope covers every real consumer verified during explore (`(tenant)`, `(account)`, `(marketing)`, and the 2 top-level `shared/components/` files actually imported by them) but does not recurse into `shared/components/dashboard/`/`shared/components/booking/` (confirmed dashboard-only) or scan the whole repo. A brand-new shared client component added elsewhere and later imported by these route groups would not be caught until the scan roots are extended.

## Validation

`pnpm check-types` exit 0, `npm run build` exit 0 (26/26 routes), `pnpm test` 48/48 (8 new), `eslint` clean save for 1 pre-existing, confirmed-unrelated warning.
