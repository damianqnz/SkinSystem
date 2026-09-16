# Exploration: a11y-html-lang-hardcoded (TICKET A11Y-01)

## Problem

Two root layouts hardcode `<html lang="es">` regardless of the actual visitor/staff locale:

- `apps/web/src/app/(dashboard)/layout.tsx:116`
- `apps/web/src/app/(auth)/layout.tsx:29`

`DEFAULT_LOCALE` is `'pt'`, and the dashboard's own middleware (`detectDashboardLocale`) already resolves a real locale per request. A screen reader announces the panel and the login screen in Spanish even for a PT-locale tenant/staff member. Violates WCAG 3.1.1 (Language of Page).

`(marketing)` and `(tenant)/[tenant]` (via `ConsumerShell`) already resolve `lang={locale}` correctly — confirmed by direct read, not assumed.

## Current state, verified by reading each file directly

### `(dashboard)/layout.tsx`
- `DashboardLayout` (the default export, i.e. the actual root layout returning `<html>`) is a **synchronous** function. It renders `<html lang="es">` at line 116, then wraps the dynamic `DashboardShell` in `<Suspense>`.
- `DashboardShell` is a separate **async** component nested inside that `<Suspense>`. It calls `await headers()`, resolves `locale` via `localeFromHeader(headersList.get('x-locale'))`, and does the RBAC gate (`resolveTenantOrgId()` + `redirect()`).
- A code comment (lines 34-37) explains the split: reading `headers()` from the *outer* layout previously broke Next 16's `cacheComponents`, because that outer layout is statically cacheable and dynamicIO rejects runtime data access there. That is why locale resolution was pushed into the Suspense-wrapped child instead of the root.
- Net effect: the *only* place `locale` is computed is inside `DashboardShell`, several component-levels below where `<html>` is rendered. `<html lang="es">` has no way to reach it today without restructuring.

### `(auth)/layout.tsx`
- `AuthLayout` is synchronous, does not call `headers()`, `getLocale()`, or anything locale-related. No `NextIntlClientProvider` either (route currently has zero i18n wiring).
- Confirmed via `proxy.ts:39,67`: `/login` and `/auth` are in `UNREWRITTEN_PREFIXES` but **not** in `PRIVATE_PREFIXES` (`['/dashboard', '/admin']`), so `detectLocale(request)` (public chain: `NEXT_LOCALE` cookie ← `Accept-Language`) already runs and sets the `x-locale` request header for this route today — it is simply never read.

### Working precedent — why a straightforward async conversion is plausible

- `(marketing)/layout.tsx:26-27`: `MarketingLayout` is `async`, calls `getLocale()`/`getMessages()` from `next-intl/server` directly in the root layout (no Suspense at all), and renders `<html lang={locale}>`. Confirmed compiling clean (existing code, already shipped).
- `(tenant)/[tenant]/layout.tsx:27-28`: `TenantLayout` is `async`, calls `await headers()` directly in the root layout (again, no Suspense), does a `notFound()` guard and a data fetch (`getBrandTheme`), then renders `<html>` via `ConsumerShell`. Also confirmed compiling clean (existing code, already shipped).
- Both precedents call dynamic/request-scoped APIs (`getLocale()` → internally `headers()` via `src/i18n/request.ts:13`, or raw `headers()`) directly in an async root layout with **no** Suspense split, and both build successfully today.
- This means the `cacheComponents` constraint documented in `(dashboard)/layout.tsx`'s comment is not a blanket rule against "headers in root layout" — something narrower triggered it previously (a build-time observation, not a documented Next.js API restriction). The dashboard's existing Suspense split may have been motivated by streaming the RBAC/tenant-resolution latency, conflated with (or additionally justified by) the cacheComponents error.

## Two live candidates for `(dashboard)/layout.tsx`, both build-verifiable

1. **Minimal**: keep `DashboardShell`'s existing Suspense split untouched (RBAC gate, `resolveTenantOrgId()`, redirect logic all stay exactly as-is). Convert only `DashboardLayout` (the outer function) to `async`, add one `getLocale()` call (from `next-intl/server` — cheap, and `src/i18n/request.ts` already resolves it from `x-locale` per request, no new header parsing needed), use it for `<html lang={locale}>`. `npm run build` is the arbiter: if this alone reproduces the cacheComponents error from the original comment, candidate 1 is dead and candidate 2 becomes the only path.
2. **Full restructure**: collapse the outer/inner split — make the whole layout look like `TenantLayout` (fully async root, no Suspense at the layout level, `<Suspense>` only wraps `{children}` inside `<main>` as it already partially does at line 91-99). Larger diff, touches the RBAC/redirect flow that candidate 1 leaves untouched.

Candidate 1 is preferred if `npm run build` accepts it: smallest diff, zero behavior change to the existing RBAC/redirect path, isolates the WCAG fix to exactly the two files the ticket names.

## `(auth)/layout.tsx` fix

No existing complexity to preserve. Convert `AuthLayout` to `async`, call `getLocale()`, render `<html lang={locale}>`. `x-locale` is already set for this route by the proxy (verified above), so this is additive with no proxy/middleware change needed — respects `CLAUDE.md`'s "No Unauthorized Middleware Edits" red line.

## Non-goals

- No `NextIntlClientProvider` addition to `(auth)` — out of scope; the ticket is about the `lang` attribute only, not client-side translation coverage for the login page.
- No touching `(dashboard)/layout.tsx`'s RBAC/redirect logic, `DashboardShell`'s existing Suspense boundary, or `TenantProvider`/`SidebarProvider` wiring.
- No touching `(marketing)` or `(tenant)/[tenant]` — already correct.
- PERF-01, PR4 (`INTL_LOCALE_MAP` dedup) — separate tickets, untouched.

## Open question for design phase

Whether candidate 1 survives `npm run build` for `(dashboard)/layout.tsx`. This is empirically decidable and does not need external research — `sdd-research` is not selected for this change.
