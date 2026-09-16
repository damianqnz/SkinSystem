# Exploration: i18n-calendar-names-consolidation (TICKET I18N-05)

## Verified representations (7, not 6 — HEARTBEAT undercounted by one)

1. **`booking.calendar.months.*` / `booking.calendar.days.*`** (messages/*.json) — the correct pattern from PR3. Named keys, full names, Sunday-first day order. Consumed by `Step2Calendar.tsx` via a local bridging pattern:
   ```ts
   const MONTH_KEYS = ['jan','feb',...,'dec'] as const;
   const DAY_KEYS = ['sun','mon',...,'sat'] as const;
   // t(`calendar.months.${MONTH_KEYS[viewMonth] ?? 'jan'}`)
   ```
   This is the pattern HEARTBEAT wants promoted to `@/i18n/`.

2. **`dashboard.calendar.header.months`** (messages/*.json:769) — indexed array, full names, Jan-Dec order. Consumed by `CalendarHeader.tsx:36-37`: `months[monthStart.getUTCMonth()]`.

3. **`dashboard.calendar.dayNav.days`** (messages/*.json:778) — indexed array, full names, Sunday-first. Consumed by `CalendarDayNav.tsx:35,50`: `days[date.getUTCDay()]`.

4. **`dashboard.calendar.dayNav.months`** (messages/*.json:779) — indexed array, full names, Jan-Dec. Same file, `CalendarDayNav.tsx:36,45-46,51`, including a `.slice(0, 3)` truncation call site for the week-view abbreviated range label.

5. **`getLandingData.ts:61` `DAY_NAMES_PT`** — hardcoded array, **3-letter abbreviated, Portuguese only**, Sunday-first. **Not a standalone label** — embedded inside fully hardcoded Portuguese sentence templates inside `computeOpenStatus()`: `'Aberto'`, `` `Fechado · Abre às ${time}` ``, `` `Fechado · Abre ${dayName} às ${time}` ``. The exported function `getLandingData(slug: string)` takes **no locale parameter at all** — this data is computed server-side with zero locale awareness, unlike every other file here.

6. **`StickyInfoCard.tsx:14` `DAY_NAMES_PT`** — a **second, different** hardcoded array despite the identical variable name: full names (not abbreviated), Sunday-first, Portuguese only. Used to label a weekly-hours dropdown (`'use client'` component, so this is a public-site client-side consumer). Also has its own separate hardcoded `'Fechado'` fallback at line 124.

7. **`MonthView.tsx:37-41` `DAY_LABELS`** and **`MobileWeekDaySelector.tsx:10-13` `SHORT_LABELS`** — two near-duplicate per-locale (es/pt/en) abbreviated arrays, **Monday-first** (not Sunday-first like everything else), with a formatting micro-difference (`MonthView` uses trailing periods — `'Lun.'` — `MobileWeekDaySelector` doesn't — `'Lun'`). Both `'use client'`, dashboard-only.

## Ordering conventions in play (real design constraint)

- **Sunday-first, full names**: the canonical `booking.calendar.days.*` pattern, plus items 3, 5, 6.
- **Monday-first, abbreviated**: items 7 (both files) — used for calendar-grid weekday headers, a different UI need (compact column labels) than the Sunday-first list-style days.

Any consolidation needs a rotation helper for the Monday-first consumers, not just a positional bridge like `Step2Calendar.tsx`'s existing `MONTH_KEYS`/`DAY_KEYS`.

## Where should the canonical namespace live?

`booking.calendar.months/days` is semantically scoped to the booking funnel. Items 2-7 are dashboard-internal or tenant-landing — using the booking namespace for those would be a leaky abstraction. A pre-existing top-level `calendar` namespace already exists in messages/*.json (currently holding unrelated keys: `view`, `slot`, `block`) — this is the natural home for a shared `calendar.months.*` / `calendar.days.*`, with `booking.calendar.months/days` deleted and `Step2Calendar.tsx` migrated to read from the shared namespace too.

## The getLandingData.ts complication (needs a decision before design)

Item 5 is not a simple "swap array for named keys" fix like the other 6. The array is inseparable from fully-Portuguese sentence templates, and the function has no locale parameter — this is architecturally a different, larger gap (the whole open/closed status label is not locale-aware at all, for any visitor). Two honest options:

- **(A) Minimal, ticket-literal fix**: replace the raw array with a lookup against the *Portuguese* values of the new canonical `calendar.days` namespace (e.g. a PT-only static import), removing the indexed array while preserving today's exact behavior (all visitors see Portuguese status text, regardless of their own locale — an existing bug, not something this ticket introduces or fixes). Explicitly flag the full label as a new, separate debt ticket (locale-aware open/closed status — call it I18N-06).
- **(B) Expand scope**: thread a `locale` parameter through `getLandingData()`/`computeOpenStatus()` and translate the full label set (`Aberto`/`Fechado`/`Abre às`/etc.) via `getTranslations()`. This is real, valuable work, but it is not what HEARTBEAT's I18N-05 ticket asked for (it only names the day-array), and it touches a Server Component data-fetching signature used elsewhere in the tenant landing page — larger blast radius than the other 6 items combined.

Recommend (A) for this change, with (B) proposed as a new follow-up ticket — consistent with this project's practice of not silently expanding SDD change scope.

## Client-side exposure (relevant to future PERF-01)

`StickyInfoCard.tsx` (item 6) is a `'use client'` component on the public tenant landing page. If its day names move into the shared `calendar.days.*` namespace and it starts calling `useTranslations('calendar')`, that's a **new client-side consumer** of the `calendar` namespace under `(tenant)/`. Noted for PERF-01's future namespace-subset measurement — not acted on here.

## Scope estimate

- `messages/{pt,es,en}.json`: add `calendar.months.*` (12 keys) + `calendar.days.*` (7 keys) = 19 new keys × 3 locales; remove 3 indexed arrays (`dashboard.calendar.header.months`, `dashboard.calendar.dayNav.months`, `dashboard.calendar.dayNav.days`) and the old `booking.calendar.months/days` objects (12+7 keys × 3, removed not added).
- New shared helper: `apps/web/src/i18n/calendar-keys.ts` — promotes `MONTH_KEYS`/`DAY_KEYS` from `Step2Calendar.tsx`, plus a Monday-first rotation helper for items 7.
- 7 call-site files touched: `Step2Calendar.tsx` (namespace migration only), `CalendarHeader.tsx`, `CalendarDayNav.tsx`, `getLandingData.ts` (option A), `StickyInfoCard.tsx`, `MonthView.tsx`, `MobileWeekDaySelector.tsx`.
- Estimated ~250-320 changed lines (JSON additions/removals are the bulk; each `.tsx` touch is small). Comfortably within a single PR's 400-line budget, but tighter than I18N-04's — tasks phase should re-forecast precisely.

## Testability

The existing `messages.test.ts` parity suite covers the new namespace automatically (no changes needed there). The new `@/i18n/calendar-keys.ts` helper (pure functions: key arrays + a rotation function) is directly unit-testable with Vitest, following the `host.ts`/`preview-url.ts` precedent — this should be a task in this change, since HEARTBEAT explicitly calls out promoting this pattern to a shared module.

## Ready for proposal

Yes, with one decision needed first: confirm option (A) for `getLandingData.ts` before propose locks in scope.
