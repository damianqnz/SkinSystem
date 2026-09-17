# Spec: i18n-blockdateform-hardcoded-strings (TICKET I18N-08)

## Requirement 1: BlockDateForm renders every string from messages, in the resolved locale

### Scenario: Any locale, block-date-range dialog
- **Given** a staff member with resolved locale `pt`, `es`, or `en`
- **When** `BlockDateForm` renders (title, back/close, from/to labels, reason chips, cancel/confirm buttons, both button states)
- **Then** every string reads from `useTranslations`-backed keys (`calendar.block.*` + reused `dashboard.calendar.newAppointment.*`), with zero hardcoded literals remaining

### Scenario: End date before start date
- **Given** a staff member sets an end date/time earlier than or equal to the start
- **When** they submit
- **Then** the validation toast reads from `calendar.block.endBeforeStartError` in their resolved locale, not a hardcoded Portuguese string

## Requirement 2: EditorialTimePicker's trigger button announces its purpose in the resolved locale

### Scenario: Any locale, time picker trigger
- **Given** any resolved locale
- **When** the collapsed time-picker trigger renders (in `BlockDateForm` or `NewAppointmentForm`)
- **Then** its `aria-label` reads from `dashboard.calendar.datePicker.selectTimeAriaLabel`, not the literal `"Selecionar hora"`

## Non-scenario: server-side messages (disclosed non-goal)

The success/error toast text a user actually sees today is controlled by `createBlockedIntervalAction`'s hardcoded server-side messages, not this component's own (currently dead) fallback strings. This requirement only covers what `BlockDateForm.tsx` itself renders; the server-side messages are I18N-09's scope.

## Verification (no RTL/jsdom harness, same constraint as every prior ticket)

1. Key-parity check (`messages.test.ts`) — the 2 new keys exist identically in pt/es/en.
2. Diff-literal check — zero remaining hardcoded Portuguese string literals in `BlockDateForm.tsx`'s JSX/logic (excluding comments/prop names).
3. `tsc --noEmit`, `npm run build`, `pnpm test` full suite.
