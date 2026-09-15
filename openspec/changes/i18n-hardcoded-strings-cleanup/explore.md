# Exploration: i18n-hardcoded-strings-cleanup (TICKET I18N-04)

## Verified state of the 5 files

All 5 files from HEARTBEAT.md's I18N-04 list were read directly and the description confirmed accurate (in two cases, the actual hardcoded surface is larger than the ticket text implies).

### 1. `(tenant)/[tenant]/book/success/page.tsx`
- `metadata.title` literal `'Reserva confirmada'` (not locale-aware — no `generateMetadata()`).
- Hardcoded ES: `¡Reserva confirmada!`, `Hemos recibido tu pago. Te esperamos.`, `Tratamiento`, `Fecha y hora`, confirmation paragraph, `Volver al inicio`.
- No `booking.success` namespace exists in `messages/*.json`.
- Precedent found: `book/page.tsx:39-48` already does `generateMetadata()` via `getTranslations('booking')` + `t('metadata.title', { name })`. `booking.metadata.title` exists as a flat key. New success-page keys should nest as `booking.success.*`, with `booking.success.metadata.title` mirroring that sibling shape.

### 2. `(account)/me/citas/page.tsx`
- Hardcoded ES empty-state block only (lines 34-42): `Sin reservas futuras`, `¿Repetimos la experiencia?`, `Hacer una reserva`.
- Confirmed convention: `me/layout.tsx:17` uses `getTranslations('account.me')`. New keys belong at `account.me.citas.*`.
- `AppointmentTabs.tsx` (203 lines, renders the actual populated list) has **zero** i18n calls today but is **not** in the I18N-04 file list — out of scope per "no ampliar sin ticket."

### 3. `(dashboard)/dashboard/customers/actions/export-customers.ts`
- `STATUS_LABELS` (lines 12-18, 5 statuses × 3 locales) is a disguised local `_i18n` map.
- **Reuse, don't duplicate**: `customers.status.*` already exists in `messages/*.json` with the exact same 5 keys (`nuevo/recurrente/riesgo/inactivo/perdido`) and equivalent EN/PT/ES values. Swap `STATUS_LABELS[c.status]?.[locale]` for a `getTranslations('customers.status')` lookup — zero new keys needed for statuses.
- `COLS` (CSV headers, lines 45-49) has no existing namespace. `dashboard.customers.csv.*` exists but only holds import-flow keys (`typeErr`, `colName`, `colPhone`, `importBtn`) — not the 6 export headers. New keys needed: `dashboard.customers.export.columns.{name,email,phone,status,lastVisit,totalVisits}`.

### 4. `(dashboard)/dashboard/calendar/_components/NewAppointmentForm.tsx`
- Confirmed zero i18n coverage — entire JSX is Portuguese literals, not just the toasts HEARTBEAT quoted. Full inventory: `Voltar`, `Marcação` (dialog title), 4 tab labels (`Serviço`/`Aula`/`Evento`/`Lembrete`), `Fechar` (aria-label), `Quando`, `Não se repete`, `Selecione um serviço` (select empty + toast), `Cliente` label, notes label + placeholder `—`, `Cancelar`, `A criar…`/`Criar →`, toast `Selecione um cliente`, success toast fallback `Marcação criada`.
- File is 361 lines — over the 150-line soft limit even before this change, but CLAUDE.md's rule is "split only when a file has multiple responsibilities, not to meet a line count." This file has one responsibility (the new-appointment dialog); recommend translating in place, not splitting, as splitting is out of I18N-04's stated scope.
- Estimated ~14 distinct strings → new namespace `dashboard.calendar.newAppointment.*`.

### 5. `shared/components/booking/AppointmentDetailModal.tsx`
- `SC` status-label map (lines 19-25) + ~20 more hardcoded Portuguese strings across the whole modal (title, tabs, section labels, buttons, toasts) — HEARTBEAT undercounts this file too.
- **Major reuse finding**: `dashboard.calendar.eventDetail.*` already exists in `messages/*.json` and is a near-exact semantic match — `title`, `closeAriaLabel`, `tabDetails`, `tabHistory`, `sectionWhen`, `sectionClient`, `sectionStaff`, `sectionNotes`, `sectionStatus`, `historySoon`, `cancelBtn`, `rescheduleBtn`, `payBtn`, `cancellingBtn`, `toastCancelled`, `toastUndo`, `toastRestored`, `toastSoon`, `toastSoonDesc`. It's consumed today by `EventDetailSheet.tsx` (confirmed via `rg`), a sibling component in the same calendar module.
- **Consequence**: `AppointmentDetailModal.tsx` is a newer, undocumented duplicate of `EventDetailSheet.tsx` that never got wired to the shared i18n keys. This file needs **zero new JSON keys** — only wiring `useTranslations('dashboard.calendar.eventDetail')` and replacing literals in place. One string (`Equipa`/"Staff") maps to `sectionStaff` — confirm exact 1:1 coverage during spec/design, but no gap is expected.

## Namespace convention confirmed

Post route-group-split, the real convention (not CLAUDE.md's stale `public.*`) is: existing top-level namespaces are `calendar`, `customers`, `booking`, `account`, `tenant`, `integrations`, `dashboard`, `marketing`. `dashboard.*` nests dashboard-only duplicates of some top-level namespaces (e.g., `dashboard.calendar` is distinct from top-level `calendar`). Route group and namespace prefix are not 1:1 — established practice keys off feature domain, not folder path.

## Scope and size estimate

| File | New JSON keys (×3 locales) | Reuse | Est. code lines changed |
|---|---|---|---|
| book/success/page.tsx | ~7 | none | ~15 |
| me/citas/page.tsx | ~3 | none | ~10 |
| export-customers.ts | ~6 (CSV headers only) | `customers.status.*` (0 new) | ~15 |
| NewAppointmentForm.tsx | ~14 | none | ~40 |
| AppointmentDetailModal.tsx | 0 | `dashboard.calendar.eventDetail.*` (full reuse) | ~30 |
| **Total** | **~30 keys × 3 = ~90 JSON lines** | | **~110 code lines** |

Estimated total ~200 changed lines — comfortably within the single-PR 400-line budget confirmed in this session's preflight. All 5 files fit in one change; no split needed.

## Testability

`apps/web/src/messages/messages.test.ts` (from the already-archived `test-infra-foundation` change) already enforces runtime key-set parity across `pt/es/en` generically. This change only needs to add correctly-paired keys to `messages/*.json` — no new test infrastructure required. The existing suite will automatically catch any parity gap this change introduces.

## Risks

- `AppointmentDetailModal.tsx` and `EventDetailSheet.tsx` appear to be duplicate components serving a similar purpose — worth flagging as a separate cleanup opportunity (not in scope here), but not blocking: this change only fixes i18n, not the duplication itself.
- `NewAppointmentForm.tsx`'s tab labels for disabled tabs (`Aula`, `Evento`, `Lembrete`) are placeholder features with no implementation — need to confirm with design whether they still get real translation keys (yes, since they're visible, disabled or not) or a `comingSoon`-style shared label.

## Ready for proposal: Yes
