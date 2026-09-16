# Spec: perf-01-consumer-shell-bundle (TICKET PERF-01)

## Requirement 1: The consumer-facing client bundle carries only the namespaces its Client Components read

### Scenario: Tenant landing page load
- **Given** any tenant landing page render (under `(tenant)/[tenant]`)
- **When** `ConsumerShell` mounts `NextIntlClientProvider`
- **Then** the `messages` prop contains only the `booking`, `calendar`, and `tenant` top-level keys — not `dashboard`, `customers`, `integrations`, `account`, or `marketing`

### Scenario: `/me` page load
- **Given** any `(account)/me/*` page render (shares `ConsumerShell`)
- **When** the provider mounts
- **Then** the same 3-namespace subset applies — confirmed zero `(account)` Client Component reads outside it

### Scenario: Every existing client translation call still resolves
- **Given** the narrowed subset
- **When** any existing Client Component under `(tenant)`/`(account)` calls `useTranslations(...)` for any key it already used before this change
- **Then** it resolves to the same value as before (no missing-key regression)

## Requirement 2: The marketing apex ships zero i18n payload it doesn't use

### Scenario: Marketing landing page load
- **Given** a request to the apex domain
- **When** `(marketing)/layout.tsx` mounts `NextIntlClientProvider`
- **Then** `messages` is `{}` — matching that zero Client Components exist under `(marketing)` today

## Requirement 3: A future client namespace addition outside the allow-list fails the test suite, not production

### Scenario: A new Client Component reads an unlisted namespace
- **Given** a hypothetical future Client Component under `(tenant)`/`(account)`/`(marketing)` that calls `useTranslations('someNewNamespace')`
- **When** `someNewNamespace` is not in that route group's allow-list
- **Then** the new regression test fails, naming the offending file and namespace — not a silent blank-string bug shipped to production

## Verification

1. New unit tests for `pickMessages()` (subset extraction, missing-key tolerance).
2. New regression test scanning `(tenant)`/`(account)`/`(marketing)` `'use client'` files for `useTranslations()` namespace calls against each route group's allow-list — must pass against the current codebase (proves the audited namespace list is complete today) and must be provably able to fail (verified by temporarily naming an excluded namespace during development, not shipped).
3. `pnpm check-types`, `npm run build`, `pnpm test` full suite, `eslint`.
4. No RTL/jsdom harness exists to assert the actual serialized provider payload at runtime (same constraint as every prior ticket) — the static-scan test is the practical equivalent for this codebase's harness.
