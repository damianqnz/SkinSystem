# Tasks: perf-01-consumer-shell-bundle (TICKET PERF-01)

## Phase 1 — `pickMessages` helper + tests
- [x] 1.1 Create `apps/web/src/i18n/pick-messages.ts`
- [x] 1.2 Unit tests: subset extraction, missing-namespace tolerance, empty-array input

## Phase 2 — Wire into the two providers
- [x] 2.1 `ConsumerShell.tsx`: import `CONSUMER_CLIENT_NAMESPACES` from the new standalone `client-namespaces.ts`, apply `pickMessages`
- [x] 2.2 `(marketing)/layout.tsx`: import `MARKETING_CLIENT_NAMESPACES` (empty), apply `pickMessages`

## Phase 3 — Regression-guard test
- [x] 3.1 `apps/web/src/i18n/client-namespace-audit.test.ts`: scan `(tenant)`, `(account)`, `(marketing)`, and `shared/components/`'s top-level files for `useTranslations()` namespace calls against the imported allow-lists
- [x] 3.2 Confirmed it passes against current code (audited list is complete) — 48/48 suite green
- [x] 3.3 Confirmed it can fail: temporarily changed `UserMenu.tsx`'s `useTranslations('tenant.userMenu')` to `useTranslations('dashboard.customers')`, re-ran the test, got the expected actionable failure message, reverted

## Phase 4 — Validation
- [x] 4.1 `pnpm check-types` — exit 0 (2 iterations to satisfy `AbstractIntlMessages`'s index-signature typing)
- [x] 4.2 `npm run build` — exit 0, route table unchanged (26/26)
- [x] 4.3 `pnpm test` — 48/48 passed (8 new: 4 `pickMessages` + 2 audit tests + the temporary negative-path check, not counted twice)
- [x] 4.4 `eslint` on all changed files — 1 pre-existing warning (`<head>` element in `ConsumerShell.tsx`, confirmed via `git diff` outside the changed lines), 0 new
- [x] 4.5 Manual byte-size confirmation matching explore.md: pt subset 4,951 B vs 35,234 B full (85.9% reduction); marketing 0 B vs full (100%)

**Actual**: 2 production files changed (+6/-2 net), 4 new files (2 helpers, 2 test files). Low risk, single PR.
