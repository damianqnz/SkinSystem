# Follow-up: Gentle AI review findings resolved (a11y-html-lang-hardcoded)

The initial A11Y-01 commit (`e257e25`) passed Gentle AI review as **approved** with 3 non-blocking findings. Rather than let them sit as unaddressed debt, they were resolved immediately in a follow-up patch, before moving to the next ticket.

## Findings and resolution

1. **R3-missing-locale-behavior-test** (WARNING) — no automated test asserted the `<html lang>` value for pt/es/en.
2. **R3-duplicate-locale-resolution-path** (WARNING) — `DashboardLayout`'s new `getLocale()` call and `DashboardShell`'s pre-existing `localeFromHeader()` call were two independent mechanisms assumed, not proven, to always agree.
3. **R3-unhandled-getlocale-failure-path** (SUGGESTION) — `await getLocale()` had no failure handling; a rejection would crash the whole route-group root layout.

**Single fix for all three**: replaced `getLocale()` (from `next-intl/server`) with `headers()` + `localeFromHeader()` — the same pattern already used at 40+ other call sites across this codebase (`(tenant)/[tenant]/layout.tsx`, `(account)/me/layout.tsx`, every dashboard page, etc.), instead of introducing a second, competing locale-resolution mechanism.

- **Finding 2 resolved by construction, not assumption**: `DashboardLayout` and `DashboardShell` now call the exact same pure function (`localeFromHeader`) against the exact same header value (`x-locale`) from the exact same per-request `headers()` object (Next.js memoizes `headers()` per request). Identical input to an identical pure function cannot diverge.
- **Finding 3 resolved by removing the fallible operation**: `localeFromHeader` is a synchronous, pure ternary/`includes()` check — it cannot throw or reject. The async `getLocale()` call (which internally dynamically imports a `messages/<locale>.json` file) is no longer on the `<html lang>` critical path.
- **Finding 1 resolved with targeted coverage**: `detect-locale.test.ts`'s `localeFromHeader` suite now asserts `pt`/`es`/`en` explicitly (previously only `en` was covered alongside the fallback cases) — this is the exact function both layouts use to produce `<html lang>`, so this is direct coverage of the behavior the finding named, within this repo's existing test-harness constraints (no RTL/jsdom for Server Component root-layout rendering).

## Files changed
- `apps/web/src/app/(dashboard)/layout.tsx`: swapped `getLocale()` import/call for the existing `headers()` + `localeFromHeader()` already used by `DashboardShell` below it.
- `apps/web/src/app/(auth)/layout.tsx`: same swap; now matches `(account)/me/layout.tsx`'s exact pattern.
- `apps/web/src/i18n/detect-locale.test.ts`: extended the `localeFromHeader` test case to cover all 3 supported locales explicitly.

## Validation
`pnpm check-types` exit 0. `npm run build` exit 0 (26/26 routes — re-confirms `headers()` called directly in `DashboardLayout`'s outer, statically-cacheable shell does not trip Next 16's `cacheComponents`, same conclusion as the original candidate-1 test, now via the more standard code path). `pnpm test` 38/38 passed. `eslint` on all 3 changed files: 2 pre-existing warnings (unrelated `no-fallthrough` in `DashboardShell`'s RBAC switch, outside every changed hunk).
