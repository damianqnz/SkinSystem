# Design: i18n-blockdateform-hardcoded-strings (TICKET I18N-08)

## 1. Messages — 2 new keys under the existing `calendar.block` namespace, 1 under `dashboard.calendar.datePicker`

`calendar.block`:
| key | pt | es | en |
|---|---|---|---|
| `confirming` | "A bloquear…" | "Bloqueando…" | "Blocking…" |
| `endBeforeStartError` | "A data final deve ser depois da inicial" | "La fecha final debe ser posterior a la inicial" | "The end date must be after the start date" |

`dashboard.calendar.datePicker`:
| key | pt | es | en |
|---|---|---|---|
| `selectTimeAriaLabel` | "Selecionar hora" | "Seleccionar hora" | "Select time" |

## 2. `BlockDateForm.tsx`

- Remove `REASONS: {id,label}[]` → `REASON_IDS = ['vacation','illness','training','other'] as const` (matches `BlockDaysForm.tsx`'s already-established pattern), `type Reason = (typeof REASON_IDS)[number]`.
- Add `const t = useTranslations('calendar.block'); const tNa = useTranslations('dashboard.calendar.newAppointment');`.
- Replace call sites:
  - Back button text → `tNa('back')`.
  - Dialog title → `t('title')`.
  - Close `aria-label` → `tNa('closeAriaLabel')`.
  - "Desde"/"Até" labels → `t('from')` / `t('to')`.
  - "Motivo" label → `t('reasonLabel')`.
  - Reason chip labels → `REASON_IDS.map((id) => ...)`, label = `t(\`reason.${id}\`)`.
  - Cancel button → `tNa('cancelBtn')`.
  - Submit button idle/pending → `t('confirm')` / `t('confirming')`.
  - Validation toast → `t('endBeforeStartError')`.
  - Success-toast fallback → `res.message ?? t('success')` (disclosed as practically dead code — see non-goals; kept correct anyway).

## 3. `EditorialTimePicker.tsx`

- Add `import { useTranslations } from 'next-intl';`, `const tDp = useTranslations('dashboard.calendar.datePicker');`.
- `aria-label="Selecionar hora"` → `aria-label={tDp('selectTimeAriaLabel')}`.

## Validation gate

`pnpm check-types`, `messages.test.ts` parity, `npm run build`, `pnpm test`, `eslint`. Diff-literal check: zero remaining `REASONS`/hardcoded Portuguese JSX text in `BlockDateForm.tsx`.
