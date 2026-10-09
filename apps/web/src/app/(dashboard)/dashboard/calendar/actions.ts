'use server';

/**
 * /dashboard/agenda — Server Actions for the management calendar.
 *
 *   · createBlockedIntervalAction  — block a date/time range for the staff
 *   · createInternalAppointmentAction — manual appointment without Stripe
 *   · cancelAppointmentAction      — soft cancel (status='cancelled')
 *   · restoreAppointmentAction     — reverts to a previous status (undo toast)
 *   · getAppointmentDetailAction   — lazy fetch full payload for the side sheet
 *   · quickCreateCustomerAction    — inline "+ Novo cliente"
 */

import { revalidatePath } from 'next/cache';
import { headers } from 'next/headers';
import { getTranslations } from 'next-intl/server';
import { z } from 'zod';
import { idSchema } from '@/shared/lib/id-schema';
import { eq, and } from 'drizzle-orm';

import { db } from '@/infrastructure/db';
import { customers } from '@/infrastructure/db/schema/customers';
import { catalogServices } from '@/domains/catalog/schema';
import { appointments } from '@/domains/booking/schema';
import { resolveTenantOrgId } from '@/shared/lib/resolve-tenant-org-id';
import { resolveCalendarStaffForRequest } from '@/domains/organizations/calendar-staff-request';
import { localeFromHeader } from '@/i18n/detect-locale';

import {
  cancelAppointment,
  restoreAppointmentStatus,
  getAppointmentFull,
  createAppointment,
  type AppointmentFull,
} from '@/domains/booking/service';
import {
  createBlockedInterval,
  BLOCK_REASONS,
} from '@/domains/booking/calendar-service';
import { APPOINTMENT_STATUS, type AppointmentStatus } from '@/domains/booking/schema';

// ── Auth helper ───────────────────────────────────────────────

type AuthOk = { orgId: string; userId: string };

type StaffAuthOk = { orgId: string; userId: string; staffProfileId: string };

/** Resolves the request locale for `getTranslations` — Server Actions have no
 *  `NextIntlClientProvider`, so each one reads `x-locale` directly. */
async function getActionLocale() {
  const hdrs = await headers();
  return localeFromHeader(hdrs.get('x-locale'));
}

/** Shorthand for this file's shared error-message namespace. */
async function getActionTranslations() {
  return getTranslations({ locale: await getActionLocale(), namespace: 'dashboard.calendar.actions' });
}

/**
 * The tenant comes from an active membership in the request's tenant, never
 * from `user_metadata`: any signed-in user can rewrite their own metadata
 * through the Auth API, so trusting it let any account act on any tenant.
 *
 * `userId` is also the caller's `profiles.id` (they mirror `auth.users.id`),
 * and the resolver has just proven that profile belongs to `orgId`.
 */
async function getAuth(): Promise<AuthOk | { error: string }> {
  const auth = await resolveTenantOrgId();
  if ('error' in auth) return { error: auth.error };
  return { orgId: auth.orgId, userId: auth.userId };
}

/**
 * Auth + effective staff profile for actions that create entries on a member's
 * calendar. `requestedStaffId` is only honoured for owner/super_admin (and
 * only when it names an active member); staff always resolve to themselves.
 */
async function getStaffAuth(
  requestedStaffId?: string | null,
): Promise<StaffAuthOk | { error: string }> {
  const res = await resolveCalendarStaffForRequest(requestedStaffId);
  if (!res.ok) return { error: res.message };
  return {
    orgId:          res.orgId,
    userId:         res.viewer.profileId,
    staffProfileId: res.staffProfileId,
  };
}

// ── Result types ──────────────────────────────────────────────

export type ActionState =
  | { status: 'idle' }
  | { status: 'success'; id: string; message?: string }
  | { status: 'error';   message: string };

export type CancelActionResult =
  | { ok: true;  previousStatus: AppointmentStatus }
  | { ok: false; message: string };

export type DetailActionResult =
  | { ok: true;  data: AppointmentFull }
  | { ok: false; message: string };

export type CreateCustomerResult =
  | { ok: true;  id: string; fullName: string }
  | { ok: false; message: string };

// ── 1. Block date ─────────────────────────────────────────────

