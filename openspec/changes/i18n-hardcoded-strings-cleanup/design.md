# Design: i18n-hardcoded-strings-cleanup (TICKET I18N-04)

## 1. `book/success/page.tsx`

New namespace `booking.success` (3 locales):

```json
"booking": {
  "success": {
    "metadata": { "title": "Reserva confirmada" },
    "heading": "¡Reserva confirmada!",
    "subtitle": "Hemos recibido tu pago. Te esperamos.",
    "treatmentLabel": "Tratamiento",
    "dateTimeLabel": "Fecha y hora",
    "confirmationNote": "Recibirás una confirmación por email. Si necesitas cancelar, hazlo con al menos 24h de antelación.",
    "backHome": "Volver al inicio"
  }
}
```

Code changes:
- Replace `export const metadata: Metadata = { title: '...' }` with `export async function generateMetadata(): Promise<Metadata>` reading `x-locale` from `headers()` (already imported) and calling `getTranslations({ locale, namespace: 'booking.success' })` — mirrors `book/page.tsx:39-48` exactly, including using the already-resolved `locale` variable pattern.
- Add `const t = await getTranslations({ locale, namespace: 'booking.success' })` in the component body; replace the 6 hardcoded strings with `t('heading')`, `t('subtitle')`, `t('treatmentLabel')`, `t('dateTimeLabel')`, `t('confirmationNote')`, `t('backHome')`.

## 2. `me/citas/page.tsx`

New namespace `account.me.citas` (3 locales):

```json
"account": {
  "me": {
    "citas": {
      "emptyTitle": "Sin reservas futuras",
      "emptySubtitle": "¿Repetimos la experiencia?",
      "bookCta": "Hacer una reserva"
    }
  }
}
```

Code: add `const t = await getTranslations('account.me.citas')` and replace the 3 strings in the empty-state block (lines 34-42). Do not touch `AppointmentTabs.tsx` — out of scope.

## 3. `export-customers.ts`

