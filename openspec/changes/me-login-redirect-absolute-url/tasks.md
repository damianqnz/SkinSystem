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

**Actual**: 4 files, small diff. Low risk, ran in parallel with I18N-09 (zero file overlap, confirmed throughout).
