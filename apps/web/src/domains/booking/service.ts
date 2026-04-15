import 'server-only';

import { eq, and, gte, asc, between, inArray } from 'drizzle-orm';
import { db } from '@/infrastructure/db';
import { appointments } from './schema';
import type { SelectAppointment, AppointmentStatus } from './schema';
import type { Result } from '@/shared/types/result';

const dbErr = (msg: string) =>
  ({ data: null, error: { message: msg, code: 'DB_ERROR' } }) as Result<never>;

const COLS = {
  id: appointments.id, organizationId: appointments.organizationId, customerId: appointments.customerId,
  serviceId: appointments.serviceId, staffProfileId: appointments.staffProfileId, startAt: appointments.startAt,
  endAt: appointments.endAt, status: appointments.status, totalCents: appointments.totalCents,
};

const ACTIVE: AppointmentStatus[] = ['pending', 'confirmed'];
export async function getUpcomingAppointments(organizationId: string): Promise<Result<SelectAppointment[]>> {
  try {
    const data = await db
      .select(COLS).from(appointments)
      .where(and(
        eq(appointments.organizationId, organizationId),
        gte(appointments.startAt, new Date()),
        inArray(appointments.status, ACTIVE),
      ))
      .orderBy(asc(appointments.startAt)) as SelectAppointment[];
    return { data, error: null };
  } catch {
    return dbErr('Failed to fetch appointments');
  }
}

export async function getSlotsByDate(organizationId: string, date: Date): Promise<Result<SelectAppointment[]>> {
  const s = new Date(new Date(date).setUTCHours(0, 0, 0, 0));
  const e = new Date(new Date(date).setUTCHours(23, 59, 59, 999));
  try {
    const data = await db
      .select(COLS).from(appointments)
      .where(and(
        eq(appointments.organizationId, organizationId),
        between(appointments.startAt, s, e),
      ))
      .orderBy(asc(appointments.startAt)) as SelectAppointment[];
    return { data, error: null };
  } catch {
    return dbErr('Failed to fetch slots');
  }
}
