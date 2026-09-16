# Proposal: i18n-datepicker-hardcoded-strings (TICKET I18N-07)

## Intent

Close the 9th month-name representation flagged (but deliberately left out of scope) by I18N-05, and fix the real locale bugs discovered while reading the file: a day-of-week header with zero ES/EN variants, and 2 of 3 consumers never passing `locale` at all (always PT in practice). Also fold in `BlockDaysForm.tsx`'s inline `LABELS` map (a `_i18n.ts`-pattern violation discovered as a consumer of the same component), per explicit user decision to include it in this cycle.

## Scope

1. **`EditorialDatePicker.tsx`**: remove `MONTHS_PT/ES/EN`, `DOW_PT`, `getMonthLabels()`, the `locale?: string` prop. Consume `useTranslations('calendar')` + `MONTH_KEYS`/`MONDAY_FIRST_DAY_KEYS` from `@/i18n/calendar-keys` (the canonical I18N-05 source, same pattern as `DesktopWeekGrid.tsx`/`CalendarHeader.tsx`). Reuse `dashboard.calendar.header.{prevMonthAriaLabel,nextMonthAriaLabel}` (byte-identical, already shipped). Add one new key, `dashboard.calendar.datePicker.selectDateAriaLabel`.
2. **3 call sites** (`BlockDaysForm.tsx`, `BlockDateForm.tsx`, `NewAppointmentForm.tsx`): drop the now-removed `locale` prop pass-through where present.
3. **`BlockDaysForm.tsx`**: remove the inline `LABELS` map. Reuse `calendar.block.reasonLabel` / `calendar.block.reason.*` (byte-identical across pt/es/en, verified). Add `dashboard.calendar.blockDays.{from,to,confirm,success,conflictHint}` (wording differs from the hour-based `calendar.block.*` framing).

## Non-goals

- `BlockDateForm.tsx`'s own hardcoding (has zero `useTranslations`/`LABELS` reference — a separate, likely-worse violation) — discovered, not touched. Flag as a follow-up ticket in the archive report, same pattern I18N-05 used for this very ticket.
- No changes to `calendar-keys.ts`, `CalendarHeader.tsx`, `DesktopWeekGrid.tsx`, `MonthView.tsx`, `CalendarDayNav.tsx`, `MobileWeekDaySelector.tsx`, or the `calendar.block.*` namespace's own values.

## Risk / size

Low risk — pure reuse of an established, already-tested pattern (I18N-05's `calendar.months/days` + `calendar-keys.ts`), no new architecture. Estimated ~120-150 changed lines across 2 components + 3 message files + 3 minor caller edits. Single PR, well under the 400-line budget.
