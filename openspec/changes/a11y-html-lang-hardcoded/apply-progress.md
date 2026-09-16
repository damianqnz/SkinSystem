# Apply Progress: a11y-html-lang-hardcoded

**Mode**: Standard (no Strict TDD flag found in sdd-init/skinsystem; no extractable pure logic — same precedent as A11Y-02).
**Batch**: 1 of 1, all tasks complete.

## Completed tasks

### Phase 1 — Dashboard root layout (candidate 1)
- [x] 1.1 Added `getLocale` to the existing `next-intl/server` import
- [x] 1.2 `DashboardLayout` converted to `async`
- [x] 1.3 `const locale = await getLocale();` added
- [x] 1.4 `<html lang="es">` → `<html lang={locale}>`
- [x] 1.5 `npm run build` — exit 0, 26/26 routes, no cacheComponents error. **Candidate 1 survives — fallback (Phase 1b) not needed.**

### Phase 1b — Fallback restructure
- Not triggered. Candidate 1 passed the build gate on the first attempt.

### Phase 2 — Auth root layout
- [x] 2.1 Added `getLocale` import from `next-intl/server`
- [x] 2.2 `AuthLayout` converted to `async`
- [x] 2.3 `const locale = await getLocale();` added
- [x] 2.4 `lang="es"` → `lang={locale}`

### Phase 3 — Validation
- [x] 3.1 `pnpm check-types` — exit 0
- [x] 3.2 `npm run build` (final) — exit 0, 26/26 routes
- [x] 3.3 `pnpm test` — 38/38 passed
- [x] 3.4 `rg 'lang="es"'` on both files — zero matches

## Final diff

- `apps/web/src/app/(dashboard)/layout.tsx`: +4/-2. Only the import line and the `DashboardLayout` function touched; `DashboardShell` (RBAC gate, `headers()`, redirect logic, Suspense boundary) untouched — confirmed via `git diff`.
- `apps/web/src/app/(auth)/layout.tsx`: +4/-2.
- Total: 8 lines net, 2 files.

## Notes

- `eslint` on both changed files reports 2 warnings (`no-fallthrough` in `DashboardShell`'s RBAC `switch`, lines 56/60). Confirmed via `git diff` these lines are outside the changed hunks — pre-existing, not introduced by this change, not fixed (out of scope, same triage pattern as I18N-05's pre-existing unused-var warnings).
