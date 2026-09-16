# Design: a11y-html-lang-hardcoded (TICKET A11Y-01)

## Technical approach

### 1. `apps/web/src/app/(dashboard)/layout.tsx`

Candidate 1 (preferred, attempt first):

- Add `import { getLocale } from 'next-intl/server';` (the file already imports `getMessages` from the same module for `DashboardShell`, so this is a sibling import, not a new dependency).
- Convert the default export `DashboardLayout` from a synchronous function to `async function DashboardLayout(...)`.
- At the top of `DashboardLayout`, `const locale = await getLocale();`.
- Change line 116 from `<html lang="es" ...>` to `<html lang={locale} ...>`.
- Leave `DashboardShell` completely untouched — it keeps its own `headers()` call, RBAC gate, and redirect logic exactly as today. `DashboardShell` also calls `getMessages()`/derives its own locale via `localeFromHeader` for the `NextIntlClientProvider` it mounts; that is a separate, already-correct code path and is not touched by this change (both calls will resolve to the same `x-locale` header value, just via two different next-intl entry points — no behavioral drift).

**Build gate**: run `npm run build` immediately after this change, before touching `(auth)/layout.tsx`. This is the empirical test for whether `cacheComponents` rejects `getLocale()` in this specific outer/statically-cacheable layout.

- **If build passes**: candidate 1 stands. Proceed to `(auth)/layout.tsx`.
- **If build fails** with a cacheComponents/dynamicIO error attributable to this change: revert the `DashboardLayout` edit and fall back to candidate 2 below. Do not attempt trial-and-error variations beyond this single documented fallback — an unexpected failure mode gets reported to the user per the SDD gate, not looped on.

### 1b. Fallback — candidate 2 (only if candidate 1 fails the build)

Restructure `(dashboard)/layout.tsx` to match the working `(tenant)/[tenant]/layout.tsx` shape:
- Merge `DashboardLayout` and `DashboardShell` into a single `async function DashboardLayout`.
- That single function does: `await headers()` (or `await getLocale()`), the RBAC gate, then returns `<html lang={locale}>...<body>...<NextIntlClientProvider>...<TenantProvider>...</TenantProvider></NextIntlClientProvider>...</body></html>` directly.
- `<Suspense>` moves to wrap only `{children}` inside `<main>` — which the file already does at lines 91-99 — so the *page content* still streams, just not the whole shell/RBAC resolution.
- This is a larger, riskier diff (touches the redirect/RBAC flow's surrounding structure, even though the RBAC logic itself is copy-pasted unchanged) and is only executed if candidate 1 is proven to fail.

### 2. `apps/web/src/app/(auth)/layout.tsx`

No existing complexity to preserve — this is a pure additive change:
- Add `import { getLocale } from 'next-intl/server';`.
- Convert `AuthLayout` to `async function AuthLayout(...)`.
- `const locale = await getLocale();` at the top.
- Change line 29 from `lang="es"` to `lang={locale}`.

No proxy/middleware change: `/login` and `/auth` are already outside `PRIVATE_PREFIXES`, so `detectLocale(request)` already sets `x-locale` for these paths today (verified in explore.md); `getLocale()` will read it correctly with zero additional plumbing.

## Files touched

| File | Change |
|---|---|
| `apps/web/src/app/(dashboard)/layout.tsx` | Candidate 1: +1 import, sync→async, +1 `getLocale()` call, 1 attribute. Candidate 2 (fallback only): structural merge of two functions. |
| `apps/web/src/app/(auth)/layout.tsx` | +1 import, sync→async, +1 `getLocale()` call, 1 attribute. |

No new files, no new i18n keys, no test files (no extractable pure logic — same precedent as A11Y-02).

## Validation gate

- `pnpm check-types` (`tsc --noEmit`) — exit 0.
- `npm run build` — exit 0, all routes still listed, no cacheComponents/dynamicIO regression. This is the decisive gate for candidate 1 vs. candidate 2 on `(dashboard)/layout.tsx`.
- `pnpm test` — full suite green (no test changes expected, but confirms no regression, e.g. `messages.test.ts` parity unaffected since no i18n keys change).
- Manual source diff-check: both `<html lang={...}>` expressions read from `getLocale()`, not a literal.
