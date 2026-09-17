# Tasks: i18n-calendar-actions-hardcoded-messages (TICKET I18N-09)

## Phase 1 — Messages (3 locales)
- [x] 1.1 Add `dashboard.calendar.actions.*` (10 new keys)
- [x] 1.2 `messages.test.ts` — key parity clean

## Phase 2 — actions.ts
- [x] 2.1 Add `getActionLocale()`/`getActionTranslations()` helpers
- [x] 2.2 `getAuth()`: 2 messages localized
- [x] 2.3 `createBlockedIntervalAction`: 2 localized + success reused from `calendar.block.success`
- [x] 2.4 `createInternalAppointmentAction`: 3 localized + success reused from `newAppointment.toastCreated`
- [x] 2.5 `cancelAppointmentAction`: 3 localized
- [x] 2.6 `restoreAppointmentAction`: 1 localized
- [x] 2.7 `getAppointmentDetailAction`: 2 localized
- [x] 2.8 `quickCreateCustomerAction`: 3 localized

## Phase 3 — Validation
- [x] 3.1 `pnpm check-types` — exit 0
- [x] 3.2 `npm run build` — exit 0, route table unchanged (26/26)
- [x] 3.3 `pnpm test` — 59/59 passed
- [x] 3.4 `eslint` on `actions.ts` — 1 pre-existing warning (`resolveTenantOrgId` unused import, confirmed via `git diff` outside changed lines), 0 new
- [x] 3.5 Diff-literal check: zero remaining `message: '[A-ZÀ-ÿ]` matches

**Actual**: 4 files (1 code + 3 message JSON), 65 changed lines in `actions.ts` + 36 lines across the 3 message files. Low risk, single PR.
