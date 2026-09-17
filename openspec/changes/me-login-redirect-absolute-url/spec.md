# Spec: me-login-redirect-absolute-url

## Requirement 1: `buildLoginUrl` always produces a valid absolute `next` URL

### Scenario: Local dev host
- **Given** `rawHost = 'lourdes.lvh.me:3000'`, `pathname = '/dashboard'`
- **When** `buildLoginUrl(rawHost, pathname)` runs
- **Then** it returns an `http://` URL on the same host, with `next` set to the full absolute URL of the original request

### Scenario: Production host
- **Given** `rawHost = 'lourdes.skinsystem.test'`, `pathname = '/me'`
- **When** `buildLoginUrl(rawHost, pathname)` runs
- **Then** it returns an `https://auth.skinsystem.test/login` URL, with `next` pointing back at `https://lourdes.skinsystem.test/me` (the tenant host, not the auth host)

### Scenario: `next` is always parseable as an absolute URL
- **Given** any valid host/pathname combination
- **When** `buildLoginUrl` runs
- **Then** `new URL(result.searchParams.get('next'))` never throws — the exact contract `resolveRedirectUrl()` requires

## Requirement 2: `proxy.ts`'s observable behavior is unchanged

### Scenario: Existing proxy tests
- **Given** the full pre-existing `proxy.test.ts` suite (header-forgery + MW-03's `/me` guard tests)
- **When** run after this change
- **Then** every test still passes unmodified

## Requirement 3: `me/layout.tsx`'s fallback redirect is now a valid absolute URL

### Scenario: Unauthenticated visit reaches the layout's own check
- **Given** the layout's redundant auth check fires (a scenario that should not occur in normal operation post-MW-03)
- **When** it redirects
- **Then** the target URL's `next` param is a valid absolute URL, not a relative path `resolveRedirectUrl()` would discard

## Verification

New unit tests for `buildLoginUrl` (4 scenarios: local host, production host, next-is-always-absolute, null host fallback). Full existing `proxy.test.ts` suite re-run to confirm Requirement 2.
