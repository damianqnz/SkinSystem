# Proposal: i18n-hardcoded-strings-cleanup (TICKET I18N-04)

## Intent

Close the hardcoded-string debt in the 5 files HEARTBEAT.md's I18N-04 identified — all touched by PR 3/3 (`refactor/i18n-red-lines`) for a locale-fallback fix only, leaving their own copy untranslated. Every visible user-facing string in these files moves to `messages/{pt,es,en}.json` under the project's established namespace convention, per CLAUDE.md's "No Hardcoded Strings" red line.

## Scope

Exactly the 5 files from the HEARTBEAT ticket list — no more:

1. `apps/web/src/app/(tenant)/[tenant]/book/success/page.tsx` — new `booking.success.*` namespace, including a `generateMetadata()` for the page title (currently a hardcoded, non-locale-aware `Metadata` export), matching the precedent in `book/page.tsx`.
2. `apps/web/src/app/(account)/me/citas/page.tsx` — new `account.me.citas.*` namespace for the empty-state block.
3. `apps/web/src/app/(dashboard)/dashboard/customers/actions/export-customers.ts` — reuse the existing `customers.status.*` namespace for `STATUS_LABELS` (delete the local map); add `dashboard.customers.export.columns.*` for the 6 CSV headers (no existing namespace covers these).
4. `apps/web/src/app/(dashboard)/dashboard/calendar/_components/NewAppointmentForm.tsx` — new `dashboard.calendar.newAppointment.*` namespace; full translation of all ~14 hardcoded strings (dialog chrome, tabs, labels, toasts), not just the toasts HEARTBEAT quoted.
5. `apps/web/src/shared/components/booking/AppointmentDetailModal.tsx` — **reuse** the existing `dashboard.calendar.eventDetail.*` namespace (already consumed by the sibling `EventDetailSheet.tsx`); zero new JSON keys, only wiring the component to `useTranslations`.

## Approach

- Add new keys to `messages/{pt,es,en}.json` with identical key sets across all three locales (parity enforced automatically by the existing `messages.test.ts` Vitest suite).
- Server Components (`book/success/page.tsx`, `me/citas/page.tsx`) use `getTranslations()`; Client Components (`export-customers.ts` is a server action so also `getTranslations()`; `NewAppointmentForm.tsx`, `AppointmentDetailModal.tsx` are `'use client'`) use `useTranslations()`.
- `export-customers.ts` and `AppointmentDetailModal.tsx` are explicitly REUSE cases: delete their local disguised-`_i18n` maps (`STATUS_LABELS`, and any status-label duplication in `AppointmentDetailModal`'s `SC` map for the label text — the `tone`/color mapping is presentation, not translation, and stays local) rather than adding parallel keys.
- ICU MessageFormat for any interpolation (none currently identified as strictly necessary, but the `toastSoon: '{label} · coming soon'` pattern already exists in `eventDetail` and should be reused as-is for `AppointmentDetailModal`'s stub-action toast).

## Alternatives considered

- **Giving `AppointmentDetailModal.tsx` its own new namespace** instead of reusing `dashboard.calendar.eventDetail.*` — rejected: the two components are semantically identical (appointment detail view), reusing avoids permanent key duplication and keeps future copy edits single-sourced. If the two components later diverge in content, splitting the namespace is a trivial follow-up; duplicating now and reconciling later is not.
- **Splitting `NewAppointmentForm.tsx` into smaller files** while touching it — rejected per CLAUDE.md: "Split only when a file has multiple responsibilities, not to meet a line count." The file has one responsibility (the new-appointment dialog); this ticket is i18n only, not a refactor ticket.
- **Bundling this with I18N-05 (months/days consolidation)** — rejected: different failure classes (untranslated copy vs. duplicated month/day representations), kept as separate tickets/changes per HEARTBEAT's own structure.

## Explicit non-goals

- `AppointmentTabs.tsx` (renders the citas page's populated list) is NOT touched — it has zero i18n today but is not named in the I18N-04 file list. Flagged as a separate follow-up, not expanded into this change.
- No refactor/split of `NewAppointmentForm.tsx` beyond translation.
- No consolidation of `AppointmentDetailModal.tsx` and `EventDetailSheet.tsx` into one component — they stay separate files; only their translation source is unified.
- No changes to `I18N-05` (months/days duplication), `PERF-01`, `A11Y-01/02`, or any other HEARTBEAT ticket.

## Success criteria

- Zero hardcoded user-facing strings remain in the 5 named files (verified by direct read + `rg` for literal ES/PT strings after implementation).
- `messages/{pt,es,en}.json` key parity holds (enforced by the existing `messages.test.ts` suite — CI-equivalent local gate).
- `pnpm check-types` and `eslint --max-warnings 0` pass on all changed files.
- `STATUS_LABELS` in `export-customers.ts` is deleted, not duplicated.
- `AppointmentDetailModal.tsx` adds zero new JSON keys — 100% reuse of `dashboard.calendar.eventDetail.*`.

## Delivery

Single PR, estimated ~200 changed lines (well under the 400-line budget confirmed in this session's SDD preflight). No chaining needed.
