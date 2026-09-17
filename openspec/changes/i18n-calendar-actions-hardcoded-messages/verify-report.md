# Verify report: i18n-calendar-actions-hardcoded-messages (TICKET I18N-09)

**Verdict: PASS** (0 critical, 0 new warnings)

## Requirement-by-requirement check

- All 18 call sites across 6 actions + `getAuth()` diffed literally: every hardcoded Portuguese string replaced with a `t('key')`/`tNa('key')`/`tBlock('key')` call. `rg "message: '[A-ZÀ-ÿ]"` on the file after the change returns zero matches.
- `createBlockedIntervalAction`'s success path confirmed to now call `tBlock('success')` (namespace `calendar.block`) — the exact key `BlockDateForm.tsx`'s client fallback already expected per I18N-08, closing that disclosed mismatch by construction.
- `createInternalAppointmentAction`'s success path confirmed to reuse `dashboard.calendar.newAppointment.toastCreated` verbatim.

## Build-time / lint-time verification

- `messages.test.ts`: key parity clean, new `dashboard.calendar.actions` namespace present identically across pt/es/en.
- `pnpm check-types`: exit 0.
- `npm run build`: exit 0, 26/26 routes, unchanged route table.
- `pnpm test`: 59/59 passed (suite grew from 55→59 in this same working session via a concurrent, non-overlapping change to `build-login-url.ts`/`me/layout.tsx`/`proxy.ts` — confirmed via `git diff --stat` those files are untouched by this change).
- `eslint` on `actions.ts`: 1 pre-existing warning (`resolveTenantOrgId` unused import at the top of the file, confirmed via `git diff` to sit outside every changed hunk), 0 new.

## Scope discipline

- No other Server Action file touched — confirmed via `git status`.
- `calendar.block.*` and `dashboard.calendar.newAppointment.*` values themselves: unchanged, only read from.

## Files changed / size

4 files: `actions.ts` (+/- within a 65-line diff), `pt.json`/`es.json`/`en.json` (+12 lines each). Well under the 400-line budget.
