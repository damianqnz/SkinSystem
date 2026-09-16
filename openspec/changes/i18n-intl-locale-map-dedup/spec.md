# Spec: i18n-intl-locale-map-dedup (TICKET PR4)

## Requirement 1: A single source of truth resolves the `Intl`/`toLocaleString` region tag

### Scenario: Any of the 15 previously-duplicated components formats a date or currency value
- **Given** a component that previously read its own local `INTL_LOCALE_MAP`
- **When** it needs a BCP-47 tag for `toLocaleString`/`toLocaleDateString`
- **Then** it calls the shared `toIntlTag()` from `@/i18n/intl-tag` and produces the identical tag it produced before (`pt`→`pt-PT`, `es`→`es-ES`, `en`→`en-GB`, unsupported→`DEFAULT_LOCALE`'s tag)

## Requirement 2: Dashboard nav labels and sidebar copy come from messages, not indexed arrays or per-file maps

### Scenario: Any locale, sidebar rendered
- **Given** a staff member with resolved locale `pt`, `es`, or `en`
- **When** the dashboard `Sidebar`/`BottomBar` render
- **Then** all 7 nav item labels, the collapse/expand tooltips, and the nav `aria-label` come from `dashboard.nav.*`/`dashboard.sidebar.*`, with zero references to `NAV_LABELS`/`SIDEBAR_LABELS` remaining

## Requirement 3: Public navbar `UserMenu` copy comes from messages

### Scenario: Any locale, public tenant navbar
- **Given** a visitor with resolved locale `pt`, `es`, or `en`
- **When** the tenant `UserMenu` widget renders (both the unauthenticated login link and the authenticated dropdown)
- **Then** all 4 strings (`loginAriaLabel`, `menuAriaLabel`, `account`, `signOut`) come from `tenant.userMenu.*`, with zero references to the `COPY` object remaining

## Non-scenario: build-time / lint-time verification

Same constraint as every prior ticket this session (no RTL/jsdom harness). Compliance verified by:
1. `messages.test.ts` key parity for the 3 new namespaces.
2. Diff-literal check: zero remaining `INTL_LOCALE_MAP|NAV_LABELS|SIDEBAR_LABELS` identifiers, zero `const COPY` in `UserMenu.tsx`.
3. `tsc --noEmit` — catches any stale prop/type mismatch from the `getNavItems` signature change or dead-prop removals.
4. `npm run build` + `pnpm test` full suite green.
