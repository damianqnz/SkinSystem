import 'server-only';

import { headers }         from 'next/headers';
import { getTranslations } from 'next-intl/server';
import { eq, and, desc, count, inArray } from 'drizzle-orm';
import { localeFromHeader } from '@/i18n/detect-locale';
import { db }            from '@/infrastructure/db';
import { customers }     from '@/infrastructure/db/schema/customers';
import { profiles }      from '@/infrastructure/db/schema/organizations';
import { appointments }  from '@/infrastructure/db/schema/booking';
import { catalogServices } from '@/infrastructure/db/schema/catalog';
import type { Result }   from '@/shared/types/result';

async function getErrorTranslations() {
  const hdrs = await headers();
  return getTranslations({ locale: localeFromHeader(hdrs.get('x-locale')), namespace: 'account.me.errors' });
}

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
  /** Professional who attends the appointment; null only if their profile has no name. */
  staffName:      string | null;
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
    const t = await getErrorTranslations();
    return dbErr(t('loadCustomerFailed'));
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
        staffName:       profiles.fullName,
      })
      .from(appointments)
      .innerJoin(catalogServices, and(
        eq(appointments.serviceId, catalogServices.id),
        eq(catalogServices.organizationId, appointments.organizationId),
      ))
      .leftJoin(profiles, and(
        eq(appointments.staffProfileId, profiles.id),
        eq(profiles.organizationId, organizationId),
      ))
      .where(and(
        eq(appointments.organizationId, organizationId),
        eq(appointments.customerId, customerId),
      ))
      .orderBy(desc(appointments.startAt));

    return { data: rows, error: null };
  } catch {
    const t = await getErrorTranslations();
    return dbErr(t('loadAppointmentsFailed'));
  }
}

// ── countActiveProfessionals ──────────────────────────────────

/**
 * Active professionals (owner or staff) in the tenant. `/me/citas` names the
 * professional only when there is more than one — with a single professional
 * the name is redundant noise.
 */
export async function countActiveProfessionals(
  organizationId: string,
): Promise<Result<number>> {
  try {
    const [row] = await db
      .select({ n: count() })
      .from(profiles)
      .where(and(
        eq(profiles.organizationId, organizationId),
        eq(profiles.isActive, true),
        inArray(profiles.role, ['owner', 'staff']),
      ));
    return { data: row?.n ?? 0, error: null };
  } catch {
    const t = await getErrorTranslations();
    return dbErr(t('loadAppointmentsFailed'));
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

    if (!rows[0]) {
      const t = await getErrorTranslations();
      return dbErr(t('customerNotFound'));
    }
    return { data: { id: rows[0].id }, error: null };
  } catch {
    const t = await getErrorTranslations();
    return dbErr(t('updateProfileFailed'));
  }
}
