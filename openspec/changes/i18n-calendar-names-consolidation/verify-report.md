# Verify report: i18n-calendar-names-consolidation (TICKET I18N-05, expanded)

**Verdict: PASS**

## Requirement-by-requirement check

1. **Shared namespace + `calendar-keys.ts`** — `calendar.months.*`/`calendar.days.*` added to all 3 locale files with full parity (confirmed by `messages.test.ts`, 38/38 tests passing across the whole suite including the new `calendar-keys.test.ts`, 5 assertions covering key order/length and Monday-rotation correctness). PASS.
2. **No indexed arrays remain** — `booking.calendar.months/days`, `dashboard.calendar.header.months`, `dashboard.calendar.dayNav.months/days` all removed from all 3 locale files (confirmed via direct read after edit). `Step2Calendar.tsx`, `CalendarHeader.tsx`, `CalendarDayNav.tsx` migrated to `calendar-keys.ts` + the shared namespace. `MonthView.tsx`/`MobileWeekDaySelector.tsx`/`week-utils.ts`/`DesktopWeekGrid.tsx` (the 8th representation found during design) all migrated — `week-utils.ts`'s `DAY_LABELS` export removed entirely, `DesktopWeekGrid.tsx` now owns its own `useTranslations` call. PASS.
3. **Public tenant-landing localized** — `StickyInfoCard.tsx`'s `DAY_NAMES_PT` and hardcoded `'Fechado'` fallback both replaced with translated lookups (`calendar.days.*`, `tenant.openStatus.closedGeneric`). PASS.
4. **Open/closed status locale-aware** — `computeOpenStatus()` is now `async`, takes `locale: SupportedLocale`, and all 4 label branches (open/closedGeneric/closedOpensAt/closedOpensOnAt) resolve via `getTranslations` against the new `tenant.openStatus.*` namespace with ICU interpolation (`{time}`, `{day}`). `getLandingData()` threads `locale` through; all 3 call sites (`page.tsx`'s `generateMetadata()` and default export, `book/page.tsx`'s default export) pass their already-computed `locale` — no new header reads introduced (confirmed by reading each call site before and after). PASS.

## Corrections made during apply (self-caught, not from external review this time)

- **Design doc error found and fixed during apply**: design assumed `booking.calendar.days`' pre-existing values were full names ("reuse verbatim"). Direct read during apply showed they were actually 3-letter abbreviations (`"sun": "Sun"`), inconsistent with the new full-name canonical `calendar.days`. Fixed by applying the same `.slice(0,3)` display-truncation pattern already used for `MonthView`/`MobileWeekDaySelector` to `Step2Calendar.tsx`'s day-header rendering, preserving its compact grid appearance.
- **`es.json`/`pt.json` had a latent inconsistency** between `dashboard.calendar.header.months` (capitalized: "Enero") and `dashboard.calendar.dayNav.months` (lowercase: "enero") — both consumers now read the single capitalized canonical value; a minor, intentional content normalization, not a behavior regression.
- **9th representation found and explicitly left out of scope**: `EditorialDatePicker.tsx` has its own `MONTHS_PT`/`MONTHS_ES`/`MONTHS_EN` hardcoded arrays — discovered via the Phase 7 `rg` sweep, not in HEARTBEAT's original ticket, not in the approved proposal/design/tasks. Not touched; flagged for a future ticket rather than silently expanding this change's already-tight scope.
- **Dead prop cleanup, in-file**: removing `MobileWeekDaySelector.tsx`'s and `DesktopWeekGrid.tsx`'s local day-label maps made their `locale` prop (in `MobileWeekDaySelector`'s case) unused — removed from that component's interface and its one caller (`WeekViewGrid.tsx`); `DesktopWeekGrid.tsx` still needs `locale` for a downstream child, left untouched.

## Cross-cutting checks

- **Key parity**: `messages.test.ts` — 5/5 passed.
- **New unit tests**: `calendar-keys.test.ts` — 5/5 passed.
- **Type safety**: `pnpm check-types` — exit 0, clean on first attempt despite the `async` signature change.
- **Lint**: `eslint` on 12 of 14 changed files — zero warnings. The remaining 2 (`CalendarHeader.tsx`, `CalendarDayNav.tsx`, and `StickyInfoCard.tsx`) carry 3 pre-existing unused-variable warnings (`intlLocale` ×2, `primaryPhone`) — confirmed via `git show HEAD:<file>` that each was already a single, unused declaration in the pre-change committed version. Pre-existing repo debt, not introduced by this change; left unfixed per scope discipline.
- **Production build**: `next build` — exit 0, all 26 dynamic routes compiled and page-data-collected successfully, including `/[tenant]`, `/[tenant]/book`, `/[tenant]/book/success` (the routes exercising the changed `getLandingData()` signature).
- **Scope discipline**: `git status` shows exactly the 14 files design named, plus the 2 new `calendar-keys.*` files. No other tracked file touched — confirmed `PublicHeader.tsx` (modified by a concurrent, independent session working on A11Y-02) is NOT part of this change's diff.
- **Size**: 15 tracked files, 154 insertions / 157 deletions = 311 changed lines on tracked files, plus 2 new files (~45 lines) = ~356 total. Within the 400-line single-PR budget the user confirmed accepting.

## Deviations from design

Two, both described above under "Corrections made during apply": the `Step2Calendar.tsx` abbreviation-source assumption, and the `EditorialDatePicker.tsx` discovery (explicitly not acted on).

## Non-goals honored

`page.tsx`'s `generateMetadata()` hardcoded `description`/`openGraph` strings untouched. `A11Y-02`, `PERF-01`, `PR4` untouched by this change (verified: this change's diff contains zero overlap with the concurrent A11Y-02 session's `PublicHeader.tsx` change).

## Testability note (per design)

`computeOpenStatus()` remains without direct unit coverage — it's `async`, not exported, DB-shaped-input, `Intl`-timezone-dependent. Covered here by the full production build succeeding plus `tsc`'s type-level guarantee that all 4 `getTranslations`/ICU calls are shape-correct against the typed message schema (`IntlMessages = typeof en`). A live-locale manual dev-server check (design's task 7.6) was not performed in this session — recorded as an accepted gap, consistent with this project's current testing capability for Server Component data-fetching logic.
