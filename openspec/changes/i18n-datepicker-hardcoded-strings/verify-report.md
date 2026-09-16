# Verify report: i18n-datepicker-hardcoded-strings (TICKET I18N-07)

**Verdict: PASS** (0 critical, 0 warnings)

## Requirement-by-requirement check

### Requirement 1: EditorialDatePicker renders every locale-dependent string in the visitor's actual locale
- `MONTH_KEYS`/`MONDAY_FIRST_DAY_KEYS` from `@/i18n/calendar-keys` now drive `months`/`days`, sourced via `useTranslations('calendar')` — same canonical mechanism as `DesktopWeekGrid.tsx`/`CalendarHeader.tsx`, confirmed by diff.
- All 3 call sites (`BlockDaysForm.tsx`, `BlockDateForm.tsx`, `NewAppointmentForm.tsx`) now render correctly for any locale: the component reads locale from the already-mounted `NextIntlClientProvider` context via `useTranslations`, no prop needed — closes the previously-live bug where 2 of 3 consumers never passed `locale` and always rendered Portuguese.
- Trigger `aria-label` now reads `dashboard.calendar.datePicker.selectDateAriaLabel` (new key, 3 locales). Nav `aria-label`s reuse `dashboard.calendar.header.{prevMonthAriaLabel,nextMonthAriaLabel}` verbatim — confirmed byte-identical to the pre-existing values via `messages.test.ts` parity pass.

### Requirement 2: BlockDaysForm renders all UI strings from messages, not an inline map
- `LABELS` const fully removed (confirmed: `rg '^const LABELS'` returns nothing).
- `reasonLabel`/`reason.*` reused from `calendar.block.*` (verified byte-identical across pt/es/en during explore, no drift risk since the source strings were not changed).
- `from`/`to`/`confirm`/`success`/`conflictHint` sourced from the new `dashboard.calendar.blockDays.*` namespace, 3 locales.

## Unplanned but resolved during apply
`eslint` surfaced a dead-prop cascade not anticipated in design.md: removing `EditorialDatePicker`'s `locale` prop made `BlockDaysForm`'s own `locale` prop fully unused, which in turn made `MonthActionModal`'s `locale` prop (and `AnimatedShell`'s) fully unused too — it existed only to pass through. Traced one level further than planned and removed at each level; `AgendaInteractive.tsx`'s own `locale` prop was confirmed still needed (3 other children consume it) and left untouched, only the one dead pass-through removed.

## Build-time / lint-time verification (per spec's non-scenario)
- `messages.test.ts`: key parity clean, 2 new namespaces present identically in all 3 locale files.
- `rg 'MONTHS_PT|MONTHS_ES|MONTHS_EN|DOW_PT'` on `EditorialDatePicker.tsx`: zero matches.
- `rg '^const LABELS'` on `BlockDaysForm.tsx`: zero matches.
- `pnpm check-types`: exit 0 (twice — once before the dead-prop cascade fix, confirming no type break, once after).
- `npm run build`: exit 0, 26/26 routes, unchanged route table.
- `pnpm test`: 38/38 passed.
- `eslint` on all 4 touched files (`EditorialDatePicker.tsx`, `BlockDaysForm.tsx`, `MonthActionModal.tsx`, `AgendaInteractive.tsx`): 0 warnings, 0 errors.

## Scope discipline
- `BlockDateForm.tsx` confirmed untouched (`git status`) — its own separate hardcoding pattern flagged as a follow-up, not fixed here, per explicit non-goal.
- `calendar-keys.ts`, `CalendarHeader.tsx`, `DesktopWeekGrid.tsx`, `MonthView.tsx`, `CalendarDayNav.tsx`, `MobileWeekDaySelector.tsx`, `calendar.block.*`'s own values — all confirmed untouched.

## Files changed / size
- `apps/web/src/messages/{pt,es,en}.json`: +8 lines each (2 new namespaces).
- `apps/web/src/app/(dashboard)/dashboard/calendar/_components/EditorialDatePicker.tsx`: net -12 lines (removed more than added — 3 hardcoded arrays + helper function replaced by 3 hook calls + 2 derived arrays).
- `apps/web/src/app/(dashboard)/dashboard/calendar/_components/BlockDaysForm.tsx`: net -8 lines (removed 5-line `LABELS` object, added 2 hook lines, mechanical call-site edits).
- `apps/web/src/app/(dashboard)/dashboard/calendar/_components/MonthActionModal.tsx`: -6 lines (dead-prop removal).
- `apps/web/src/app/(dashboard)/dashboard/calendar/_components/AgendaInteractive.tsx`: -1 line (dead pass-through removal).
- Total: 6 files, well under the 400-line single-PR budget.
