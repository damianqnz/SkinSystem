# Tasks: i18n-calendar-names-consolidation (TICKET I18N-05, expanded)

## Phase 1 — Foundation
- [ ] 1.1 Add `calendar.months.*` (12 keys) and `calendar.days.*` (7 keys) to `pt.json`, `es.json`, `en.json` — reuse `booking.calendar.months/days`' existing values verbatim.
- [ ] 1.2 Add `tenant.openStatus.*` (4 keys: `open`, `closedGeneric`, `closedOpensAt`, `closedOpensOnAt`) to all 3 locale files. `closedOpensAt` interpolates `{time}`; `closedOpensOnAt` interpolates `{day}` and `{time}`.
- [ ] 1.3 Remove `booking.calendar.months` and `booking.calendar.days` from all 3 locale files.
- [ ] 1.4 Remove `dashboard.calendar.header.months`, `dashboard.calendar.dayNav.months`, `dashboard.calendar.dayNav.days` from all 3 locale files.
- [ ] 1.5 Create `apps/web/src/i18n/calendar-keys.ts` — `MONTH_KEYS`, `DAY_KEYS`, `MONDAY_FIRST_DAY_KEYS` per design.
- [ ] 1.6 Create `apps/web/src/i18n/calendar-keys.test.ts` — Vitest coverage for key order/length and rotation correctness.

## Phase 2 — Booking funnel migration
- [ ] 2.1 `Step2Calendar.tsx`: import `MONTH_KEYS`/`DAY_KEYS` from `@/i18n/calendar-keys`; change the months/days `t(...)` calls from the `booking` namespace to `calendar`. Verify grid-lookup behavior (position → label) is unchanged.

## Phase 3 — Dashboard calendar header/nav migration
- [ ] 3.1 `CalendarHeader.tsx`: add `useTranslations('calendar')`; replace `t.raw('months')[monthStart.getUTCMonth()]` with `MONTH_KEYS`-indexed lookup.
- [ ] 3.2 `CalendarDayNav.tsx`: add `useTranslations('calendar')`; replace both `t.raw('days')`/`t.raw('months')` lookups; preserve the existing `.slice(0,3)` truncation call sites unchanged.

## Phase 4 — Dashboard week/month-grid migration
- [ ] 4.1 `MonthView.tsx`: replace local `DAY_LABELS` with `useTranslations('calendar')` + `MONDAY_FIRST_DAY_KEYS.map(k => t(k).slice(0,3))`. Confirm the trailing-period normalization (`'Lun.'` → `'Lun'`) is intentional per design, not a regression.
- [ ] 4.2 `MobileWeekDaySelector.tsx`: same pattern as 4.1.
- [ ] 4.3 `week-utils.ts`: remove the `DAY_LABELS` export.
- [ ] 4.4 `DesktopWeekGrid.tsx`: add `useTranslations('calendar')`; build `days` from `MONDAY_FIRST_DAY_KEYS.map(tCal)` instead of importing `DAY_LABELS` from `week-utils.ts`.

## Phase 5 — Public tenant-landing migration
- [ ] 5.1 `StickyInfoCard.tsx`: replace local `DAY_NAMES_PT` with `useTranslations('calendar')`. Replace the hardcoded `'Fechado'` fallback (line ~124) with `t('tenant.openStatus.closedGeneric')` (or the equivalent scoped call) — reuse, not a new key.

## Phase 6 — `getLandingData.ts` locale-awareness
- [ ] 6.1 `computeOpenStatus()`: make `async`, add `locale: SupportedLocale` parameter, replace all 4 hardcoded label branches with `getTranslations({ locale, namespace: 'tenant.openStatus' })` calls per design; replace `DAY_NAMES_PT` day-name lookup with `calendar` namespace + `DAY_KEYS`.
- [ ] 6.2 `getLandingData(slug: string, locale: SupportedLocale)`: thread the new parameter to the one internal `computeOpenStatus()` call, adding `await`.
- [ ] 6.3 `(tenant)/[tenant]/page.tsx`: pass `locale` at both call sites (`generateMetadata()` computes its own `locale` via `localeFromHeader`/`headers()`; `PublicHomePage` already has `locale` computed — pass it through).
- [ ] 6.4 `(tenant)/[tenant]/book/page.tsx`: pass the already-computed `locale` to its `getLandingData()` call.

## Phase 7 — Verification
- [ ] 7.1 `pnpm --filter web test` — confirm `messages.test.ts` (parity) and the new `calendar-keys.test.ts` both pass.
- [ ] 7.2 `pnpm check-types` — exit 0.
- [ ] 7.3 `eslint --max-warnings 0` scoped to all changed files.
- [ ] 7.4 `rg` sweep for the removed literal arrays/strings (`DAY_NAMES_PT`, `DAY_LABELS`, `SHORT_LABELS`, `'Fechado'` outside the new key, `Janeiro`/`January`/`Enero` as raw array literals) — confirm zero remaining occurrences outside `messages/*.json` values.
- [ ] 7.5 `git diff --stat` — confirm exactly the 14 files from design's summary changed, nothing else (in particular, `PublicHeader.tsx`, `EventDetailSheet.tsx`, `AppointmentDetailModal.tsx` must show zero diff — out of scope per non-goals).
- [ ] 7.6 Manual verification: dev-server check that `computeOpenStatus()`'s label renders correctly (in English, at minimum) for at least one "closed, opens tomorrow" scenario — this is the one behavior not covered by an automated test per design's testability section.

## Review Workload Forecast
- Estimated changed lines: ~320-380 (grew slightly from design's 8th-file discovery)
- 400-line budget risk: Medium — close to the ceiling
- Chained PRs recommended: No, but flag to user if actual diff exceeds 400
- Delivery strategy: ask-on-risk (session preflight)
- Decision needed before apply: Yes — confirm with user if the actual measured diff approaches/exceeds 400 lines once Phase 1-6 are drafted
