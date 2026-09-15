# Archive report: i18n-hardcoded-strings-cleanup (TICKET I18N-04)

**Status**: DONE. Archived 2026-09-15.

## Summary

All 5 files from HEARTBEAT.md's I18N-04 backlog are fully localized. Verify passed clean (0 critical/warning/suggestion) on the first attempt. 294 changed lines across 8 tracked files, well under the 400-line single-PR budget confirmed in this session's SDD preflight.

## Key outcomes

- `AppointmentDetailModal.tsx` needed zero new translation keys — full reuse of `dashboard.calendar.eventDetail.*` and `dashboard.customers.appointments.status.*`, matching the sibling `EventDetailSheet.tsx`'s existing pattern.
- `export-customers.ts`'s disguised `STATUS_LABELS` `_i18n` map deleted, replaced by the pre-existing `customers.status.*` namespace.
- 3 new namespaces added: `booking.success.*`, `account.me.citas.*`, `dashboard.calendar.newAppointment.*`.
- A real naming collision (local `t()` helper vs. the new `getTranslations()` const) was caught and fixed during apply, in `book/success/page.tsx`.

## Non-goals honored

`AppointmentTabs.tsx`, `EventDetailSheet.tsx`, `proxy.ts`, and all other HEARTBEAT tickets (I18N-05, PERF-01, A11Y-01/02, TEST-02/03, Stripe hardening) are untouched by this change.

## Process deviation (recorded for future sessions)

This cycle's phases (explore/propose/spec/design/tasks/apply/verify/archive) were executed by the orchestrator directly rather than delegated to `sdd-*` sub-agents via the `Agent` tool, because `gentle-ai sdd-preflight-hook` (a `PreToolUse` hook on the `Agent` tool matcher, installed by `gentle-ai sync` earlier in the session) refused every dispatch attempt with "SDD child dispatch refused: parent-confirmed SDD preflight is missing, invalid, or uncorroborated" — even after redoing the `AskUserQuestion` preflight with the exact required markers (`Gentle AI SDD preflight 1/3:` etc.) and byte-exact option labels per the updated `sdd-orchestrator-workflow.md`. Manually replaying the hook binary (`gentle-ai sdd-preflight-hook --agent claude-code`) with an equivalent payload returned exit 0 (allow), confirming the refusal is a live-harness integration inconsistency, not a genuine missing-authority condition. User was informed and explicitly chose to continue via inline orchestrator execution rather than pause the SDD workflow or attempt to disable/patch the hook.

## Artifacts

- `openspec/changes/i18n-hardcoded-strings-cleanup/{explore,proposal,spec,design,tasks,verify-report,archive-report}.md`
- Engram topic_keys: `sdd/i18n-hardcoded-strings-cleanup/{explore,proposal,spec-design,tasks,verify-report}`