- Delete `STATUS_LABELS` (lines 12-18) entirely.
- Add `const tStatus = await getTranslations('customers.status')`; replace `STATUS_LABELS[c.status]?.[locale] ?? c.status` with `tStatus.has(c.status) ? tStatus(c.status) : c.status` (guard against an unknown status value the same way the current `?? c.status` fallback does — `next-intl`'s `t.has()` checks key existence without throwing).
- New namespace `dashboard.customers.export.columns` (3 locales, replacing the inline `COLS` ternary):

```json
"dashboard": {
  "customers": {
    "export": {
      "columns": {
        "name": "Nombre",
        "email": "Email",
        "phone": "Teléfono",
        "status": "Estado",
        "lastVisit": "Última visita",
        "totalVisits": "Total visitas"
      }
    }
  }
}
```

- Replace the `COLS` ternary with `const tCols = await getTranslations('dashboard.customers.export.columns'); const COLS = [tCols('name'), tCols('email'), tCols('phone'), tCols('status'), tCols('lastVisit'), tCols('totalVisits')];`.

## 4. `NewAppointmentForm.tsx`

New namespace `dashboard.calendar.newAppointment` (3 locales, ~14 keys):

```json
"dashboard": {
  "calendar": {
    "newAppointment": {
      "back": "Voltar",
      "title": "Marcação",
      "closeAriaLabel": "Fechar",
      "tabService": "Serviço",
      "tabClass": "Aula",
      "tabEvent": "Evento",
      "tabReminder": "Lembrete",
      "whenLabel": "Quando",
      "noRepeat": "Não se repete",
      "selectServicePlaceholder": "Selecione um serviço",
      "customerLabel": "Cliente",
      "notesLabel": "Notas para o fornecedor e convidado(s)",
      "cancelBtn": "Cancelar",
      "creatingBtn": "A criar…",
      "createBtn": "Criar →",
      "toastSelectService": "Selecione um serviço",
      "toastSelectCustomer": "Selecione um cliente",
      "toastCreated": "Marcação criada"
    }
  }
}
```

(`toastSelectService` duplicates `selectServicePlaceholder`'s text but is a distinct key since one is a placeholder and one a toast message — keeping them separate avoids coupling unrelated UI surfaces to the same key if either wording needs to diverge later.)

Code: add `const t = useTranslations('dashboard.calendar.newAppointment')` at the top of the component; replace all ~14 literals identified in exploration, including the 3 disabled tab labels (`Aula`/`Evento`/`Lembrete` still render text even though disabled).

## 5. `AppointmentDetailModal.tsx`

**Zero new JSON keys.** Reuses two existing namespaces, mirroring the exact pattern already used by the sibling `EventDetailSheet.tsx` (`EventDetailSheet.tsx:61-62,120`):

```ts
const t     = useTranslations('dashboard.calendar.eventDetail');
const tAppt = useTranslations('dashboard.customers.appointments');
// ...
const statusLabel = tAppt(`status.${status}` as Parameters<typeof tAppt>['0']);
```

Mapping of current hardcoded strings to existing keys:

| Current literal | Existing key |
|---|---|
| `Detalhe da marcação` | `eventDetail.title` |
| `Fechar` (aria-label) | `eventDetail.closeAriaLabel` |
| `Detalhes` | `eventDetail.tabDetails` |
| `Histórico` | `eventDetail.tabHistory` |
| `Quando` | `eventDetail.sectionWhen` |
| `Cliente` | `eventDetail.sectionClient` |
| `Equipa` | `eventDetail.sectionStaff` |
| `Notas` | `eventDetail.sectionNotes` |
| `Status` | `eventDetail.sectionStatus` |
| `Histórico chega em breve.` | `eventDetail.historySoon` |
| `Reagendar` | `eventDetail.rescheduleBtn` |
| `Cancelar` / `A cancelar…` | `eventDetail.cancelBtn` / `eventDetail.cancellingBtn` |
| `Aceitar pagamento →` | `eventDetail.payBtn` |
| `Marcação cancelada` (toast) | `eventDetail.toastCancelled` |
| `Desfazer` (toast action) | `eventDetail.toastUndo` |
| `Restaurada` (toast) | `eventDetail.toastRestored` |
| stub toast `` `${l} · em breve` `` + description | `eventDetail.toastSoon` (ICU `{label}`) + `eventDetail.toastSoonDesc` |
| `SC[status]` per-status label | `tAppt('status.' + status)` (`dashboard.customers.appointments.status.*`) |

The local `SC` map's `tone` field (color mapping, not text) stays local — it is presentation, not translation. `TN` (tone → Tailwind classes) is unaffected. Delete the `es/pt/en` text fields from `SC`, keeping only `{ [status]: { tone } }`, or replace `SC` entirely with a small local `STATUS_TONE: Record<string, Tone>` map matching `EventDetailSheet.tsx`'s own `STATUS_TONE` constant for consistency between the two sibling components.

## File/module changes summary

| File | New keys added | Keys reused | Code touch |
|---|---|---|---|
| `messages/{pt,es,en}.json` | ~30 leaf keys × 3 | — | JSON only |
| `book/success/page.tsx` | 0 | `booking.success.*` (new) | `generateMetadata()` + 6 replacements |
| `me/citas/page.tsx` | 0 | `account.me.citas.*` (new) | 3 replacements |
| `export-customers.ts` | 0 | `customers.status.*`, `dashboard.customers.export.columns.*` (new) | delete `STATUS_LABELS`, replace `COLS` |
| `NewAppointmentForm.tsx` | 0 | `dashboard.calendar.newAppointment.*` (new) | ~14 replacements |
| `AppointmentDetailModal.tsx` | 0 | `dashboard.calendar.eventDetail.*`, `dashboard.customers.appointments.status.*` (both pre-existing) | ~20 replacements, delete `SC` text fields |

## Testability

No new test files needed. `apps/web/src/messages/messages.test.ts` (existing, from `test-infra-foundation`) automatically re-validates key parity once the new namespaces are added — no design changes needed to that suite. Manual/build verification (`pnpm check-types`, `eslint`, and a dev-server visual check per locale) covers the actual rendering correctness, consistent with this project's current testing capability (no jsdom/RTL yet, per `sdd-init`'s testing-capabilities record).
