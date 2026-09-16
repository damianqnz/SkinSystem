# Design: a11y-header-scrollspy-state (TICKET A11Y-02)

## Technical approach

Two purely additive JSX attribute changes in `PublicHeader.tsx`, plus one new i18n key mirrored in 3 locale files. No new components, hooks, state, or dependencies.

### 1. `apps/web/src/app/(tenant)/[tenant]/_components/PublicHeader.tsx`

`<nav>` (currently line 103):
```tsx
<nav className="hidden md:flex items-center gap-1" aria-label={t('nav.ariaLabel')}>
```

Each `<button>` inside the `.map()` (currently lines 105-116) gains one prop, inserted right after `onClick`:
```tsx
<button
  key={id}
  onClick={() => scrollTo(id)}
  aria-current={activeId === id ? 'true' : undefined}
  className={[...]}
>
```

No other lines change. `activeId`, `SECTIONS`, `scrollTo`, and the className ternary are untouched — the visual active-state styling stays exactly as is; `aria-current` is additive, not a replacement.

### 2. Locale files — `apps/web/src/messages/{pt,es,en}.json`

Add `ariaLabel` as a sibling key inside the existing `tenant.header.nav` object (after `location`, matching the existing 5-key ordering — insertion order in JSON doesn't affect the parity test, but keeping it adjacent to its siblings aids readability):

- `pt.json`: `"ariaLabel": "Navegação da página"`
- `es.json`: `"ariaLabel": "Navegación de la página"`
- `en.json`: `"ariaLabel": "Page navigation"`

Wording choice: describes the nav's function (in-page section navigation), consistent with how `bookCta`/`nav.*` siblings are named — short, functional, no branding.

## Why no test file changes

`messages.test.ts` already asserts key-set parity across all three locale files generically (it doesn't hardcode which keys must exist — it diffs the three files' key sets against each other). Adding the same key to all three files keeps that suite green with zero test-file edits. Verified by reading the existing namespace shape (5 identical keys across all 3 files already) — the new key follows the same shape, so no special-casing is needed.

## Alternatives considered and rejected

- **`aria-current="page"`** — rejected; matches the codebase's `Sidebar.tsx`/`BottomBar.tsx` precedent but that precedent is for real multi-page navigation. Using `"page"` here would misrepresent an in-page anchor scroll as a page navigation, which is incorrect per the ARIA `aria-current` spec (`"page"`: "the current page within a set of pages").
- **`aria-current="location"`** — a defensible WCAG technique for scroll-spy nav, but rejected in favor of following the ticket's explicit, spec-legal `"true"` prescription. No functional or accessibility difference significant enough to justify deviating from what was already reviewed and written into the ticket.
- **Extracting a `NavButton` sub-component** — rejected as over-engineering for a 5-item, single-use `.map()`; the file is 138 lines, well under the 150-line soft limit, and CLAUDE.md's modularity rule only forces a split for multiple responsibilities, not line count.
