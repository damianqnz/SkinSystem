/**
 * @file activation-policy.ts
 * @domain customers
 * @description Pure decision rule for linking a verified Supabase auth identity
 *              to a tenant's `customers` row (the "activation primitive").
 *
 * Deliberately free of the `server-only` guard and of any `@/infrastructure/db`
 * import (same precedent as `shared/lib/stripe-policy.ts`): `server-only` would
 * make Vitest refuse the module, and importing the Drizzle schema would open a
 * Postgres connection at import time. For the same reason the candidate row is a
 * hand-written structural type, not `typeof customers.$inferSelect`.
 *
 * The DB side (SELECT the candidate, guarded UPDATE) lives in `activation.ts`.
 */

/** The three columns the decision needs, as read from `customers`. */
export type ActivationCandidateRow = {
  id:         string;
  authUserId: string | null;
  isBlocked:  boolean;
};

export type ActivationDecision =
  | { kind: 'activate';          customerId: string }
  | { kind: 'already_linked';    customerId: string }
  | { kind: 'identity_conflict'; customerId: string }
  | { kind: 'blocked';           customerId: string }
  | { kind: 'no_account' };

/**
 * Decides what activation should do for `authUserId` against the tenant's
 * candidate row (already filtered by organization and email by the caller).
 *
 * BRANCH ORDER IS LOAD-BEARING and is asserted by `activation-policy.test.ts`:
 *   1. no row              -> `no_account`        (never creates a row, D3)
 *   2. blocked             -> `blocked`           (before ANY link check, so a
 *                              blocked row is never written, not even when it
 *                              is unlinked, and a blocked customer who was
 *                              already activated is still denied, D2)
 *   3. unlinked            -> `activate`          (the only decision that writes)
 *   4. same auth user      -> `already_linked`    (idempotent re-entry)
 *   5. different auth user -> `identity_conflict` (never overwritten, D1)
 */
export function resolveActivationDecision(
  row: ActivationCandidateRow | null,
  authUserId: string,
): ActivationDecision {
  if (row === null) return { kind: 'no_account' };
  if (row.isBlocked) return { kind: 'blocked', customerId: row.id };
  if (row.authUserId === null) return { kind: 'activate', customerId: row.id };
  if (row.authUserId === authUserId) return { kind: 'already_linked', customerId: row.id };
  return { kind: 'identity_conflict', customerId: row.id };
}
