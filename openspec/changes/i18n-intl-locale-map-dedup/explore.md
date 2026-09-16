# Exploration: i18n-intl-locale-map-dedup (TICKET PR4)

## Correction to the original ticket (HEARTBEAT.md line 40)

The ticket listed 6 targets: `INTL_LOCALE_MAP` dedup + `nav-items.NAV_LABELS` + `Sidebar.SIDEBAR_LABELS` + `UserMenu.COPY` + `week-utils` + `MonthView` + `MobileWeekDaySelector`. The last 3 (`week-utils`, `MonthView`, `MobileWeekDaySelector`) were **already migrated by I18N-05** (confirmed: `rg 'DAY_LABELS'` returns zero results; both components already import `MONDAY_FIRST_DAY_KEYS` from `@/i18n/calendar-keys` and consume `useTranslations('calendar')`). Real remaining scope: `INTL_LOCALE_MAP` (15 copies, not 14) + `NAV_LABELS` + `SIDEBAR_LABELS` + `UserMenu.COPY`.

## `INTL_LOCALE_MAP` — 15 byte-identical copies, all `{ pt: 'pt-PT', es: 'es-ES', en: 'en-GB' }`, fallback always `'pt-PT'`

Files (verified via `rg`):
`PaymentHistoryTable.tsx`, `CouponsSection.tsx`, `dashboard/page.tsx`, `customers/[id]/_components/TreatmentTimeline.tsx`, `AppointmentsList.tsx`, `customers/[id]/_components/CompromisosTab.tsx`, `customers/[id]/_components/PhotoGallery.tsx`, `customers/_components/CustomerListItem.tsx`, `customers/[id]/_components/CustomerProfileClient.tsx`, `customers/[id]/_components/SobreTab.tsx`, `customers/[id]/ficha/_components/TreatmentTimeline.tsx`, `customers/[id]/ficha/_components/PhotoGallery.tsx`, `calendar/_components/CalendarHeader.tsx`, `calendar/_components/EventDetailSheet.tsx`, `calendar/_components/CalendarDayNav.tsx`.

**A canonical replacement already exists and is already live**: `apps/web/src/i18n/intl-tag.ts` exports `toIntlTag(locale: SupportedLocale): IntlTag`, already consumed by 5 files in the `(tenant)/[tenant]/book/*` funnel (`Step1Service.tsx`, `Step2Calendar.tsx`, `Step3Confirm.tsx`, `BookingSummary.tsx`, `book/success/page.tsx`). It is strictly better than the duplicated inline maps: typed against `SupportedLocale` (not bare `string`), and falls back through `DEFAULT_LOCALE` instead of a hardcoded `'pt-PT'` literal — so it tracks the project default automatically instead of silently drifting if `DEFAULT_LOCALE` ever changes. Pure reuse, zero new code needed for the mapping itself.

## `nav-items.ts` — `NAV_LABELS: Record<SupportedLocale, NavTuple>` (indexed 7-tuple)

Violates the "named keys, never indexed arrays" rule. `getNavItems(locale: string)`/`getBottomNavItems(locale: string)` are **plain TS functions, not components** — consumed by `Sidebar.tsx` and `BottomBar.tsx` (both `'use client'`, both already inside the `NextIntlClientProvider` tree mounted at `(dashboard)/layout.tsx`). They can't call `useTranslations()` themselves; the fix threads a translator function in from the calling component instead of a locale string.

## `Sidebar.tsx` — `SIDEBAR_LABELS: Record<'pt'|'es'|'en', {collapse, expand}>` + hardcoded `locale` usage

Only consumer of the label map is this file. `locale` is read from `useTenantContext()` solely to index `NAV_LABELS`/`SIDEBAR_LABELS` — once both switch to `useTranslations`, `locale` becomes fully unused in this file (same dead-prop-cascade pattern already seen in I18N-07). Also carries 2 hardcoded `aria-label="Navegação principal"` (collapsed rail nav + expanded nav) — approved by the user to fold into this same fix since it's the identical file/namespace.

## `BottomBar.tsx` — no local map, but consumes `getBottomNavItems(locale)`; same dead-`locale`-after-refactor situation as `Sidebar.tsx` once `nav-items.ts` changes signature.

## `UserMenu.tsx` — `COPY: Record<Locale, {loginAria, menuAria, account, signOut}>`

`'use client'`, receives `locale` as an explicit prop (public `(tenant)` segment — `NextIntlClientProvider` confirmed mounted in `ConsumerShell`, per PR3/3). Can switch directly to `useTranslations()`; the `locale` prop becomes unused in this file specifically, but it is passed down from a parent — needs checking whether that parent needs it for anything else before removing the prop from `Props`.

## Reuse audit

- No existing key for nav item labels, sidebar collapse/expand, or `UserMenu`'s copy in any locale file (confirmed via targeted `rg` before designing new namespaces).
- `dashboard.nav.*`, `dashboard.sidebar.*`, `tenant.userMenu.*` are new namespaces — no existing top-level `dashboard.sidebar`/`dashboard.nav`/`tenant.userMenu` collide (confirmed via `python3 -c "json.load(...).keys()"` on `pt.json`).

## Non-goals

- No change to `@/i18n/intl-tag.ts` itself — reused as-is.
- No change to the 5 already-migrated `(tenant)/[tenant]/book/*` consumers of `toIntlTag`.
- No change to `week-utils.ts`, `MonthView.tsx`, `MobileWeekDaySelector.tsx` — already correct (I18N-05).
- `UserMenu.tsx`'s parent's own `locale` prop is out of scope unless it becomes provably dead too (checked during apply).
