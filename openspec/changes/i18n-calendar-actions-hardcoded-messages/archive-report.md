# Archive report: i18n-calendar-actions-hardcoded-messages (TICKET I18N-09)

**Status**: DONE. Archived 2026-09-17.

## Summary

Localizes all 13 hardcoded Portuguese messages across `apps/web/src/app/(dashboard)/dashboard/calendar/actions.ts`'s 6 Server Actions and shared `getAuth()` helper — closing the gap I18N-08 flagged (the server-side message a user actually sees was untouched by that component-level fix).

## Value found: closed a real client/server mismatch, not just added translations

`createBlockedIntervalAction`'s hardcoded success message ("Período bloqueado") never matched `calendar.block.success` ("Horário bloqueado com sucesso"/etc.) — the exact key `BlockDateForm.tsx`'s own client-side fallback already targeted, per I18N-08's disclosed non-goal. Switching the server to return `calendar.block.success` directly closes this by construction: both paths now agree, not just "the fallback would be correct if it ever fired."

## Approach

Server Actions resolve their own locale via `headers()` (they're server-side code, same mechanism a Server Component uses) through two small local helpers. 2 of 13 messages reuse existing keys verbatim; 10 new keys live in a new `dashboard.calendar.actions` namespace, matching this codebase's per-feature-namespace convention.

## Non-goals

Other Server Action files that may carry the same hardcoded-message pattern (billing, settings, etc.) were not audited — this ticket was scoped to the one file I18N-08 named. Worth a future sweep if the pattern repeats elsewhere.

## Scope

4 files (1 code + 3 message JSON).

## Validation

`pnpm check-types` exit 0, `messages.test.ts` key parity clean, `npm run build` exit 0 (26/26 routes), `pnpm test` 59/59, `eslint` clean save for 1 pre-existing, confirmed-unrelated warning.

## Parallel-work note

This change was executed concurrently with an unrelated fix (the `next=/me` relative-redirect bug, touching `me/layout.tsx`/`build-login-url.ts`/`proxy.ts`) per explicit user instruction to run both in parallel as long as they didn't share files. Confirmed zero file overlap via `git diff --stat` before finishing.
