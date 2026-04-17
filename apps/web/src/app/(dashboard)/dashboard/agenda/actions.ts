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
import { z } from 'zod';
import { eq, and } from 'drizzle-orm';

import { db } from '@/infrastructure/db';
import { profiles } from '@/infrastructure/db/schema/organizations';
import { customers } from '@/infrastructure/db/schema/customers';
import { catalogServices } from '@/domains/catalog/schema';
import { appointments } from '@/domains/booking/schema';
import { createSupabaseServerClient } from '@/infrastructure/supabase/server';

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

async function getAuth(): Promise<AuthOk | { error: string }> {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Não autorizado' };

  const orgId = user.user_metadata?.organization_id as string | undefined;
  if (!orgId) return { error: 'Organização não encontrada na sessão' };
  return { orgId, userId: user.id };
}

/** Resolve the staff profileId for the current user (must belong to the org). */
async function getStaffProfileId(orgId: string, userId: string): Promise<string | null> {
  const own = await db
    .select({ id: profiles.id })
    .from(profiles)
    .where(and(eq(profiles.id, userId), eq(profiles.organizationId, orgId)))
    .limit(1);
  if (own[0]) return own[0].id;

  // Fallback to any active profile in the org
  const any = await db
    .select({ id: profiles.id })
    .from(profiles)
    .where(eq(profiles.organizationId, orgId))
    .limit(1);
  return any[0]?.id ?? null;
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
});

export async function createBlockedIntervalAction(
  raw: unknown,
): Promise<ActionState> {
  const auth = await getAuth();
  if ('error' in auth) return { status: 'error', message: auth.error };

  const parsed = blockSchema.safeParse(raw);
  if (!parsed.success) {
    return { status: 'error', message: parsed.error.issues[0]?.message ?? 'Dados inválidos' };
  }

  const profileId = await getStaffProfileId(auth.orgId, auth.userId);
  if (!profileId) return { status: 'error', message: 'Sem profissional na organização' };

  const result = await createBlockedInterval({
    organizationId: auth.orgId,
    profileId,
    ...parsed.data,
  });

  if (result.error) return { status: 'error', message: result.error.message };

  revalidatePath('/dashboard/agenda');
  return { status: 'success', id: result.data.id, message: 'Período bloqueado' };
}

// ── 2. Internal appointment ───────────────────────────────────

const apptSchema = z.object({
  customerId: z.string().uuid(),
  serviceId:  z.string().uuid(),
  startAt:    z.coerce.date(),
  guestComment: z.string().max(500).nullable().optional(),
});

export async function createInternalAppointmentAction(
  raw: unknown,
): Promise<ActionState> {
  const auth = await getAuth();
  if ('error' in auth) return { status: 'error', message: auth.error };

  const parsed = apptSchema.safeParse(raw);
  if (!parsed.success) {
    return { status: 'error', message: parsed.error.issues[0]?.message ?? 'Dados inválidos' };
  }

  const profileId = await getStaffProfileId(auth.orgId, auth.userId);
  if (!profileId) return { status: 'error', message: 'Sem profissional na organização' };

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

  if (!svc[0]) return { status: 'error', message: 'Serviço não encontrado' };

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

  if (result.error) return { status: 'error', message: result.error.message };

  // Internal appointments are created as 'pending' by default; promote to confirmed
  // since the staff is the source of truth (no payment gate needed).
  await db
    .update(appointments)
    .set({ status: 'confirmed', updatedAt: new Date() })
    .where(and(
      eq(appointments.id, result.data.id),
      eq(appointments.organizationId, auth.orgId),
    ));

  revalidatePath('/dashboard/agenda');
  revalidatePath('/dashboard');
  return { status: 'success', id: result.data.id, message: 'Marcação criada' };
}

// ── 3. Cancel + restore (undo) ────────────────────────────────

const idSchema = z.object({ appointmentId: z.string().uuid() });

export async function cancelAppointmentAction(raw: unknown): Promise<CancelActionResult> {
  const auth = await getAuth();
  if ('error' in auth) return { ok: false, message: auth.error };

  const parsed = idSchema.safeParse(raw);
  if (!parsed.success) return { ok: false, message: 'ID inválido' };

  // Fetch current status *before* mutation so the client can offer an exact undo
  const before = await getAppointmentFull(auth.orgId, parsed.data.appointmentId);
  if (before.error || !before.data) return { ok: false, message: before.error?.message ?? 'Não encontrada' };
  if (before.data.status === 'cancelled') {
    return { ok: false, message: 'Esta marcação já está cancelada' };
  }

  const previousStatus = before.data.status;
  const result = await cancelAppointment(auth.orgId, parsed.data.appointmentId);
  if (result.error) return { ok: false, message: result.error.message };

  revalidatePath('/dashboard/agenda');
  revalidatePath('/dashboard');
  return { ok: true, previousStatus };
}

const restoreSchema = z.object({
  appointmentId: z.string().uuid(),
  status:        z.enum(APPOINTMENT_STATUS),
});

export async function restoreAppointmentAction(raw: unknown): Promise<ActionState> {
  const auth = await getAuth();
  if ('error' in auth) return { status: 'error', message: auth.error };

  const parsed = restoreSchema.safeParse(raw);
  if (!parsed.success) return { status: 'error', message: 'Dados inválidos' };

  const result = await restoreAppointmentStatus(auth.orgId, parsed.data.appointmentId, parsed.data.status);
  if (result.error) return { status: 'error', message: result.error.message };

  revalidatePath('/dashboard/agenda');
  revalidatePath('/dashboard');
  return { status: 'success', id: result.data.id };
}

// ── 4. Detail (lazy fetch for side sheet) ─────────────────────

export async function getAppointmentDetailAction(raw: unknown): Promise<DetailActionResult> {
  const auth = await getAuth();
  if ('error' in auth) return { ok: false, message: auth.error };

  const parsed = idSchema.safeParse(raw);
  if (!parsed.success) return { ok: false, message: 'ID inválido' };

  const result = await getAppointmentFull(auth.orgId, parsed.data.appointmentId);
  if (result.error || !result.data) return { ok: false, message: result.error?.message ?? 'Não encontrada' };

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

  const parsed = newCustomerSchema.safeParse(raw);
  if (!parsed.success) return { ok: false, message: parsed.error.issues[0]?.message ?? 'Dados inválidos' };

  try {
    const rows = await db
      .insert(customers)
      .values({
        organizationId: auth.orgId,
        fullName:       parsed.data.fullName,
        phone:          parsed.data.phone ?? null,
        email:          parsed.data.email ?? null,
        isGuest:        false,
      })
      .returning({ id: customers.id, fullName: customers.fullName });

    if (!rows[0]) return { ok: false, message: 'Não foi possível criar o cliente' };
    revalidatePath('/dashboard/customers');
    return { ok: true, id: rows[0].id, fullName: rows[0].fullName };
  } catch {
    return { ok: false, message: 'Erro ao criar o cliente' };
  }
}
