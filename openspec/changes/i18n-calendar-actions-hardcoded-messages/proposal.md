# Proposal: i18n-calendar-actions-hardcoded-messages (TICKET I18N-09)

## Intent

Localize all 13 hardcoded Portuguese messages in `apps/web/src/app/(dashboard)/dashboard/calendar/actions.ts` (6 Server Actions + shared `getAuth()` helper), closing the gap I18N-08 flagged: these server-side strings are what a user actually sees, regardless of how well the client component itself is localized.

## Approach

Server Actions resolve their own locale via `headers()` (same mechanism as Server Components), through two small local helpers (`getActionLocale`, `getActionTranslations`). 2 of 13 messages reuse existing keys verbatim (`dashboard.calendar.newAppointment.toastCreated`, `calendar.block.success` — the latter also closes I18N-08's disclosed client/server message mismatch). The remaining 11 unique strings live in a new `dashboard.calendar.actions` namespace, matching this codebase's per-feature-namespace convention.

## Non-goals

- Other Server Action files that may carry the same pattern (`billing/actions.ts`, `settings/*/actions.ts`, etc.) — not audited, out of this ticket's named scope.
- No test infrastructure added for Server Action message paths — no existing pattern to extend, disproportionate for a string-literal swap.

## Risk / size

Low risk — pure string-literal replacement, zero logic change, zero new dependencies. 4 files (1 code + 3 message JSON).
