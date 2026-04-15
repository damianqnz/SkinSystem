import 'server-only';

import { eq, and, asc } from 'drizzle-orm';
import { db } from '@/infrastructure/db';
import { customers } from './schema';
import type { SelectCustomer } from './schema';
import type { Result } from '@/shared/types/result';

const dbErr = (msg: string) =>
  ({ data: null, error: { message: msg, code: 'DB_ERROR' } }) as Result<never>;

const LIST   = { id: customers.id, organizationId: customers.organizationId, fullName: customers.fullName, phone: customers.phone, email: customers.email, isGuest: customers.isGuest, createdAt: customers.createdAt };
const DETAIL = { ...LIST, notes: customers.notes };

// ─────────────────────────────────────────────────────────────

export async function getCustomersList(
  organizationId: string,
): Promise<Result<SelectCustomer[]>> {
  try {
    const data = await db
      .select(LIST)
      .from(customers)
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
      .select(DETAIL)
      .from(customers)
      .where(and(
        eq(customers.organizationId, organizationId),
        eq(customers.id, customerId),
      ))
      .limit(1) as SelectCustomer[];
    if (!rows[0]) return { data: null, error: { message: 'Customer not found', code: 'NOT_FOUND' } };
    return { data: rows[0], error: null };
  } catch {
    return dbErr('Failed to fetch customer');
  }
}
