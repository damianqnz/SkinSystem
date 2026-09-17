# Archive report: me-login-redirect-absolute-url

**Status**: DONE. Archived 2026-09-17.

## Summary

Fixes the latent bug found during MW-03: `me/layout.tsx`'s own defense-in-depth auth check passed a relative `next=/me` to `/login`, which `resolveRedirectUrl()` silently rejects (it requires an absolute URL), always falling back to a hardcoded default instead of preserving the requested subpath.

## Fix: reuse, don't duplicate

`buildLoginUrl()` (already used correctly by `proxy.ts` for the primary `/me` guard since MW-03) only ever read `request.headers.get('host')` from its `NextRequest` parameter — nothing else request-specific. Generalized its signature to accept the raw host string directly, so the exact same, already-correct URL-construction logic is now reusable from a Server Component (`me/layout.tsx`, which has `headers()` but no `NextRequest`) without a second, duplicated implementation. One call site updated (`proxy.ts`), behaviorally identical.

## Amended after first pass: two sibling pages had the identical bug

The first pass fixed only `me/layout.tsx`'s fallback — correctly noting that *layout* has no way to know the exact subpath being rendered. But `me/citas/page.tsx` and `me/perfil/page.tsx` each carry their **own** redundant defense-in-depth auth check (`redirect('/login?next=/me/citas')`, `redirect('/login?next=/me/perfil')`) — same relative-`next` bug, and unlike the layout, each page *does* know its own exact path literally, since it's hardcoded right there in the same line. Found via `rg "next=/me" apps/web/src` after the first commit, before declaring the ticket done. Both now call `buildLoginUrl(hdrs.get('host'), '/me/citas' | '/me/perfil')`, so — unlike the layout's fallback — these two genuinely do preserve the exact requested subpath if ever reached.

## Disclosed non-goal

`me/layout.tsx`'s own fallback still can't preserve the *exact* subpath (it has no way to know which specific `/me/*` page triggered it) — falls back to bare `/me`, which is correct-but-generic. Not fixed, and not needed: MW-03's primary proxy guard already handles subpath preservation correctly for the common case; this one fallback is merely valid (a non-silently-discarded `next`) rather than subpath-perfect, which is enough given it's unreachable defense-in-depth in normal operation.

## Ran in parallel with I18N-09

Zero file overlap (confirmed throughout via `git status`): this change touched `build-login-url.ts`, its new test, `proxy.ts` (1 line), `me/layout.tsx`. I18N-09 touched `calendar/actions.ts` and `messages/*.json` only.

## Scope

6 files (4 from the first pass + `me/citas/page.tsx` + `me/perfil/page.tsx`), trivial diff.

## Validation

First pass: `pnpm check-types` exit 0, `npm run build` exit 0 (26/26 routes), `pnpm test` 13/13 (scoped — see verify-report.md for why full-suite was skipped mid-parallel-run), `eslint` clean save for 1 pre-existing, confirmed-unrelated warning. Amendment: `pnpm check-types` exit 0, `eslint` on both new files clean, `rg "next=/me"` project-wide returns zero remaining relative-redirect literals, full combined suite (with I18N-09's changes also landed) `pnpm test` 59/59 and `npm run build` 26/26 routes.