const blockSchema = z.object({
  startAt: z.coerce.date(),
  endAt:   z.coerce.date(),
  reason:  z.enum(BLOCK_REASONS),
  title:   z.string().max(120).nullable().optional(),
  staffProfileId: idSchema.nullable().optional(),
});

export async function createBlockedIntervalAction(
  raw: unknown,
): Promise<ActionState> {
  const t = await getActionTranslations();
  const parsed = blockSchema.safeParse(raw);
  if (!parsed.success) {
    return { status: 'error', message: parsed.error.issues[0]?.message ?? t('invalidData') };
  }

  const auth = await getStaffAuth(parsed.data.staffProfileId);
  if ('error' in auth) return { status: 'error', message: auth.error };

  const profileId = auth.staffProfileId;

  const { startAt, endAt, reason, title } = parsed.data;
  const result = await createBlockedInterval({
    organizationId: auth.orgId,
    profileId,
    startAt,
    endAt,
    reason,
    title,
  });

  if (result.error) return { status: 'error', message: result.error.message };

  // Reuses BlockDateForm's own `calendar.block.success` — the client's
  // `res.message ?? t('success')` fallback expects this exact key's value,
  // so both paths now agree instead of the server silently overriding it
  // with a hardcoded Portuguese string (see I18N-08's disclosed non-goal).
  const tBlock = await getTranslations({ locale: await getActionLocale(), namespace: 'calendar.block' });
  revalidatePath('/dashboard/calendar');
  revalidatePath('/dashboard/calendar');
  return { status: 'success', id: result.data.id, message: tBlock('success') };
}

// ── 2. Internal appointment ───────────────────────────────────

const apptSchema = z.object({
  customerId: idSchema,
  serviceId:  idSchema,
  startAt:    z.coerce.date(),
  guestComment: z.string().max(500).nullable().optional(),
  staffProfileId: idSchema.nullable().optional(),
});

export async function createInternalAppointmentAction(
  raw: unknown,
): Promise<ActionState> {
  const t = await getActionTranslations();
  const parsed = apptSchema.safeParse(raw);
  if (!parsed.success) {
    return { status: 'error', message: parsed.error.issues[0]?.message ?? t('invalidData') };
  }

  const auth = await getStaffAuth(parsed.data.staffProfileId);
  if ('error' in auth) return { status: 'error', message: auth.error };

  const profileId = auth.staffProfileId;

  // Resolve service to compute endAt + price
  const svc = await db
    .select({
      id: catalogServices.id,
      durationMinutes: catalogServices.durationMinutes,
      priceCents: catalogServices.priceCents,
    })
    .from(catalogServices)
    .where(and(
      eq(catalogServices.id, parsed.data.serviceId),
      eq(catalogServices.organizationId, auth.orgId),
    ))
    .limit(1);

  if (!svc[0]) return { status: 'error', message: t('serviceNotFound') };

  const endAt = new Date(parsed.data.startAt.getTime() + svc[0].durationMinutes * 60_000);

  const result = await createAppointment({
    organizationId: auth.orgId,
    customerId:     parsed.data.customerId,
    serviceId:      parsed.data.serviceId,
    staffProfileId: profileId,
    startAt:        parsed.data.startAt,
    endAt,
    priceCents:     svc[0].priceCents,
    discountCents:  0,
    surchargesCents: 0,
    totalCents:     svc[0].priceCents,
    guestComment:   parsed.data.guestComment ?? null,
  });

  if (result.error) {
    return {
      status: 'error',
      message: result.error.code === 'NOT_FOUND' ? t('customerNotFound') : result.error.message,
    };
  }

  // Internal appointments are created as 'pending' by default; promote to confirmed
  // since the staff is the source of truth (no payment gate needed).
  await db
    .update(appointments)
    .set({ status: 'confirmed', updatedAt: new Date() })
    .where(and(
      eq(appointments.id, result.data.id),
      eq(appointments.organizationId, auth.orgId),
    ));

  // Reuses NewAppointmentForm's own `dashboard.calendar.newAppointment.toastCreated`.
  const tNa = await getTranslations({ locale: await getActionLocale(), namespace: 'dashboard.calendar.newAppointment' });
  revalidatePath('/dashboard/calendar');
  revalidatePath('/dashboard/calendar');
  revalidatePath('/dashboard');
  return { status: 'success', id: result.data.id, message: tNa('toastCreated') };
}

