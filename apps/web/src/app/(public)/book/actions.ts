'use server';

import { z }            from 'zod';
import { headers }      from 'next/headers';
import { randomUUID }   from 'crypto';
import { eq, and }      from 'drizzle-orm';
import { db }           from '@/infrastructure/db';
import { customers }    from '@/infrastructure/db/schema/customers';
import { profiles }     from '@/infrastructure/db/schema/organizations';
import { getOrganizationBySlug } from '@/domains/organizations/service';
import { getServiceById }        from '@/domains/catalog/service';
import { calculateAvailableSlots, createAppointment } from '@/domains/booking/service';
import { createBookingSession }  from '@/domains/billing/service';
import { buildSlotKey, lockSlot } from '@/shared/lib/redis-lock';
import type { SlotStatus }        from '@/domains/booking/service';

// ── Public slot type (serialized for RSC boundary) ────────────

export type PublicSlot = {
  startISO: string;
  endISO:   string;
  status:   'available' | 'locked';
  label:    string;    // "09:00"
};

// ── State types ───────────────────────────────────────────────

export type BookingState =
  | { status: 'idle' }
  | { status: 'redirect'; url: string }
  | { status: 'conflict' }
  | { status: 'error'; message: string };

// ── getAvailableSlotsAction ───────────────────────────────────

/**
 * Returns only public-facing slot statuses: available + locked.
 * All internal states (buffer, break, blocked) are hidden from clients.
 */
export async function getAvailableSlotsAction(
  serviceId: string,
  dateISO:   string,
): Promise<{ slots: PublicSlot[]; error?: string }> {
  const hdrs = await headers();
  const slug = hdrs.get('x-tenant-slug') ?? '';

  const orgResult = await getOrganizationBySlug(slug);
  if (orgResult.error || !orgResult.data) return { slots: [], error: 'Negocio no encontrado' };

  const result = await calculateAvailableSlots(
    orgResult.data.id,
    serviceId,
    new Date(dateISO),
  ).catch(() => null);

  if (!result?.data) return { slots: [], error: 'No se pudo cargar disponibilidad' };

  const VISIBLE: SlotStatus[] = ['available', 'locked'];
  const slots: PublicSlot[] = result.data
    .filter((s) => VISIBLE.includes(s.status))
    .map((s) => ({
      startISO: s.startAt.toISOString(),
      endISO:   s.endAt.toISOString(),
      status:   s.status as 'available' | 'locked',
      label:    s.startAt.toISOString().slice(11, 16), // "HH:MM" UTC
    }));

  return { slots };
}

// ── createBookingAction ───────────────────────────────────────

const createBookingSchema = z.object({
  serviceId:    z.string().uuid(),
  slotStartISO: z.string().min(1),
  slotEndISO:   z.string().min(1),
  guestName:    z.string().min(2).max(100),
  guestEmail:   z.string().email(),
  guestPhone:   z.string().min(6).max(30),
  guestComment: z.string().max(500).optional(),
});

/**
 * Full booking transaction:
 *   1. Lock Redis slot (5 min TTL, best-effort)
 *   2. Upsert guest customer by email
 *   3. Find default staff profile
 *   4. Create appointment (pending)
 *   5. Create Stripe Checkout session → return redirect URL
 *
 * Security: orgId always from server-side header, never from client input.
 */
export async function createBookingAction(
  _prev: BookingState,
  raw:   unknown,
): Promise<BookingState> {
  const hdrs   = await headers();
  const slug   = hdrs.get('x-tenant-slug') ?? '';
  const locale = hdrs.get('x-locale') ?? 'es';
  const base   = process.env.NEXT_PUBLIC_BASE_URL ?? 'http://localhost:3000';

  const parsed = createBookingSchema.safeParse(raw);
  if (!parsed.success) {
    return { status: 'error', message: parsed.error.issues[0]?.message ?? 'Datos inválidos' };
  }

  const input = parsed.data;

  const orgResult = await getOrganizationBySlug(slug);
  if (orgResult.error || !orgResult.data) {
    return { status: 'error', message: 'Negocio no encontrado' };
  }
  const org = orgResult.data;

  // ── 1. Acquire Redis slot lock (best-effort) ──────────────
  const slotStart      = new Date(input.slotStartISO);
  const dateStr        = slotStart.toISOString().slice(0, 10);
  const lockedBySession = randomUUID();
  const slotKey        = buildSlotKey(org.id, dateStr, input.slotStartISO, input.serviceId);

  const locked = await lockSlot(slotKey, lockedBySession, 600).catch(() => true);
  if (!locked) return { status: 'conflict' };

  // ── 2. Get service pricing ────────────────────────────────
  const svcResult = await getServiceById(input.serviceId, org.id);
  if (svcResult.error || !svcResult.data) {
    return { status: 'error', message: 'Servicio no encontrado' };
  }
  const svc = svcResult.data;

  // ── 3. Find default staff profile ────────────────────────
  const staffRows = await db
    .select({ id: profiles.id })
    .from(profiles)
    .where(and(eq(profiles.organizationId, org.id), eq(profiles.isActive, true)))
    .limit(1);

  if (!staffRows[0]) {
    return { status: 'error', message: 'No hay profesionales disponibles' };
  }

  // ── 4. Upsert guest customer ──────────────────────────────
  const existing = await db
    .select({ id: customers.id })
    .from(customers)
    .where(and(
      eq(customers.organizationId, org.id),
      eq(customers.email, input.guestEmail),
    ))
    .limit(1);

  let customerId: string;
  if (existing[0]) {
    customerId = existing[0].id;
  } else {
    const rows = await db
      .insert(customers)
      .values({
        organizationId: org.id,
        fullName:       input.guestName,
        email:          input.guestEmail,
        phone:          input.guestPhone,
        isGuest:        true,
      })
      .returning({ id: customers.id });
    if (!rows[0]) return { status: 'error', message: 'Error al registrar cliente' };
    customerId = rows[0].id;
  }

  // ── 5. Create appointment (pending) ──────────────────────
  const slotEnd = new Date(input.slotEndISO);
  const apptResult = await createAppointment({
    organizationId:  org.id,
    customerId,
    serviceId:       input.serviceId,
    staffProfileId:  staffRows[0].id,
    startAt:         slotStart,
    endAt:           slotEnd,
    priceCents:      svc.priceCents,
    discountCents:   0,
    surchargesCents: 0,
    totalCents:      svc.priceCents,
    guestComment:    input.guestComment,
  });
  if (apptResult.error || !apptResult.data) {
    return { status: 'error', message: 'Error al crear la cita' };
  }

  // ── 6. Stripe Checkout session ────────────────────────────
  const sessionResult = await createBookingSession({
    organizationId:  org.id,
    appointmentId:   apptResult.data.id,
    serviceId:       input.serviceId,
    customerEmail:   input.guestEmail,
    customerName:    input.guestName,
    locale,
    slotStartISO:    input.slotStartISO,
    lockedBySession,
    successUrl: `${base}/book/success?appointment=${apptResult.data.id}`,
    cancelUrl:  `${base}/book?cancelled=1`,
  });

  if (sessionResult.error || !sessionResult.data) {
    return { status: 'error', message: sessionResult.error?.message ?? 'Error de pago' };
  }

  return { status: 'redirect', url: sessionResult.data.checkoutUrl };
}
