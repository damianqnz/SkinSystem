# Proposal: mw-03-me-auth-guard-proxy (TICKET MW-03 — `/me` en PRIVATE_PREFIXES)

## Scope aprobado

`apps/web/src/proxy.ts` — el usuario aprobó explícitamente este scope de middleware, con el diseño específico descrito abajo, después de que la exploración encontrara que el enfoque literal del ticket rompía el selector de idioma de `/me`. `src/i18n/request.ts` NO se toca. Satisface la red line de `CLAUDE.md` §2.

## Intent

Mover el auth+tenant guard de `/me` (hoy en `me/layout.tsx`, un 200 + render antes de redirigir) al proxy, para un 307 real — sin alterar la cadena de resolución de locale que `/me` ya usa correctamente hoy (pública, no la del dashboard).

## Approach

Separar los dos conceptos que hoy comparte la única variable `isPrivate`:
- `AUTH_REQUIRED_PREFIXES = ['/dashboard', '/admin', '/me']` — nuevo, controla solo el guard de auth+tenant.
- `PRIVATE_PREFIXES = ['/dashboard', '/admin']` — sin cambios, sigue controlando la elección de cadena de locale y el seed de `NEXT_LOCALE`.

`me/layout.tsx` mantiene su propio chequeo de auth como defensa en profundidad (mismo patrón ya establecido en `DashboardShell`), y sus checks de existencia de organización + datos del cliente, que el proxy no reemplaza.

## Non-goals

- Comportamiento de `/dashboard`/`/admin` — sin cambios, `PRIVATE_PREFIXES` queda idéntico.
- El bug latente de `next=/me` relativo en el fallback de `me/layout.tsx` — documentado, no arreglado (código ahora inalcanzable en la práctica).
- `getOrganizationBySlug`/`getMyCustomer` en `me/layout.tsx` — sin cambios.

## Risk / size

Riesgo bajo si el diseño de separación de conceptos es correcto (verificado con tests nuevos que prueban explícitamente que `/me` sigue en la cadena pública de locale). Cambio pequeño: ~10-15 líneas en `proxy.ts`, tests nuevos en `proxy.test.ts`.
