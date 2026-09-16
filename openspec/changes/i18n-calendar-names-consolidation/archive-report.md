# Archive report: i18n-calendar-names-consolidation (TICKET I18N-05, expanded)

**Status**: DONE. Archived 2026-09-16.

## Summary

Consolidated 9 representations of month/day names (HEARTBEAT's ticket named 6-7; design found an 8th, apply found a 9th) into a single named-key source (`calendar.months.*`/`calendar.days.*`) plus a shared pure helper (`@/i18n/calendar-keys.ts`). Scope was explicitly expanded by user decision to also make `getLandingData()`'s open/closed status label fully locale-aware, closing a real bug (the label was 100% hardcoded Portuguese regardless of visitor locale) rather than leaving it half-fixed. 15 tracked files + 2 new files, ~356 changed lines, verify passed clean.

## Key outcomes

- New canonical namespace lives at top-level `calendar.*` (not `booking.calendar.*`, which is funnel-scoped) — avoids the leaky-abstraction alternative.
- `@/i18n/calendar-keys.ts` promotes `Step2Calendar.tsx`'s pre-existing bridging pattern into a shared, unit-tested module, per the original ticket's own suggestion.
- The 9th representation (`EditorialDatePicker.tsx`) was found during the apply-phase verification sweep and deliberately excluded — not silently fixed, not silently ignored; recorded in HEARTBEAT as a follow-up (I18N-07 working title).
- One design-doc assumption (that `booking.calendar.days` held full names) was wrong; caught and corrected during apply via direct source verification, not carried through as a latent bug.

## Process notes

1. **SDD dispatch hook defect persists**: same `gentle-ai sdd-preflight-hook` issue documented in the prior two changes this session — Agent-tool delegation to `sdd-*` sub-agents refused regardless of correctly-formatted preflight. Entire cycle executed via inline orchestrator work.
2. **Concurrent-session ledger collision (new pattern, first occurrence)**: unlike the previous two changes' ledger resets (which were budget-accounting quirks — generated lockfiles, etc.), this reset was caused by a genuinely concurrent second Claude Code session (working `A11Y-02` in the same repo checkout) committing to `main` mid-attempt. The native ledger correctly detected this ("a base merged into the branch during the attempt is charged to the attempt") and refused to settle until a maintainer-authorized reset. No actual file conflict existed between the two changes — investigated and confirmed via `git diff` before proceeding. Recorded here so future sessions recognize this pattern and don't mistake it for a defect in their own work.

## Artifacts

- `openspec/changes/i18n-calendar-names-consolidation/{explore,proposal,spec,design,tasks,verify-report,archive-report}.md`
- `apps/web/src/i18n/calendar-keys.ts`, `calendar-keys.test.ts` (new, permanent)
- Engram topic_keys: `sdd/i18n-calendar-names-consolidation/{explore,proposal,spec-design,tasks,verify-archive}`
