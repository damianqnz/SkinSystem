import type { UserRole } from '@/shared/lib/resolve-tenant-types';

export type CalendarStaffInput = {
  viewer: {
    profileId: string;
    role: UserRole;
  };
  requestedStaffId?: string | null;
  activeMemberIds: readonly string[];
};

/**
 * Decides whose calendar the management calendar should show.
 *
 * - `staff`: always their own calendar — a staff member may never switch to
 *   another member's calendar, whatever is requested.
 * - `owner` / `super_admin`: the requested member when that id belongs to an
 *   active member of the tenant, otherwise their own calendar.
 * - Missing or empty request: the viewer's own calendar.
 *
 * The caller is responsible for proving `activeMemberIds` is tenant-scoped;
 * this pure function performs no data access.
 */
export function resolveCalendarStaff(input: CalendarStaffInput): string {
  const { viewer, requestedStaffId, activeMemberIds } = input;

  if (viewer.role === 'staff') return viewer.profileId;

  if (requestedStaffId && activeMemberIds.includes(requestedStaffId)) {
    return requestedStaffId;
  }

  return viewer.profileId;
}
