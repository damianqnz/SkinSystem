# Exploration: i18n-blockdateform-hardcoded-strings (TICKET I18N-08)

## Source

Flagged during I18N-07 as a discovered-but-out-of-scope sibling of `BlockDaysForm.tsx`: `BlockDateForm.tsx` blocks a single date/time range (hour pickers), has zero `useTranslations`/`LABELS` reference, 100% hardcoded Portuguese.

## Full inventory of hardcoded strings (read the file directly)

`REASONS` array (4 reason chips: id + label), dialog title ("Bloquear data"), back button ("Voltar"), close aria-label ("Fechar"), "Desde"/"Até" labels, "Motivo" label, "Cancelar" button, submit button (idle "Bloquear →" / pending "A bloquear…"), one client-side validation toast ("A data final deve ser depois da inicial"), one fallback success-toast string ("Período bloqueado").

## Reuse discovery: `calendar.block.*` — dead JSON, designed for exactly this component

`messages/*.json`'s `calendar.block.*` namespace (confirmed **zero current consumers** via `rg`) matches this component's semantics almost exactly — hour-based blocking, not day-range (that's `BlockDaysForm`'s own `dashboard.calendar.blockDays.*`, migrated in I18N-07). Byte-level diff against the current hardcoded PT text:

| Key | Hardcoded today (pt) | `calendar.block.*` (pt) |
|---|---|---|
| title | "Bloquear data" | "Bloquear horário" |
| from/to | "Desde" / "Até" | "Desde (hs)" / "Até (hs)" |
| reasonLabel | "Motivo" | "Motivo" (identical) |
| confirm | "Bloquear →" | "Confirmar bloqueio" |
| success | "Período bloqueado" | "Horário bloqueado com sucesso" |
| reason.other | "Outro" | "Evento" |
| reason.{vacation,illness,training} | Férias/Doença/Formação | Férias/Doença/Formação (identical) |

**User decision**: adopt `calendar.block.*` as the source of truth (the "(hs)" suffix strongly suggests this namespace was authored for this exact hour-based-blocking component and simply never wired up — same dead-JSON pattern PR3/3 found for the `booking` namespace). This changes the visible PT copy slightly (e.g. "Bloquear data" → "Bloquear horário") as an accepted, deliberate side effect of finally consuming a namespace that already existed for this purpose.

## Additional reuse: `dashboard.calendar.newAppointment.*`

`back` ("Voltar"/"Volver"/"Back"), `closeAriaLabel` ("Fechar"/"Cerrar"/"Close"), `cancelBtn` ("Cancelar"/"Cancelar"/"Cancel") — all 3 byte-identical across all 3 locales to what this component already hardcodes. Reused verbatim, zero new keys.

## Genuinely new keys (no existing match)

- `calendar.block.confirming` — pending-state button text ("A bloquear…" / "Bloqueando…" / "Blocking…").
- `calendar.block.endBeforeStartError` — the one purely-client-side validation message this component owns outright.

## Found but explicitly out of scope: server-side hardcoded messages in `actions.ts`

`createBlockedIntervalAction` (in `(dashboard)/dashboard/calendar/actions.ts`) returns hardcoded Portuguese error/success messages (`'Dados inválidos'`, `'Sem profissional na organização'`, `'Período bloqueado'`) directly from the Server Action — **not** from this component. The component's own `res.message ?? 'Período bloqueado'` fallback is dead code today (the action always sets `message` on both paths), so migrating only the client-side fallback string doesn't change what a non-PT user actually sees; the real fix requires threading locale into this (and likely several sibling) Server Actions — a materially bigger, separate architectural question. Flagged as a follow-up ticket, not fixed here, consistent with how I18N-08 itself was flagged during I18N-07 rather than silently absorbed.

## One more found while reading a sibling file: `EditorialTimePicker.tsx`

Consumed by both `BlockDateForm.tsx` and `NewAppointmentForm.tsx` (the latter already fully migrated in I18N-04). Exactly one hardcoded string: `aria-label="Selecionar hora"` — the direct time-picker analog of `EditorialDatePicker.tsx`'s `aria-label="Selecionar data"`, already fixed in I18N-07 via `dashboard.calendar.datePicker.selectDateAriaLabel`. Same file family, same fix, zero new design decisions — folded into this change as a trivial sibling addition (`dashboard.calendar.datePicker.selectTimeAriaLabel`), not asked separately.

## Non-goals

- `actions.ts` / `createBlockedIntervalAction`'s server-side messages — flagged above, follow-up ticket recommended (**I18N-09**).
- `EditorialDatePicker.tsx` — already correctly localized (I18N-07); untouched.
- `BlockDaysForm.tsx` — already migrated in I18N-07; untouched.
