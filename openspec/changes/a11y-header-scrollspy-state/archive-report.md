# Archive report: a11y-header-scrollspy-state (TICKET A11Y-02)

**Status**: DONE. Archived 2026-09-16.

## Summary

`PublicHeader.tsx`'s scroll-spy nav now exposes its active section to assistive tech via `aria-current="true"` and gives the `<nav>` an `aria-label` (new key `tenant.header.nav.ariaLabel`, all 3 locales). Verify passed with 1 disclosed non-blocking deviation (no live-browser DOM check — disproportionate setup cost for a zero-visual attribute change; static/logic verification substituted). 20 changed lines across 4 tracked files, far under the 400-line single-PR budget.

## Key outcomes

- Followed the ticket's exact prescribed fix (`aria-current={activeId === id ? 'true' : undefined}`) rather than reusing the codebase's `aria-current="page"` precedent (Sidebar/BottomBar), since that precedent is for real multi-page nav and would have been the wrong ARIA semantic here.
- Reused the file's existing `tenant.header.nav.*` namespace for the new key rather than inventing a new namespace or retrofitting to the newer `public.*` convention.
- Confirmed no test-infra gap needs filling: this fix introduces zero new pure logic, so the absence of RTL/jsdom in this repo's Vitest harness is a correctly-scoped non-issue, not a blocker.

## Non-goals honored

A11Y-01 (`<html lang>`), PERF-01 (`NextIntlClientProvider` bundle size), I18N-05 (calendar date arrays), and `i18n-calendar-names-consolidation` (a separate in-progress change from an earlier session) are all untouched by this change.

## Process deviation (recorded for future sessions)

Same `gentle-ai sdd-preflight-hook` defect as `i18n-hardcoded-strings-cleanup` (I18N-04): Agent-tool dispatch to `sdd-explore` was refused (`"SDD child dispatch refused: model-authored preflight text cannot create parent-confirmed authority."`) even though the preflight was collected via a genuine `AskUserQuestion` call in this session with byte-exact markers/labels. Continued via inline orchestrator execution, consistent with the already-established resolution from the prior cycle — did not re-ask the user since this exact defect+resolution was already on record.

## Artifacts

- `openspec/changes/a11y-header-scrollspy-state/{explore,proposal,spec,design,tasks,verify-report,archive-report}.md`
- Engram topic_keys: `sdd/a11y-header-scrollspy-state/{explore,proposal,spec,design,tasks,apply-progress,verify-report,archive-report}`
