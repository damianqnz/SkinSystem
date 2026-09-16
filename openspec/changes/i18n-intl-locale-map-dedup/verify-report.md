# Verify report: i18n-intl-locale-map-dedup (TICKET PR4)

**Verdict: PASS** (0 critical, 0 warnings introduced — 5 pre-existing warnings disclosed, unrelated)

## Requirement-by-requirement check

### Requirement 1: A single source of truth resolves the Intl/toLocaleString region tag
- All 15 files diffed literally: local `INTL_LOCALE_MAP` const (and, in `PaymentHistoryTable.tsx`, its `toIntlLocale()` wrapper) removed; each call site now calls `toIntlTag(x as SupportedLocale)`. `rg 'INTL_LOCALE_MAP'` returns zero matches project-wide.
- `toIntlTag` is the same function already live in the 5 booking-funnel files — confirmed unchanged, untouched by this diff (`git status` shows `intl-tag.ts` not modified).
- Fallback behavior is now `DEFAULT_LOCALE`-driven (via `toIntlTag`'s internal `INTL_TAGS[DEFAULT_LOCALE]`) instead of the literal `'pt-PT'` string every duplicated copy hardcoded — confirmed by reading `intl-tag.ts` (untouched, pre-existing).

### Requirement 2: Dashboard nav labels and sidebar copy come from messages
- `nav-items.ts`: `NAV_LABELS` indexed tuple replaced with named `NavKey`-keyed `NAV_ITEMS`; `getNavItems`/`getBottomNavItems` now take a translator function. `Sidebar.tsx`/`BottomBar.tsx` pass `useTranslations('dashboard.nav')` directly — confirmed via diff.
- `Sidebar.tsx`: `SIDEBAR_LABELS` removed, `{ collapse: tSb('collapse'), expand: tSb('expand') }` in its place. Both `aria-label="Navegação principal"` instances now `aria-label={tSb('navAriaLabel')}` — confirmed via `rg`, zero literal matches remain.

### Requirement 3: Public navbar UserMenu copy comes from messages
- `COPY` object removed (`grep '^const COPY'` returns nothing). `useTranslations('tenant.userMenu')` in its place; all 4 call sites (`loginAriaLabel`, `menuAriaLabel`, `account`, `signOut`) confirmed via diff.
- `locale` removed from `Props`; `PublicHeader.tsx`'s pass-through dropped, its own `locale` variable confirmed still needed by `LanguageSwitcher` at the adjacent line (untouched).

## Build-time / lint-time verification (per spec's non-scenario)
- `messages.test.ts`: key parity clean, 3 new namespaces present identically in all 3 locale files.
- `pnpm check-types`: exit 0 — no stale prop/type mismatch from the `getNavItems` signature change or any of the dead-prop removals.
- `npm run build`: exit 0, 26/26 routes, unchanged route table.
- `pnpm test`: 38/38 passed.
- `eslint` on all 20 touched code files: 5 warnings, **all confirmed pre-existing via `git diff`** — each sits on a line this change did not touch (a destructured-but-unused `countryIso` prop, two destructured-but-unused `locale` props in the two `TreatmentTimeline.tsx` copies, and two `intlLocale` variables in `CalendarHeader.tsx`/`CalendarDayNav.tsx` that were already unused before this change under their old `INTL_LOCALE_MAP[...]` expression — only the RHS changed, the unused-variable status did not). Not fixed, out of scope, same triage pattern as every prior ticket this session.

## Scope discipline
- `@/i18n/intl-tag.ts` and its 5 pre-existing booking-funnel consumers: confirmed untouched (`git status`).
- `week-utils.ts`, `MonthView.tsx`, `MobileWeekDaySelector.tsx`: confirmed untouched — already correct from I18N-05.
- `shared/components/dashboard/UserMenu.tsx` (the other, dashboard-scoped UserMenu — different component): confirmed untouched.

## Files changed / size
23 files (20 code + 3 message JSON), 136 insertions / 120 deletions = **256 changed lines**. Well under the 400-line single-PR budget — no chaining needed, matching the `ask-on-risk` delivery strategy's "no risk detected" path.
