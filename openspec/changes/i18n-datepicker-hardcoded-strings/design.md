# Design: i18n-datepicker-hardcoded-strings (TICKET I18N-07)

## 1. `EditorialDatePicker.tsx`

- Delete `MONTHS_PT`, `MONTHS_ES`, `MONTHS_EN`, `DOW_PT`, `getMonthLabels()`.
- Delete the `locale?: string` prop from `EditorialDatePickerProps`.
- Add `'use client'` hooks: `const tCal = useTranslations('calendar');`, `const t = useTranslations('dashboard.calendar.header');`, `const tDp = useTranslations('dashboard.calendar.datePicker');` (all from `next-intl`, matching `DesktopWeekGrid.tsx`/`CalendarHeader.tsx`).
- `const months = MONTH_KEYS.map((k) => tCal(`months.${k}`));` (import `MONTH_KEYS`, `MONDAY_FIRST_DAY_KEYS` from `@/i18n/calendar-keys`).
- `const days = MONDAY_FIRST_DAY_KEYS.map((k) => tCal(`days.${k}`).slice(0, 1));` — single-letter header, local display-slicing concern per established precedent.
- `fmtTrigger(iso, months)` — change signature from `(iso, locale)` to `(iso, months: string[])` since translation hooks can't be called from a free function outside the component; pass the already-computed `months` array in.
- `aria-label="Selecionar data"` → `aria-label={tDp('selectDateAriaLabel')}`.
- `aria-label="Mês anterior"` → `aria-label={t('prevMonthAriaLabel')}` (reused, zero new key).
- `aria-label="Próximo mês"` → `aria-label={t('nextMonthAriaLabel')}` (reused, zero new key).
- Day-of-week row: `DOW_PT.map(...)` → `days.map(...)` (same JSX shape, new source array).

## 2. Message files — new keys

`dashboard.calendar.datePicker`:
| key | pt | es | en |
|---|---|---|---|
| `selectDateAriaLabel` | "Selecionar data" | "Seleccionar fecha" | "Select date" |

`dashboard.calendar.blockDays`:
| key | pt | es | en |
|---|---|---|---|
| `from` | "Desde" | "Desde" | "From" |
| `to` | "Até" | "Hasta" | "To" |
| `confirm` | "Bloquear dias" | "Bloquear días" | "Block days" |
| `success` | "Dias bloqueados com sucesso" | "Días bloqueados correctamente" | "Days blocked successfully" |
| `conflictHint` | "Reserva existente:" | "Reserva existente:" | "Existing booking:" |

No new keys for `reasonLabel`/`reason.*` — reused verbatim from `calendar.block.reasonLabel` / `calendar.block.reason.{illness,vacation,training,other}` (confirmed byte-identical across all 3 locales during explore).

## 3. `BlockDaysForm.tsx`

- Delete the inline `LABELS` const (lines 12-16) and its type annotation.
- Add `const t = useTranslations('dashboard.calendar.blockDays');` and `const tBlock = useTranslations('calendar.block');`.
- Replace `t.from`/`t.to`/`t.reasonLabel`/`t.confirm`/`t.success`/`t.conflictHint`/`t.reason[r]` call sites:
  - `t.from` → `t('from')`, `t.to` → `t('to')`, `t.confirm` → `t('confirm')`, `t.success` → `t('success')`, `t.conflictHint` → `t('conflictHint')` (all from the new `dashboard.calendar.blockDays` namespace).
  - `t.reasonLabel` → `tBlock('reasonLabel')`, `t.reason[r]` → `tBlock(`reason.${r}`)` (reused namespace).
- `locale` prop stays on `BlockDaysFormProps` (still needed for `LABELS[locale] ?? LABELS.es!`'s replacement is no longer needed since `useTranslations` resolves locale from context automatically) — actually: since `useTranslations` no longer needs the `locale` prop for its own logic, but `<EditorialDatePicker locale={locale} .../>` calls become obsolete too (Section 1 removes that prop). Net: `BlockDaysForm`'s own `locale` prop becomes fully unused after this change and is removed from `BlockDaysFormProps`, with its caller updated (1 call site, mechanical).

## 4. Call-site cleanup

- `BlockDaysForm.tsx` (2 call sites): drop `locale={locale}` from both `<EditorialDatePicker>` invocations.
- `BlockDateForm.tsx`, `NewAppointmentForm.tsx`: no change needed (they already don't pass `locale`).
- Whoever renders `<BlockDaysForm>` (its own caller) loses the need to pass `locale` too, if `BlockDaysFormProps.locale` is removed — find and update that 1 call site during apply.

## Validation gate

- `pnpm check-types` — exit 0 (catches any stale `locale` prop reference immediately).
- `messages.test.ts` — key parity for the 2 new namespaces across pt/es/en.
- `npm run build` — exit 0, no route regression.
- `pnpm test` — full suite green.
- `eslint` on all changed files.
- Diff-literal check: zero remaining `MONTHS_PT|MONTHS_ES|MONTHS_EN|DOW_PT|LABELS` identifiers in the 2 changed component files.
