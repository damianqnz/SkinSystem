import 'server-only';

import { eq, and, gte, lte, desc } from 'drizzle-orm';
import { db }                from '@/infrastructure/db';
import { payments }          from '@/infrastructure/db/schema/booking';
import { appointments }      from '@/domains/booking/schema';
import { customers }         from '@/infrastructure/db/schema/customers';
import { catalogServices }   from '@/domains/catalog/schema';
import { profiles }          from '@/infrastructure/db/schema/organizations';
import type { Result }       from '@/shared/types/result';

// ── Types ─────────────────────────────────────────────────────

export interface PaymentHistoryRow {
  paymentId:        string;
  paidAt:           string | null;      // ISO string
  clientName:       string;
  staffName:        string | null;
  serviceNameI18n:  unknown;            // JSONB — resolved client-side by locale
  serviceDate:      string;             // ISO — appointment.startAt
  amountCents:      number;
  currency:         string;
  depositPercent:   number;
  method:           string;             // always 'Stripe' for now
  stripeIntentId:   string;
  status:           string;
  appointmentId:    string;
  createdAt:        string;             // payment record created
}

// ── Query ─────────────────────────────────────────────────────

/**
 * Returns payment history for an organization within [fromDate, toDate].
 * Tenant-isolated: organizationId filter on every table.
 */
export async function getPaymentHistory(
  organizationId: string,
  fromDate:        Date,
  toDate:          Date,
): Promise<Result<PaymentHistoryRow[]>> {
  try {
    const rows = await db
      .select({
        paymentId:       payments.id,
        paidAt:          payments.paidAt,
        amountCents:     payments.amountCents,
        currency:        payments.currency,
        status:          payments.status,
        stripeIntentId:  payments.stripePaymentIntentId,
        createdAt:       payments.createdAt,
        appointmentId:   appointments.id,
        serviceDate:     appointments.startAt,
        serviceNameI18n: catalogServices.nameI18n,
        depositPercent:  catalogServices.depositPercent,
        clientName:      customers.fullName,
        staffName:       profiles.fullName,
      })
      .from(payments)
      .innerJoin(appointments,    and(eq(appointments.id,              payments.appointmentId),
                                      eq(appointments.organizationId,  organizationId)))
      .innerJoin(customers,       and(eq(customers.id,                 appointments.customerId),
                                      eq(customers.organizationId,     organizationId)))
      .innerJoin(catalogServices, and(eq(catalogServices.id,           appointments.serviceId),
                                      eq(catalogServices.organizationId, organizationId)))
      .leftJoin(profiles,              eq(profiles.id,                 appointments.staffProfileId))
      .where(and(
        eq(payments.organizationId, organizationId),
        gte(payments.createdAt, fromDate),
        lte(payments.createdAt, toDate),
      ))
      .orderBy(desc(payments.createdAt))
      .limit(500);

    const mapped: PaymentHistoryRow[] = rows.map((r) => ({
      paymentId:       r.paymentId,
      paidAt:          r.paidAt?.toISOString() ?? null,
      clientName:      r.clientName,
      staffName:       r.staffName ?? null,
      serviceNameI18n: r.serviceNameI18n,
      serviceDate:     r.serviceDate.toISOString(),
      amountCents:     r.amountCents,
      currency:        r.currency,
      depositPercent:  r.depositPercent,
      method:          'Stripe',
      stripeIntentId:  r.stripeIntentId,
      status:          r.status,
      appointmentId:   r.appointmentId,
      createdAt:       r.createdAt.toISOString(),
    }));

    return { data: mapped, error: null };
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'DB error';
    return { data: null, error: { message: msg, code: 'DB_ERROR' } };
  }
}
