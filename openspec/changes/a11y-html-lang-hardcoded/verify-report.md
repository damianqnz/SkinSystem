# Verify report: a11y-html-lang-hardcoded (TICKET A11Y-01)

**Verdict: PASS** (0 critical, 0 warnings, 1 disclosed non-blocking note — see below)

## Requirement-by-requirement check

### Requirement 1: Dashboard root layout announces the resolved locale
- Diffed literally against design: `apps/web/src/app/(dashboard)/layout.tsx` — `DashboardLayout` is `async`, calls `const locale = await getLocale();`, renders `<html lang={locale}>`. Confirmed via `git diff` — the expression is not a string literal.
- `getLocale()` resolves through `src/i18n/request.ts`, which reads the `x-locale` header set by `proxy.ts` for every `/dashboard` request (via `detectDashboardLocale`). PT/ES/EN scenarios are all satisfied by this single code path — no per-locale branching needed, confirmed correct by construction (the same mechanism already used correctly by `DashboardShell`'s own `NextIntlClientProvider`, unchanged).
- **RBAC/redirect regression check**: `git diff` shows the changed hunk is exactly the import line + the `DashboardLayout` function (import + signature + 2 new lines + attribute). `DashboardShell` — where `resolveTenantOrgId()`, the `NO_AUTH`/`NOT_MEMBER`/etc. switch, and all `redirect()` calls live — has zero diff. Scenario satisfied by non-modification, verified by diff, not by assumption.

### Requirement 2: Auth root layout announces the resolved locale
- Diffed literally: `apps/web/src/app/(auth)/layout.tsx` — `AuthLayout` is `async`, calls `getLocale()`, renders `<html lang={locale}>`. No string literal remains.
- `x-locale` for `/login`/`/auth` confirmed set by `proxy.ts` today (these paths are in `UNREWRITTEN_PREFIXES` but not `PRIVATE_PREFIXES`, so `detectLocale(request)` — the public cookie/Accept-Language chain — already runs and sets the header before this change; verified by reading `proxy.ts` directly in explore.md, not inferred).

## Build-time verification (per spec's non-scenario)
- `npm run build`: exit 0, 26/26 routes generated, no cacheComponents/dynamicIO error — resolves the open question from explore.md/design.md in favor of candidate 1 (minimal fix). Fallback restructure (candidate 2 / Phase 1b) was never needed.
- `pnpm check-types`: exit 0.
- `pnpm test`: 38/38 passed (no test changes; confirms zero regression, e.g. `messages.test.ts` parity untouched since no i18n keys changed — this ticket needed none).
- `rg 'lang="es"'` on both changed files: zero matches.

## Disclosed non-blocking note
- `eslint` on the two changed files reports 2 pre-existing `no-fallthrough` warnings inside `DashboardShell`'s RBAC `switch` statement (lines 56/60 in the current file). Confirmed via `git diff` these lines fall outside every changed hunk in this ticket — present on `HEAD` before this change, not introduced, not fixed here (out of scope; same triage precedent as the pre-existing unused-var warnings disclosed in I18N-05's verify-report).

## Scope discipline
- `(marketing)` and `(tenant)/[tenant]` layouts: confirmed untouched (`git status` shows only the 2 intended files).
- No `NextIntlClientProvider` added to `(auth)` — confirmed, out of scope per proposal.md.
- No i18n key changes, no proxy/middleware changes — confirmed via `git diff --stat` (2 files only).

## Files changed / size
- `apps/web/src/app/(dashboard)/layout.tsx`: +4/-2.
- `apps/web/src/app/(auth)/layout.tsx`: +4/-2.
- Total: 2 files, 8 lines net — well under the 400-line single-PR budget; no chaining needed.
