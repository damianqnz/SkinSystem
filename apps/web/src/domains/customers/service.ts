import 'server-only';

import { eq, and, asc, inArray, sql, or, ilike } from 'drizzle-orm';
import { db } from '@/infrastructure/db';
import { customers } from './schema';
import { appointments } from '@/infrastructure/db/schema/booking';
import type { SelectCustomer } from './schema';
import type { Result } from '@/shared/types/result';

const dbErr = (msg: string) =>
  ({ data: null, error: { message: msg, code: 'DB_ERROR' } }) as Result<never>;

const LIST   = { id: customers.id, organizationId: customers.organizationId, fullName: customers.fullName, phone: customers.phone, email: customers.email, isGuest: customers.isGuest, createdAt: customers.createdAt, clientStatus: customers.clientStatus, isBlocked: customers.isBlocked, avatarUrl: customers.avatarUrl, company: customers.company, country: customers.country, countryIso: customers.countryIso, address: customers.address, city: customers.city, state: customers.state, postalCode: customers.postalCode, socialLinks: customers.socialLinks };
const DETAIL = { ...LIST, notes: customers.notes };

const VISITED = ['completed', 'confirmed'] as const;

// ── Client lifecycle status ───────────────────────────────────
export type ClientStatus = 'nuevo' | 'recurrente' | 'riesgo' | 'inactivo' | 'perdido';

export function getClientStatus(totalVisits: number, lastVisitAt: Date | null): ClientStatus {
  if (lastVisitAt) {
    const d = Math.floor((Date.now() - lastVisitAt.getTime()) / 86_400_000);
    if (d >= 60) return 'perdido';
    if (d >= 45) return 'inactivo';
    if (d >= 30) return 'riesgo';
  }
  return totalVisits >= 2 ? 'recurrente' : 'nuevo';
}

// ── Public type for CRM table (includes visit stats) ─────────
export type CustomerWithStats = {
  id: string; organizationId: string;
  fullName: string; email: string | null; phone: string | null;
  isGuest: boolean; createdAt: Date;
  lastVisitAt: Date | null; visitCount: number;
  status: ClientStatus;
  isBlocked: boolean;
  avatarUrl: string | null;
  notes?: string | null;
  company: string | null; country: string | null; countryIso: string | null;
  address: string | null; city: string | null; state: string | null;
  postalCode: string | null;
  socialLinks: Record<string, unknown> | null;
};

// ─────────────────────────────────────────────────────────────

export async function getCustomersList(
  organizationId: string,
  query?: string,
): Promise<Result<SelectCustomer[]>> {
  try {
    const baseFilter = eq(customers.organizationId, organizationId);
    const where = query
      ? and(baseFilter, or(
          ilike(customers.fullName, `%${query}%`),
          ilike(customers.email,    `%${query}%`),
          ilike(customers.phone,    `%${query}%`),
        ))
      : baseFilter;
    const data = await db
      .select(LIST).from(customers)
      .where(where)
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
        clientStatus:   customers.clientStatus,
        isBlocked:      customers.isBlocked,
        avatarUrl:      customers.avatarUrl,
        company:        customers.company,
        country:        customers.country,
        address:        customers.address,
        city:           customers.city,
        state:          customers.state,
        postalCode:     customers.postalCode,
        socialLinks:    customers.socialLinks,
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
    const out: CustomerWithStats[] = rows.map((r) => {
      const visitCount = Number(r.visitCount ?? 0);
      const lastVisitAt = r.lastVisitAt instanceof Date ? r.lastVisitAt : r.lastVisitAt ? new Date(String(r.lastVisitAt)) : null;
      // Prefer DB-stored status (updated nightly by pg_cron); fall back to in-process compute
      const status: ClientStatus = (r.clientStatus as ClientStatus) ?? getClientStatus(visitCount, lastVisitAt);
      return { id: r.id, organizationId: r.organizationId, fullName: r.fullName, email: r.email, phone: r.phone, isGuest: r.isGuest, createdAt: r.createdAt, lastVisitAt, visitCount, status, isBlocked: r.isBlocked, avatarUrl: r.avatarUrl ?? null, company: r.company ?? null, country: r.country ?? null, countryIso: (r as Record<string, unknown>).countryIso as string ?? null, address: r.address ?? null, city: r.city ?? null, state: r.state ?? null, postalCode: r.postalCode ?? null, socialLinks: (r.socialLinks as Record<string, unknown>) ?? null };
    });
    return { data: out, error: null };
  } catch {
    return dbErr('Failed to fetch customers with stats');
  }
}

/** Single customer with visit stats — used for CRM profile page. */
export async function getCustomerProfile(
  organizationId: string,
  customerId: string,
): Promise<Result<CustomerWithStats>> {
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
        clientStatus:   customers.clientStatus,
        isBlocked:      customers.isBlocked,
        avatarUrl:      customers.avatarUrl,
        company:        customers.company,
        country:        customers.country,
        countryIso:     customers.countryIso,
        address:        customers.address,
        city:           customers.city,
        state:          customers.state,
        postalCode:     customers.postalCode,
        notes:          customers.notes,
        socialLinks:    customers.socialLinks,
        lastVisitAt:    sql<Date | null>`MAX(${appointments.startAt})`,
        visitCount:     sql<number>`COUNT(${appointments.id})::int`,
      })
      .from(customers)
      .leftJoin(appointments, and(
        eq(appointments.customerId, customers.id),
        eq(appointments.organizationId, customers.organizationId),
        inArray(appointments.status, [...VISITED]),
      ))
      .where(and(eq(customers.organizationId, organizationId), eq(customers.id, customerId)))
      .groupBy(customers.id)
      .limit(1);
    if (!rows[0]) return { data: null, error: { message: 'Customer not found', code: 'NOT_FOUND' } };
    const r = rows[0];
    const visitCount  = Number(r.visitCount ?? 0);
    const lastVisitAt = r.lastVisitAt instanceof Date ? r.lastVisitAt : r.lastVisitAt ? new Date(String(r.lastVisitAt)) : null;
    const status: ClientStatus = (r.clientStatus as ClientStatus) ?? getClientStatus(visitCount, lastVisitAt);
    return {
      data: { id: r.id, organizationId: r.organizationId, fullName: r.fullName, email: r.email, phone: r.phone, isGuest: r.isGuest, createdAt: r.createdAt, lastVisitAt, visitCount, status, isBlocked: r.isBlocked, avatarUrl: r.avatarUrl ?? null, notes: r.notes ?? null, company: r.company ?? null, country: r.country ?? null, countryIso: r.countryIso ?? null, address: r.address ?? null, city: r.city ?? null, state: r.state ?? null, postalCode: r.postalCode ?? null, socialLinks: (r.socialLinks as Record<string, unknown>) ?? null },
      error: null,
    };
  } catch {
    return dbErr('Failed to fetch customer profile');
  }
}
