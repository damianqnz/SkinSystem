# Design: mw-03-me-auth-guard-proxy (TICKET MW-03)

## `proxy.ts` changes

```ts
/** Prefixes whose locale resolution uses the staff-scoped DASHBOARD_LOCALE
 *  chain instead of the public NEXT_LOCALE/Accept-Language chain, and which
 *  never seed the public NEXT_LOCALE cookie. Unchanged by this ticket. */
const PRIVATE_PREFIXES = ['/dashboard', '/admin'] as const;

/** Prefixes that always require an authenticated session AND a resolvable
 *  tenant. Superset of PRIVATE_PREFIXES — /me is customer-facing and must
 *  keep the public locale chain, but still needs the same auth+tenant guard. */
const AUTH_REQUIRED_PREFIXES = ['/dashboard', '/admin', '/me'] as const;
```

In `proxy()`:
```ts
const requiresAuth = matchesPrefix(pathname, AUTH_REQUIRED_PREFIXES);
const isPrivate     = matchesPrefix(pathname, PRIVATE_PREFIXES); // unchanged meaning
const locale = isPrivate ? detectDashboardLocale(request) : detectLocale(request); // unchanged
...
if (requiresAuth && !user) {
  return redirectWithSession(response, buildLoginUrl(request, pathname));
}
if (requiresAuth && !tenantSlug) {
  return redirectWithSession(response, new URL('/', request.url));
}
...
if (!isPrivate && !request.cookies.get('NEXT_LOCALE')) { /* unchanged */ }
```

Only the 2 guard conditions swap `isPrivate` → `requiresAuth`. Every other `isPrivate` use (locale branch, cookie-seed condition) stays exactly as it reads today — this is the entire mechanism of the fix: `/me` gains `requiresAuth = true` while keeping `isPrivate = false`.

`UNREWRITTEN_PREFIXES` already lists `/me` explicitly (separate from its `...PRIVATE_PREFIXES` spread) — no change needed there.

## `me/layout.tsx`

No functional change. Update the file's own comment on its `if (!user) redirect(...)` line to note it's now redundant defense-in-depth (matching `DashboardShell`'s existing comment style), so a future reader isn't confused about why an apparently-unreachable branch still exists.

## `proxy.ts`'s own doc comment

`UNREWRITTEN_PREFIXES`'s docstring currently says `/me` has "its own guard" (implying layout-only). Update to reflect the proxy now also guards it.

## Tests: `proxy.test.ts`

Add a new `describe('proxy() /me auth guard')` block:
1. Unauthenticated `/me` on tenant host → redirect to a URL matching `buildLoginUrl`'s shape (host = auth subdomain or same-host in dev, `next` param present).
2. Authenticated `/me` on tenant host → no redirect (response is the pass-through/rewrite-exempt `NextResponse.next`).
3. Authenticated `/me` on apex (no tenant) → redirect to `/`.
4. Locale-chain isolation: `/me` request with `DASHBOARD_LOCALE=en` cookie, no `NEXT_LOCALE`, `Accept-Language: es` → forwarded `x-locale` is `es`, proving the dashboard cookie never leaks into `/me`'s resolution.
5. Cookie-seed: `/me` request with no `NEXT_LOCALE` cookie → response sets one.

## Validation gate

`pnpm check-types`, `pnpm test` (new tests + full existing suite — proves zero `/dashboard`/`/admin` regression), `npm run build`, `eslint`.
