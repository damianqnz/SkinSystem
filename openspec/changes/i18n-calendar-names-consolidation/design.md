# Design: i18n-calendar-names-consolidation (TICKET I18N-05, expanded)

## Correction found during design

An **8th representation** exists beyond HEARTBEAT's original 4 hardcoded-array files: `week-utils.ts` exports its own full-name, Monday-first `DAY_LABELS`, consumed by `DesktopWeekGrid.tsx:21,39` via positional index (`days[i]`). Same category of problem as `MonthView.tsx`/`MobileWeekDaySelector.tsx` (Monday-first, per-locale hardcoded), in the same `calendar/_components/` directory. Included in this change's scope — it's the same fix pattern, not new scope.

## 1. Shared namespace: `messages/{pt,es,en}.json`

Add to the existing top-level `calendar` object:

```json
"calendar": {
  "months": {
    "jan": "January", "feb": "February", ..., "dec": "December"
  },
  "days": {
    "sun": "Sunday", "mon": "Monday", ..., "sat": "Saturday"
  },
  "view": { ... },
  "slot": { ... },
  "block": { ... }
}
```

Full names only (matches `booking.calendar.months/days`'s existing values — reuse those exact translations, don't re-translate). Remove `booking.calendar.months` and `booking.calendar.days` entirely. Remove `dashboard.calendar.header.months`, `dashboard.calendar.dayNav.months`, `dashboard.calendar.dayNav.days`.

New namespace `tenant.openStatus`:

```json
"tenant": {
  "openStatus": {
    "open": "Open",
    "closedGeneric": "Closed",
    "closedOpensAt": "Closed · Opens at {time}",
    "closedOpensOnAt": "Closed · Opens {day} at {time}"
  }
}
```

## 2. `apps/web/src/i18n/calendar-keys.ts` (new, pure, unit-testable)

```ts
export const MONTH_KEYS = [
  'jan', 'feb', 'mar', 'apr', 'may', 'jun',
  'jul', 'aug', 'sep', 'oct', 'nov', 'dec',
] as const;
export type MonthKey = typeof MONTH_KEYS[number];

export const DAY_KEYS = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'] as const;
export type DayKey = typeof DAY_KEYS[number];

/** Rotates the Sunday-first DAY_KEYS to start on Monday, for grid-header consumers. */
export const MONDAY_FIRST_DAY_KEYS: readonly DayKey[] =
  [...DAY_KEYS.slice(1), DAY_KEYS[0]];
```

`MONDAY_FIRST_DAY_KEYS` is a `const`, not a function — the rotation is fixed (Sunday→Monday is the only need across all 3 Monday-first consumers), so a precomputed array is simpler and equally testable than a rotation function.

## 3. Consumer changes

