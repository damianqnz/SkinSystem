# Exploration: me-login-redirect-absolute-url

## Bug

`(account)/me/layout.tsx`'s own defense-in-depth auth check did `redirect('/login?next=/me')` — a **relative** path. `(auth)/login/actions.ts`'s `resolveRedirectUrl()` validates `next` by calling `new URL(next)`; a relative path throws, is caught, and the function silently falls back to a hardcoded default. Net effect: an unauthenticated deep-link to `/me/perfil` or `/me/citas` bounced back to bare `/me` after sign-in instead of the originally-requested page.

## Why this is now low-severity (post-MW-03) but still worth fixing correctly

MW-03 moved `/me`'s *primary* auth guard into `proxy.ts`, which already uses `buildLoginUrl()` — a function that already builds a correct absolute URL. So in practice, this layout-level check is unreachable for a normal request today (the proxy redirects first). It remains as intentional defense-in-depth (matching `DashboardShell`'s own redundant `NO_AUTH` case), so it should still behave correctly if it is ever the one that fires (e.g. a future regression in the proxy guard).

## Design decision: generalize `buildLoginUrl` instead of duplicating its logic

Read `buildLoginUrl(request: NextRequest, pathname: string)` — it only ever used `request.headers.get('host')`, nothing else `NextRequest`-specific. Confirmed via `grep` there is exactly one call site (`proxy.ts:110`) and no existing test file. Changed the signature to accept `rawHost: string | null` directly, so the identical URL-building logic (local vs `auth.${BASE_DOMAIN}`, http vs https) is usable from both `proxy.ts` (`request.headers.get('host')`) and a Server Component (`(await headers()).get('host')`) without a request object — avoiding a second, duplicated implementation.

## Known limitation, disclosed

`me/layout.tsx` (a layout, not a page) has no header carrying the originally-requested pathname — only `x-tenant-slug`/`x-locale` are forwarded by the proxy. So this fallback's `next` always points at bare `/me`, not the specific subpage. This is fine: the exact-subpath preservation is already correctly handled by the *primary* guard in `proxy.ts` (which does know the real pathname); this fallback only needed to stop producing an invalid `next` value, not to reproduce subpath-preservation logic that's unreachable in practice.

## Parallel work disclosure

This change ran concurrently with a sibling fork resolving I18N-09 in `apps/web/src/app/(dashboard)/dashboard/calendar/` and `messages/*.json`. Zero file overlap — confirmed via `git status` throughout, and `pnpm test`/`check-types`/`build` scoped to avoid depending on the other fork's in-flight JSON edits (a transient full-suite `messages.test.ts` failure was observed mid-run, caused entirely by the other fork's in-progress locale-file edits, not this change; resolved once that fork's edits landed).
