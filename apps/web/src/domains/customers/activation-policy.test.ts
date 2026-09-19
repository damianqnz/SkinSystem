/**
 * @file activation-policy.test.ts
 * @description Regression tests for the activation decision rule. The branch
 *              ORDER is the contract: blocked is checked before any link
 *              consideration, and a different auth identity is never overwritten.
 */
import { describe, expect, it } from 'vitest';
import {
  resolveActivationDecision,
  type ActivationCandidateRow,
  type ActivationDecision,
} from './activation-policy';

const CUSTOMER_ID = '11111111-1111-4111-8111-111111111111';
const AUTH_USER   = '22222222-2222-4222-8222-222222222222';
const OTHER_AUTH  = '33333333-3333-4333-8333-333333333333';

function row(overrides: Partial<ActivationCandidateRow> = {}): ActivationCandidateRow {
  return { id: CUSTOMER_ID, authUserId: null, isBlocked: false, ...overrides };
}

describe('resolveActivationDecision', () => {
  it('returns no_account when there is no row, and never activate', () => {
    expect(resolveActivationDecision(null, AUTH_USER)).toEqual({ kind: 'no_account' });
  });

  it('activates an unlinked, unblocked guest row', () => {
    expect(resolveActivationDecision(row(), AUTH_USER)).toEqual({
      kind: 'activate',
      customerId: CUSTOMER_ID,
    });
  });

  it('is idempotent when the row is already linked to the same auth user', () => {
    expect(resolveActivationDecision(row({ authUserId: AUTH_USER }), AUTH_USER)).toEqual({
      kind: 'already_linked',
      customerId: CUSTOMER_ID,
    });
  });

  it('reports identity_conflict, never activate, when linked to a different auth user', () => {
    const decision = resolveActivationDecision(row({ authUserId: OTHER_AUTH }), AUTH_USER);
    expect(decision).toEqual({ kind: 'identity_conflict', customerId: CUSTOMER_ID });
  });

  describe('blocked customers (denied before any link consideration)', () => {
    it('is blocked, never activate, when blocked and unlinked', () => {
      expect(resolveActivationDecision(row({ isBlocked: true }), AUTH_USER)).toEqual({
        kind: 'blocked',
        customerId: CUSTOMER_ID,
      });
    });

    it('stays blocked when already linked to the same auth user', () => {
      const decision = resolveActivationDecision(
        row({ isBlocked: true, authUserId: AUTH_USER }),
        AUTH_USER,
      );
      expect(decision).toEqual({ kind: 'blocked', customerId: CUSTOMER_ID });
    });

    it('is blocked, not identity_conflict, when linked to a different auth user', () => {
      const decision = resolveActivationDecision(
        row({ isBlocked: true, authUserId: OTHER_AUTH }),
        AUTH_USER,
      );
      expect(decision).toEqual({ kind: 'blocked', customerId: CUSTOMER_ID });
    });
  });

  it('maps every candidate shape to exactly one decision kind', () => {
    const cases: Array<[ActivationCandidateRow | null, ActivationDecision['kind']]> = [
      [null, 'no_account'],
      [row({ isBlocked: true }), 'blocked'],
      [row({ authUserId: AUTH_USER }), 'already_linked'],
      [row({ authUserId: OTHER_AUTH }), 'identity_conflict'],
      [row(), 'activate'],
    ];
    for (const [candidate, expected] of cases) {
      expect(resolveActivationDecision(candidate, AUTH_USER).kind).toBe(expected);
    }
  });

  it('echoes the customerId on every decision except no_account', () => {
    const rows: ActivationCandidateRow[] = [
      row(),
      row({ authUserId: AUTH_USER }),
      row({ authUserId: OTHER_AUTH }),
      row({ isBlocked: true }),
    ];
    for (const candidate of rows) {
      const decision = resolveActivationDecision(candidate, AUTH_USER);
      expect(decision.kind).not.toBe('no_account');
      expect('customerId' in decision && decision.customerId).toBe(CUSTOMER_ID);
    }
    expect(resolveActivationDecision(null, AUTH_USER)).not.toHaveProperty('customerId');
  });
});
