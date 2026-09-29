'use server';

import 'server-only';

import { z } from 'zod';
import { resolveTenantOrgId } from '@/shared/lib/resolve-tenant-org-id';
import { db } from '@/infrastructure/db';
import { customers } from '@/domains/customers/schema';

// ── Public types ──────────────────────────────────────────────
export type CreatedCustomer = { id: string; fullName: string };

export type CreateCustomerState =
  | { status: 'idle' }
  | { status: 'success'; data: CreatedCustomer }
  | { status: 'error'; message: string };

// ── Schema ────────────────────────────────────────────────────
const createSchema = z.object({
  fullName: z.string().min(2, 'Nombre mínimo 2 caracteres').max(120),
  phone:    z.string().max(30).optional(),
  email:    z.string().email('Email inválido').optional().or(z.literal('')),
});

// ── Action ────────────────────────────────────────────────────
export async function createCustomerAction(
  _prev: CreateCustomerState,
  formData: FormData,
): Promise<CreateCustomerState> {
  // Tenant from an active membership in the request's tenant — never from
  // user_metadata, which the signed-in user can rewrite via the Auth API.
  const auth = await resolveTenantOrgId();
  if ('error' in auth) return { status: 'error', message: auth.error };
  const { orgId } = auth;

  const rawEmail = (formData.get('email') as string | null) ?? '';
  const parsed = createSchema.safeParse({
    fullName: formData.get('fullName'),
    phone:    formData.get('phone')  || undefined,
    email:    rawEmail               || undefined,
  });
  if (!parsed.success) {
    return { status: 'error', message: parsed.error.issues[0]?.message ?? 'Datos inválidos' };
  }

  try {
    const [row] = await db
      .insert(customers)
      .values({
        organizationId: orgId,
        fullName:       parsed.data.fullName,
        phone:          parsed.data.phone  ?? null,
        email:          parsed.data.email?.toLowerCase() || null,
        isGuest:        false,
      })
      .returning({ id: customers.id, fullName: customers.fullName });

    if (!row) throw new Error('Insert returned no rows');
    return { status: 'success', data: row };
  } catch {
    return { status: 'error', message: 'Error al crear cliente' };
  }
}
