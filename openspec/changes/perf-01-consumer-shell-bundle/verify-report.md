# Verify report: perf-01-consumer-shell-bundle (TICKET PERF-01)

**Verdict: PASS** (0 critical, 0 new warnings)

## Requirement-by-requirement check

### Requirement 1: Consumer client bundle carries only `booking`/`calendar`/`tenant`
- Diffed literally: `ConsumerShell.tsx` now computes `messages = pickMessages(await getMessages(), CONSUMER_CLIENT_NAMESPACES)`.
- Byte measurement re-run post-change against the real `pt.json`: subset is 4,951 B vs 35,234 B full — 85.9% reduction, applies to every tenant landing and every `/me` page (both share `ConsumerShell`).
- No existing client translation call broken: the `client-namespace-audit.test.ts` test scans every real `'use client'` file under `(tenant)`/`(account)`/`shared/components/` top-level and asserts every `useTranslations()` namespace it finds today is in `CONSUMER_CLIENT_NAMESPACES` — passes clean, proving the audited allow-list already covers 100% of today's real usage.

### Requirement 2: Marketing apex ships zero i18n payload
- `(marketing)/layout.tsx` now passes `pickMessages(messages, MARKETING_CLIENT_NAMESPACES)` where `MARKETING_CLIENT_NAMESPACES = []` — `messages` prop is `{}`.
- Confirmed via the same audit test's second `it()`: zero Client Components exist under `(marketing)` today, so the empty allow-list is exactly correct, not a guess.

### Requirement 3: Future out-of-allow-list namespace fails the test suite
- Verified empirically, not just by code review: temporarily changed `UserMenu.tsx`'s `useTranslations('tenant.userMenu')` to `useTranslations('dashboard.customers')`, re-ran `pnpm test client-namespace-audit`, got:
  > `AssertionError: .../UserMenu.tsx: useTranslations('dashboard...') reads a namespace not in [booking, calendar, tenant]`
- Reverted immediately after confirming the failure mode; final `pnpm test` run (48/48) confirms the revert left no trace.

## Build-time / lint-time verification

- `pnpm check-types`: exit 0. `pickMessages`'s `Record<string, unknown>` initially failed against `AbstractIntlMessages`'s index signature (`string | AbstractIntlMessages`, not `unknown`) — corrected to `Record<string, AbstractIntlMessages[string]>` plus a non-null assertion after the `in`-guarded lookup (TS doesn't narrow index-signature access via `in`).
- `npm run build`: exit 0, 26/26 routes, route table unchanged.
- `pnpm test`: 48/48 passed (8 new across `pick-messages.test.ts` and `client-namespace-audit.test.ts`).
- `eslint` on all 6 touched/created files: 1 pre-existing warning (`@next/next/no-head-element` on `ConsumerShell.tsx`'s `<head>` tag — confirmed via `git diff` to sit outside every changed line, this file's `<head>` predates the change and is structurally required since `ConsumerShell` provides the whole `<html>/<head>/<body>` document).

## Scope discipline

- `(dashboard)/layout.tsx`: confirmed untouched (`git status`) — still receives the full bundle, unchanged, per the explicit non-goal.
- No `messages/*.json` content changed — confirmed via `git status`, only code files touched.
- `shared/components/dashboard/`/`shared/components/booking/` subtrees: confirmed via `rg` (done during explore) to have zero imports from `(tenant)`/`(account)`/`(marketing)` — correctly excluded from the audit test's scan scope, disclosed as a deliberate limitation in design.md (a *new* shared component elsewhere wouldn't be caught until the scan roots are extended).

## Files changed / size

2 production files (+6/-2 net: `ConsumerShell.tsx`, `(marketing)/layout.tsx`), 4 new files (`pick-messages.ts` + its test, `client-namespaces.ts`, `client-namespace-audit.test.ts`). Well under the 400-line single-PR budget.
