# Proposal: a11y-header-scrollspy-state (TICKET A11Y-02)

## Intent

`PublicHeader.tsx`'s scroll-spy nav (5 in-page anchor buttons) signals the active section by color alone. This fails WCAG 1.4.1 (Use of Color) and 4.1.2 (Name, Role, Value): a screen reader announces 5 identical buttons with no indication of which section is current, and the `<nav>` itself has no accessible name distinguishing it from the header's other interactive clusters (language switcher, user menu, book CTA).

## Scope

Exactly 4 files, ~10-15 lines:

1. `apps/web/src/app/(tenant)/[tenant]/_components/PublicHeader.tsx` — add `aria-current={activeId === id ? 'true' : undefined}` to each nav `<button>` (line ~105-119), add `aria-label={t('nav.ariaLabel')}` to the `<nav>` element (line 103).
2. `apps/web/src/messages/pt.json`, `es.json`, `en.json` — add `tenant.header.nav.ariaLabel` key (sibling of the existing `nav.services`/`nav.about`/etc.).

## Key decisions

- **`aria-current` value: `'true'`**, matching the ticket's explicit prescription and the ARIA spec's generic "this is the current one" token. NOT `'page'` (codebase precedent in `Sidebar.tsx`/`BottomBar.tsx`, but that's real multi-page nav — wrong semantic here) and NOT `'location'` (a valid WCAG alternative for scroll-spy nav, but no reason to deviate from the ticket's explicit, spec-legal choice).
- **Namespace: `tenant.header.nav.ariaLabel`**, following this file's own established `tenant.header.*` precedent rather than the newer `public.<feature>.*` convention (retrofitting the whole file's namespace is out of scope for an a11y fix).
- **No new test infrastructure.** No RTL/jsdom exists in this repo's Vitest harness (`environment: 'node'`, `include: ['src/**/*.test.ts']` only). This fix wires an already-existing boolean (`activeId === id`) into two static attributes — no new pure logic to extract or unit-test. Verification: `pnpm check-types`, scoped `eslint --max-warnings 0`, `messages.test.ts` (key-parity), manual/visual check.

## Non-goals

- PERF-01, A11Y-01, I18N-05 — separate open HEARTBEAT tickets, untouched.
- No component-test-infra addition (separate ticket class, same as TEST-01/02/03).
- No `tenant.header.*` → `public.*` namespace migration.

## Risk

Low. Purely additive JSX attributes + one new i18n key in 3 files with identical value shape to existing siblings. No behavior change to `activeId` logic, no new state, no new dependencies. Single PR, no chaining.
