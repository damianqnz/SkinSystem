# Design: i18n-calendar-actions-hardcoded-messages (TICKET I18N-09)

## Helpers added to `actions.ts`

```ts
async function getActionLocale() {
  const hdrs = await headers();
  return localeFromHeader(hdrs.get('x-locale'));
}

async function getActionTranslations() {
  return getTranslations({ locale: await getActionLocale(), namespace: 'dashboard.calendar.actions' });
}
```

`getAuth()` calls `getActionTranslations()` itself for its own 2 messages (`notAuthorized`, `orgNotFoundInSession`); every action additionally calls it once for its own body's messages. `next-intl`'s `getTranslations` is memoized per request (React `cache()`), so the repeated calls with identical `locale`+`namespace` within one request are deduplicated — no real overhead, consistent with how `getMessages()`/`getTranslations()` are already called multiple times per render tree elsewhere in this codebase.

## Messages — `dashboard.calendar.actions` (new, 10 keys × 3 locales)

| key | pt | es | en |
|---|---|---|---|
| `notAuthorized` | Não autorizado | No autorizado | Not authorized |
| `orgNotFoundInSession` | Organização não encontrada na sessão | Organización no encontrada en la sesión | Organization not found in session |
| `invalidData` | Dados inválidos | Datos inválidos | Invalid data |
| `noStaffInOrg` | Sem profissional na organização | Sin profesional en la organización | No staff member in the organization |
| `serviceNotFound` | Serviço não encontrado | Servicio no encontrado | Service not found |
| `invalidId` | ID inválido | ID inválido | Invalid ID |
| `notFoundGeneric` | Não encontrada | No encontrada | Not found |
| `alreadyCancelled` | Esta marcação já está cancelada | Esta cita ya está cancelada | This appointment is already cancelled |
| `couldNotCreateCustomer` | Não foi possível criar o cliente | No se pudo crear el cliente | Could not create the client |
| `errorCreatingCustomer` | Erro ao criar o cliente | Error al crear el cliente | Error creating the client |

## Reused, zero new keys

- `dashboard.calendar.newAppointment.toastCreated` → `createInternalAppointmentAction`'s success message.
- `calendar.block.success` → `createBlockedIntervalAction`'s success message (fetched via a second, targeted `getTranslations({ namespace: 'calendar.block' })` call at that one call site).

## Per-action mapping

| Action | Messages replaced |
|---|---|
| `getAuth()` | `notAuthorized`, `orgNotFoundInSession` |
| `createBlockedIntervalAction` | `invalidData`, `noStaffInOrg`, success → `calendar.block.success` |
| `createInternalAppointmentAction` | `invalidData`, `noStaffInOrg`, `serviceNotFound`, success → `newAppointment.toastCreated` |
| `cancelAppointmentAction` | `invalidId`, `notFoundGeneric`, `alreadyCancelled` |
| `restoreAppointmentAction` | `invalidData` |
| `getAppointmentDetailAction` | `invalidId`, `notFoundGeneric` |
| `quickCreateCustomerAction` | `invalidData`, `couldNotCreateCustomer`, `errorCreatingCustomer` |

## Validation gate

`pnpm check-types`, `messages.test.ts` parity, `npm run build`, `pnpm test`, `eslint`, diff-literal check.
