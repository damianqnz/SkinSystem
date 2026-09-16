# Proposal: i18n-intl-locale-map-dedup (TICKET PR4)

## Intent

Eliminate the 15 duplicated `INTL_LOCALE_MAP` copies and the 3 remaining inline label maps (`NAV_LABELS`, `SIDEBAR_LABELS`, `UserMenu.COPY`) flagged by PR3/3's review. `week-utils`/`MonthView`/`MobileWeekDaySelector` — also originally listed — are already done (I18N-05); dropped from this change's scope.

## Scope

1. **15 `INTL_LOCALE_MAP` copies**: replace each with `import { toIntlTag } from '@/i18n/intl-tag'`, removing the local const and updating call sites. Pure reuse — `toIntlTag` already exists, already live in 5 booking-funnel files, and is strictly more correct (tracks `DEFAULT_LOCALE`, typed against `SupportedLocale`).
2. **`nav-items.ts`**: `NAV_LABELS` indexed tuple → named `dashboard.nav.*` keys (7). `getNavItems`/`getBottomNavItems` take a translator function instead of a bare locale string (they're plain functions, not components).
3. **`Sidebar.tsx`**: `SIDEBAR_LABELS` → `dashboard.sidebar.{collapse,expand}`. Approved scope addition: 2 hardcoded `aria-label="Navegação principal"` → `dashboard.sidebar.navAriaLabel` (same file, same new namespace).
4. **`UserMenu.tsx`** (public `(tenant)` navbar widget): `COPY` → `tenant.userMenu.{loginAriaLabel,menuAriaLabel,account,signOut}`.
5. **Dead-prop cleanup**: `Sidebar.tsx`/`BottomBar.tsx` lose their now-unused `locale` read from `useTenantContext()`; `UserMenu.tsx`'s `locale` prop is removed, with `PublicHeader.tsx`'s pass-through dropped (its own `locale` stays — still needed for `LanguageSwitcher`).

## Non-goals

- `@/i18n/intl-tag.ts` itself, and its 5 existing booking-funnel consumers — untouched.
- `week-utils.ts`, `MonthView.tsx`, `MobileWeekDaySelector.tsx` — already correct.
- `shared/components/dashboard/UserMenu.tsx` (the *other*, dashboard-scoped UserMenu, server component, no locale prop) — different component, not in scope.

## Risk / size

Low risk — mechanical reuse/rename, one already-proven pattern (`toIntlTag`) and one already-proven pattern (`useTranslations` + named keys) applied consistently. 19 files touched (15 dedup + `nav-items.ts` + `Sidebar.tsx` + `BottomBar.tsx` + `UserMenu.tsx` + `PublicHeader.tsx`, some overlapping). Estimated ~150-200 changed lines. Single PR, under the 400-line budget, but closer to it than prior tickets given the file count — flag for a size check before archive.
