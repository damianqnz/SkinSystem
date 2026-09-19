import { describe, expect, it } from 'vitest';
import { CUSTOMERS_ORG_EMAIL_UNIQUE_INDEX, isUniqueViolation } from './unique-violation';

const pgError = (constraint: string) => ({ code: '23505', constraint_name: constraint });

describe('isUniqueViolation', () => {
  it('detects a bare postgres unique violation', () => {
    expect(isUniqueViolation(pgError(CUSTOMERS_ORG_EMAIL_UNIQUE_INDEX))).toBe(true);
  });

  it('detects a violation wrapped in a DrizzleQueryError-style cause', () => {
    const wrapped = Object.assign(new Error('Failed query'), {
      cause: pgError(CUSTOMERS_ORG_EMAIL_UNIQUE_INDEX),
    });
    expect(isUniqueViolation(wrapped, CUSTOMERS_ORG_EMAIL_UNIQUE_INDEX)).toBe(true);
  });

  it('does not match a different constraint when one is requested', () => {
    expect(isUniqueViolation(pgError('some_other_key'), CUSTOMERS_ORG_EMAIL_UNIQUE_INDEX)).toBe(false);
  });

  it('matches any unique violation when no constraint is requested', () => {
    expect(isUniqueViolation(pgError('some_other_key'))).toBe(true);
  });

  it('ignores other SQLSTATE codes', () => {
    expect(isUniqueViolation({ code: '23503', constraint_name: CUSTOMERS_ORG_EMAIL_UNIQUE_INDEX })).toBe(false);
  });

  it('returns false for non-object and empty input', () => {
    expect(isUniqueViolation(null)).toBe(false);
    expect(isUniqueViolation(undefined)).toBe(false);
    expect(isUniqueViolation('23505')).toBe(false);
    expect(isUniqueViolation(new Error('boom'))).toBe(false);
  });

  it('terminates on a cyclic cause chain', () => {
    const a: { cause?: unknown } = {};
    a.cause = a;
    expect(isUniqueViolation(a)).toBe(false);
  });
});
