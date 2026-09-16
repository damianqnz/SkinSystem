# Exploration: i18n-dashboard-locale-db-fallback (Huecos A/B)

## Source debt

Phase 36 entry in HEARTBEAT.md: `proxy.ts`'s `detectDashboardLocale()` resolves `DASHBOARD_LOCALE cookie → NEXT_LOCALE cookie → Accept-Language → DEFAULT_LOCALE`. Target chain: `profiles.locale → organizations.locale → DEFAULT_LOCALE`. The middleware has no DB access, so when `DASHBOARD_LOCALE` is absent it falls through to the public chain instead of re-querying `profiles.locale`.

## Red line check (mandatory before any locale-chain work)

`CLAUDE.md` §2: "No Unauthorized Middleware Edits — PROHIBITED to modify `proxy.ts` or `i18n/request.ts` without a dedicated ticket with explicit middleware scope approved in HEARTBEAT." Huecos A/B are listed as plain pending debt, **not** as an approved middleware-scope ticket (unlike MW-01/MW-02, which explicitly said "Scope aprobado"). Asked the user before proceeding; they chose the layout-mount path the debt note itself offered as an alternative — no `proxy.ts` edit in this change.

## Where the DB access already happens

`(dashboard)/layout.tsx`'s `DashboardShell` calls `resolveTenantOrgId()` for its RBAC gate on every dashboard request. Read that function directly:
- It already calls `getOrganizationBySlug(slug)`, which already selects `organizations.locale` (via `SLUG_COLS` in `domains/organizations/service.ts`) — just never returned it past `orgId`.
- It already queries `profiles` for `{ role, isActive }` for the exact `(user.id, orgId)` pair the fallback needs — just never selected `locale`.

Both DB accesses this fix needs are **already happening**; the fix only widens two SELECT column lists and forwards two already-fetched values. Confirmed via `db.select({...})` call and `OrgSummary` type in `domains/organizations/service.ts`.

## Schema confirmation

`apps/web/src/infrastructure/db/schema/organizations.ts`: `organizations.locale` (`text`, NOT NULL, default `'pt'`), `profiles.locale` (`text`, nullable — "NULL = no explicit preference"). Both already correctly typed/defaulted (Phase 36 fixed the org default).

## Consumers of `resolveTenantOrgId()`

~15 Server Actions across the dashboard call this function, all destructuring only `orgId`/`userId`/`role` (occasionally with a custom `requiredRoles` argument). Adding `profileLocale`/`orgLocale` to the success return type is purely additive — confirmed safe via `rg` sweep of every call site before making the change.

## `getMessages()` limitation

`next-intl/server`'s `getMessages()` always resolves against the request's `x-locale`-derived locale (via `src/i18n/request.ts`'s `getRequestConfig`) — it cannot be redirected to an arbitrary locale from a calling component. For the fallback branch, messages must be loaded via a direct dynamic import instead, mirroring the exact pattern `src/i18n/request.ts` itself already uses (`(await import(...)).default`).

## Non-goals

- `<html lang>` in the outer `DashboardLayout` — would need its own DB access to fix in the fallback case too, duplicating the RBAC round-trip A11Y-01 deliberately kept isolated to the inner `DashboardShell`. Left as a disclosed limitation.
- Cookie re-seeding — `cookies().set()` is restricted to Server Actions/Route Handlers in the Next.js App Router; not available from a Server Component render. Left as a disclosed limitation, matching the debt's own low-effort framing.
