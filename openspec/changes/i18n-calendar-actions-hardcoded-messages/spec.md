# Spec: i18n-calendar-actions-hardcoded-messages (TICKET I18N-09)

## Requirement 1: Every message these 6 Server Actions can return resolves in the caller's locale

### Scenario: Any locale, any error/success path
- **Given** a staff member with resolved locale `pt`, `es`, or `en`
- **When** any of `createBlockedIntervalAction`, `createInternalAppointmentAction`, `cancelAppointmentAction`, `restoreAppointmentAction`, `getAppointmentDetailAction`, `quickCreateCustomerAction`, or the shared `getAuth()` helper returns a message
- **Then** that message reads from `useTranslations`-backed keys resolved via the request's `x-locale` header, with zero hardcoded literals remaining

### Scenario: Block-success message now matches what the client already expected
- **Given** `createBlockedIntervalAction` succeeds
- **Then** its `message` equals `calendar.block.success` in the resolved locale — the same key `BlockDateForm.tsx`'s own `res.message ?? t('success')` fallback (from I18N-08) already targets, closing that disclosed mismatch

## Verification

1. Key-parity check (`messages.test.ts`) — the new `dashboard.calendar.actions` namespace exists identically in pt/es/en.
2. Diff-literal check (`rg "message: '[A-ZÀ-ÿ]"`) — zero remaining hardcoded Portuguese literals in `actions.ts`.
3. `tsc --noEmit`, `npm run build`, `pnpm test` full suite.
