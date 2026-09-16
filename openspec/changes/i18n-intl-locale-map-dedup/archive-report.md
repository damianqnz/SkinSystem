# Archive report: i18n-intl-locale-map-dedup (TICKET PR4)

**Status**: DONE. Archived 2026-09-16.

## Summary

Eliminated the 15 duplicated `INTL_LOCALE_MAP` copies flagged by PR3/3's review, plus the 3 remaining inline label maps (`NAV_LABELS`, `SIDEBAR_LABELS`, `UserMenu.COPY`). `week-utils`/`MonthView`/`MobileWeekDaySelector` — also originally listed in the ticket — were found already done by I18N-05 during exploration and dropped from scope, correcting the stale ticket description.

## Value chosen: reuse the already-live canonical utility

`@/i18n/intl-tag.ts`'s `toIntlTag()` already existed and was already consumed by 5 files in the booking funnel — it was simply never rolled out to the dashboard. Every one of the 15 duplicated copies was byte-identical to what `toIntlTag` already does, except strictly worse: hardcoded `'pt-PT'` fallback instead of tracking `DEFAULT_LOCALE`. Pure reuse, zero new mapping logic written.

## Scope addition (user-approved)

2 hardcoded `aria-label="Navegação principal"` in `Sidebar.tsx` — found while already touching that file for `SIDEBAR_LABELS` — folded into the same `dashboard.sidebar.*` namespace rather than left as new debt.

## Dead-prop cleanup, traced fully

Once `nav-items.ts`/`UserMenu.tsx` stopped needing a bare `locale` string, the following became provably dead and were removed in the same pass: `Sidebar.tsx`/`BottomBar.tsx`'s `useTenantContext()` import (locale-only usage), `UserMenu.tsx`'s `locale` prop, and `PublicHeader.tsx`'s one pass-through to it (its own `locale`, still needed by `LanguageSwitcher`, was left untouched).

## Scope

23 files (20 code + 3 message JSON), 256 changed lines (136+/120-) — well under the 400-line budget, no chaining needed.

## Non-goals honored

`@/i18n/intl-tag.ts` itself and its 5 existing consumers untouched. `week-utils.ts`/`MonthView.tsx`/`MobileWeekDaySelector.tsx` untouched (already correct). `shared/components/dashboard/UserMenu.tsx` (the *other*, dashboard-scoped UserMenu — a different, server component) untouched.

## Disclosed verify note

5 pre-existing `eslint` `no-unused-vars` warnings surfaced across the diff (`countryIso`, two dead `locale` props, two dead `intlLocale` variables under their old expression) — all confirmed via `git diff` to sit outside every changed hunk. Not fixed, out of scope, same triage pattern as every prior ticket this session.

## Validation

`pnpm check-types` exit 0, `messages.test.ts` key parity clean, `npm run build` exit 0 (26/26 routes), `pnpm test` 38/38 passed, `eslint` clean save for the 5 disclosed pre-existing warnings.
