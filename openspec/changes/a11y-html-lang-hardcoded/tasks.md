# Tasks: a11y-html-lang-hardcoded (TICKET A11Y-01)

## Phase 1 — Dashboard root layout (candidate 1: minimal)
- [x] 1.1 Add `import { getLocale } from 'next-intl/server';` to `(dashboard)/layout.tsx`
- [x] 1.2 Convert `DashboardLayout` to `async function DashboardLayout(...)`
- [x] 1.3 Add `const locale = await getLocale();` at the top of `DashboardLayout`
- [x] 1.4 Change `<html lang="es" ...>` to `<html lang={locale} ...>`
- [x] 1.5 Run `npm run build` — confirm exit 0 and no cacheComponents/dynamicIO error (PASSED — 26/26 routes)

## Phase 1b — Fallback restructure (ONLY if 1.5 fails)
- Not triggered — candidate 1 passed on first attempt.

## Phase 2 — Auth root layout
- [x] 2.1 Add `import { getLocale } from 'next-intl/server';` to `(auth)/layout.tsx`
- [x] 2.2 Convert `AuthLayout` to `async function AuthLayout(...)`
- [x] 2.3 Add `const locale = await getLocale();` at the top of `AuthLayout`
- [x] 2.4 Change `lang="es"` to `lang={locale}`

## Phase 3 — Validation
- [x] 3.1 `pnpm check-types` — exit 0
- [x] 3.2 `npm run build` (final, both files changed) — exit 0, route table unchanged (26/26)
- [x] 3.3 `pnpm test` — 38/38 passed
- [x] 3.4 Diff-literal check: both `<html lang={...}>` read from `getLocale()`, zero remaining `lang="es"` literal in either file

**Forecast**: ~10-15 changed lines if candidate 1 survives (Phase 1b skipped); Low risk, single PR, no chaining. If Phase 1b triggers, re-forecast before apply continues past it (still expected well under the 400-line budget given `TenantLayout` itself is 42 lines).
