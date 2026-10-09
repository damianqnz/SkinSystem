import 'server-only';

import { eq, and, inArray } from 'drizzle-orm';
import { db } from '@/infrastructure/db';
import { profiles } from '@/infrastructure/db/schema/organizations';
import { organizationInvitations } from '@/infrastructure/db/schema/calendar';
import type { Result } from '@/shared/types/result';
import type { UserRole } from '@/shared/lib/resolve-tenant-types';

// ── Types ─────────────────────────────────────────────────────

export type TeamMember = {
  id:        string;
  fullName:  string | null;
  avatarUrl: string | null;
  role:      UserRole;
  isActive:  boolean;
};

export type PendingInvitation = {
  id:        string;
  email:     string;
  role:      UserRole;
  expiresAt: Date;
  createdAt: Date;
};

const dbErr = (m: string): Result<never> =>
  ({ data: null, error: { message: m, code: 'DB_ERROR' } });

// ── Service ───────────────────────────────────────────────────

/**
 * Active + deactivated members of the tenant (`owner` and `staff` roles).
 * `super_admin` is platform-level and never listed here. Tenant-isolated.
 */
export async function listTeamMembers(
  organizationId: string,
): Promise<Result<TeamMember[]>> {
  try {
    const rows = await db
      .select({
        id:        profiles.id,
        fullName:  profiles.fullName,
        avatarUrl: profiles.avatarUrl,
        role:      profiles.role,
        isActive:  profiles.isActive,
      })
      .from(profiles)
      .where(and(
        eq(profiles.organizationId, organizationId),
        inArray(profiles.role, ['owner', 'staff']),
      ));

    return { data: rows, error: null };
  } catch {
    return dbErr('Failed to list team members');
  }
}

/**
 * Pending staff invitations for the tenant. Tenant-isolated and filtered to
 * `pending` status only.
 */
export async function listPendingInvitations(
  organizationId: string,
): Promise<Result<PendingInvitation[]>> {
  try {
    const rows = await db
      .select({
        id:        organizationInvitations.id,
        email:     organizationInvitations.email,
        role:      organizationInvitations.role,
        expiresAt: organizationInvitations.expiresAt,
        createdAt: organizationInvitations.createdAt,
      })
      .from(organizationInvitations)
      .where(and(
        eq(organizationInvitations.organizationId!, organizationId),
        eq(organizationInvitations.status, 'pending'),
      ));

    return { data: rows, error: null };
  } catch {
    return dbErr('Failed to list pending invitations');
  }
}
