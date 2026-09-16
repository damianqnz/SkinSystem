# Tasks: a11y-header-scrollspy-state (TICKET A11Y-02)

## Phase 1 — Messages: add new key (3 locales)
- [ ] 1.1 Add `tenant.header.nav.ariaLabel` = "Navegação da página" to `pt.json`
- [ ] 1.2 Add `tenant.header.nav.ariaLabel` = "Navegación de la página" to `es.json`
- [ ] 1.3 Add `tenant.header.nav.ariaLabel` = "Page navigation" to `en.json`

## Phase 2 — `PublicHeader.tsx`
- [ ] 2.1 Add `aria-label={t('nav.ariaLabel')}` to the `<nav>` element (line 103)
- [ ] 2.2 Add `aria-current={activeId === id ? 'true' : undefined}` to the `<button>` inside the `.map()` (right after `onClick`, before `className`)

## Phase 3 — Verification
- [ ] 3.1 `pnpm --filter web test` — confirm `messages.test.ts` parity suite passes with the new key (no test file changes needed)
- [ ] 3.2 `pnpm check-types` — exit 0
- [ ] 3.3 `eslint --max-warnings 0` scoped to `PublicHeader.tsx`
- [ ] 3.4 `git diff --stat` — confirm only `PublicHeader.tsx` + `messages/{pt,es,en}.json` changed
- [ ] 3.5 Manual/visual check: scroll the tenant landing page and confirm the active nav button gets `aria-current="true"` in DevTools (Elements panel), and no other button has the attribute

## Review Workload Forecast
- Estimated changed lines: ~12-15 (2 lines in PublicHeader.tsx + 1 line × 3 locale files, plus surrounding JSON comma/brace diff noise)
- 400-line budget risk: Low
- Chained PRs recommended: No
- Delivery strategy: ask-on-risk (session preflight) — no risk triggered, proceeding as single PR
- Decision needed before apply: No
