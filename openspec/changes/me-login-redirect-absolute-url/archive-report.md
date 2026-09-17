# Archive report: me-login-redirect-absolute-url

**Status**: DONE. Archived 2026-09-17.

## Summary

Fixes the latent bug found during MW-03: `me/layout.tsx`'s own defense-in-depth auth check passed a relative `next=/me` to `/login`, which `resolveRedirectUrl()` silently rejects (it requires an absolute URL), always falling back to a hardcoded default instead of preserving the requested subpath.

## Fix: reuse, don't duplicate

`buildLoginUrl()` (already used correctly by `proxy.ts` for the primary `/me` guard since MW-03) only ever read `request.headers.get('host')` from its `NextRequest` parameter — nothing else request-specific. Generalized its signature to accept the raw host string directly, so the exact same, already-correct URL-construction logic is now reusable from a Server Component (`me/layout.tsx`, which has `headers()` but no `NextRequest`) without a second, duplicated implementation. One call site updated (`proxy.ts`), behaviorally identical.

## Disclosed non-goal

This fallback still can't preserve the *exact* originally-requested subpath (e.g. `/me/perfil`) — the layout has no header carrying it. Not fixed, and not needed: MW-03's primary proxy guard already handles subpath preservation correctly for the common case; this fallback is now merely correct (produces a valid, non-silently-discarded `next`) rather than subpath-perfect, which is enough given it's unreachable defense-in-depth in normal operation.

## Ran in parallel with I18N-09

Zero file overlap (confirmed throughout via `git status`): this change touched `build-login-url.ts`, its new test, `proxy.ts` (1 line), `me/layout.tsx`. I18N-09 touched `calendar/actions.ts` and `messages/*.json` only.

## Scope

4 files, trivial diff.

## Validation

`pnpm check-types` exit 0, `npm run build` exit 0 (26/26 routes), `pnpm test` 13/13 (scoped — see verify-report.md for why full-suite was skipped mid-parallel-run), `eslint` clean save for 1 pre-existing, confirmed-unrelated warning.
