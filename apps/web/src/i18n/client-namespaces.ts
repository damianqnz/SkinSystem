/**
 * @file client-namespaces.ts
 * @description Allow-lists of top-level message namespaces each consumer-
 *              facing route group's Client Components actually read (PERF-01).
 *              Kept in a standalone module (no `next-intl/server`, no
 *              `next/font/google`) so both the providers that consume it and
 *              `client-namespace-audit.test.ts` can import it without
 *              dragging in Next-runtime-only side effects.
 */

/** `(tenant)` + `(account)` — both share `ConsumerShell`. */
export const CONSUMER_CLIENT_NAMESPACES = ['booking', 'calendar', 'tenant', 'account'] as const;

/** `(marketing)` — no Client Component exists there today. */
export const MARKETING_CLIENT_NAMESPACES: readonly string[] = [];
