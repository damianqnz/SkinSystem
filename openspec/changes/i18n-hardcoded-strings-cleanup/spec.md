# Spec: i18n-hardcoded-strings-cleanup (TICKET I18N-04)

## Requirement 1: `book/success/page.tsx` fully localized

### Scenario: Page renders in each supported locale
- **Given** a tenant's booking success page is requested with `x-locale` set to `pt`, `es`, or `en`
- **When** the page renders
- **Then** the page title (via `generateMetadata()`), heading, subtitle, `Tratamiento`/`Fecha y hora` labels, confirmation paragraph, and "back home" link text all resolve from `booking.success.*` keys in the matching locale — no literal Spanish string renders regardless of `x-locale`.

### Scenario: Key parity holds
- **Given** the `booking.success.*` namespace is added
- **When** `messages.test.ts`'s parity suite runs
- **Then** `pt.json`, `es.json`, and `en.json` have identical key sets under `booking.success`.

## Requirement 2: `me/citas/page.tsx` empty state localized

### Scenario: Empty state renders in each supported locale
- **Given** a consumer with no customer record views `/me/citas`
- **When** the empty-state block renders
- **Then** its heading, subtitle, and CTA button text resolve from `account.me.citas.*` keys in the request's locale.

## Requirement 3: `export-customers.ts` reuses existing status labels, adds CSV column keys

### Scenario: CSV export uses shared status namespace
- **Given** a customer export is requested in any supported locale
- **When** the CSV is generated
- **Then** status labels come from `customers.status.*` (the existing namespace, unchanged), and the local `STATUS_LABELS` map is deleted — not duplicated.

### Scenario: CSV column headers are localized
- **Given** a customer export is requested in any supported locale
- **When** the CSV header row is generated
- **Then** all 6 column headers resolve from `dashboard.customers.export.columns.*` in the request's locale, replacing the inline ternary `COLS` array.

## Requirement 4: `NewAppointmentForm.tsx` fully localized

### Scenario: Dialog renders with zero hardcoded copy
- **Given** the new-appointment dialog is opened in any supported locale
- **When** the dialog renders (header, tabs, date/time section, customer section, notes section, footer buttons)
- **Then** every visible string resolves from `dashboard.calendar.newAppointment.*` — including the 3 disabled placeholder tabs (`Aula`/`Evento`/`Lembrete`), which still receive real translation keys since they render regardless of disabled state.

### Scenario: Toasts localized
- **Given** a user submits the form without selecting a service or customer, or successfully creates an appointment
- **When** the corresponding toast fires
- **Then** its message resolves from `dashboard.calendar.newAppointment.*` in the active locale, including the success-toast fallback (currently hardcoded `'Marcação criada'`).

## Requirement 5: `AppointmentDetailModal.tsx` reuses the existing `eventDetail` namespace

### Scenario: Modal renders using shared keys, zero new keys added
- **Given** the appointment detail modal is opened in any supported locale
- **When** the modal renders (title, tabs, section labels, status badge, action buttons, toasts)
- **Then** every string resolves from `dashboard.calendar.eventDetail.*` — the same namespace `EventDetailSheet.tsx` already consumes — and no new keys are added to `messages/*.json` for this file.

### Scenario: Local `SC` status-label map is removed
- **Given** the modal needs a translated status label for the current appointment status
- **When** it resolves that label
- **Then** it reads from `dashboard.calendar.eventDetail.*` (or `customers.status.*` if that's the better semantic fit — resolved at design time) instead of its local `SC.<status>.<locale>` map; the `SC` map's `tone`/color fields (non-textual) may remain local since they are presentation, not translation.

## Non-Goals (explicit, not testable requirements)

- `AppointmentTabs.tsx` is not modified — it has separate, pre-existing i18n debt not named in the I18N-04 ticket.
- No file splitting/refactoring of `NewAppointmentForm.tsx` beyond translation.
- No merge or deduplication of `AppointmentDetailModal.tsx` and `EventDetailSheet.tsx` as components.
- No changes to `I18N-05`, `PERF-01`, `A11Y-01/02`, or any other HEARTBEAT ticket.

## Testability

All 5 requirements are covered by direct rendering/behavior scenarios above. Key-set parity (a cross-cutting concern for Requirements 1–5) is covered by the existing `apps/web/src/messages/messages.test.ts` Vitest suite, which requires no modification — it already diffs the full flattened key tree of all three locale files at runtime.
