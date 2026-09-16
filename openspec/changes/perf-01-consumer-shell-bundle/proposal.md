# Proposal: perf-01-consumer-shell-bundle (TICKET PERF-01)

## Intent

Stop shipping the full ~35KB i18n message bundle to every tenant-landing and `/me` page load when the Client Components there only ever read 3 of its 8 top-level namespaces (~5KB). Close the same defect in `(marketing)/layout.tsx`, which ships the full bundle for **zero** client consumers.

## Approach

New `pickMessages(messages, namespaces)` helper in `@/i18n`. `ConsumerShell.tsx` passes `['booking', 'calendar', 'tenant']` (the namespaces actually read by every Client Component under `(tenant)`/`(account)`, re-audited fresh via `rg`, not trusted from the 5-week-stale PR3/3 measurement). `(marketing)/layout.tsx` passes `[]` (zero Client Components exist there today).

**Runtime-regression safeguard** (the reason this wasn't a one-line fix in PR3/3): a new test statically scans every `'use client'` file under these route groups for `useTranslations('<namespace>')` calls and fails if any namespace isn't in the corresponding allow-list — converting "silently breaks in production" into "breaks the test suite when someone adds the client component."

## Non-goals

- `(dashboard)/layout.tsx` — untouched; its Client Components already span nearly every `dashboard.*` namespace, so subsetting would save little and risk more.
- No content changes to any `messages/*.json` file.
- No change to `getMessages()`/`src/i18n/request.ts` — this only narrows what's handed to the client provider, server-side `getTranslations()` calls are unaffected.

## Risk / size

Low risk: purely a data-narrowing change plus one new guard test. `use-intl@4.9.1` types `messages?` as `DeepPartial<Messages> | null`, confirmed type-legal for passing a subset. Small diff — 2 production files, 1 new helper, 1 new test.
