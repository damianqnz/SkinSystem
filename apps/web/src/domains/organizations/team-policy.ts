import type { UserRole } from '@/shared/lib/resolve-tenant-types';

/** Roles a team manager may assign. `super_admin` is platform-level, never granted here. */
export const ASSIGNABLE_TEAM_ROLES = ['owner', 'staff'] as const;

export type TeamChangeVerdict = 'allowed' | 'self' | 'not_found';

/**
 * Decides whether a team manager may change another member's role or active
 * flag. The caller has already proven it is an owner of the tenant.
 *
 * - `self`: nobody manages their own row — deactivating or demoting yourself
 *   can leave the organization without an owner.
 * - `not_found`: the target is not in the tenant, or is a `super_admin`.
 *   Platform admins are outside the tenant's authority, and reporting them as
 *   missing avoids revealing that one exists.
 */
export function evaluateTeamChange(
  actorId: string,
  target: { id: string; role: UserRole } | undefined,
): TeamChangeVerdict {
  if (!target) return 'not_found';
  if (target.id === actorId) return 'self';
  if (target.role === 'super_admin') return 'not_found';
  return 'allowed';
}
