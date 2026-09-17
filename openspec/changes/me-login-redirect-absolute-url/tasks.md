# Tasks: me-login-redirect-absolute-url

## Phase 1 — Generalize buildLoginUrl
- [x] 1.1 Change signature from `(request: NextRequest, pathname)` to `(rawHost: string | null, pathname)`
- [x] 1.2 Remove now-unused `NextRequest` import
- [x] 1.3 Update `proxy.ts`'s one call site

## Phase 2 — Fix me/layout.tsx
- [x] 2.1 Import `buildLoginUrl`
- [x] 2.2 Replace `redirect('/login?next=/me')` with `redirect(buildLoginUrl(hdrs.get('host'), '/me').toString())`
- [x] 2.3 Document why the exact subpath isn't preserved here (disclosed non-goal)

## Phase 3 — Tests
- [x] 3.1 New `build-login-url.test.ts`: local host, production host, next-always-absolute, null-host fallback
- [x] 3.2 Confirmed full `proxy.test.ts` suite (including MW-03's `/me` guard tests) unaffected

## Phase 4 — Validation
- [x] 4.1 `pnpm check-types` — exit 0
- [x] 4.2 `npm run build` — exit 0, route table unchanged (26/26)
- [x] 4.3 `pnpm test` (scoped to `proxy`+`build-login-url` to avoid a sibling parallel change's in-flight `messages/*.json` edits) — 13/13 passed
- [x] 4.4 `eslint` on all 4 touched/created files — 1 pre-existing warning (`NODE_ENV` turbo-env on an untouched `proxy.ts` line, already tracked in TEST-04), 0 new

## Phase 5 — Amendment: two sibling pages had the same bug (found post-commit)
- [x] 5.1 `rg "next=/me" apps/web/src` after the first commit surfaced `me/citas/page.tsx` and `me/perfil/page.tsx` — each with their own `redirect('/login?next=/me/<page>')`, same relative-path bug, not caught by the first pass (which only looked at `me/layout.tsx`)
- [x] 5.2 Fixed both with `buildLoginUrl(hdrs.get('host'), '/me/citas' | '/me/perfil')` — unlike the layout's fallback, these two DO know their exact subpath (it's the literal already in the redirect call)
- [x] 5.3 `pnpm check-types` — exit 0
- [x] 5.4 `eslint` on both files — clean
- [x] 5.5 `rg "next=/me"` project-wide — zero remaining relative-redirect literals
- [x] 5.6 Full combined suite (with I18N-09 landed too): `pnpm test` 59/59, `npm run build` 26/26 routes

**Actual**: 6 files total, small diff. Low risk, ran in parallel with I18N-09 (zero file overlap, confirmed throughout).
