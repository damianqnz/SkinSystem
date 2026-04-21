'use server';

import { revalidatePath }             from 'next/cache';
import { z }                          from 'zod';
import { eq, and }                    from 'drizzle-orm';
import { createSupabaseServerClient } from '@/infrastructure/supabase/server';
import { db }                         from '@/infrastructure/db';
import { bookingSettings }            from '@/domains/booking/schema';
import { getPaymentHistory }          from '@/domains/billing/service-history';
import type { PaymentHistoryRow }     from '@/domains/billing/service-history';
import type { Result }                from '@/shared/types/result';

// ── Auth helper ───────────────────────────────────────────────

async function resolveOrgId(): Promise<{ orgId: string } | { error: string }> {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'No autorizado' };
  const orgId = user.user_metadata?.organization_id as string | undefined;
  if (!orgId) return { error: 'Organización no encontrada' };
  return { orgId };
}

// ── Toggle: online payments ───────────────────────────────────

export async function toggleOnlinePaymentAction(
  enabled: boolean,
): Promise<{ error?: string }> {
  const auth = await resolveOrgId();
  if ('error' in auth) return { error: auth.error };

  try {
    await db
      .update(bookingSettings)
      .set({ onlinePaymentEnabled: enabled, updatedAt: new Date() })
      .where(eq(bookingSettings.organizationId, auth.orgId));

    revalidatePath('/dashboard/billing');
    return {};
  } catch {
    return { error: 'No se pudo actualizar la configuración' };
  }
}

// ── Toggle: advance payment required ─────────────────────────

export async function toggleAdvancePaymentAction(
  required: boolean,
): Promise<{ error?: string }> {
  const auth = await resolveOrgId();
  if ('error' in auth) return { error: auth.error };

  try {
    await db
      .update(bookingSettings)
      .set({ advancePaymentRequired: required, updatedAt: new Date() })
      .where(eq(bookingSettings.organizationId, auth.orgId));

    revalidatePath('/dashboard/billing');
    return {};
  } catch {
    return { error: 'No se pudo actualizar la configuración' };
  }
}

// ── Fetch payment history (date range) ───────────────────────

const rangeSchema = z.object({
  from: z.string().min(1),   // YYYY-MM-DD
  to:   z.string().min(1),   // YYYY-MM-DD
});

export async function getPaymentHistoryAction(
  raw: unknown,
): Promise<Result<PaymentHistoryRow[]>> {
  const auth = await resolveOrgId();
  if ('error' in auth) return { data: null, error: { message: auth.error, code: 'AUTH_ERROR' } };

  const parsed = rangeSchema.safeParse(raw);
  if (!parsed.success) {
    return { data: null, error: { message: 'Fechas inválidas', code: 'VALIDATION_ERROR' } };
  }

  const fromDate = new Date(parsed.data.from + 'T00:00:00Z');
  const toDate   = new Date(parsed.data.to   + 'T23:59:59Z');

  if (isNaN(fromDate.getTime()) || isNaN(toDate.getTime())) {
    return { data: null, error: { message: 'Fechas inválidas', code: 'VALIDATION_ERROR' } };
  }

  return getPaymentHistory(auth.orgId, fromDate, toDate);
}
