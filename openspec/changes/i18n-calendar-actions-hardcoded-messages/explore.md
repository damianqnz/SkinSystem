# Exploration: i18n-calendar-actions-hardcoded-messages (TICKET I18N-09)

## Source

Flagged during I18N-08: `createBlockedIntervalAction`'s hardcoded Portuguese success/error messages are what a user actually sees today — the client's own message fallback was already correctly translated but practically dead code, since the server always sets `message`.

## Full inventory (`apps/web/src/app/(dashboard)/dashboard/calendar/actions.ts`)

`rg "message: '[A-ZÀ-ÿ]"` over the file found hardcoded Portuguese in all 6 exported Server Actions plus the shared `getAuth()` helper — 13 unique literal strings across 18 call sites (several repeated: "Dados inválidos" ×4, "Sem profissional na organização" ×2, "ID inválido" ×2, "Não encontrada" ×2).

## Server Actions can resolve locale directly — no client-message-threading needed

Server Actions run entirely server-side and can call `headers()` from `next/headers` exactly like a Server Component. Added a tiny `getActionLocale()`/`getActionTranslations()` pair at the top of the file (mirrors the `getAuth()`/`getStaffProfileId()` local-helper convention already established in this exact file) so every action resolves `x-locale` → `getTranslations({ locale, namespace: 'dashboard.calendar.actions' })` without needing the caller to pass anything new.

## Reuse audit (messages/*.json)

- `dashboard.calendar.newAppointment.toastCreated` = "Marcação criada"/"Cita creada"/"Appointment created" — byte-identical to `createInternalAppointmentAction`'s hardcoded success message. Reused verbatim.
- `calendar.block.success` = "Horário bloqueado com sucesso"/"Horario bloqueado correctamente"/"Time slot blocked successfully" — this is the **exact** namespace `BlockDateForm.tsx`'s client-side fallback already expected (`res.message ?? t('success')`, from I18N-08). The server previously overrode it with a *different* hardcoded string ("Período bloqueado"), so the client's fallback never actually matched what would show if it ever fired. Switching the server to return `tBlock('success')` closes this gap for real — both paths now agree by construction, not by disclosure.
- No other existing key matched any of the remaining 11 unique messages (`rg`'d for substrings across every locale file — confirmed no generic `errors.*`/`common.*` namespace exists anywhere in this codebase to reuse from).

## New namespace: `dashboard.calendar.actions`

10 new keys (`notAuthorized`, `orgNotFoundInSession`, `invalidData`, `noStaffInOrg`, `serviceNotFound`, `invalidId`, `notFoundGeneric`, `alreadyCancelled`, `couldNotCreateCustomer`, `errorCreatingCustomer`) — placed as a sibling of `dashboard.calendar.{eventDetail,newAppointment,blockDays}`, matching this codebase's established per-feature-namespace convention rather than introducing a new cross-cutting `common.errors` namespace (a bigger, unrequested architectural decision).

## Non-goals

- Other Server Action files under `(dashboard)/dashboard/**` may carry the same hardcoded-message pattern (e.g. `billing/actions.ts`, `settings/*/actions.ts`) — not audited here, this ticket was scoped to the one file named in I18N-08's finding. Worth a future sweep, not opened as a numbered ticket here to avoid inventing scope beyond the explicit ask.
- No test added: this repo has no existing pattern for unit-testing a Server Action's translated-message paths (they're integration-tested manually or not at all today), and inventing one is disproportionate for a pure string-literal swap with zero logic change.
