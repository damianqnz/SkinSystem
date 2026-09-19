import 'server-only';

/**
 * @file activation.ts
 * @domain customers
 * @description Server-only DB wrapper around the pure decision in
 *              `activation-policy.ts`: links a VERIFIED Supabase auth identity
 *              to the current tenant's `customers` row.
 *
 * CALLER CONTRACT (cannot be enforced from inside this module): `authUserId`
 * MUST belong to a verified identity. Callers must gate on
 * `user.email_confirmed_at != null` before invoking this function, otherwise a
 * password sign-in against an unconfirmed email could activate a row and
 * reintroduce the possession-of-inbox hole this change exists to close. That
 * gate lives in the shared post-auth resolver, so there is one place to audit.
 * `organizationId` must come from the request's resolved tenant, never from the
 * auth user.
 *
 * Isolation (Req 7): the organization predicate is unconditional on every
 * statement below; no code path here queries `customers` by email alone.
 * Write surface: exactly one guarded UPDATE, and only on the `activate` decision.
 * All access is Drizzle over the server-only `db` (Req 8), explicit columns.
 *
 * Never log an email address or a DB error message: Drizzle's error message
 * embeds the query parameters, which include the email. Only truncated ids and
 * the error class / SQLSTATE are logged.
 */
import { and, eq, isNull, sql } from 'drizzle-orm';
import { z }                    from 'zod';
import { db }                   from '@/infrastructure/db';
import { customers }            from '@/infrastructure/db/schema/customers';
import type { Result }          from '@/shared/types/result';
import {
  resolveActivationDecision,
  type ActivationCandidateRow,
  type ActivationDecision,
} from './activation-policy';

const activationInputSchema = z.object({
  organizationId: z.string().uuid(),
  authUserId:     z.string().uuid(),
  // Normalized here too (idempotent): the lookup compares `lower(email)`, so an
  // un-normalized value would silently resolve to `no_account`.
  verifiedEmail:  z.string().trim().toLowerCase().email(),
});

export type ActivateCustomerIdentityInput = z.input<typeof activationInputSchema>;

const LOG_TAG = '[customer-activation]';

/** First 8 chars of a uuid: enough to triage in logs without dumping full ids. */
const shortId = (id: string | null): string => (id === null ? 'null' : id.slice(0, 8));

/** SQLSTATE of the driver error, if any (postgres.js error sits in `cause`). */
function sqlState(error: unknown): string | undefined {
  const cause: unknown = error instanceof Error ? error.cause : undefined;
  if (typeof cause === 'object' && cause !== null && 'code' in cause) {
    const { code } = cause;
    return typeof code === 'string' ? code : undefined;
  }
  return undefined;
}

/** The single candidate lookup. At most one row exists: `uq_customers_org_email`. */
async function findCandidate(
  organizationId: string,
  verifiedEmail: string,
): Promise<ActivationCandidateRow | null> {
  const rows = await db
    .select({
      id:         customers.id,
      authUserId: customers.authUserId,
      isBlocked:  customers.isBlocked,
    })
    .from(customers)
    .where(and(
      eq(customers.organizationId, organizationId),
      sql`lower(${customers.email}) = ${verifiedEmail}`,
    ))
    .limit(1);
  return rows[0] ?? null;
}

/**
 * Compare-and-set link: the `auth_user_id IS NULL` predicate means two
 * concurrent activations of one row cannot both win. `is_blocked = false` makes
 * the "a blocked customer is never linked" invariant hold even when the row is
 * blocked between the SELECT and this UPDATE. Returns whether a row was linked.
 */
async function linkIdentity(
  organizationId: string,
  customerId: string,
  authUserId: string,
): Promise<boolean> {
  const updated = await db
    .update(customers)
    .set({ authUserId, isGuest: false })
    .where(and(
      eq(customers.id, customerId),
      eq(customers.organizationId, organizationId),
      isNull(customers.authUserId),
      eq(customers.isBlocked, false),
    ))
    .returning({ id: customers.id });
  return updated.length === 1;
}

/**
 * Links `authUserId` to the tenant's customer row for `verifiedEmail`.
 *
 * `error` is reserved for infrastructure failure (invalid input, DB
 * unreachable, unresolvable race). `no_account`, `blocked` and
 * `identity_conflict` are decisions, not errors: they travel in `data`, the
 * caller must branch on them, and none of them writes anything.
 */
export async function activateCustomerIdentity(
  input: ActivateCustomerIdentityInput,
): Promise<Result<ActivationDecision>> {
  const parsed = activationInputSchema.safeParse(input);
  if (!parsed.success) {
    return { data: null, error: { message: 'Invalid activation input', code: 'INVALID_INPUT' } };
  }
  const { organizationId, authUserId, verifiedEmail } = parsed.data;

  try {
    let row = await findCandidate(organizationId, verifiedEmail);
    let decision = resolveActivationDecision(row, authUserId);

    if (decision.kind === 'activate') {
      const linked = await linkIdentity(organizationId, decision.customerId, authUserId);
      if (!linked) {
        // Lost the compare-and-set: re-read once and decide from the fresh row.
        row = await findCandidate(organizationId, verifiedEmail);
        decision = resolveActivationDecision(row, authUserId);
        if (decision.kind === 'activate') {
          // Row is unlinked and unblocked yet the guarded UPDATE matched nothing
          // (e.g. relinked and unlinked in between). Do not report success.
          console.warn(`${LOG_TAG} link_not_applied`, { org: shortId(organizationId) });
          return { data: null, error: { message: 'Activation could not be applied', code: 'ACTIVATION_RACE' } };
        }
      }
    }

    if (decision.kind === 'identity_conflict') {
      console.warn(`${LOG_TAG} identity_conflict`, {
        org:           shortId(organizationId),
        customer:      shortId(decision.customerId),
        existingAuth:  shortId(row?.authUserId ?? null),
        attemptedAuth: shortId(authUserId),
      });
    }

    return { data: decision, error: null };
  } catch (error) {
    console.error(`${LOG_TAG} db_error`, {
      org:       shortId(organizationId),
      errorName: error instanceof Error ? error.name : 'unknown',
      sqlState:  sqlState(error),
    });
    return { data: null, error: { message: 'Activation failed', code: 'DB_ERROR' } };
  }
}
