'use server';

import { resolveTenantOrgId } from '@/shared/lib/resolve-tenant-org-id';
import { OWNER_ROLES }        from '@/shared/lib/resolve-tenant-types';
import { idSchema } from '@/shared/lib/id-schema';
import { revalidatePath }             from 'next/cache';
import { headers }                    from 'next/headers';
import { getTranslations }            from 'next-intl/server';
import { z }                          from 'zod';
import { eq, and }                    from 'drizzle-orm';
import { randomBytes }                from 'crypto';
import { db }                         from '@/infrastructure/db';
import { profiles }                   from '@/infrastructure/db/schema/organizations';
import { organizationInvitations }    from '@/infrastructure/db/schema/calendar';
import { localeFromHeader }           from '@/i18n/detect-locale';
import type { Result }                from '@/shared/types/result';

// ── Helpers ────────────────────────────────────────────────────

function revalidate() {
  revalidatePath('/dashboard/settings/team');
}

async function getActionTranslations() {
  const hdrs = await headers();
  return getTranslations({ locale: localeFromHeader(hdrs.get('x-locale')), namespace: 'dashboard.settings.team.actions' });
}

/**
 * Every team action manages the organization itself, so it is owner-only.
 * The default resolver roles include `staff`, which let any staff member
 * promote themselves to owner or deactivate the owner.
 */
function resolveTeamManager() {
  return resolveTenantOrgId(OWNER_ROLES);
}

// ── Invite staff ───────────────────────────────────────────────

const inviteSchema = z.object({
  email: z.string().email(),
  role:  z.enum(['staff', 'owner']).default('staff'),
});

export async function inviteStaffAction(raw: unknown): Promise<Result<null>> {
  const auth = await resolveTeamManager();
  if ('error' in auth) return { data: null, error: { message: auth.error, code: 'AUTH_ERROR' } };

  const t = await getActionTranslations();
  const parsed = inviteSchema.safeParse(raw);
  if (!parsed.success) {
    const onEmail = parsed.error.issues[0]?.path[0] === 'email';
    return { data: null, error: { message: onEmail ? t('invalidEmail') : t('invalidData'), code: 'VALIDATION_ERROR' } };
  }

  const token     = randomBytes(32).toString('hex');
  const expiresAt = new Date(Date.now() + 72 * 60 * 60 * 1000); // 72 h

  await db.insert(organizationInvitations).values({
    organizationId: auth.orgId,
    invitedBy:      auth.userId,
    email:          parsed.data.email,
    role:           parsed.data.role,
    token,
    expiresAt,
    status:         'pending',
  });

  revalidate();
  return { data: null, error: null };
}

// ── Toggle member active ───────────────────────────────────────

const toggleActiveSchema = z.object({
  profileId: idSchema,
  isActive:  z.boolean(),
});

export async function toggleMemberActiveAction(
  profileId: string,
  isActive:  boolean,
): Promise<Result<null>> {
  const auth = await resolveTeamManager();
  if ('error' in auth) return { data: null, error: { message: auth.error, code: 'AUTH_ERROR' } };

  const t = await getActionTranslations();
  const parsed = toggleActiveSchema.safeParse({ profileId, isActive });
  if (!parsed.success) return { data: null, error: { message: t('invalidData'), code: 'VALIDATION_ERROR' } };

  // Mirrors the UI, which hides the menu on your own row: deactivating
  // yourself would lock you out of the dashboard.
  if (parsed.data.profileId === auth.userId) {
    return { data: null, error: { message: t('cannotManageSelf'), code: 'FORBIDDEN' } };
  }

  await db.update(profiles)
    .set({ isActive: parsed.data.isActive, updatedAt: new Date() })
    .where(and(eq(profiles.id, parsed.data.profileId), eq(profiles.organizationId, auth.orgId)));

  revalidate();
  return { data: null, error: null };
}

// ── Update member role ─────────────────────────────────────────

const roleSchema = z.object({
  profileId: idSchema,
  role:      z.enum(['staff', 'owner']),
});

export async function updateMemberRoleAction(raw: unknown): Promise<Result<null>> {
  const auth = await resolveTeamManager();
  if ('error' in auth) return { data: null, error: { message: auth.error, code: 'AUTH_ERROR' } };

  const t = await getActionTranslations();
  const parsed = roleSchema.safeParse(raw);
  if (!parsed.success) return { data: null, error: { message: t('invalidData'), code: 'VALIDATION_ERROR' } };

  // Same rule as above: self-demotion could leave the org without an owner.
  if (parsed.data.profileId === auth.userId) {
    return { data: null, error: { message: t('cannotManageSelf'), code: 'FORBIDDEN' } };
  }

  await db.update(profiles)
    .set({ role: parsed.data.role, updatedAt: new Date() })
    .where(and(eq(profiles.id, parsed.data.profileId), eq(profiles.organizationId, auth.orgId)));

  revalidate();
  return { data: null, error: null };
}

// ── Cancel invitation ──────────────────────────────────────────

export async function cancelInvitationAction(invitationId: string): Promise<Result<null>> {
  const auth = await resolveTeamManager();
  if ('error' in auth) return { data: null, error: { message: auth.error, code: 'AUTH_ERROR' } };

  const t = await getActionTranslations();
  const parsed = idSchema.safeParse(invitationId);
  if (!parsed.success) return { data: null, error: { message: t('invalidData'), code: 'VALIDATION_ERROR' } };

  await db.delete(organizationInvitations)
    .where(and(
      eq(organizationInvitations.id,             parsed.data),
      eq(organizationInvitations.organizationId!, auth.orgId),
    ));

  revalidate();
  return { data: null, error: null };
}
