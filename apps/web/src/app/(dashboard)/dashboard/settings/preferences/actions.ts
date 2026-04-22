'use server';

import { resolveTenantOrgId } from '@/shared/lib/resolve-tenant-org-id';
import { revalidatePath }             from 'next/cache';
import { z }                          from 'zod';
import { eq }                         from 'drizzle-orm';
import { db }                         from '@/infrastructure/db';
import { bookingSettings }            from '@/domains/booking/schema';
import type { Result }                from '@/shared/types/result';

// ── Auth helper ───────────────────────────────────────────────

function revalidate() {
  revalidatePath('/dashboard/settings/preferences');
  revalidatePath('/');
  revalidatePath('/book');
}

// ── Booking policies ──────────────────────────────────────────

const policiesSchema = z.object({
  bookingLeadTimeHours:    z.number().int().min(0).max(168),
  bookingWindowDays:       z.number().int().min(1).max(365),
  slotDurationMinutes:     z.number().int().min(5).max(480),
  cancellationHoursNotice: z.number().int().min(0).max(720),
  cancellationPolicyText:  z.string().max(2000).optional().nullable(),
});

export async function updatePoliciesAction(raw: unknown): Promise<Result<null>> {
  const auth = await resolveTenantOrgId();
  if ('error' in auth) return { data: null, error: { message: auth.error, code: 'AUTH_ERROR' } };

  const parsed = policiesSchema.safeParse(raw);
  if (!parsed.success) return { data: null, error: { message: parsed.error.issues[0]?.message ?? 'Dados inválidos', code: 'VALIDATION_ERROR' } };

  await db.update(bookingSettings).set({
    bookingLeadTimeHours:    parsed.data.bookingLeadTimeHours,
    bookingWindowDays:       parsed.data.bookingWindowDays,
    slotDurationMinutes:     parsed.data.slotDurationMinutes,
    cancellationHoursNotice: parsed.data.cancellationHoursNotice,
    cancellationPolicyText:  parsed.data.cancellationPolicyText ?? null,
    updatedAt: new Date(),
  }).where(eq(bookingSettings.organizationId, auth.orgId));

  revalidate();
  return { data: null, error: null };
}

// ── Booking config ────────────────────────────────────────────

const configSchema = z.object({
  firstAvailableSlot:      z.boolean(),
  skipTeamMember:          z.boolean(),
  allowMultipleServices:   z.boolean(),
  anyTeamMemberAllowed:    z.boolean(),
  clientLoginEnabled:      z.boolean(),
  clientLoginRequired:     z.boolean(),
  accordionView:           z.boolean(),
  allowOnlineRescheduling: z.boolean(),
  allowOnlineCancellation: z.boolean(),
  showRebookButton:        z.boolean(),
  formFieldName:           z.boolean(),
  formFieldPhone:          z.boolean(),
  formFieldEmail:          z.boolean(),
  formFieldAddress:        z.boolean(),
});

export async function updateConfigAction(raw: unknown): Promise<Result<null>> {
  const auth = await resolveTenantOrgId();
  if ('error' in auth) return { data: null, error: { message: auth.error, code: 'AUTH_ERROR' } };

  const parsed = configSchema.safeParse(raw);
  if (!parsed.success) return { data: null, error: { message: parsed.error.issues[0]?.message ?? 'Dados inválidos', code: 'VALIDATION_ERROR' } };

  await db.update(bookingSettings).set({ ...parsed.data, updatedAt: new Date() }).where(eq(bookingSettings.organizationId, auth.orgId));
  revalidate();
  return { data: null, error: null };
}

// ── Personalization ───────────────────────────────────────────

const personalizationSchema = z.object({
  preferredLanguage:   z.enum(['pt', 'es', 'en']),
  timeFormat:          z.enum(['12h', '24h']),
  weekStartDay:        z.number().int().min(0).max(6),
  showServicePrices:   z.boolean(),
  showServiceDuration: z.boolean(),
  showWorkingHours:    z.boolean(),
  showLocalTime:       z.boolean(),
  termsLabel:          z.string().max(100).optional().nullable(),
  termsUrl:            z.string().max(300).optional().nullable(),
  termsRequired:       z.boolean(),
  redirectLabel:       z.string().max(100).optional().nullable(),
  redirectUrl:         z.string().max(300).optional().nullable(),
});

export async function updatePersonalizationAction(raw: unknown): Promise<Result<null>> {
  const auth = await resolveTenantOrgId();
  if ('error' in auth) return { data: null, error: { message: auth.error, code: 'AUTH_ERROR' } };

  const parsed = personalizationSchema.safeParse(raw);
  if (!parsed.success) return { data: null, error: { message: parsed.error.issues[0]?.message ?? 'Dados inválidos', code: 'VALIDATION_ERROR' } };

  await db.update(bookingSettings).set({ ...parsed.data, updatedAt: new Date() }).where(eq(bookingSettings.organizationId, auth.orgId));
  revalidate();
  return { data: null, error: null };
}

// ── Visibility ────────────────────────────────────────────────

const visibilitySchema = z.object({
  showInSearchResults: z.boolean(),
});

export async function updateVisibilityAction(raw: unknown): Promise<Result<null>> {
  const auth = await resolveTenantOrgId();
  if ('error' in auth) return { data: null, error: { message: auth.error, code: 'AUTH_ERROR' } };

  const parsed = visibilitySchema.safeParse(raw);
  if (!parsed.success) return { data: null, error: { message: parsed.error.issues[0]?.message ?? 'Dados inválidos', code: 'VALIDATION_ERROR' } };

  await db.update(bookingSettings).set({ ...parsed.data, updatedAt: new Date() }).where(eq(bookingSettings.organizationId, auth.orgId));
  revalidate();
  return { data: null, error: null };
}
