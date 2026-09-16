# Exploration: a11y-header-scrollspy-state (TICKET A11Y-02)

## Current state (verified by reading the file directly)

`apps/web/src/app/(tenant)/[tenant]/_components/PublicHeader.tsx` — nav block confirmed at lines 103-120 (ticket cited 104-119, drift of 1 line, negligible). The `<nav>` (line 103) has no `aria-label`. The `.map()` (lines 104-119) renders 5 `<button>` elements whose only "active section" signal is Tailwind classes keyed on `activeId === id` (background/text color swap) — zero ARIA state. `activeId` is set by an `IntersectionObserver` (scroll-spy), confirming the ticket's diagnosis: a screen reader announces 5 identical unlabeled buttons with no indication of which section is current.

## i18n namespace (verified — pt.json:202-213, mirrored in es.json/en.json)

```json
"tenant": { "header": { "bookCta": "...", "nav": { "services", "about", "gallery", "reviews", "location" } } }
```

This file already establishes `tenant.header.*` as its namespace (predates the `(public)/` → `public.<feature>.*` convention documented in CLAUDE.md for newer files — this ticket follows the existing local precedent, not the newer doc convention, since retrofitting the whole file's namespace is out of scope). New key fits as a sibling under the existing `nav` object: `tenant.header.nav.ariaLabel`. Needs identical addition to pt.json, es.json, en.json (redline: key parity, verified by `messages.test.ts`).

## aria-current value — codebase precedent checked

`rg aria-current` found `dashboard/Sidebar.tsx:87,141` and `dashboard/BottomBar.tsx:39`, all using `aria-current={active ? 'page' : undefined}`. Those are real multi-page navigation (each link is a different route) — `'page'` is the semantically correct ARIA token there. `PublicHeader`'s nav is an in-page scroll-spy (same page, anchor scroll via `scrollIntoView`), a different case. The HEARTBEAT ticket explicitly prescribes `aria-current={activeId === id ? 'true' : undefined}`. `'true'` is a spec-legal enumerated value (WAI-ARIA `aria-current`: false|true|page|step|location|date|time) and is the safe generic choice for "this is the current one" without asserting a page/step/date semantic that doesn't apply. Recommendation: follow the ticket's prescribed `'true'`, not `'page'` (wrong semantic — not a page nav) and not `'location'` (valid alternative per some WCAG scroll-spy techniques, but the ticket is explicit and `'true'` is uncontroversial spec-legal — no reason to deviate).

## Testing scope

`apps/web/vitest.config.ts` uses `environment: 'node'`, `include: ['src/**/*.test.ts']` — no DOM/jsdom, no React Testing Library, no `.tsx` test files anywhere in the repo. This fix adds a static `aria-current`/`aria-label` attribute wired to an already-existing boolean comparison (`activeId === id`) — no new pure function to extract, unlike `settings-layout-tenant-fallback-fix` (which extracted `resolvePreviewUrl`). **Component rendering tests are out of scope** for this ticket: there is zero RTL/jsdom precedent in this repo, and introducing one would be a separate test-infra ticket (same class as TEST-01/02/03), not a drive-by inside an a11y fix. Verification for this change relies on `pnpm check-types`, scoped `eslint`, and manual/visual confirmation (screen reader or axe DevTools spot-check recommended but not automatable in this harness).

## Scope boundary

Exactly 4 files: `PublicHeader.tsx` (add `aria-current` to the button + `aria-label` to the `<nav>`) + `pt.json`/`es.json`/`en.json` (1 new key: `tenant.header.nav.ariaLabel`). No other files touched. Estimated diff: ~10-15 lines. Well under any PR budget — single PR, no chaining needed.

## Non-goals

- Not fixing PERF-01, A11Y-01, or I18N-05 (separate open tickets in the same HEARTBEAT region) — those are independently scoped and untouched by this change.
- Not adding component/DOM test infrastructure.
- Not retrofitting `tenant.header.*` to the newer `public.*` namespace convention (separate concern, would touch far more than this ticket's 5 nav labels).
