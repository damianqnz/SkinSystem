# Archive report: mw-03-me-auth-guard-proxy (TICKET MW-03)

**Status**: DONE. Archived 2026-09-17.

## Summary

Moves `/me`'s auth+tenant guard from `me/layout.tsx` (a 200 + render before redirecting) into `proxy.ts` (a real 307), closing a performance debt flagged in HEARTBEAT.md. This is a middleware-scope change — `CLAUDE.md`'s red line requires explicit approval before touching `proxy.ts`, which the user gave for the specific design below after exploration surfaced a real risk in the literal ticket text.

## Why the literal ticket ("just add `/me` to `PRIVATE_PREFIXES`") was wrong

`PRIVATE_PREFIXES`/`isPrivate` in `proxy.ts` conflates two concerns: the auth+tenant guard, and which locale chain resolves (staff-scoped `DASHBOARD_LOCALE` vs public `NEXT_LOCALE`) plus whether the public cookie gets seeded. `/me` is the customer account and must stay on the public chain — confirmed via `setLocaleAction` (writes `NEXT_LOCALE`) and `/me`'s own `LanguageSwitcher` usage. Naively adding `/me` to `PRIVATE_PREFIXES` would have silently broken the customer language switcher.

## Fix

New `AUTH_REQUIRED_PREFIXES = ['/dashboard', '/admin', '/me']` drives only the auth+tenant guard (the two `redirectWithSession` conditions). `PRIVATE_PREFIXES` stays `['/dashboard', '/admin']`, completely unchanged, still driving locale-chain choice and cookie seeding. `/me` gains `requiresAuth = true` while `isPrivate` stays `false` — auth moves to the proxy, every other behavior is bit-for-bit unchanged, proven by 5 new tests (3 for the guard, 2 specifically isolating the locale-chain/cookie-seed behavior) plus the full pre-existing suite passing unmodified.

## Bonus found, not fixed: a latent redirect bug

`me/layout.tsx`'s own fallback redirect passes a relative `next=/me`, but the login action's `resolveRedirectUrl()` expects an absolute URL and silently falls back to a hardcoded default on a relative one — meaning an unauthenticated deep-link to `/me/perfil` today bounces back to bare `/me` after login, not the originally-requested page. The new proxy-driven primary path (using `buildLoginUrl()`, which already builds correct absolute URLs) fixes this as a side effect for the common case; the layout's own fallback still carries the bug but is now unreachable in practice (same class as `/dashboard`'s own redundant `NO_AUTH` case). Not fixed — disclosed only, out of this ticket's scope.

## Scope

3 files, 83 changed lines (73+/10-). `me/layout.tsx`'s own auth check kept, now explicitly documented as redundant defense-in-depth, matching `DashboardShell`'s established precedent rather than diverging from it.

## Validation

`pnpm check-types` exit 0, `npm run build` exit 0 (26/26 routes), `pnpm test` 55/55 (5 new, all passed on first run; 4 pre-existing header-forgery tests unaffected), `eslint` clean save for 1 pre-existing warning already tracked in TEST-04.
