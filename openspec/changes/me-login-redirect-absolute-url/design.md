# Design: me-login-redirect-absolute-url

## `apps/web/src/infrastructure/auth/build-login-url.ts`

```ts
export function buildLoginUrl(rawHost: string | null, pathname: string): URL {
  const host = rawHost ?? '';
  const isLocal = isLocalHost(host);
  const scheme = isLocal ? 'http' : 'https';
  const loginHost = isLocal ? host : `auth.${BASE_DOMAIN}`;

  const url = new URL(`${scheme}://${loginHost}/login`);
  url.searchParams.set('next', `${scheme}://${host}${pathname}`);
  return url;
}
```

Removed the `NextRequest` import/type entirely — no longer needed.

## `apps/web/src/proxy.ts`

One-line call-site update:
```ts
return redirectWithSession(response, buildLoginUrl(request.headers.get('host'), pathname));
```
(was `buildLoginUrl(request, pathname)`.) `request.headers.get('host')` is exactly what the old implementation read internally — zero behavior change.

## `apps/web/src/app/(account)/me/layout.tsx`

```ts
import { buildLoginUrl } from '@/infrastructure/auth/build-login-url';
// ...
if (!user) redirect(buildLoginUrl(hdrs.get('host'), '/me').toString());
```
`hdrs` is the same `await headers()` result already computed at the top of the layout for `x-tenant-slug`/`x-locale` — no new header read.

## `apps/web/src/infrastructure/auth/build-login-url.test.ts` (new)

4 cases: local host (http, same-host), production host (https, `auth.` subdomain, `next` still points at the tenant host), `next` is always a parseable absolute URL, and the `rawHost = null` edge case (empty-host fallback, still routes to the auth subdomain).

## Validation gate

`pnpm check-types`, `pnpm test` (new test file + full `proxy.test.ts`, confirming MW-03's tests are unaffected), `npm run build`, `eslint` on all 4 touched/created files.
