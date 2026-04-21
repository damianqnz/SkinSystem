import 'server-only';

import { eq, and, desc } from 'drizzle-orm';
import { db }            from '@/infrastructure/db';
import { appointments }  from '@/infrastructure/db/schema/booking';
import { catalogServices } from '@/infrastructure/db/schema/catalog';
import { profiles }      from '@/infrastructure/db/schema/organizations';
import type { Result }   from '@/shared/types/result';

export type AppointmentHistoryItem = {
  id:          string;
  startAt:     string; // ISO
  endAt:       string; // ISO
  status:      string;
  priceCents:  number;
  totalCents:  number;
  serviceId:   string;
  serviceName: Record<string, string> | null; // { es, en, pt }
  staffName:   string | null;
};

export type AppointmentHistoryStats = {
  totalThisYear:    number;
  cancelledCount:   number;
  avgSpendCents:    number | null; // null = no completed appointments
  distinctServices: number;
};

export type AppointmentHistoryData = {
  items: AppointmentHistoryItem[];
  stats: AppointmentHistoryStats;
};

function computeStats(rows: AppointmentHistoryItem[]): AppointmentHistoryStats {
  const yearStart    = new Date(new Date().getFullYear(), 0, 1);
  const notCancelled = rows.filter(r => r.status !== 'cancelled' && r.status !== 'no_show');
  const totalThisYear   = notCancelled.filter(r => new Date(r.startAt) >= yearStart).length;
  const cancelledCount  = rows.filter(r => r.status === 'cancelled').length;
  const completed       = rows.filter(r => r.status === 'completed');
  const avgSpendCents   = completed.length > 0
    ? Math.round(completed.reduce((s, r) => s + r.totalCents, 0) / completed.length)
    : null;
  const distinctServices = new Set(notCancelled.map(r => r.serviceId)).size;
  return { totalThisYear, cancelledCount, avgSpendCents, distinctServices };
}

/** Full appointment history for a customer — used in CRM Compromisos tab. */
export async function getCustomerAppointmentHistory(
  organizationId: string,
  customerId:     string,
): Promise<Result<AppointmentHistoryData>> {
  try {
    const rows = await db
      .select({
        id:          appointments.id,
        startAt:     appointments.startAt,
        endAt:       appointments.endAt,
        status:      appointments.status,
        priceCents:  appointments.priceCents,
        totalCents:  appointments.totalCents,
        serviceId:   appointments.serviceId,
        serviceName: catalogServices.nameI18n,
        staffName:   profiles.fullName,
      })
      .from(appointments)
      .leftJoin(catalogServices, eq(catalogServices.id, appointments.serviceId))
      .leftJoin(profiles, eq(profiles.id, appointments.staffProfileId))
      .where(and(
        eq(appointments.organizationId, organizationId),
        eq(appointments.customerId,     customerId),
      ))
      .orderBy(desc(appointments.startAt))
      .limit(200);

    const items: AppointmentHistoryItem[] = rows.map(r => ({
      id:          r.id,
      startAt:     r.startAt instanceof Date ? r.startAt.toISOString() : String(r.startAt),
      endAt:       r.endAt   instanceof Date ? r.endAt.toISOString()   : String(r.endAt),
      status:      r.status,
      priceCents:  r.priceCents,
      totalCents:  r.totalCents,
      serviceId:   r.serviceId,
      serviceName: r.serviceName as Record<string, string> | null,
      staffName:   r.staffName ?? null,
    }));

    return { data: { items, stats: computeStats(items) }, error: null };
  } catch {
    return { data: null, error: { message: 'Failed to fetch appointment history', code: 'DB_ERROR' } };
  }
}
