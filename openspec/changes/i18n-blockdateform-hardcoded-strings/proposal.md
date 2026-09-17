# Proposal: i18n-blockdateform-hardcoded-strings (TICKET I18N-08)

## Intent

Localize `BlockDateForm.tsx` (100% hardcoded Portuguese, zero `useTranslations`) — the sibling of `BlockDaysForm.tsx`, deliberately left out of I18N-07's scope.

## Approach

Adopt the existing, currently-unconsumed `calendar.block.*` namespace as the source of truth (user-approved): reuses `title`, `from`, `to`, `reasonLabel`, `confirm`, `success`, `reason.{vacation,illness,training,other}` verbatim — zero new keys for 10 of 12 strings. Also reuses `dashboard.calendar.newAppointment.{back,closeAriaLabel,cancelBtn}` byte-identical across all 3 locales. Only 2 genuinely new keys: `calendar.block.confirming` (pending button state) and `calendar.block.endBeforeStartError` (the one purely client-side validation message). Folds in `EditorialTimePicker.tsx`'s one hardcoded `aria-label` (direct analog of `EditorialDatePicker`'s already-fixed one) as a trivial sibling addition.

## Non-goals

- `createBlockedIntervalAction` (`actions.ts`)'s hardcoded server-side messages — the component's own success/error message fallbacks are dead code today (the server action always sets `message`), so fixing only the client side wouldn't change what a non-PT user sees. Threading locale into Server Actions is a separate, materially bigger architectural question. Flagged as **I18N-09**.
- `BlockDaysForm.tsx`, `EditorialDatePicker.tsx` — already correct (I18N-07); untouched.

## Risk / size

Low risk — reuse-heavy, 2 new keys, 2 files touched. Adopting `calendar.block.*` changes the visible PT copy slightly (explicit, user-approved trade for correctly localizing ES/EN and closing the dead-JSON gap).
