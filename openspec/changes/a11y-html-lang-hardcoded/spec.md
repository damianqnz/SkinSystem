# Spec: a11y-html-lang-hardcoded (TICKET A11Y-01)

## Requirement 1: Dashboard root layout announces the resolved locale

### Scenario: PT-locale staff member opens the dashboard
- **Given** a staff member whose resolved dashboard locale (via `detectDashboardLocale`) is `pt`
- **When** the `(dashboard)` root layout renders
- **Then** the emitted `<html>` element has `lang="pt"`, not a hardcoded `"es"`

### Scenario: ES-locale staff member opens the dashboard
- **Given** a staff member whose resolved dashboard locale is `es`
- **When** the `(dashboard)` root layout renders
- **Then** the emitted `<html>` element has `lang="es"`

### Scenario: EN-locale staff member opens the dashboard
- **Given** a staff member whose resolved dashboard locale is `en`
- **When** the `(dashboard)` root layout renders
- **Then** the emitted `<html>` element has `lang="en"`

### Scenario: Existing RBAC/redirect behavior is unaffected
- **Given** the same authenticated-but-not-staff and unauthenticated flows that `DashboardShell` already handles (`NO_AUTH` → `/login`, `NOT_MEMBER`/other anomalies → `/me`)
- **When** the locale-resolution fix is applied
- **Then** those redirects still fire under the same conditions as before (no behavioral change to `resolveTenantOrgId()` or its switch branches)

## Requirement 2: Auth root layout announces the resolved locale

### Scenario: PT-locale visitor opens `/login`
- **Given** a visitor whose resolved public locale (via `detectLocale`, the `NEXT_LOCALE` cookie / `Accept-Language` chain) is `pt`
- **When** the `(auth)` root layout renders
- **Then** the emitted `<html>` element has `lang="pt"`, not a hardcoded `"es"`

### Scenario: ES-locale visitor opens `/login`
- **Given** a visitor whose resolved public locale is `es`
- **When** the `(auth)` root layout renders
- **Then** the emitted `<html>` element has `lang="es"`

### Scenario: EN-locale visitor opens `/login`
- **Given** a visitor whose resolved public locale is `en`
- **When** the `(auth)` root layout renders
- **Then** the emitted `<html>` element has `lang="en"`

## Non-scenario: build-time verification (not RTL/jsdom-testable)

Neither requirement has a Server-Component runtime test harness available in this repo (no RTL/jsdom precedent for root-layout rendering, same constraint documented for A11Y-02). Compliance is verified by:
1. Diff-literal check: the `<html lang={...}>` expression reads from a real per-request locale value, not a string literal.
2. `npm run build` passing (arbiter for the `(dashboard)/layout.tsx` cacheComponents question raised in explore.md).
3. Source-level confirmation that `getLocale()` in both files resolves from `src/i18n/request.ts`, which reads the same `x-locale` header the proxy already sets for `/dashboard` and `/login`/`/auth` respectively (verified in explore.md against `proxy.ts`).
