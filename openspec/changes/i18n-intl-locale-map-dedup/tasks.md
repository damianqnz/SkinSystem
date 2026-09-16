# Tasks: i18n-intl-locale-map-dedup (TICKET PR4)

## Phase 1 — Messages (3 locales)
- [x] 1.1 Add `dashboard.nav.{panel,calendar,services,clients,payments,integrations,settings}`
- [x] 1.2 Add `dashboard.sidebar.{collapse,expand,navAriaLabel}`
- [x] 1.3 Add `tenant.userMenu.{loginAriaLabel,menuAriaLabel,account,signOut}`
- [x] 1.4 `messages.test.ts` — key parity clean

## Phase 2 — INTL_LOCALE_MAP dedup (15 files)
- [x] 2.1-2.15 All 15 files: local map removed, `toIntlTag` imported, call sites updated (verified via `rg 'INTL_LOCALE_MAP'` — zero remaining)

## Phase 3 — nav-items.ts
- [x] 3.1 `NAV_LABELS` tuple replaced with `NAV_ITEMS` (key+href+icon), translator-based `getNavItems`/`getBottomNavItems`

## Phase 4 — Sidebar.tsx / BottomBar.tsx
- [x] 4.1 `Sidebar.tsx`: wired `useTranslations('dashboard.nav')`/`useTranslations('dashboard.sidebar')`, `SIDEBAR_LABELS` removed, both `aria-label`s fixed, dead `locale`/`useTenantContext()` import removed
- [x] 4.2 `BottomBar.tsx`: same `useTranslations('dashboard.nav')` wiring, dead `locale`/`useTenantContext()` removed

## Phase 5 — UserMenu.tsx (tenant navbar)
- [x] 5.1 `COPY` replaced with `useTranslations('tenant.userMenu')`, `locale` removed from `Props`
- [x] 5.2 `PublicHeader.tsx`: dropped `locale={locale}` pass-through to `<UserMenu>` (`PublicHeader`'s own `locale` kept — still used by `LanguageSwitcher`)

## Phase 6 — Validation
- [x] 6.1 `pnpm check-types` — exit 0
- [x] 6.2 `npm run build` — exit 0, route table unchanged (26/26)
- [x] 6.3 `pnpm test` — 38/38 passed
- [x] 6.4 `eslint` on every touched file — 5 pre-existing warnings found, all confirmed via `git diff` to be outside the changed lines (unrelated dead props: `countryIso`, two `locale` destructures, two `intlLocale` variables that were already unused before this change with a different RHS expression)
- [x] 6.5 Diff-literal check: zero `INTL_LOCALE_MAP|NAV_LABELS|SIDEBAR_LABELS` identifiers, zero `const COPY` in `UserMenu.tsx`
- [x] 6.6 Line-count check: 23 files, 136 insertions / 120 deletions = 256 changed lines. Well under the 400-line budget — single PR, no chaining needed.

**Actual**: 256 changed lines across 23 files (20 code + 3 message JSON), Low risk, single PR.
