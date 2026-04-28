import 'server-only';

import { eq, and, desc } from 'drizzle-orm';
import { db }            from '@/infrastructure/db';
import { customers }     from '@/infrastructure/db/schema/customers';
import { appointments }  from '@/infrastructure/db/schema/booking';
import { catalogServices } from '@/infrastructure/db/schema/catalog';
import type { Result }   from '@/shared/types/result';

// ── Types ─────────────────────────────────────────────────────

export type MeCustomer = {
  id:       string;
  fullName: string;
  email:    string | null;
  phone:    string | null;
  isGuest:  boolean;
};

export type MeAppointment = {
  id:             string;
  startAt:        Date;
  endAt:          Date;
  status:         string;
  priceCents:     number;
  totalCents:     number;
  discountCents:  number;
  currency:       string;
  serviceNameI18n: unknown;   // { es, en, pt }
  serviceColor:   string | null;
  durationMinutes: number;
};

// ── Helpers ───────────────────────────────────────────────────

const dbErr = (msg: string): Result<never> =>
  ({ data: null, error: { message: msg, code: 'DB_ERROR' } });

// ── getMyCustomer ─────────────────────────────────────────────

/**
 * Looks up the customer record by Supabase email within the tenant.
 * Returns null data (no error) when no record exists yet.
 */
export async function getMyCustomer(
  organizationId: string,
  email: string,
): Promise<Result<MeCustomer | null>> {
  try {
    const rows = await db
      .select({
        id:       customers.id,
        fullName: customers.fullName,
        email:    customers.email,
        phone:    customers.phone,
        isGuest:  customers.isGuest,
      })
      .from(customers)
      .where(and(
        eq(customers.organizationId, organizationId),
        eq(customers.email, email),
      ))
      .limit(1);

    return { data: rows[0] ?? null, error: null };
  } catch {
    return dbErr('Error loading customer profile');
  }
}

// ── getMyAppointments ─────────────────────────────────────────

export async function getMyAppointments(
  organizationId: string,
  customerId: string,
): Promise<Result<MeAppointment[]>> {
  try {
    const rows = await db
      .select({
        id:              appointments.id,
        startAt:         appointments.startAt,
        endAt:           appointments.endAt,
        status:          appointments.status,
        priceCents:      appointments.priceCents,
        totalCents:      appointments.totalCents,
        discountCents:   appointments.discountCents,
        currency:        catalogServices.currency,
        serviceNameI18n: catalogServices.nameI18n,
        serviceColor:    catalogServices.color,
        durationMinutes: catalogServices.durationMinutes,
      })
      .from(appointments)
      .innerJoin(catalogServices, eq(appointments.serviceId, catalogServices.id))
      .where(and(
        eq(appointments.organizationId, organizationId),
        eq(appointments.customerId, customerId),
      ))
      .orderBy(desc(appointments.startAt));

    return { data: rows, error: null };
  } catch {
    return dbErr('Error loading appointments');
  }
}

// ── updateMyProfile ───────────────────────────────────────────

export async function updateMyProfile(
  organizationId: string,
  customerId: string,
  input: { fullName: string; phone: string },
): Promise<Result<{ id: string }>> {
  try {
    const rows = await db
      .update(customers)
      .set({
        fullName: input.fullName,
        phone:    input.phone || null,
        isGuest:  false,        // Promotes guest to registered client
      })
      .where(and(
        eq(customers.id, customerId),
        eq(customers.organizationId, organizationId),
      ))
      .returning({ id: customers.id });

    if (!rows[0]) return dbErr('Customer not found');
    return { data: { id: rows[0].id }, error: null };
  } catch {
    return dbErr('Error updating profile');
  }
}