| File | Before | After |
|---|---|---|
| `Step2Calendar.tsx` | local `MONTH_KEYS`/`DAY_KEYS` + `t('calendar.months.'+k)` against `booking` namespace | import `MONTH_KEYS`/`DAY_KEYS` from `@/i18n/calendar-keys`; `t` namespace changes from `booking` to `calendar` for the months/days calls only (rest of the component's `booking.*` usage is untouched) |
| `CalendarHeader.tsx` | `useTranslations('dashboard.calendar.header')`; `t.raw('months')[monthStart.getUTCMonth()]` | add `useTranslations('calendar')`; `tCal(MONTH_KEYS[monthStart.getUTCMonth()])` |
| `CalendarDayNav.tsx` | `t.raw('days')`/`t.raw('months')` from `dashboard.calendar.dayNav` | `useTranslations('calendar')`; `DAY_KEYS[date.getUTCDay()]` / `MONTH_KEYS[...]`; the `.slice(0,3)` truncation call sites keep slicing the translated string (unaffected by the key-source change) |
| `MonthView.tsx` | `DAY_LABELS: Record<locale, string[]>` (Monday-first, with periods) | `useTranslations('calendar')`; `MONDAY_FIRST_DAY_KEYS.map(k => tCal(k).slice(0,3))` (no trailing period — normalization) |
| `MobileWeekDaySelector.tsx` | `SHORT_LABELS: Record<locale, string[]>` | same pattern as `MonthView.tsx` |
| `week-utils.ts` | exports `DAY_LABELS: Record<locale, string[]>` (full names) | **remove the export entirely** — `DesktopWeekGrid.tsx` takes over via `useTranslations('calendar')` + `MONDAY_FIRST_DAY_KEYS.map(tCal)` directly, since `week-utils.ts` is a plain helper module (not a component) and shouldn't own translation calls |
| `DesktopWeekGrid.tsx` | `const days = DAY_LABELS[locale] ?? DAY_LABELS.es!;` then `days[i]` | `const tCal = useTranslations('calendar'); const days = MONDAY_FIRST_DAY_KEYS.map(k => tCal(k));` then `days[i]` (unchanged indexing) |
| `StickyInfoCard.tsx` | local `DAY_NAMES_PT` (full names) + hardcoded `'Fechado'` fallback | `useTranslations('calendar')` for day names; the `'Fechado'` fallback moves to a new `tenant.openStatus.closedGeneric` reuse (same string as `computeOpenStatus`'s generic-closed label — reuse, not a new key) |

## 4. `getLandingData.ts` / `computeOpenStatus()` locale-awareness

```ts
import { getTranslations } from 'next-intl/server';
import { DAY_KEYS } from '@/i18n/calendar-keys';
import type { SupportedLocale } from '@/i18n/config';

async function computeOpenStatus(
  rules: AvailabilityDay[],
  timezone: string,
  locale: SupportedLocale,
): Promise<OpenStatus> {
  const t = await getTranslations({ locale, namespace: 'tenant.openStatus' });
  // ... unchanged weekday/time computation ...
  if (!todayRule) {
    for (let delta = 1; delta <= 7; delta++) {
      const nextRule = rules.find(r => r.dayOfWeek === (todayDow + delta) % 7 && r.isActive);
      if (nextRule) {
        const dayLabel = (await getTranslations({ locale, namespace: 'calendar' }))(DAY_KEYS[(todayDow + delta) % 7]);
        return { isOpen: false, label: t('closedOpensOnAt', { day: dayLabel, time: fmtTime(nextRule.openTime) }), opensAt: nextRule.openTime };
      }
    }
    return { isOpen: false, label: t('closedGeneric'), opensAt: null };
  }
  // open / closedOpensAt branches mirror the same t(...) substitution
}
```

`computeOpenStatus` becomes `async` (was sync) since it now awaits `getTranslations` — its one call site inside `getLandingData()` already runs inside an async function, so this only requires adding `await`.

`getLandingData(slug: string, locale: SupportedLocale)` — new second parameter, passed through from all 3 call sites using their already-computed `locale` variable (from `localeFromHeader(headers().get('x-locale'))`, no new header reads).

## 5. Testability

- `calendar-keys.ts`: new `calendar-keys.test.ts`, Vitest, node env — asserts `MONTH_KEYS`/`DAY_KEYS` length/order and `MONDAY_FIRST_DAY_KEYS`'s rotation correctness (first element is `'mon'`, last is `'sun'`).
- `computeOpenStatus()`: not unit-tested in this change. It's `async`, DB-shaped-input, timezone-`Intl`-dependent, and not exported — extracting it into a standalone testable unit (mirroring the `resolvePreviewUrl` precedent) would require a larger refactor of `getLandingData.ts`'s module boundary, out of scope here. Covered by manual/build-time verification (`pnpm check-types`, dev-server visual check across all 3 locales) — consistent with this project's current testing capability for Server Component data-fetching logic. Flagged as a candidate for a future `TEST-04`-style follow-up if `getLandingData.ts` grows further.

## Files touched summary

`messages/{pt,es,en}.json`, `apps/web/src/i18n/calendar-keys.ts` (new), `calendar-keys.test.ts` (new), `Step2Calendar.tsx`, `CalendarHeader.tsx`, `CalendarDayNav.tsx`, `MonthView.tsx`, `MobileWeekDaySelector.tsx`, `week-utils.ts`, `DesktopWeekGrid.tsx`, `StickyInfoCard.tsx`, `getLandingData.ts`, `(tenant)/[tenant]/page.tsx`, `(tenant)/[tenant]/book/page.tsx`. 14 files total.
