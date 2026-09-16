# Verify report: i18n-dashboard-locale-db-fallback (Huecos A/B)

**Verdict: PASS** (0 critical, 0 new warnings)

## Requirement-by-requirement check

- **Cookie-present path unchanged**: diffed literally — the `hasDashboardLocaleCookie` ternary's true-branch is byte-identical to the pre-existing expressions (`localeFromHeader(headersList.get('x-locale'))`, `await getMessages()`). Zero behavioral change for the ~95% common case.
- **Cookie-absent, profile locale set**: `resolveDashboardFallbackLocale('en', anything)` returns `'en'` — unit-tested.
- **Cookie-absent, profile null, org locale set**: `resolveDashboardFallbackLocale(null, 'es')` returns `'es'` — unit-tested.
- **Cookie-absent, nothing usable**: returns `DEFAULT_LOCALE` — unit-tested, including the case where `profileLocale` is present but not a supported value (falls through to org, not straight to default).
- **Zero new DB round-trips**: confirmed by reading `resolve-tenant-org-id.ts`'s diff — `orgResult` (already fetched for `orgId`) and the `profiles` SELECT (already run for the RBAC gate) are the only two queries in the function, both pre-existing, only their column lists changed.

## Scope discipline

- `proxy.ts`/`src/i18n/request.ts`: confirmed untouched (`git status`) — no middleware-scope ticket needed, per the user's explicit layout-mount choice.
- `<html lang>` in `DashboardLayout` (outer): confirmed untouched — disclosed non-goal, not a regression (pre-existing independent resolution, same as before A11Y-01).
- Cookie is not re-seeded (Next.js restriction: `cookies().set()` requires a Server Action/Route Handler, unavailable in a Server Component render) — disclosed, matches the debt's own "Estimated effort: S" framing.

## Build-time / lint-time verification

- `pnpm check-types`: exit 0 — the additive `ResolveTenantOk` fields broke nothing across its ~15 existing consumers.
- `npm run build`: exit 0, 26/26 routes — empirically confirms the dynamic `import(\`../../messages/${locale}.json\`)` inside `DashboardShell` (itself inside `<Suspense>`, inside the outer statically-cacheable `DashboardLayout`) bundles and resolves correctly, mirroring `src/i18n/request.ts`'s own working pattern.
- `pnpm test`: 42/42 passed (4 new, covering the fallback function's full decision table).
- `eslint`: 2 pre-existing `no-fallthrough` warnings on the RBAC `switch` — already disclosed during A11Y-01's follow-up fix on this same file; confirmed unrelated to this diff's lines.

## Files changed / size

5 files, 66 net lines (`+66/-6` per `git diff --stat` reading `+ ...` minus `- ...`... actual: 10 insertions/2 deletions in `resolve-tenant-org-id.ts`, 4 insertions in `resolve-tenant-types.ts`, 16 insertions in `detect-locale.ts`, 20 insertions in `detect-locale.test.ts`, 22 insertions/4 deletions in `(dashboard)/layout.tsx`). Well under the 400-line budget.
