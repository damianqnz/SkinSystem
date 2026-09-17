# Archive report: i18n-blockdateform-hardcoded-strings (TICKET I18N-08)

**Status**: DONE. Archived 2026-09-17.

## Summary

Localizes `BlockDateForm.tsx`, the last fully-hardcoded-Portuguese calendar component flagged during I18N-07's consumer audit. Zero `useTranslations` reference, 12 hardcoded strings.

## Value found: reused a namespace that already existed for exactly this purpose

`calendar.block.*` had zero consumers before this change but its semantics (hour-based blocking, "(hs)" suffix on the from/to labels) matched this component almost exactly — the same "dead JSON, never wired up" pattern PR3/3 found for the `booking` namespace. Adopting it (user-approved, since it changes PT's visible copy slightly — e.g. "Bloquear data" → "Bloquear horário") meant 10 of 12 strings needed zero new keys, reusing `calendar.block.*` and `dashboard.calendar.newAppointment.{back,closeAriaLabel,cancelBtn}` verbatim. Only 2 genuinely new keys were needed.

## Bonus fix found while reading a sibling file

`EditorialTimePicker.tsx` (shared by `BlockDateForm` and the already-migrated `NewAppointmentForm`) had one hardcoded `aria-label="Selecionar hora"` — the direct time-picker analog of `EditorialDatePicker`'s already-fixed `selectDateAriaLabel`. Folded in as a trivial, same-pattern addition.

## Disclosed non-goal

`createBlockedIntervalAction`'s server-side hardcoded messages (`actions.ts`) are what a user actually sees today for success/error toasts — this component's own message fallbacks are practically dead code (the action always sets `message`). Fixing this requires threading locale into Server Actions, a separate architectural question. **Follow-up ticket recommended: I18N-09.**

## Scope

5 files (2 code + 3 message JSON), 63 changed lines (36+/27-).

## Non-goals honored

`BlockDaysForm.tsx`, `EditorialDatePicker.tsx` — already correct (I18N-07), untouched. `actions.ts` — flagged as I18N-09, not fixed here.

## Validation

`pnpm check-types` exit 0, `messages.test.ts` key parity clean, `npm run build` exit 0 (26/26 routes), `pnpm test` 50/50, `eslint` clean on both changed files.
