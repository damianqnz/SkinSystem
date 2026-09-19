/**
 * @file unique-violation.ts
 * @description Detects a Postgres unique-violation (SQLSTATE 23505) raised by a
 *              Drizzle query, optionally scoped to one named constraint/index.
 *
 * Deliberately pure: no `server-only` guard and no `@/infrastructure/db` import,
 * so it is unit-testable in Vitest without a live Postgres connection
 * (same precedent as `shared/lib/stripe-policy.ts`).
 *
 * drizzle-orm >= 0.44 wraps driver errors in a `DrizzleQueryError` whose
 * `.cause` is the original `postgres` (postgres.js) `PostgresError`, so the
 * `cause` chain has to be walked — checking the top-level error alone misses it.
 */

/** Name of the expression index created by `20260919_customers_auth_identity.sql`. */
export const CUSTOMERS_ORG_EMAIL_UNIQUE_INDEX = 'uq_customers_org_email';

const UNIQUE_VIOLATION = '23505';
const MAX_CAUSE_DEPTH = 5;

type PgErrorShape = {
  code?: unknown;
  constraint_name?: unknown;
  cause?: unknown;
};

function isObject(value: unknown): value is PgErrorShape {
  return typeof value === 'object' && value !== null;
}

/**
 * `true` when `error` (or anything in its `cause` chain) is a Postgres unique
 * violation. When `constraintName` is given, the violation must be on exactly
 * that constraint/index, so an unrelated unique failure is never swallowed.
 */
export function isUniqueViolation(error: unknown, constraintName?: string): boolean {
  let current: unknown = error;
  for (let depth = 0; depth < MAX_CAUSE_DEPTH && isObject(current); depth += 1) {
    if (current.code === UNIQUE_VIOLATION) {
      return constraintName === undefined || current.constraint_name === constraintName;
    }
    current = current.cause;
  }
  return false;
}
