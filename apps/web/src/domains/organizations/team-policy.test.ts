/**
 * @file team-policy.test.ts
 * @description Regression tests for team management authority. Staff must
 *              never manage the team, nobody manages their own row, and a
 *              tenant owner has no authority over a platform super_admin.
 */
import { describe, expect, it } from 'vitest';
import { OWNER_ROLES } from '@/shared/lib/resolve-tenant-types';
import { evaluateTeamChange, ASSIGNABLE_TEAM_ROLES } from './team-policy';

const OWNER = 'b1000000-0000-0000-0000-000000000001';
const OTHER = 'b1000000-0000-0000-0000-000000000009';

describe('team management authority', () => {
  it('is owner-level only: staff is not a manager role', () => {
    expect(OWNER_ROLES).not.toContain('staff');
    expect([...OWNER_ROLES].sort()).toEqual(['owner', 'super_admin']);
  });

  it('never lets a tenant grant super_admin', () => {
    expect(ASSIGNABLE_TEAM_ROLES).not.toContain('super_admin');
  });

  it.each(['owner', 'staff'] as const)('allows managing another %s', (role) => {
    expect(evaluateTeamChange(OWNER, { id: OTHER, role })).toBe('allowed');
  });

  it('rejects managing your own row', () => {
    expect(evaluateTeamChange(OWNER, { id: OWNER, role: 'owner' })).toBe('self');
  });

  it('treats a super_admin as out of reach, reported as not found', () => {
    expect(evaluateTeamChange(OWNER, { id: OTHER, role: 'super_admin' })).toBe('not_found');
  });

  it('rejects a target outside the tenant', () => {
    expect(evaluateTeamChange(OWNER, undefined)).toBe('not_found');
  });
});
