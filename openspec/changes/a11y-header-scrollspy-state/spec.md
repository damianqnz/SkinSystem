# Spec: a11y-header-scrollspy-state (TICKET A11Y-02)

## Requirement 1: Scroll-spy nav buttons expose active state to assistive tech

### Scenario: Active section is announced, not just colored
- **Given** a visitor scrolls the tenant public landing page past a section boundary
- **When** the `IntersectionObserver` updates `activeId` to the newly visible section's id
- **Then** the matching `<button>` in `PublicHeader`'s nav renders `aria-current="true"`, and every other button renders no `aria-current` attribute (not `aria-current="false"` — `undefined` omits the attribute, matching the existing codebase pattern in `Sidebar.tsx`/`BottomBar.tsx`).

### Scenario: No section active yet (initial render, before scroll/observer fires)
- **Given** `activeId` is still its initial empty string
- **When** the nav renders
- **Then** no button has `aria-current` set, and no button is visually styled as active (existing behavior, unchanged).

## Requirement 2: Nav has an accessible name

### Scenario: Screen reader distinguishes the section nav from other header controls
- **Given** the tenant public header renders with the language switcher, user menu, and book CTA alongside the section nav
- **When** a screen reader user navigates by landmark/nav
- **Then** the `<nav>` wrapping the 5 section buttons has `aria-label` resolved from `tenant.header.nav.ariaLabel`, in the request's locale (pt/es/en).

## Requirement 3: Key parity holds across all 3 locales

### Scenario: New key ships in all locale files
- **Given** `tenant.header.nav.ariaLabel` is added
- **When** `messages.test.ts`'s parity suite runs
- **Then** `pt.json`, `es.json`, and `en.json` have identical key sets under `tenant.header.nav` (6 keys: `services`, `about`, `gallery`, `reviews`, `location`, `ariaLabel`).

## Non-requirements (explicitly out of scope)

- No component/DOM rendering test is required or expected — this repo's Vitest harness has no jsdom/RTL setup, and this change introduces no new pure logic to unit-test.
- No change to `activeId` computation, the `IntersectionObserver` config, or scroll behavior.
- No change to A11Y-01 (`<html lang>`), PERF-01, or I18N-05 — independently scoped, untouched.
