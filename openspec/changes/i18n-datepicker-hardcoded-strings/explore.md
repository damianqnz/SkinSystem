# Exploration: i18n-datepicker-hardcoded-strings (TICKET I18N-07)

## Original ticket scope

`EditorialDatePicker.tsx`'s `MONTHS_PT/ES/EN` arrays — flagged during I18N-05 as discovered-but-out-of-scope (9th representation of month names in the codebase).

## What reading the file directly found — scope is bigger than the ticket title

`apps/web/src/app/(dashboard)/dashboard/calendar/_components/EditorialDatePicker.tsx`:
- `MONTHS_PT/ES/EN` (lines 20-22) — the named arrays.
- `DOW_PT` (line 24) — day-of-week single-letter header (`['S','T','Q','Q','S','S','D']`). **Has no ES/EN variant at all** — real bug, not just duplication: the day-of-week row always renders in Portuguese regardless of locale.
- 3 hardcoded PT `aria-label`s: `"Selecionar data"` (trigger button), `"Mês anterior"` / `"Próximo mês"` (nav buttons).
- `locale?: string` prop, `getMonthLabels(locale)` helper — manual locale branching instead of `next-intl`.

**Consumer audit** (all 3 call sites read directly):
- `BlockDaysForm.tsx:77,81` — passes `locale={locale}` ✓.
- `BlockDateForm.tsx:123,135` — does **not** pass `locale` at all → always renders `MONTHS_PT` (Portuguese) regardless of actual locale, for any non-PT staff member.
- `NewAppointmentForm.tsx:174` — same gap, no `locale` passed.

So 2 of 3 real-world usages are already silently broken today, not just theoretically duplicated. Switching to `useTranslations()` (auto-resolves locale from the already-mounted `NextIntlClientProvider` context, no prop needed) fixes all 3 call sites uniformly and removes the now-provably-unreliable `locale` prop entirely.

## Reuse audit (avoid new keys where an exact match already exists)

- `calendar.months.*` / `calendar.days.*` + `@/i18n/calendar-keys.ts` (`MONTH_KEYS`, `MONDAY_FIRST_DAY_KEYS`) — canonical source established by I18N-05. `EditorialDatePicker` should consume these exactly like `DesktopWeekGrid.tsx`, `CalendarHeader.tsx`, `CalendarDayNav.tsx` already do (`tCal('months.' + key)` / `tCal('days.' + key)`), not maintain its own arrays.
- `dashboard.calendar.header.prevMonthAriaLabel` = "Mês anterior" (pt) / `nextMonthAriaLabel` = "Próximo mês" (pt) — **already exist verbatim**, consumed today by `CalendarHeader.tsx`. Direct reuse, zero new keys for the two nav aria-labels.
- No existing key for "select date" (trigger button aria-label) in any locale file — confirmed via `rg` across all 3 message files. One genuinely new key needed: `dashboard.calendar.datePicker.selectDateAriaLabel`.
- Single-letter day header: `MONDAY_FIRST_DAY_KEYS.map(k => tCal('days.' + k)).slice(0,1)` per entry reproduces the exact current PT output (`Segunda→S, Terça→T, Quarta→Q, Quinta→Q, Sexta→S, Sábado→S, Domingo→D`) and correctly localizes for ES (`L,M,M,J,V,S,D`) and EN (`M,T,W,T,F,S,S`) — same `.slice(0,N)` local-display-concern precedent already used by `MonthView.tsx`/`MobileWeekDaySelector.tsx` (those use `.slice(0,3)`).

## Second component in scope (user decision): `BlockDaysForm.tsx`

Own inline `LABELS: Record<string, {...}>` map (lines 12-16) — a `_i18n.ts`-style hardcoded translation object, the exact pattern `CLAUDE.md` §"No Local `_i18n.ts` Files" prohibits (not a separate file, but the same violation in substance). Discovered while reading this file as an `EditorialDatePicker` consumer.

**Reuse audit for `BlockDaysForm.tsx`**: its `reason.*` enum (vacation/illness/training/other) and `reasonLabel` ("Motivo"/"Motivo"/"Reason") are **byte-identical across all 3 locales** to the existing, currently-unconsumed `calendar.block.reasonLabel` / `calendar.block.reason.*` (verified by reading `pt.json`/`es.json`/`en.json` directly). Full reuse, zero new keys for those. `from`/`to`/`confirm`/`success`/`conflictHint` differ in wording from `calendar.block.*` (that namespace is for a *time-slot* block — "Bloquear horário", hour-based — whereas `BlockDaysForm` blocks a *day range*, no hours), so these 5 need a new dedicated namespace: `dashboard.calendar.blockDays.*`.

## Explicitly out of scope (found, not touched)

- `BlockDateForm.tsx` — the sibling *time-slot* block form. Has zero `useTranslations`/`LABELS` reference at all (different, likely-also-hardcoded pattern) — genuinely separate from both this ticket's title and the user's approved scope (EditorialDatePicker + BlockDaysForm only). Flagged for a future ticket, not touched here.
- `calendar.block.*` namespace itself — untouched (only read from, for the `reasonLabel`/`reason.*` reuse).

## Non-goals

- No changes to `MONTH_KEYS`/`DAY_KEYS`/`MONDAY_FIRST_DAY_KEYS` in `calendar-keys.ts` — reused as-is.
- No changes to `CalendarHeader.tsx`, `DesktopWeekGrid.tsx`, `MonthView.tsx`, `CalendarDayNav.tsx`, `MobileWeekDaySelector.tsx` — already correct, untouched.
- No `sdd-research` — this is an internal reuse/dedup exercise against code already read directly, no external evidence needed.
