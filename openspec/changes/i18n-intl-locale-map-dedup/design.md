# Design: i18n-intl-locale-map-dedup (TICKET PR4)

## 1. `INTL_LOCALE_MAP` dedup (15 files)

For each file: remove the local `const INTL_LOCALE_MAP = {...}` (and any local `toIntlLocale()`/`fmtDate`-style wrapper that only re-exposes the lookup), add `import { toIntlTag } from '@/i18n/intl-tag';`, and replace each `INTL_LOCALE_MAP[x] ?? 'pt-PT'` call site with `toIntlTag(x as SupportedLocale)` (the cast matches existing precedent, e.g. `Sidebar.tsx`'s `(locale as 'pt'|'es'|'en')` — every one of these `x` values already originates from an already-validated `SupportedLocale` source: `useLocale()`, `useTenantContext().locale`, or a prop threaded from one of those).

Files: `PaymentHistoryTable.tsx`, `CouponsSection.tsx`, `dashboard/page.tsx`, `customers/[id]/_components/TreatmentTimeline.tsx`, `AppointmentsList.tsx`, `customers/[id]/_components/CompromisosTab.tsx`, `customers/[id]/_components/PhotoGallery.tsx`, `customers/_components/CustomerListItem.tsx`, `customers/[id]/_components/CustomerProfileClient.tsx`, `customers/[id]/_components/SobreTab.tsx`, `customers/[id]/ficha/_components/TreatmentTimeline.tsx`, `customers/[id]/ficha/_components/PhotoGallery.tsx`, `calendar/_components/CalendarHeader.tsx`, `calendar/_components/EventDetailSheet.tsx`, `calendar/_components/CalendarDayNav.tsx`.

## 2. Messages — new namespaces (3 locales each)

`dashboard.nav`: `panel`, `calendar`, `services`, `clients`, `payments`, `integrations`, `settings` (values copied verbatim from the current `NAV_LABELS` tuples).
`dashboard.sidebar`: `collapse`, `expand` (from `SIDEBAR_LABELS`), `navAriaLabel` = "Navegação principal" (pt) / "Navegación principal" (es) / "Main navigation" (en) — new, approved scope addition.
`tenant.userMenu`: `loginAriaLabel`, `menuAriaLabel`, `account`, `signOut` (values copied verbatim from `COPY`).

## 3. `nav-items.ts`

```ts
type NavKey = 'panel' | 'calendar' | 'services' | 'clients' | 'payments' | 'integrations' | 'settings';
const NAV_ITEMS: { key: NavKey; href: string; icon: LucideIcon }[] = [
  { key: 'panel',        href: '/dashboard',              icon: LayoutDashboard },
  { key: 'calendar',     href: '/dashboard/calendar',     icon: CalendarDays    },
  { key: 'services',     href: '/dashboard/catalog',      icon: Sparkles        },
  { key: 'clients',      href: '/dashboard/customers',    icon: Users           },
  { key: 'payments',     href: '/dashboard/billing',      icon: CreditCard      },
  { key: 'integrations', href: '/dashboard/integrations', icon: Network         },
  { key: 'settings',     href: '/dashboard/settings',     icon: Settings2       },
];

export function getNavItems(t: (key: NavKey) => string): NavItem[] {
  return NAV_ITEMS.map(({ key, href, icon }) => ({ href, icon, label: t(key) }));
}
export function getBottomNavItems(t: (key: NavKey) => string): NavItem[] {
  return getNavItems(t).slice(0, 5);
}
```
Removes `DEFAULT_LOCALE`/`isSupportedLocale` imports (no longer needed — the translator function already resolves locale via context).

## 4. `Sidebar.tsx` / `BottomBar.tsx`

- `Sidebar.tsx`: `const tNav = useTranslations('dashboard.nav'); const tSb = useTranslations('dashboard.sidebar');` replace `getNavItems(locale)` → `getNavItems(tNav)`, `SIDEBAR_LABELS[...]` → `{ collapse: tSb('collapse'), expand: tSb('expand') }`, both `aria-label="Navegação principal"` → `tSb('navAriaLabel')`. Remove now-fully-unused `locale` destructure from `useTenantContext()` (confirmed nothing else in the file needs it) — if `useTenantContext()` itself becomes unused, remove that import too.
- `BottomBar.tsx`: `const tNav = useTranslations('dashboard.nav'); const items = getBottomNavItems(tNav);`. Same `useTenantContext()`/`locale` cleanup.

## 5. `UserMenu.tsx` ((tenant) navbar widget)

- `const t = useTranslations('tenant.userMenu');` replaces `const t = COPY[locale];` — call sites (`t.loginAria` etc.) become `t('loginAriaLabel')` etc. (renamed to match spec's key names).
- Remove `locale: Locale` from `Props` and the `Locale` type alias if it becomes otherwise unused.
- `PublicHeader.tsx:126`: drop `locale={locale}` from `<UserMenu>` (its own `locale` stays — line 125 `<LanguageSwitcher current={locale} .../>` still needs it).

## Validation gate

`pnpm check-types`, `messages.test.ts` parity, `npm run build`, `pnpm test`, `eslint` on every touched file, diff-literal check for the 3 removed identifiers. Given file count (~19-20), run a line-count check before archive per the review workload guard (`ask-on-risk`).
