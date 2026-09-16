# Spec: i18n-datepicker-hardcoded-strings (TICKET I18N-07)

## Requirement 1: EditorialDatePicker renders every locale-dependent string in the visitor's actual locale

### Scenario: PT staff member opens any form using EditorialDatePicker
- **Given** a staff member with resolved locale `pt`
- **When** `EditorialDatePicker` renders, regardless of which of the 3 consumer forms mounts it
- **Then** the month label, the 7 day-of-week header letters, and both nav `aria-label`s are all in Portuguese, sourced from `calendar.months.*`/`calendar.days.*`/`dashboard.calendar.header.*`

### Scenario: ES staff member opens `BlockDateForm` or `NewAppointmentForm` (previously broken)
- **Given** a staff member with resolved locale `es`, using either of the two consumers that never passed the old `locale` prop
- **When** `EditorialDatePicker` renders
- **Then** the month label and day-of-week header render in Spanish (previously: always Portuguese, since `locale` was `undefined` and `getMonthLabels(undefined)` fell back to `MONTHS_PT`)

### Scenario: EN staff member
- **Given** a staff member with resolved locale `en`
- **When** `EditorialDatePicker` renders
- **Then** the month label and day-of-week header render in English (`M,T,W,T,F,S,S` for the day header)

### Scenario: Trigger button announces its purpose in the resolved locale
- **Given** any resolved locale
- **When** the collapsed trigger button renders
- **Then** its `aria-label` reads from `dashboard.calendar.datePicker.selectDateAriaLabel`, not the literal `"Selecionar data"`

## Requirement 2: BlockDaysForm renders all UI strings from messages, not an inline map

### Scenario: Any locale, block-days form
- **Given** a staff member with resolved locale `pt`, `es`, or `en`
- **When** `BlockDaysForm` renders (labels, reason select, confirm button, success toast, conflict list)
- **Then** every string reads from `useTranslations`-backed keys (`dashboard.calendar.blockDays.*` + reused `calendar.block.{reasonLabel,reason.*}`), with zero references to the removed `LABELS` object

## Non-scenario: build-time / lint-time verification only

No RTL/jsdom harness exists for these client components' rendered text (same constraint as every prior A11Y/I18N ticket in this repo). Compliance is verified by:
1. Key-parity check (`messages.test.ts`) — the two new namespaces exist identically in `pt.json`/`es.json`/`en.json`.
2. Source diff-literal check — zero remaining `MONTHS_PT`/`MONTHS_ES`/`MONTHS_EN`/`DOW_PT`/`LABELS` identifiers in either file.
3. `tsc --noEmit` — the removed `locale` prop's call sites type-check clean (no leftover unused prop or missing-prop error).
4. `pnpm test` full suite green.
