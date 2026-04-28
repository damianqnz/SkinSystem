'use server';

import { z }            from 'zod';
import { headers }      from 'next/headers';
import { randomUUID }   from 'crypto';
import { eq, and, lte, or, isNull, gt } from 'drizzle-orm';
import { db }           from '@/infrastructure/db';
import { customers }    from '@/infrastructure/db/schema/customers';
import { profiles }     from '@/infrastructure/db/schema/organizations';
import { coupons, bookingSettings, paymentSurcharges, appointments } from '@/infrastructure/db/schema/booking';
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

// ── Booking config (passed from page → funnel) ────────────────

export type SurchargeItem = {
  id:          string;
  name:        string;
  valueType:   'percent' | 'fixed';
  value:       number;   // numeric string from DB → parsed
  isReduction: boolean;
};

export type BookingConfig = {
  onlinePaymentEnabled:    boolean;
  advancePaymentRequired:  boolean;
  clientLoginEnabled:      boolean;
  clientLoginRequired:     boolean;
  formFieldName:           boolean;
  formFieldPhone:          boolean;
  formFieldEmail:          boolean;
  formFieldAddress:        boolean;
  bookingWindowDays:       number;
  bookingLeadTimeHours:    number;
  weekStartDay:            number;
  timeFormat:              string;
  showServicePrices:       boolean;
  showServiceDuration:     boolean;
  cancellationPolicyText:  string | null;
  termsRequired:           boolean;
  termsLabel:              string | null;
  termsUrl:                string | null;
};

// ── Coupon result ─────────────────────────────────────────────

export type CouponResult =
  | { valid: true;  id: string; discountType: 'percent' | 'fixed'; discountValue: number }
  | { valid: false; message: string };

// ── State types ───────────────────────────────────────────────

export type BookingState =
  | { status: 'idle' }
  | { status: 'redirect'; url: string }
  | { status: 'conflict' }
  | { status: 'error'; message: string };

// ── validateCouponAction ──────────────────────────────────────

/**
 * Validates a coupon code for the current tenant.
 * Checks: isActive, validFrom ≤ today, validUntil ≥ today (or null), usesCount < maxUses (or null).
 */
export async function validateCouponAction(code: string): Promise<CouponResult> {
  const hdrs = await headers();
  const slug = hdrs.get('x-tenant-slug') ?? '';

  const orgResult = await getOrganizationBySlug(slug);
  if (orgResult.error || !orgResult.data) {
    return { valid: false, message: 'Negocio no encontrado' };
  }

  const today = new Date().toISOString().slice(0, 10); // YYYY-MM-DD

  const rows = await db
    .select({
      id:            coupons.id,
      discountType:  coupons.discountType,
      discountValue: coupons.discountValue,
      maxUses:       coupons.maxUses,
      usesCount:     coupons.usesCount,
      validUntil:    coupons.validUntil,
    })
    .from(coupons)
    .where(and(
      eq(coupons.organizationId, orgResult.data.id),
      eq(coupons.code, code.trim().toUpperCase()),
      eq(coupons.isActive, true),
      lte(coupons.validFrom, today),
      or(isNull(coupons.validUntil), gt(coupons.validUntil, today)),
    ))
    .limit(1);

  const row = rows[0];
  if (!row) return { valid: false, message: 'Cupón no válido o expirado' };

  if (row.maxUses !== null && row.usesCount >= row.maxUses) {
    return { valid: false, message: 'Este cupón ha alcanzado el límite de usos' };
  }

  return {
    valid:         true,
    id:            row.id,
    discountType:  row.discountType as 'percent' | 'fixed',
    discountValue: parseFloat(row.discountValue),
  };
}

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
  /** Validated coupon ID (optional — re-validated server-side) */
  couponId:     z.string().uuid().optional(),
});

/**
 * Full booking transaction:
 *   1. Fetch bookingSettings + surcharges (server-side — never trust client amounts)
 *   2. Lock Redis slot (5 min TTL, best-effort)
 *   3. Get service pricing
 *   4. Find default staff profile
 *   5. Upsert guest customer
 *   6. Create appointment (pending)
 *   7a. onlinePaymentEnabled = false  → confirm directly, redirect to success
 *   7b. onlinePaymentEnabled = true   → compute online amount, create Stripe session
 *
 * Security: orgId + amounts always from server-side — never from client input.
 */
