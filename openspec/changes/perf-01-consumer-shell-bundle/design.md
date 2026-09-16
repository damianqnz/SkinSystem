# Design: perf-01-consumer-shell-bundle (TICKET PERF-01)

## 1. `apps/web/src/i18n/pick-messages.ts` (new)

```ts
import type { AbstractIntlMessages } from 'next-intl';

/**
 * Narrows a full message bundle to only the given top-level namespaces.
 * Keeps NextIntlClientProvider from shipping namespaces a route group's
 * Client Components never read (see PERF-01).
 */
export function pickMessages(
  messages: AbstractIntlMessages,
  namespaces: readonly string[],
): AbstractIntlMessages {
  const picked: Record<string, unknown> = {};
  for (const ns of namespaces) {
    if (ns in messages) picked[ns] = messages[ns];
  }
  return picked;
}
```

## 2. `ConsumerShell.tsx`

```ts
import { pickMessages } from '@/i18n/pick-messages';

const CONSUMER_CLIENT_NAMESPACES = ['booking', 'calendar', 'tenant'] as const;
// ...
const messages = pickMessages(await getMessages(), CONSUMER_CLIENT_NAMESPACES);
```

## 3. `(marketing)/layout.tsx`

```ts
import { pickMessages } from '@/i18n/pick-messages';

const MARKETING_CLIENT_NAMESPACES: readonly string[] = []; // no Client Components today
// ...
const [locale, messages] = await Promise.all([getLocale(), getMessages()]);
// messages = pickMessages(messages, MARKETING_CLIENT_NAMESPACES);
```

## 4. Regression-guard test: `apps/web/src/i18n/client-namespace-audit.test.ts` (new)

Mirrors `messages.test.ts`'s style (`node:fs`, no jsdom). Scan roots: the 3 route-group directories (`app/(tenant)`, `app/(account)`, `app/(marketing)`) **plus** the top-level files directly under `shared/components/` (`ConsumerShell.tsx`, `LanguageSwitcher.tsx` — both actually consumed by these route groups, confirmed during explore) — deliberately **not** recursing into `shared/components/dashboard/` or `shared/components/booking/`, which are dashboard-only subtrees confirmed via `rg` to have zero imports from `(tenant)`/`(account)`/`(marketing)`.

For each scanned file:
1. Skip files without a `'use client'` directive.
2. Regex-match `useTranslations\(\s*['"]([^'"]+)['"]\s*\)` (and flag, as a test failure with an actionable message, any `useTranslations(` call that is *not* a plain string literal — e.g. a template literal — since the static scan can't audit a dynamic namespace).
3. Extract the top-level segment before the first `.` and assert it's in that root's allow-list (`CONSUMER_CLIENT_NAMESPACES` for `(tenant)`/`(account)`/`shared/components/` top-level files, `MARKETING_CLIENT_NAMESPACES` for `(marketing)`).

Both allow-lists live in a new standalone module, `apps/web/src/i18n/client-namespaces.ts` (no `next-intl/server`/`next/font/google` imports), consumed by `ConsumerShell.tsx`, `(marketing)/layout.tsx`, and this test alike — avoids both duplicating the literal arrays and importing Next-runtime-only side effects (font loaders, server-only `next-intl` calls) into the Vitest/Node test environment.

**Disclosed, deliberate limitation**: a *new* shared client component added later under a directory this scan doesn't cover (e.g. a new subdirectory of `shared/components/`) and consumed by one of these route groups would not be caught until someone extends the scan roots. A whole-repo static import-graph analysis would close this gap but is disproportionate for this ticket; the chosen scope covers every current real consumer, verified via `rg` during explore.

## Validation gate

`pnpm check-types`, `pnpm test` (new `pick-messages.test.ts` + `client-namespace-audit.test.ts`, full suite), `npm run build` (26 routes expected unchanged), `eslint`.
