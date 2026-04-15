import 'server-only';

import { eq, and, inArray, desc } from 'drizzle-orm';
import { db } from '@/infrastructure/db';
import { customers, customerOnboarding } from '@/infrastructure/db/schema/customers';
import { appointments }                   from '@/infrastructure/db/schema/booking';
import { catalogServices }                from '@/infrastructure/db/schema/catalog';
import { clinicalSessions, sessionPhotos } from '@/infrastructure/db/schema/clinical';
import type { Result } from '@/shared/types/result';

// ── Public types ──────────────────────────────────────────────

export type PhotoRecord = {
  id: string; clinicalSessionId: string;
  photoType: string; storagePath: string; takenAt: Date;
};

export type AppointmentHistoryRow = {
  appointmentId: string;
  startAt: Date; endAt: Date; status: string; totalCents: number;
  serviceNameI18n: unknown;
  clinicalSessionId: string | null;
  professionalNotes: string | null;
  skinReactionNotes: string | null;
  photos: PhotoRecord[];
};

export type CustomerFullHistory = {
  id: string; fullName: string; email: string | null; phone: string | null;
  isGuest: boolean; createdAt: Date;
  onboarding: { allergies: string | null; medications: string | null; chronicConditions: string | null } | null;
  appointments: AppointmentHistoryRow[];
};

// ── Internal helpers ──────────────────────────────────────────

const dbErr = (m: string): Result<never> =>
  ({ data: null, error: { message: m, code: 'DB_ERROR' } });

async function fetchBase(customerId: string, orgId: string) {
  return Promise.all([
    db.select({ id: customers.id, fullName: customers.fullName, email: customers.email, phone: customers.phone, isGuest: customers.isGuest, createdAt: customers.createdAt })
      .from(customers)
      .where(and(eq(customers.id, customerId), eq(customers.organizationId, orgId)))
      .limit(1),

    db.select({ allergies: customerOnboarding.allergies, medications: customerOnboarding.medications, chronicConditions: customerOnboarding.chronicConditions })
      .from(customerOnboarding)
      .where(and(eq(customerOnboarding.customerId, customerId), eq(customerOnboarding.organizationId, orgId)))
      .limit(1),
  ]);
}

async function fetchAppointmentRows(customerId: string, orgId: string) {
  return db
    .select({
      appointmentId: appointments.id,
      startAt: appointments.startAt, endAt: appointments.endAt,
      status: appointments.status, totalCents: appointments.totalCents,
      serviceNameI18n: catalogServices.nameI18n,
      clinicalSessionId: clinicalSessions.id,
      professionalNotes: clinicalSessions.professionalNotes,
      skinReactionNotes: clinicalSessions.skinReactionNotes,
    })
    .from(appointments)
    .leftJoin(catalogServices, eq(catalogServices.id, appointments.serviceId))
    .leftJoin(clinicalSessions, and(
      eq(clinicalSessions.appointmentId, appointments.id),
      eq(clinicalSessions.organizationId, orgId),
    ))
    .where(and(eq(appointments.organizationId, orgId), eq(appointments.customerId, customerId)))
    .orderBy(desc(appointments.startAt));
}

async function fetchPhotos(sessionIds: string[], orgId: string): Promise<PhotoRecord[]> {
  if (sessionIds.length === 0) return [];
  return db
    .select({ id: sessionPhotos.id, clinicalSessionId: sessionPhotos.clinicalSessionId, photoType: sessionPhotos.photoType, storagePath: sessionPhotos.storagePath, takenAt: sessionPhotos.takenAt })
    .from(sessionPhotos)
    .where(and(eq(sessionPhotos.organizationId, orgId), inArray(sessionPhotos.clinicalSessionId, sessionIds))) as Promise<PhotoRecord[]>;
}

// ── Public service ────────────────────────────────────────────

export async function getCustomerFullHistory(
  customerId: string,
  organizationId: string,
): Promise<Result<CustomerFullHistory>> {
  try {
    const [[custRows, onboardingRows], apptRows] = await Promise.all([
      fetchBase(customerId, organizationId),
      fetchAppointmentRows(customerId, organizationId),
    ]);

    if (!custRows[0]) return { data: null, error: { message: 'Customer not found', code: 'NOT_FOUND' } };

    const sessionIds = apptRows.map(r => r.clinicalSessionId).filter((id): id is string => id !== null);
    const photoRows  = await fetchPhotos(sessionIds, organizationId);

    const bySession = new Map<string, PhotoRecord[]>();
    for (const p of photoRows) {
      const arr = bySession.get(p.clinicalSessionId) ?? [];
      arr.push(p);
      bySession.set(p.clinicalSessionId, arr);
    }

    return {
      data: {
        ...custRows[0],
        onboarding: onboardingRows[0] ?? null,
        appointments: apptRows.map(r => ({
          ...r,
          photos: r.clinicalSessionId ? (bySession.get(r.clinicalSessionId) ?? []) : [],
        })) as AppointmentHistoryRow[],
      },
      error: null,
    };
  } catch {
    return dbErr('Failed to fetch customer history');
  }
}
