import 'server-only';

import { eq, and, asc, inArray, sql } from 'drizzle-orm';
import { db } from '@/infrastructure/db';
import { customers } from './schema';
import { appointments } from '@/infrastructure/db/schema/booking';
import type { SelectCustomer } from './schema';
import type { Result } from '@/shared/types/result';

const dbErr = (msg: string) =>
  ({ data: null, error: { message: msg, code: 'DB_ERROR' } }) as Result<never>;

const LIST   = { id: customers.id, organizationId: customers.organizationId, fullName: customers.fullName, phone: customers.phone, email: customers.email, isGuest: customers.isGuest, createdAt: customers.createdAt };
const DETAIL = { ...LIST, notes: customers.notes };

const VISITED = ['completed', 'confirmed'] as const;

// ── Public type for CRM table (includes visit stats) ─────────
export type CustomerWithStats = {
  id: string; organizationId: string;
  fullName: string; email: string | null; phone: string | null;
  isGuest: boolean; createdAt: Date;
  lastVisitAt: Date | null; visitCount: number;
};

// ─────────────────────────────────────────────────────────────

export async function getCustomersList(
  organizationId: string,
): Promise<Result<SelectCustomer[]>> {
  try {
    const data = await db
      .select(LIST).from(customers)
      .where(eq(customers.organizationId, organizationId))
      .orderBy(asc(customers.fullName)) as SelectCustomer[];
    return { data, error: null };
  } catch {
    return dbErr('Failed to fetch customers');
  }
}

export async function getCustomerById(
  organizationId: string,
  customerId: string,
): Promise<Result<SelectCustomer>> {
  try {
    const rows = await db
      .select(DETAIL).from(customers)
      .where(and(eq(customers.organizationId, organizationId), eq(customers.id, customerId)))
      .limit(1) as SelectCustomer[];
    if (!rows[0]) return { data: null, error: { message: 'Customer not found', code: 'NOT_FOUND' } };
    return { data: rows[0], error: null };
  } catch {
    return dbErr('Failed to fetch customer');
  }
}

/** CRM overview: customer list enriched with last-visit date and visit count. */
export async function getCustomersWithStats(
  organizationId: string,
): Promise<Result<CustomerWithStats[]>> {
  try {
    const rows = await db
      .select({
        id:             customers.id,
        organizationId: customers.organizationId,
        fullName:       customers.fullName,
        email:          customers.email,
        phone:          customers.phone,
        isGuest:        customers.isGuest,
        createdAt:      customers.createdAt,
        lastVisitAt:    sql<Date | null>`MAX(${appointments.startAt})`,
        visitCount:     sql<number>`COUNT(${appointments.id})::int`,
      })
      .from(customers)
      .leftJoin(
        appointments,
        and(
          eq(appointments.customerId, customers.id),
          eq(appointments.organizationId, customers.organizationId), // tenant isolation
          inArray(appointments.status, [...VISITED]),
        ),
      )
      .where(eq(customers.organizationId, organizationId))
      .groupBy(customers.id)
      .orderBy(asc(customers.fullName));
    return { data: rows as CustomerWithStats[], error: null };
  } catch {
    return dbErr('Failed to fetch customers with stats');
  }
}
