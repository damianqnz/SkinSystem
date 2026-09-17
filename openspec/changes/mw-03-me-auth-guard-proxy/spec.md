# Spec: mw-03-me-auth-guard-proxy (TICKET MW-03)

## Requirement 1: `/me` gets a real redirect from the proxy when unauthenticated

### Scenario: Unauthenticated visit to `/me` on a tenant subdomain
- **Given** a request to `/me` on `lourdes.skinsystem.test` with no Supabase session
- **When** `proxy()` runs
- **Then** it returns a redirect to the login URL built by `buildLoginUrl()`, before any layout renders

### Scenario: Authenticated visit to `/me` on a tenant subdomain
- **Given** a request to `/me` on `lourdes.skinsystem.test` with a valid Supabase session
- **When** `proxy()` runs
- **Then** it passes the request through unmodified (no redirect)

### Scenario: Authenticated visit to `/me` on the apex (no tenant)
- **Given** a request to `/me` on the apex host with a valid session but no resolvable tenant slug
- **When** `proxy()` runs
- **Then** it redirects to `/`

## Requirement 2: `/me`'s locale resolution and cookie-seeding behavior is bit-for-bit unchanged

### Scenario: `/me` still resolves locale via the public chain, not the dashboard chain
- **Given** a request to `/me` carrying a `DASHBOARD_LOCALE=en` cookie but no `NEXT_LOCALE` cookie, with `Accept-Language: es`
- **When** `proxy()` runs
- **Then** the resolved `x-locale` header is `es` (from the public `NEXT_LOCALE`/Accept-Language chain), **not** `en` (which would mean the dashboard chain leaked in)

### Scenario: `/me` still seeds `NEXT_LOCALE` on first visit
- **Given** a request to `/me` with no `NEXT_LOCALE` cookie present
- **When** `proxy()` runs
- **Then** the response sets a `NEXT_LOCALE` cookie — proving the `!isPrivate` cookie-seed block still fires for `/me`

## Requirement 3: `/dashboard`/`/admin` behavior is completely unchanged

### Scenario: Existing header-forgery and auth-guard tests for `/dashboard` still pass
- **Given** the existing `proxy.test.ts` suite
- **When** run after this change
- **Then** every existing test still passes unmodified — `PRIVATE_PREFIXES` itself never changed

## Verification

New tests in `proxy.test.ts` using the existing `vi.mock` seam on `createSupabaseMiddlewareClient` (design D1, per `CLAUDE.md`'s "no `proxy.ts` extraction" precedent) for all 3 scenarios in Requirement 1 and both in Requirement 2. Full existing suite re-run to confirm Requirement 3.
