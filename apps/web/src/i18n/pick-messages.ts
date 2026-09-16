import type { AbstractIntlMessages } from 'next-intl';

/**
 * Narrows a full message bundle to only the given top-level namespaces.
 * Keeps `NextIntlClientProvider` from shipping namespaces a route group's
 * Client Components never read (PERF-01) — e.g. the ~26KB `dashboard.*`
 * tree has no business in the public tenant/`/me` client bundle.
 */
export function pickMessages(
  messages: AbstractIntlMessages,
  namespaces: readonly string[],
): AbstractIntlMessages {
  const picked: Record<string, AbstractIntlMessages[string]> = {};
  for (const ns of namespaces) {
    if (ns in messages) picked[ns] = messages[ns]!;
  }
  return picked;
}
