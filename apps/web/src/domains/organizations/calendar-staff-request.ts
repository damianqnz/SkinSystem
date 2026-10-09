import 'server-only';

import { resolveTenantOrgId } from '@/shared/lib/resolve-tenant-org-id';
import { listTeamMembers } from './team-service';
import { resolveCalendarStaff } from './calendar-staff-policy';
import type { UserRole } from '@/shared/lib/resolve-tenant-types';

// ── Types ─────────────────────────────────────────────────────

export type CalendarViewer = {
  profileId: string;
  role: UserRole;
};

export type CalendarStaffResolution =
  | {
      ok: true;
      orgId: string;
      viewer: CalendarViewer;
      /** The effective staff profile whose calendar should be shown/acted on. */
      staffProfileId: string;
    }
  | { ok: false; message: string; code?: string };

// ── Resolver ──────────────────────────────────────────────────

/**
 * Resolves the viewer and the effective staff profile for the management
 * calendar in a single request-scoped step.
 *
 * - `staff`: always themselves — `requestedStaffId` is ignored.
 * - `owner` / `super_admin`: `requestedStaffId` when it names an *active*
 *   member of the tenant, otherwise themselves.
 * - Missing/empty request: the viewer's own profile.
 *
 * The decision itself lives in the pure `resolveCalendarStaff` (unit-tested
 * separately); this helper only wires the established auth resolver and the
 * tenant-scoped member list into it. It performs no extra data access beyond
 * those two lookups.
 */
export async function resolveCalendarStaffForRequest(
  requestedStaffId?: string | null,
): Promise<CalendarStaffResolution> {
  const auth = await resolveTenantOrgId();
  if ('error' in auth) return { ok: false, message: auth.error, code: auth.code };

  const members = await listTeamMembers(auth.orgId);
  if (members.error || !members.data) {
    return { ok: false, message: members.error?.message ?? 'Failed to list team members', code: 'DB_ERROR' };
  }

  const activeMemberIds = members.data
    .filter((m) => m.isActive)
    .map((m) => m.id);

  const staffProfileId = resolveCalendarStaff({
    viewer: { profileId: auth.userId, role: auth.role },
    requestedStaffId,
    activeMemberIds,
  });

  return {
    ok: true,
    orgId: auth.orgId,
    viewer: { profileId: auth.userId, role: auth.role },
    staffProfileId,
  };
}
