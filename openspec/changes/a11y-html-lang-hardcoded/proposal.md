# Proposal: a11y-html-lang-hardcoded (TICKET A11Y-01)

## Intent

Fix the hardcoded `<html lang="es">` in `(dashboard)/layout.tsx` and `(auth)/layout.tsx` so both announce the visitor's/staff's actual resolved locale to assistive technology, closing a WCAG 3.1.1 violation already documented in `HEARTBEAT.md`.

## Scope

- `apps/web/src/app/(dashboard)/layout.tsx` — convert `DashboardLayout` to `async`, resolve locale via `getLocale()` (next-intl/server), pass it to `<html lang={locale}>`. `DashboardShell`'s existing Suspense boundary, RBAC gate, and redirect logic are left untouched.
- `apps/web/src/app/(auth)/layout.tsx` — convert `AuthLayout` to `async`, resolve locale via `getLocale()`, pass it to `<html lang={locale}>`.

## Approach

Both fixes reuse `getLocale()` from `next-intl/server`, which already resolves the request's locale through `src/i18n/request.ts` (itself already reading the `x-locale` header the proxy sets for every request, including `/login`/`/auth` and `/dashboard`). No new header-parsing code, no proxy/middleware change (respects the `CLAUDE.md` "No Unauthorized Middleware Edits" red line), no new i18n keys.

`(dashboard)/layout.tsx` is the riskier of the two: a code comment in the file claims Next 16's `cacheComponents` previously rejected reading dynamic request data from this specific outer/statically-cacheable layout, which is why locale resolution currently lives inside the Suspense-wrapped `DashboardShell` instead. Exploration found two working counter-examples in this same codebase — `(marketing)/layout.tsx` and `(tenant)/[tenant]/layout.tsx` — that already call dynamic APIs directly in an async root layout with no Suspense split, and both build clean today. This is grounds to attempt the minimal fix, with `npm run build` as the empirical arbiter per `HEARTBEAT.md`'s own framing of this ticket ("es cambio arquitectónico de caching, con `npm run build` como árbitro").

**Fallback if the minimal fix fails the build**: restructure `(dashboard)/layout.tsx` to match the `TenantLayout` pattern — collapse the outer/inner split so the whole layout becomes one async function (Suspense moves to wrap only `{children}`, as it partially already does). This is a materially larger diff and touches the RBAC/redirect flow; it is the explicit non-preferred path, chosen only if candidate 1 provably fails.

## Non-goals

- `(marketing)` and `(tenant)/[tenant]` — already correct, untouched.
- No `NextIntlClientProvider` addition to `(auth)` (out of scope: ticket is about the `lang` attribute, not client-side translation coverage).
- `PERF-01` (i18n bundle size on the public site) and `PR4` (`INTL_LOCALE_MAP` dedup) — separate tickets.
- No change to `DashboardShell`'s RBAC gate, redirect codes, `TenantProvider`, `SidebarProvider`, or `resolveTenantOrgId()` — unless the fallback restructure is triggered, and even then only the Suspense/component-split shape changes, not the RBAC logic itself.

## Risk / size

Low-risk, low-size change if candidate 1 (minimal) survives the build: 2 files, roughly one added import + one added `await getLocale()` + one attribute change per file (~10-15 changed lines). Escalates to Medium if the fallback restructure is needed. No new tests are extractable (pure JSX attribute + locale plumbing, same precedent as A11Y-02 which also had no unit-testable logic).

## Delivery

Single PR, well under the 400-line budget either way. `delivery_strategy: ask-on-risk` (per session preflight) — will only surface a decision if the fallback restructure pushes size into risk territory, which is unlikely for a 2-file change.
