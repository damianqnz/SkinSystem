/**
 * @file calendar-staff-policy.test.ts
 * @description Regression tests for per-team-member calendar visibility.
 *              Staff always see their own calendar; owners/super_admins may
 *              switch to any active member of the tenant, and fall back to
 *              their own calendar for foreign, inactive, or missing requests.
 */
import { describe, expect, it } from 'vitest';
import { resolveCalendarStaff } from './calendar-staff-policy';

const OWNER       = 'c1000000-0000-0000-0000-000000000001';
const SUPER_ADMIN = 'c1000000-0000-0000-0000-000000000002';
const STAFF       = 'c1000000-0000-0000-0000-000000000003';
const OTHER       = 'c1000000-0000-0000-0000-000000000009';

const active = (ids: readonly string[]) => ids;

describe('calendar staff resolution', () => {
  it('staff always see their own calendar, even when requesting another member', () => {
    expect(resolveCalendarStaff({
      viewer:           { profileId: STAFF, role: 'staff' },
      requestedStaffId: OTHER,
      activeMemberIds:  active([OTHER]),
    })).toBe(STAFF);
  });

  it('staff with no request see their own calendar', () => {
    expect(resolveCalendarStaff({
      viewer:          { profileId: STAFF, role: 'staff' },
      activeMemberIds: active([STAFF, OTHER]),
    })).toBe(STAFF);
  });

  it('owner can view another active member calendar', () => {
    expect(resolveCalendarStaff({
      viewer:           { profileId: OWNER, role: 'owner' },
      requestedStaffId: OTHER,
      activeMemberIds:  active([OWNER, OTHER]),
    })).toBe(OTHER);
  });

  it('owner requesting a foreign/inactive member falls back to own calendar', () => {
    expect(resolveCalendarStaff({
      viewer:           { profileId: OWNER, role: 'owner' },
      requestedStaffId: OTHER,
      activeMemberIds:  active([OWNER]),
    })).toBe(OWNER);
  });

  it('owner with no request sees their own calendar', () => {
    expect(resolveCalendarStaff({
      viewer:          { profileId: OWNER, role: 'owner' },
      activeMemberIds: active([OWNER, OTHER]),
    })).toBe(OWNER);
  });

  it('owner requesting themselves sees their own calendar', () => {
    expect(resolveCalendarStaff({
      viewer:           { profileId: OWNER, role: 'owner' },
      requestedStaffId: OWNER,
      activeMemberIds:  active([OWNER, OTHER]),
    })).toBe(OWNER);
  });

  it('super_admin can view another active member calendar', () => {
    expect(resolveCalendarStaff({
      viewer:           { profileId: SUPER_ADMIN, role: 'super_admin' },
      requestedStaffId: OTHER,
      activeMemberIds:  active([SUPER_ADMIN, OTHER]),
    })).toBe(OTHER);
  });

  it('super_admin with no request sees their own calendar', () => {
    expect(resolveCalendarStaff({
      viewer:          { profileId: SUPER_ADMIN, role: 'super_admin' },
      activeMemberIds: active([SUPER_ADMIN, OTHER]),
    })).toBe(SUPER_ADMIN);
  });

  it('treats an empty request as missing', () => {
    expect(resolveCalendarStaff({
      viewer:           { profileId: OWNER, role: 'owner' },
      requestedStaffId: '',
      activeMemberIds:  active([OWNER, OTHER]),
    })).toBe(OWNER);
  });
});
