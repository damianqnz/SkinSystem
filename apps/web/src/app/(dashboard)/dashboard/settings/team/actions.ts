'use server';

import { resolveTenantOrgId } from '@/shared/lib/resolve-tenant-org-id';
import { revalidatePath }             from 'next/cache';
import { z }                          from 'zod';
import { eq, and }                    from 'drizzle-orm';
import { randomBytes }                from 'crypto';
import { db }                         from '@/infrastructure/db';
import { profiles }                   from '@/infrastructure/db/schema/organizations';
import { organizationInvitations }    from '@/infrastructure/db/schema/calendar';
import type { Result }                from '@/shared/types/result';

// ── Auth helper ────────────────────────────────────────────────

function revalidate() {
  revalidatePath('/dashboard/settings/team');
}

// ── Invite staff ───────────────────────────────────────────────

const inviteSchema = z.object({
  email: z.string().email('E-mail inválido'),
  role:  z.enum(['staff', 'owner']).default('staff'),
});

export async function inviteStaffAction(raw: unknown): Promise<Result<null>> {
  const auth = await resolveTenantOrgId();
  if ('error' in auth) return { data: null, error: { message: auth.error, code: 'AUTH_ERROR' } };

  const parsed = inviteSchema.safeParse(raw);
  if (!parsed.success) return { data: null, error: { message: parsed.error.issues[0]?.message ?? 'Dados inválidos', code: 'VALIDATION_ERROR' } };

  const token     = randomBytes(32).toString('hex');
  const expiresAt = new Date(Date.now() + 72 * 60 * 60 * 1000); // 72 h

  await db.insert(organizationInvitations).values({
    organizationId: auth.orgId,
    invitedBy:      auth.userId,
    email:          parsed.data.email,
    role:           parsed.data.role as 'staff' | 'owner',
    token,
    expiresAt,
    status:         'pending',
  });

  revalidate();
  return { data: null, error: null };
}

// ── Toggle member active ───────────────────────────────────────

export async function toggleMemberActiveAction(
  profileId: string,
  isActive:  boolean,
): Promise<Result<null>> {
  const auth = await resolveTenantOrgId();
  if ('error' in auth) return { data: null, error: { message: auth.error, code: 'AUTH_ERROR' } };

  await db.update(profiles)
    .set({ isActive, updatedAt: new Date() })
    .where(and(eq(profiles.id, profileId), eq(profiles.organizationId, auth.orgId)));

  revalidate();
  return { data: null, error: null };
}

// ── Update member role ─────────────────────────────────────────

const roleSchema = z.object({
  profileId: z.string().uuid(),
  role:      z.enum(['staff', 'owner']),
});

export async function updateMemberRoleAction(raw: unknown): Promise<Result<null>> {
  const auth = await resolveTenantOrgId();
  if ('error' in auth) return { data: null, error: { message: auth.error, code: 'AUTH_ERROR' } };

  const parsed = roleSchema.safeParse(raw);
  if (!parsed.success) return { data: null, error: { message: parsed.error.issues[0]?.message ?? 'Dados inválidos', code: 'VALIDATION_ERROR' } };

  await db.update(profiles)
    .set({ role: parsed.data.role, updatedAt: new Date() })
    .where(and(eq(profiles.id, parsed.data.profileId), eq(profiles.organizationId, auth.orgId)));

  revalidate();
  return { data: null, error: null };
}

// ── Cancel invitation ──────────────────────────────────────────

export async function cancelInvitationAction(invitationId: string): Promise<Result<null>> {
  const auth = await resolveTenantOrgId();
  if ('error' in auth) return { data: null, error: { message: auth.error, code: 'AUTH_ERROR' } };

  await db.delete(organizationInvitations)
    .where(and(
      eq(organizationInvitations.id,             invitationId),
      eq(organizationInvitations.organizationId!, auth.orgId),
    ));

  revalidate();
  return { data: null, error: null };
}
