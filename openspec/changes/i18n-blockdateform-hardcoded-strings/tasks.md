# Tasks: i18n-blockdateform-hardcoded-strings (TICKET I18N-08)

## Phase 1 — Messages (3 locales)
- [x] 1.1 Add `calendar.block.{confirming,endBeforeStartError}`
- [x] 1.2 Add `dashboard.calendar.datePicker.selectTimeAriaLabel`
- [x] 1.3 `messages.test.ts` — key parity clean

## Phase 2 — BlockDateForm.tsx
- [x] 2.1 `REASONS` → `REASON_IDS` (named ids, matching `BlockDaysForm.tsx`)
- [x] 2.2 Wire `useTranslations('calendar.block')` + `useTranslations('dashboard.calendar.newAppointment')`
- [x] 2.3 Replace all 12 hardcoded strings with translated equivalents (10 reused, 2 new)

## Phase 3 — EditorialTimePicker.tsx
- [x] 3.1 Wire `useTranslations('dashboard.calendar.datePicker')`, fix the one `aria-label`

## Phase 4 — Validation
- [x] 4.1 `pnpm check-types` — exit 0
- [x] 4.2 `npm run build` — exit 0, route table unchanged (26/26)
- [x] 4.3 `pnpm test` — 50/50 passed
- [x] 4.4 `eslint` on both changed files — 0 warnings
- [x] 4.5 Diff-literal check: zero remaining rendered hardcoded PT strings (only harmless JSX section comments `{/* Desde */}` etc. remain, not user-visible)

**Actual**: 5 files, 36 insertions / 27 deletions = 63 changed lines. Low risk, single PR.
