'use server';
import { eq } from 'drizzle-orm';

import { resolveTenantOrgId } from '@/shared/lib/resolve-tenant-org-id';
import 'server-only';

import { z } from 'zod';
import { createSupabaseServerClient } from '@/infrastructure/supabase/server';
import { db } from '@/infrastructure/db';
import { profiles } from '@/infrastructure/db/schema/organizations';
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
  // Auth — orgId ALWAYS from session (not spoofable)
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { status: 'error', message: 'No autorizado' };

  let orgId = user.user_metadata?.organization_id as string | undefined;
  // Fallback: profiles table (profiles.id === auth.users.id)
  if (!orgId) {
    const profileRows = await db.select({ organizationId: profiles.organizationId })
      .from(profiles).where(eq(profiles.id, user.id)).limit(1);
    orgId = profileRows[0]?.organizationId;
  }
    if (!orgId) return { status: 'error', message: 'Organización no encontrada' };

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
        email:          parsed.data.email  || null,
        isGuest:        false,
      })
      .returning({ id: customers.id, fullName: customers.fullName });

    if (!row) throw new Error('Insert returned no rows');
    return { status: 'success', data: row };
  } catch {
    return { status: 'error', message: 'Error al crear cliente' };
  }
}