export async function createBookingAction(
  _prev: BookingState,
  raw:   unknown,
): Promise<BookingState> {
  const hdrs   = await headers();
  const slug   = hdrs.get('x-tenant-slug') ?? '';
  const locale = hdrs.get('x-locale') ?? 'es';

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

  // ── 1. Fetch settings + surcharges in parallel ────────────
  const [settingsRows, surchargeRows] = await Promise.all([
    db.select({
      onlinePaymentEnabled:   bookingSettings.onlinePaymentEnabled,
      advancePaymentRequired: bookingSettings.advancePaymentRequired,
    })
      .from(bookingSettings)
      .where(eq(bookingSettings.organizationId, org.id))
      .limit(1),

    db.select({
      valueType:   paymentSurcharges.valueType,
      value:       paymentSurcharges.value,
      isReduction: paymentSurcharges.isReduction,
    })
      .from(paymentSurcharges)
      .where(and(
        eq(paymentSurcharges.organizationId, org.id),
        eq(paymentSurcharges.isActive, true),
      )),
  ]);

  const settings = settingsRows[0] ?? {
    onlinePaymentEnabled:   false,
    advancePaymentRequired: false,
  };

  // ── 2. Acquire Redis slot lock (best-effort) ──────────────
  const slotStart       = new Date(input.slotStartISO);
  const dateStr         = slotStart.toISOString().slice(0, 10);
  const lockedBySession = randomUUID();
  const slotKey         = buildSlotKey(org.id, dateStr, input.slotStartISO, input.serviceId);

  const locked = await lockSlot(slotKey, lockedBySession, 600).catch(() => true);
  if (!locked) return { status: 'conflict' };

  // ── 3. Get service pricing ────────────────────────────────
  const svcResult = await getServiceById(input.serviceId, org.id);
  if (svcResult.error || !svcResult.data) {
    return { status: 'error', message: 'Servicio no encontrado' };
  }
  const svc        = svcResult.data;
  const priceCents = svc.priceCents;

  // ── 4. Find default staff profile ────────────────────────
  const staffRows = await db
    .select({ id: profiles.id })
    .from(profiles)
    .where(and(eq(profiles.organizationId, org.id), eq(profiles.isActive, true)))
    .limit(1);

  if (!staffRows[0]) {
    return { status: 'error', message: 'No hay profesionales disponibles' };
  }

  // ── 5. Upsert guest customer ──────────────────────────────
  const existing = await db
    .select({ id: customers.id, isBlocked: customers.isBlocked })
    .from(customers)
    .where(and(
      eq(customers.organizationId, org.id),
      eq(customers.email, input.guestEmail),
    ))
    .limit(1);

  if (existing[0]?.isBlocked) {
    return { status: 'error', message: 'No es posible realizar esta reserva.' };
  }

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

  // ── Compute online amount (server-side) ───────────────────
  // Reductions: % or fixed amounts subtracted from online charge
  const reductionCents = surchargeRows
    .filter((s) => s.isReduction)
    .reduce((sum, s) => {
      const v = parseFloat(String(s.value));
      return sum + (s.valueType === 'percent'
        ? Math.round(priceCents * v / 100)
        : Math.round(v));
    }, 0);

  const onlineSubtotal = settings.advancePaymentRequired
    ? Math.max(0, priceCents - reductionCents)
    : priceCents;

  // Re-validate coupon server-side (never trust client-supplied discount)
  let couponDiscountCents = 0;
  let validatedCouponId: string | undefined;

  if (input.couponId) {
    const today = new Date().toISOString().slice(0, 10);
    const couponRows = await db
      .select({
        id:            coupons.id,
        discountType:  coupons.discountType,
        discountValue: coupons.discountValue,
        maxUses:       coupons.maxUses,
        usesCount:     coupons.usesCount,
      })
      .from(coupons)
      .where(and(
        eq(coupons.id, input.couponId),
        eq(coupons.organizationId, org.id),
        eq(coupons.isActive, true),
        lte(coupons.validFrom, today),
        or(isNull(coupons.validUntil), gt(coupons.validUntil, today)),
      ))
      .limit(1);

    const coupon = couponRows[0];
    if (coupon && (coupon.maxUses === null || coupon.usesCount < coupon.maxUses)) {
      const v = parseFloat(coupon.discountValue);
      couponDiscountCents = coupon.discountType === 'percent'
        ? Math.round(onlineSubtotal * v / 100)
        : Math.min(Math.round(v * 100), onlineSubtotal);
      validatedCouponId = coupon.id;
    }
  }

  const onlineAmountCents = Math.max(0, onlineSubtotal - couponDiscountCents);
  const discountCents     = couponDiscountCents;
  const totalCents        = priceCents; // full service price regardless of payment split

  // ── 6. Create appointment ─────────────────────────────────
  const slotEnd    = new Date(input.slotEndISO);
  const apptResult = await createAppointment({
    organizationId:  org.id,
    customerId,
    serviceId:       input.serviceId,
    staffProfileId:  staffRows[0].id,
    startAt:         slotStart,
    endAt:           slotEnd,
    priceCents,
    discountCents,
    surchargesCents: 0,
    totalCents,
    guestComment:    input.guestComment,
    couponId:        validatedCouponId,
  });
  if (apptResult.error || !apptResult.data) {
    return { status: 'error', message: 'Error al crear la cita' };
  }

  const appointmentId = apptResult.data.id;
  // Build redirect base from current request origin (preserves subdomain)
  const origin = `${hdrs.get('x-forwarded-proto') ?? 'https'}://${hdrs.get('host') ?? 'localhost:3000'}`;

  // ── 7a. No online payment — confirm directly ──────────────
  if (!settings.onlinePaymentEnabled) {
    await db
      .update(appointments)
      .set({ status: 'confirmed', updatedAt: new Date() })
      .where(and(
        eq(appointments.id, appointmentId),
        eq(appointments.organizationId, org.id),
      ));
    return { status: 'redirect', url: `${origin}/book/success?appointment=${appointmentId}` };
  }

  // ── 7b. Online payment — create Stripe Checkout ───────────
  const sessionResult = await createBookingSession({
    organizationId:     org.id,
    appointmentId,
    serviceId:          input.serviceId,
    customerEmail:      input.guestEmail,
    customerName:       input.guestName,
    locale,
    slotStartISO:       input.slotStartISO,
    lockedBySession,
    overrideAmountCents: onlineAmountCents,
    successUrl: `${origin}/book/success?appointment=${appointmentId}`,
    cancelUrl:  `${origin}/book?cancelled=1`,
  });

  if (sessionResult.error || !sessionResult.data) {
    return { status: 'error', message: sessionResult.error?.message ?? 'Error de pago' };
  }

  return { status: 'redirect', url: sessionResult.data.checkoutUrl };
}
