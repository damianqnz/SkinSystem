# Spec: i18n-dashboard-locale-db-fallback (Huecos A/B)

## Requirement 1: Dashboard content locale falls back to the DB chain when `DASHBOARD_LOCALE` is absent

### Scenario: Cookie present (unchanged behavior)
- **Given** a request to `/dashboard/*` carrying a `DASHBOARD_LOCALE` cookie
- **When** `DashboardShell` renders
- **Then** `locale`/`messages` resolve exactly as before this change (`x-locale` header → `getMessages()`)

### Scenario: Cookie absent, staff member has an explicit `profiles.locale`
- **Given** a request with no `DASHBOARD_LOCALE` cookie, for a staff member whose `profiles.locale` is `'en'`
- **When** `DashboardShell` renders
- **Then** the dashboard renders in English, regardless of what `NEXT_LOCALE`/Accept-Language would have produced

### Scenario: Cookie absent, staff member has no explicit preference
- **Given** a request with no `DASHBOARD_LOCALE` cookie, `profiles.locale` is `null`, and the org's `organizations.locale` is `'es'`
- **When** `DashboardShell` renders
- **Then** the dashboard renders in Spanish (the org default), not the public Accept-Language chain

### Scenario: Cookie absent, no usable locale anywhere
- **Given** neither `profiles.locale` nor `organizations.locale` resolves to a supported locale
- **When** `resolveDashboardFallbackLocale` runs
- **Then** it returns `DEFAULT_LOCALE`

## Non-scenario: `<html lang>` in the fallback case (disclosed non-goal)

The outer `DashboardLayout`'s `<html lang>` is not corrected by this change (see proposal.md's non-goals) — it may show a different locale than the rendered content in this narrow fallback scenario. Not a regression: `<html lang>` was already resolved independently before A11Y-01/this change.

## Verification (no RTL/jsdom harness, same constraint as every prior ticket)

1. `resolveDashboardFallbackLocale` — pure function, fully unit-tested (profile wins, org wins, both unsupported, unsupported-profile-falls-through).
2. `pnpm check-types` — catches any `ResolveTenantOk` consumer mismatch (none expected — purely additive fields).
3. `npm run build` — empirical proof the dynamic `import()` for messages resolves and bundles.
4. `pnpm test` full suite green.