// ── 3. Cancel + restore (undo) ────────────────────────────────

const appointmentIdPayloadSchema = z.object({ appointmentId: idSchema });

export async function cancelAppointmentAction(raw: unknown): Promise<CancelActionResult> {
  const auth = await getAuth();
  if ('error' in auth) return { ok: false, message: auth.error };

  const t = await getActionTranslations();
  const parsed = appointmentIdPayloadSchema.safeParse(raw);
  if (!parsed.success) return { ok: false, message: t('invalidId') };

  // Fetch current status *before* mutation so the client can offer an exact undo
  const before = await getAppointmentFull(auth.orgId, parsed.data.appointmentId);
  if (before.error || !before.data) return { ok: false, message: before.error?.message ?? t('notFoundGeneric') };
  if (before.data.status === 'cancelled') {
    return { ok: false, message: t('alreadyCancelled') };
  }

  const previousStatus = before.data.status;
  const result = await cancelAppointment(auth.orgId, parsed.data.appointmentId);
  if (result.error) return { ok: false, message: result.error.message };

  revalidatePath('/dashboard/calendar');
  revalidatePath('/dashboard');
  return { ok: true, previousStatus };
}

const restoreSchema = z.object({
  appointmentId: idSchema,
  status:        z.enum(APPOINTMENT_STATUS),
});

export async function restoreAppointmentAction(raw: unknown): Promise<ActionState> {
  const auth = await getAuth();
  if ('error' in auth) return { status: 'error', message: auth.error };

  const t = await getActionTranslations();
  const parsed = restoreSchema.safeParse(raw);
  if (!parsed.success) return { status: 'error', message: t('invalidData') };

  const result = await restoreAppointmentStatus(auth.orgId, parsed.data.appointmentId, parsed.data.status);
  if (result.error) return { status: 'error', message: result.error.message };

  revalidatePath('/dashboard/calendar');
  revalidatePath('/dashboard');
  return { status: 'success', id: result.data.id };
}

// ── 4. Detail (lazy fetch for side sheet) ─────────────────────

export async function getAppointmentDetailAction(raw: unknown): Promise<DetailActionResult> {
  const auth = await getAuth();
  if ('error' in auth) return { ok: false, message: auth.error };

  const t = await getActionTranslations();
  const parsed = appointmentIdPayloadSchema.safeParse(raw);
  if (!parsed.success) return { ok: false, message: t('invalidId') };

  const result = await getAppointmentFull(auth.orgId, parsed.data.appointmentId);
  if (result.error || !result.data) return { ok: false, message: result.error?.message ?? t('notFoundGeneric') };

  return { ok: true, data: result.data };
}

// ── 5. Quick-create customer ──────────────────────────────────

const newCustomerSchema = z.object({
  fullName: z.string().min(2).max(120),
  phone:    z.string().max(30).nullable().optional(),
  email:    z.string().email().nullable().optional(),
});

export async function quickCreateCustomerAction(raw: unknown): Promise<CreateCustomerResult> {
  const auth = await getAuth();
  if ('error' in auth) return { ok: false, message: auth.error };

  const t = await getActionTranslations();
  const parsed = newCustomerSchema.safeParse(raw);
  if (!parsed.success) return { ok: false, message: parsed.error.issues[0]?.message ?? t('invalidData') };

  try {
    const rows = await db
      .insert(customers)
      .values({
        organizationId: auth.orgId,
        fullName:       parsed.data.fullName,
        phone:          parsed.data.phone ?? null,
        email:          parsed.data.email?.toLowerCase() ?? null,
        isGuest:        false,
      })
      .returning({ id: customers.id, fullName: customers.fullName });

    if (!rows[0]) return { ok: false, message: t('couldNotCreateCustomer') };
    revalidatePath('/dashboard/customers');
    return { ok: true, id: rows[0].id, fullName: rows[0].fullName };
  } catch {
    return { ok: false, message: t('errorCreatingCustomer') };
  }
}
