# Proposal: i18n-calendar-names-consolidation (TICKET I18N-05, expanded)

## Intent

Consolidate the 7 verified representations of month/day names into a single named-key source, per CLAUDE.md's "Named Keys, Never Indexed Arrays" red line. **Scope expanded per explicit user decision**: also make `getLandingData.ts`'s open/closed status label fully locale-aware (was entangled with the day-name array and previously had zero locale parameter), rather than leaving that bug in place behind a minimal fix.

## Scope

1. **New shared source**: add `calendar.months.*` (12 keys) and `calendar.days.*` (7 keys, Sunday-first, full names) to `messages/{pt,es,en}.json`, reusing the existing top-level `calendar` namespace (today holds only `view`/`slot`/`block`).
2. **New helper module**: `apps/web/src/i18n/calendar-keys.ts` — promotes `Step2Calendar.tsx`'s existing `MONTH_KEYS`/`DAY_KEYS` bridging arrays, plus a `rotateToMonday(dayKeys)` (or equivalent) helper for the two Monday-first consumers.
3. **Delete** `booking.calendar.months/days` (superseded by the shared namespace) and migrate `Step2Calendar.tsx` to the shared one.
4. **Delete** the 3 indexed arrays in `messages/*.json`: `dashboard.calendar.header.months`, `dashboard.calendar.dayNav.months`, `dashboard.calendar.dayNav.days`. Migrate `CalendarHeader.tsx` and `CalendarDayNav.tsx` to the shared namespace + helper.
5. **`MonthView.tsx`**, **`MobileWeekDaySelector.tsx`**, and **`week-utils.ts`** (8th representation, found during design — not in HEARTBEAT's original count of 4 hardcoded files; `week-utils.ts` exports its own full-name Monday-first `DAY_LABELS`, consumed by `DesktopWeekGrid.tsx`): replace all per-locale hardcoded Monday-first arrays with the shared namespace + rotation helper. Drop `MonthView`'s trailing-period formatting (`'Lun.'` → `'Lun'`) for consistency with the rest of the app's abbreviation style — a minor, intentional visual normalization.
6. **`StickyInfoCard.tsx`**: replace its hardcoded full-name `DAY_NAMES_PT` array with `useTranslations('calendar')` against the shared namespace. Its separate hardcoded `'Fechado'` string (line 124, the "no hours today" fallback) moves to a new key in the same pass since it's in the same component and same edit.
7. **`getLandingData.ts` (expanded scope)**: `getLandingData(slug: string)` becomes `getLandingData(slug: string, locale: SupportedLocale)`. `computeOpenStatus()` becomes locale-aware, resolving its 4 label variants (`Aberto`, `Fechado`, `Fechado · Abre às {time}`, `Fechado · Abre {day} às {time}`) via `getTranslations` against a new namespace (`tenant.openStatus.*`), and its day-name lookup uses the shared `calendar.days` namespace instead of the local `DAY_NAMES_PT` array. All 3 call sites (`(tenant)/[tenant]/page.tsx`'s `generateMetadata()` and `PublicHomePage`, `(tenant)/[tenant]/book/page.tsx`'s `BookPage`) pass the already-computed `locale` through.

## Approach

- Canonical namespace lives at top-level `calendar.months.*` / `calendar.days.*` (not `booking.calendar.*`, which is booking-funnel scoped and would be a leaky abstraction for dashboard/tenant-landing consumers).
- Full names only in the canonical source; abbreviation (3-letter, with/without period) stays a display concern handled by slicing or a small formatting helper, not separate translated keys — avoids doubling the key count for what's a presentation detail.
- `calendar-keys.ts` is pure/side-effect-free, directly unit-testable with Vitest (no jsdom needed), following the `preview-url.ts` precedent from the settings-layout-tenant-fallback-fix change.
- `computeOpenStatus()`'s new signature takes `locale` and returns the same `OpenStatus` shape; ICU interpolation (`{time}`, `{day}`) replaces string-template concatenation.

## Alternatives considered

- **Keep `booking.calendar.months/days` as the canonical namespace** instead of creating a new shared one — rejected: semantically wrong for non-booking consumers (dashboard calendar, tenant landing hours display) and would keep the funnel-specific namespace as an accidental shared dependency.
- **Minimal fix for `getLandingData.ts`** (PT-only lookup, defer full locale-awareness to a new I18N-06 ticket) — this was the original recommendation from explore, but the user explicitly chose to expand scope now instead. Recorded here for the record; not the chosen path.
- **Per-key abbreviated variants in messages.json** (e.g. `calendar.months.jan` and `calendar.monthsShort.jan`) instead of local slicing — rejected: doubles the key surface for a formatting concern that's already solved elsewhere in the codebase (`CalendarDayNav.tsx`'s existing `.slice(0,3)` on month names).

## Explicit non-goals

- `(tenant)/[tenant]/page.tsx`'s `generateMetadata()` has its own separate hardcoded-Portuguese `description`/`openGraph` strings (unrelated to `computeOpenStatus`) — discovered during this exploration, explicitly NOT touched here. Worth a future ticket.
- No changes to `A11Y-02` (PublicHeader scroll-spy) or `PERF-01` (i18n bundle narrowing) — those remain separate, sequenced tickets per the earlier planning discussion.
- No changes to `PR4` (the 14 duplicated `INTL_LOCALE_MAP` copies) — `CalendarHeader.tsx`/`CalendarDayNav.tsx` each have their own local `INTL_LOCALE_MAP`, left untouched here; only their months/days arrays are in scope.

## Success criteria

- Zero indexed arrays for months/days remain in `messages/*.json`.
- All 7 original consumer files read from the shared `calendar.months/days` namespace (directly or via `calendar-keys.ts`).
- `getLandingData()`'s open/closed status label renders correctly in all 3 locales (verified per-locale, not just PT).
- `messages.test.ts` parity suite passes with zero changes to that test file.
- `calendar-keys.ts` has direct Vitest unit coverage for both the positional-lookup and Monday-rotation helpers.

## Delivery

Single PR expected, ~300-380 changed lines (estimate grew from explore's ~250-320 due to the `getLandingData.ts` scope expansion) — near the 400-line budget. Tasks phase must re-forecast precisely; flag to the user if it crosses 400.
