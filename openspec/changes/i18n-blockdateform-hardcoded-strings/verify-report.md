# Verify report: i18n-blockdateform-hardcoded-strings (TICKET I18N-08)

**Verdict: PASS** (0 critical, 0 warnings)

## Requirement-by-requirement check

### Requirement 1: BlockDateForm renders every string from messages
- Diffed literally: all 12 hardcoded strings replaced. 10 reuse existing keys (`calendar.block.{title,from,to,reasonLabel,confirm,success,reason.*}`, `dashboard.calendar.newAppointment.{back,closeAriaLabel,cancelBtn}`), 2 are new (`calendar.block.{confirming,endBeforeStartError}`).
- `REASONS` (id+label tuples) replaced with `REASON_IDS` (bare ids) + `t(\`reason.${id}\`)`, matching `BlockDaysForm.tsx`'s already-established pattern from I18N-07.
- Validation toast (`endBeforeStartError`) and pending-button state (`confirming`) confirmed wired to the 2 new keys via diff.

### Requirement 2: EditorialTimePicker's aria-label localized
- `aria-label="Selecionar hora"` → `aria-label={tDp('selectTimeAriaLabel')}`, confirmed via diff. `NewAppointmentForm.tsx` (the sibling consumer) unaffected — same component, no prop signature change.

## Disclosed non-scenario, confirmed unchanged
- `createBlockedIntervalAction`'s server-side messages (`'Dados inválidos'`, `'Sem profissional na organização'`, `'Período bloqueado'`) confirmed untouched via `git status` — `actions.ts` not in this diff. The component's own `res.message ?? t('success')` fallback is now correctly localized code, but remains practically unreachable today since the server action always sets `message` — matches the disclosed non-goal exactly, not a regression.

## Build-time / lint-time verification

- `messages.test.ts`: key parity clean, 3 new keys present identically in all 3 locale files.
- `pnpm check-types`: exit 0.
- `npm run build`: exit 0, 26/26 routes, unchanged route table.
- `pnpm test`: 50/50 passed.
- `eslint` on both changed files: 0 warnings, 0 errors.
- Diff-literal check: `rg` for every removed hardcoded string returns only 3 harmless JSX section comments (`{/* Desde */}`, `{/* Até */}`, `{/* Motivo */}`) — not user-visible, left as organizational comments matching the translated key names conceptually.

## Scope discipline
- `BlockDaysForm.tsx`, `EditorialDatePicker.tsx`: confirmed untouched (`git status`) — already correct from I18N-07.
- `actions.ts`: confirmed untouched — flagged as I18N-09, not fixed here.

## Files changed / size
5 files (2 code + 3 message JSON), 36 insertions / 27 deletions = 63 changed lines. Well under the 400-line budget.
