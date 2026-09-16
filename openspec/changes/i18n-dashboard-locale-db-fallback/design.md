# Design: i18n-dashboard-locale-db-fallback (Huecos A/B)

## 1. `apps/web/src/i18n/detect-locale.ts`

New exported pure function, sibling to `localeFromHeader`/`detectDashboardLocale`:

```ts
export function resolveDashboardFallbackLocale(
  profileLocale: string | null,
  orgLocale: string,
): SupportedLocale {
  if (isSupportedLocale(profileLocale ?? undefined)) return profileLocale as SupportedLocale;
  if (isSupportedLocale(orgLocale)) return orgLocale as SupportedLocale;
  return DEFAULT_LOCALE;
}
```

## 2. `apps/web/src/shared/lib/resolve-tenant-types.ts`

`ResolveTenantOk` gains two fields: `profileLocale: string | null`, `orgLocale: string`. Purely additive — every existing consumer destructures only the fields it needs, so this cannot break any of the ~15 Server Actions already calling `resolveTenantOrgId()`.

## 3. `apps/web/src/shared/lib/resolve-tenant-org-id.ts`

- Widen the existing `profiles` SELECT: `{ role, isActive, locale }` (was `{ role, isActive }`) — zero new query, same round-trip.
- Return `profileLocale: profile.locale` and `orgLocale: orgResult.data.locale` on success — `orgResult` (from `getOrganizationBySlug`, already called earlier in this same function) already selects `organizations.locale` via its `SLUG_COLS`; no new query there either.

## 4. `apps/web/src/app/(dashboard)/layout.tsx` — `DashboardShell`

- Add `cookies()` alongside the existing `headers()` call.
- Move the RBAC gate (`resolveTenantOrgId()` + redirect switch) **before** locale resolution — it now needs to run first so `auth.profileLocale`/`auth.orgLocale` are available for the fallback branch.
- `const hasDashboardLocaleCookie = !!cookieStore.get('DASHBOARD_LOCALE')?.value;`
- `locale`: ternary — cookie present → existing `localeFromHeader(...)`; absent → `resolveDashboardFallbackLocale(auth.profileLocale, auth.orgLocale)`.
- `messages`: ternary — cookie present → existing `getMessages()`; absent → `(await import(\`../../messages/${locale}.json\`)).default` (mirrors `src/i18n/request.ts`'s own dynamic-import pattern for message loading, since `getMessages()` always resolves against the header-derived locale and can't be redirected).

No changes to the outer `DashboardLayout`'s `<html lang>` resolution (still `localeFromHeader` from the header) — disclosed non-goal, see proposal.md.

## Validation gate

`pnpm check-types`, `pnpm test` (new unit tests for `resolveDashboardFallbackLocale` covering: profile wins, org wins when profile is null, both unsupported → `DEFAULT_LOCALE`, unsupported profile falls through to a valid org locale), `npm run build` (empirical check that the dynamic `import()` inside the already-Suspense-wrapped `DashboardShell` bundles and resolves correctly), `eslint` on all touched files.
