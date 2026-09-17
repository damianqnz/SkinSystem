# Verify report: me-login-redirect-absolute-url

**Verdict: PASS** (0 critical, 0 new warnings)

## Requirement-by-requirement check

- **`buildLoginUrl` always absolute**: 4 new unit tests, all passed on first run — local host (http, same-host), production host (https, `auth.` subdomain, `next` targets the tenant host not the auth host), `next`-is-always-parseable, and the `rawHost = null` edge case.
- **`proxy.ts` unchanged behavior**: full `proxy.test.ts` suite (9 tests: 4 header-forgery + 5 MW-03 `/me`-guard tests) passed unmodified — confirmed the one-line call-site change (`buildLoginUrl(request, pathname)` → `buildLoginUrl(request.headers.get('host'), pathname)`) is behaviorally identical, since that's exactly what the old implementation read internally.
- **`me/layout.tsx`'s fallback now produces a valid `next`**: diffed literally — `redirect('/login?next=/me')` → `redirect(buildLoginUrl(hdrs.get('host'), '/me').toString())`, reusing the already-computed `hdrs` from the top of the layout.

## Build-time / lint-time verification

- `pnpm check-types`: exit 0.
- `npm run build`: exit 0, 26/26 routes, unchanged route table.
- `pnpm test` (scoped to `proxy`+`build-login-url` — a sibling parallel change was mid-edit on `messages/*.json`, and a full-suite run would have shown transient failures unrelated to this change): 13/13 passed.
- `eslint` on all 4 touched/created files: 1 pre-existing warning (`NODE_ENV` turbo-env, on an untouched `proxy.ts` line — confirmed via `git diff` outside every changed hunk, already tracked in TEST-04's enumeration), 0 new.

## Scope discipline

- Zero overlap with the concurrently-running I18N-09 fork: confirmed via `git status` throughout — this change touched only `build-login-url.ts`, its new test, `proxy.ts` (one line), and `me/layout.tsx`; I18N-09 touched only `calendar/actions.ts` and `messages/*.json`.
- No change to `proxy.ts`'s matcher, `AUTH_REQUIRED_PREFIXES`/`PRIVATE_PREFIXES`, or any other MW-03 logic — only the `buildLoginUrl` call-site's argument shape.

## Files changed / size

4 files: `build-login-url.ts` (signature change), `build-login-url.test.ts` (new), `proxy.ts` (1 line), `me/layout.tsx` (1 import + 1 line + comment). Trivial size, well under any budget concern.
