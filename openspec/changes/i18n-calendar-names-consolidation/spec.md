# Spec: i18n-calendar-names-consolidation (TICKET I18N-05, expanded)

## Requirement 1: Shared calendar namespace and helper exist

### Scenario: Canonical months/days keys exist with parity
- **Given** `messages/{pt,es,en}.json` are loaded
- **When** the key set under `calendar.months.*` (12 keys: jan-dec) and `calendar.days.*` (7 keys: sun-sat) is inspected
- **Then** all three locale files have an identical key set, verified by the existing `messages.test.ts` parity suite with zero changes to that test file.

### Scenario: `calendar-keys.ts` provides positional and rotation helpers
- **Given** the new module `apps/web/src/i18n/calendar-keys.ts`
- **When** its exports are used
- **Then** it provides `MONTH_KEYS`/`DAY_KEYS` (Sunday-first, matching the JSON's order) and a rotation function that reorders `DAY_KEYS` to start on Monday, both pure and directly unit-testable with Vitest.

## Requirement 2: No indexed arrays remain for months/days

### Scenario: `booking.calendar.months/days` removed
- **Given** the change is applied
- **When** `messages/*.json` is inspected
- **Then** `booking.calendar.months` and `booking.calendar.days` no longer exist; `Step2Calendar.tsx` reads from the shared `calendar.months/days` namespace instead, and its existing grid-lookup behavior (position → translated label) is unchanged.

### Scenario: `dashboard.calendar` indexed arrays removed
- **Given** the change is applied
- **When** `messages/*.json` is inspected
- **Then** `dashboard.calendar.header.months`, `dashboard.calendar.dayNav.months`, and `dashboard.calendar.dayNav.days` no longer exist as arrays; `CalendarHeader.tsx` and `CalendarDayNav.tsx` render identical output (same month/day label per given date) using the shared namespace and `calendar-keys.ts`, including `CalendarDayNav.tsx`'s existing abbreviated week-range label (currently `.slice(0,3)` on a full month name).

### Scenario: Dashboard-local hardcoded arrays removed
- **Given** the change is applied
- **When** `MonthView.tsx` and `MobileWeekDaySelector.tsx` are inspected
- **Then** neither file contains a local per-locale day-name array; both render the same Monday-first weekday header labels via the shared namespace + rotation helper, with `MonthView`'s output normalized to drop trailing periods (`'Lun'` not `'Lun.'`).

## Requirement 3: Public tenant-landing day names localized

### Scenario: `StickyInfoCard.tsx` hours dropdown uses shared translations
- **Given** a visitor opens the weekly-hours dropdown on a tenant's public landing page
- **When** the 7 day rows render
- **Then** each day label resolves from the shared `calendar.days` namespace in the visitor's locale (not a hardcoded Portuguese array), and the "no hours today" fallback text also resolves from a translated key (not the current hardcoded `'Fechado'`).

## Requirement 4: Open/closed status is locale-aware

### Scenario: Status label renders in the visitor's locale
- **Given** a visitor with `x-locale` set to `pt`, `es`, or `en` views the tenant landing page or booking catalog page
- **When** the open/closed status renders
- **Then** the label (`Open`/`Closed`/`Closed · Opens at {time}`/`Closed · Opens {day} at {time}`) resolves fully in that locale — including the day name when applicable — via `getTranslations` against a `tenant.openStatus.*` namespace, not the current hardcoded-Portuguese sentence templates.

### Scenario: `getLandingData()` signature carries locale
- **Given** `getLandingData(slug: string, locale: SupportedLocale)`
- **When** any of its 3 call sites (`(tenant)/[tenant]/page.tsx`'s `generateMetadata()` and default export, `(tenant)/[tenant]/book/page.tsx`'s default export) invoke it
- **Then** each passes the locale it already computes via `localeFromHeader(headers().get('x-locale'))` at that call site — no new header-reading logic is introduced.

## Non-Goals (explicit, not testable requirements)

- `(tenant)/[tenant]/page.tsx`'s `generateMetadata()` `description`/`openGraph` hardcoded Portuguese strings are NOT touched — separate, pre-existing debt discovered during exploration, out of scope for this change.
- `A11Y-02` (PublicHeader scroll-spy `aria-current`), `PERF-01` (i18n bundle narrowing), and `PR4` (`INTL_LOCALE_MAP` deduplication) are not addressed here.

## Testability

Requirements 1-3 are covered by the existing `messages.test.ts` parity suite (namespace/key-level) plus new unit tests for `calendar-keys.ts` (Vitest, no jsdom needed — pure functions). Requirement 4's `getLandingData()`/`computeOpenStatus()` locale-awareness is a Server-only async function with DB/`Intl` dependencies; per this project's established testing capability (Node-env Vitest, no jsdom/RTL), design should specify whether `computeOpenStatus()` can be tested in isolation (extracting the pure label-selection logic from its DB/timezone inputs) similar to the `resolvePreviewUrl` precedent, or whether it's covered by manual/build-time verification only.
