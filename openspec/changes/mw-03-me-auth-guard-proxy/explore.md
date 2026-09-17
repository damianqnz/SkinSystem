# Exploration: mw-03-me-auth-guard-proxy (TICKET: `/me` en PRIVATE_PREFIXES)

## Source debt

HEARTBEAT.md: "`/me` en `PRIVATE_PREFIXES` del proxy — hoy se auto-guarda en `me/layout.tsx:37`; moverlo al proxy es optimización (307 real en vez de 200 + render), no fix de seguridad."

## Middleware red line

`CLAUDE.md` §2 prohibits `proxy.ts` edits without a dedicated, HEARTBEAT-approved middleware-scope ticket. No alternative (layout-mount) path exists here — the entire point is to short-circuit BEFORE any layout renders, which is intrinsically a proxy concern. Presented the finding below to the user and got explicit approval for the specific design (not just "yes, touch it").

## Why the literal ticket text is wrong: `isPrivate` conflates two concerns

`proxy.ts`'s single `PRIVATE_PREFIXES` boolean (`isPrivate`) currently drives **both**:
1. The auth+tenant guard (`if (isPrivate && !user) redirect(login)`, `if (isPrivate && !tenantSlug) redirect('/')`).
2. Which locale chain resolves (`detectDashboardLocale` — staff cookie `DASHBOARD_LOCALE` — vs `detectLocale` — public cookie `NEXT_LOCALE`) **and** whether the `NEXT_LOCALE` cookie gets seeded on first visit (`!isPrivate && !cookie` block).

`/me` is the **customer** account (not staff). Confirmed via `shared/actions/locale.ts`'s `setLocaleAction` (writes `NEXT_LOCALE`, the public cookie) and `me/layout.tsx`'s `LanguageSwitcher` usage: `/me` already uses, and must keep using, the **public** locale chain. Naively adding `/me` to `PRIVATE_PREFIXES` would silently switch it to the staff-scoped `DASHBOARD_LOCALE` chain and stop seeding `NEXT_LOCALE` on first visit — breaking the customer language switcher's own cookie contract, a real regression the ticket's one-line framing didn't anticipate.

## Fix: split the two concerns

New `AUTH_REQUIRED_PREFIXES = ['/dashboard', '/admin', '/me']` drives only the auth+tenant guard. `PRIVATE_PREFIXES = ['/dashboard', '/admin']` stays exactly as-is, unchanged, still driving locale-chain choice and cookie seeding. `/me` gets `requiresAuth = true` but `isPrivate` (locale) stays `false` — auth moves to the proxy, locale behavior is bit-for-bit unchanged.

## `/me` genuinely needs a tenant, confirmed by reading `me/layout.tsx`

`me/layout.tsx` does `getOrganizationBySlug(slug)` and redirects to `/` on failure — the same target `if (isPrivate && !tenantSlug)` already redirects to for `/dashboard`. Confirms the tenant-required guard, not just the auth guard, correctly generalizes to `/me`.

## `me/layout.tsx`'s own auth check: kept as defense-in-depth, matching the `/dashboard` precedent

`DashboardShell` (in `(dashboard)/layout.tsx`) keeps its own `NO_AUTH` redirect case even though the proxy already guards `/dashboard` — its comment explicitly calls this "redundant defense in depth." Same treatment for `/me`: `if (!user) redirect('/login?next=/me')` stays in `me/layout.tsx` untouched, now provably unreachable in practice but intentionally kept, matching established codebase philosophy rather than diverging from it.

## Bug found, left alone: `next=/me`'s relative path

`me/layout.tsx`'s own fallback redirect passes a **relative** `next=/me`, but `(auth)/login/actions.ts`'s `resolveRedirectUrl()` expects an **absolute** URL (`new URL(next)` throws on a relative path, silently falling back to the hardcoded default `/me`). Today this means an unauthenticated visit to a deep `/me/*` page bounces back to the top-level `/me` after login, not the originally-requested page. `buildLoginUrl()` (already used by the proxy for `/dashboard`/`/admin`) builds a correct absolute URL, so **the new primary path (proxy-driven) fixes this bug as a side effect** for the common case. The layout's own fallback still carries the latent bug, but it's now dead-in-practice code (same reachability class as `/dashboard`'s redundant `NO_AUTH` case) — not fixed here, out of scope for this ticket.

## Non-goals

- `PRIVATE_PREFIXES`'s existing behavior for `/dashboard`/`/admin` — completely unchanged.
- `me/layout.tsx`'s `getOrganizationBySlug`/`getMyCustomer` calls — untouched, still needed for render data + the org-existence check the proxy's pure string-pattern `extractTenantSlug` can't do.
- The relative-`next=/me` latent bug in the layout's own fallback — disclosed above, not fixed (now-unreachable-in-practice code).
