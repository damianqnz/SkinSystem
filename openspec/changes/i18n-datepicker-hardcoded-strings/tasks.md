# Tasks: i18n-datepicker-hardcoded-strings (TICKET I18N-07)

## Phase 1 — Messages: new namespaces (3 locales)
- [x] 1.1 Add `dashboard.calendar.datePicker.selectDateAriaLabel` to `pt.json`/`es.json`/`en.json`
- [x] 1.2 Add `dashboard.calendar.blockDays.{from,to,confirm,success,conflictHint}` to `pt.json`/`es.json`/`en.json`
- [x] 1.3 Run `messages.test.ts` — confirm key parity, 0 missing in any locale

## Phase 2 — EditorialDatePicker.tsx
- [x] 2.1 Remove `MONTHS_PT`, `MONTHS_ES`, `MONTHS_EN`, `DOW_PT`, `getMonthLabels()`
- [x] 2.2 Remove `locale?: string` from `EditorialDatePickerProps`
- [x] 2.3 Add `useTranslations` hooks (`calendar`, `dashboard.calendar.header`, `dashboard.calendar.datePicker`) + import `MONTH_KEYS`/`MONDAY_FIRST_DAY_KEYS` from `@/i18n/calendar-keys`
- [x] 2.4 Compute `months` (full names) and `days` (single-letter, Monday-first) from the canonical namespace
- [x] 2.5 Refactor `fmtTrigger(iso, locale)` → `fmtTrigger(iso, months)`
- [x] 2.6 Wire the 3 `aria-label`s to translated values (2 reused, 1 new)
- [x] 2.7 Day-of-week row reads from computed `days` array

## Phase 3 — Call-site cleanup
- [x] 3.1 `BlockDaysForm.tsx` (2 call sites): drop `locale={locale}` from `<EditorialDatePicker>`
- [x] 3.2 Confirm `BlockDateForm.tsx`/`NewAppointmentForm.tsx` need no change (already omit `locale`)

## Phase 4 — BlockDaysForm.tsx
- [x] 4.1 Remove the inline `LABELS` const and its type annotation
- [x] 4.2 Add `useTranslations('dashboard.calendar.blockDays')` and `useTranslations('calendar.block')`
- [x] 4.3 Replace all `t.<field>`/`t.reason[r]` call sites with translated equivalents
- [x] 4.4 Remove `locale` from `BlockDaysFormProps` (now fully unused)
- [x] 4.5 Update `MonthActionModal.tsx:82` — drop `locale={locale}` from `<BlockDaysForm>`

## Phase 4b — Unplanned: dead-prop cascade found by eslint (not in original design)
- [x] 4b.1 `eslint` surfaced `MonthActionModal.tsx`'s own `locale` prop as now-unused (it existed only to pass through to `BlockDaysForm`/`AnimatedShell`) — removed from `MonthActionModalProps` and `AnimatedShell`'s prop type
- [x] 4b.2 Removed the now-dead `locale={locale}` pass from `AgendaInteractive.tsx:90` (its own `locale` prop stays — still used by 3 other children at that call site)

## Phase 5 — Validation
- [x] 5.1 `pnpm check-types` — exit 0
- [x] 5.2 `npm run build` — exit 0, route table unchanged (26/26)
- [x] 5.3 `pnpm test` — 38/38 passed
- [x] 5.4 `eslint` on all changed files — 0 warnings
- [x] 5.5 Diff-literal check: zero remaining `MONTHS_PT|MONTHS_ES|MONTHS_EN|DOW_PT|LABELS` in either component

**Forecast**: ~120-150 changed lines, Low risk, single PR, no chaining.
