# Archive report: i18n-datepicker-hardcoded-strings (TICKET I18N-07)

**Status**: DONE. Archived 2026-09-16.

## Summary

Closed the 9th month-name representation flagged (but deliberately deferred) by I18N-05: `EditorialDatePicker.tsx`'s `MONTHS_PT/ES/EN` arrays. Exploration found the real scope was bigger — `DOW_PT` had zero ES/EN variant at all (always-Portuguese day header, a live bug not just duplication), 3 hardcoded `aria-label`s, and 2 of the component's 3 real consumers never passed the old `locale` prop at all (always defaulted to Portuguese regardless of actual staff locale). Per explicit user decision, `BlockDaysForm.tsx`'s own inline `LABELS` map (a `_i18n.ts`-pattern violation, discovered while reading it as an `EditorialDatePicker` consumer) was folded into the same cycle.

## Value chosen: reuse over new keys

`dashboard.calendar.header.{prevMonthAriaLabel,nextMonthAriaLabel}` and `calendar.block.{reasonLabel,reason.*}` were already shipped, byte-identical to what these two components needed — reused verbatim, zero new keys for them. Only 6 genuinely new keys were added (`dashboard.calendar.datePicker.selectDateAriaLabel` + `dashboard.calendar.blockDays.{from,to,confirm,success,conflictHint}`), matching the "reuse over duplication" principle established by I18N-04.

## Unplanned finding, resolved same-cycle

Removing the now-redundant `locale` prop cascaded further than design.md anticipated: `BlockDaysForm` → `MonthActionModal`/`AnimatedShell` → `AgendaInteractive`'s one pass-through all turned out to be dead once `EditorialDatePicker` stopped needing it. `eslint` caught each step; all were traced and removed in the same pass rather than left as new dead code.

## Scope

6 files changed (3 message JSON + 4 components, one of which — `AgendaInteractive.tsx` — only lost one dead line). Net negative line count in the two main component files (removed more hardcoded content than the translation wiring added).

## Non-goals honored

`BlockDateForm.tsx` — the sibling *time-slot* block form — was found to have its own separate hardcoding pattern (zero `useTranslations` reference at all) during consumer audit, and deliberately **not** touched: out of the user-approved scope for this cycle. Flagged here as a recommended follow-up, same pattern I18N-05 used to flag this very ticket.

**Follow-up ticket recommended**: `BlockDateForm.tsx` hardcoded strings (time-slot blocking form) — call it I18N-08.

## Validation

`pnpm check-types` exit 0, `messages.test.ts` key parity clean, `npm run build` exit 0 (26/26 routes), `pnpm test` 38/38 passed, `eslint` on all 4 touched component files clean (0 warnings after the dead-prop cascade fix).
