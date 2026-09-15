# Tasks: i18n-hardcoded-strings-cleanup (TICKET I18N-04)

## Phase 1 — Messages: add new namespaces (3 locales each)
- [ ] 1.1 Add `booking.success.*` (7 keys) to `pt.json`, `es.json`, `en.json`
- [ ] 1.2 Add `account.me.citas.*` (3 keys) to all 3 locale files
- [ ] 1.3 Add `dashboard.customers.export.columns.*` (6 keys) to all 3 locale files
- [ ] 1.4 Add `dashboard.calendar.newAppointment.*` (~14 keys, deduplicate `toastSelectService` if identical wording makes a separate key genuinely unnecessary — otherwise keep both) to all 3 locale files

## Phase 2 — `book/success/page.tsx`
- [ ] 2.1 Replace static `metadata` export with `generateMetadata()` using `headers()` + `getTranslations({ locale, namespace: 'booking.success' })`, mirroring `book/page.tsx:39-48`
- [ ] 2.2 Add `const t = await getTranslations({ locale, namespace: 'booking.success' })` in the page body
- [ ] 2.3 Replace the 6 hardcoded strings (heading, subtitle, treatmentLabel, dateTimeLabel, confirmationNote, backHome) with `t(...)` calls

## Phase 3 — `me/citas/page.tsx`
- [ ] 3.1 Add `const t = await getTranslations('account.me.citas')`
- [ ] 3.2 Replace the 3 empty-state strings with `t(...)` calls

## Phase 4 — `export-customers.ts`
- [ ] 4.1 Delete the `STATUS_LABELS` constant
- [ ] 4.2 Add `const tStatus = await getTranslations('customers.status')`; replace the status lookup with `tStatus.has(c.status) ? tStatus(c.status) : c.status`
- [ ] 4.3 Add `const tCols = await getTranslations('dashboard.customers.export.columns')`; replace the `COLS` ternary with an array built from `tCols(...)` calls

## Phase 5 — `NewAppointmentForm.tsx`
- [ ] 5.1 Add `const t = useTranslations('dashboard.calendar.newAppointment')` at the top of the component
- [ ] 5.2 Replace all ~14 hardcoded strings (header/back, dialog title, close aria-label, 4 tab labels, "Quando", "Não se repete", service-select placeholder, customer label, notes label, cancel/create buttons, 3 toast messages) with `t(...)` calls

## Phase 6 — `AppointmentDetailModal.tsx`
- [ ] 6.1 Add `const t = useTranslations('dashboard.calendar.eventDetail')` and `const tAppt = useTranslations('dashboard.customers.appointments')`, matching `EventDetailSheet.tsx:61-62`
- [ ] 6.2 Replace all ~19 hardcoded strings per the design doc's mapping table (title, tabs, section labels, buttons, toasts) with `t(...)` calls
- [ ] 6.3 Replace `SC[status]` status-label lookup with `tAppt('status.' + status)`, matching `EventDetailSheet.tsx:120`
- [ ] 6.4 Remove the `es`/`pt`/`en` text fields from the local `SC` map, keeping only the `tone` mapping (or replace with a `STATUS_TONE` constant matching `EventDetailSheet.tsx`'s own naming)

## Phase 7 — Verification
- [ ] 7.1 `pnpm --filter web test` — confirm the existing `messages.test.ts` parity suite passes with the new keys (no test file changes needed)
- [ ] 7.2 `pnpm check-types` — exit 0
- [ ] 7.3 `eslint --max-warnings 0` scoped to the 5 changed `.tsx`/`.ts` files
- [ ] 7.4 `rg` for the specific literal strings removed (e.g. `"Marcação criada"`, `"Detalhe da marcação"`, `"Sin reservas futuras"`) across the 5 files — confirm zero remaining hardcoded occurrences
- [ ] 7.5 `git diff --stat` — confirm only `messages/{pt,es,en}.json` + the 5 named files changed, nothing else (in particular, `AppointmentTabs.tsx` and `EventDetailSheet.tsx` must show zero diff)

## Review Workload Forecast
- Estimated changed lines: ~200 (per design/proposal estimate: ~90 JSON + ~110 code)
- 400-line budget risk: Low
- Chained PRs recommended: No
- Delivery strategy: single-pr (session preflight)
- Decision needed before apply: No
