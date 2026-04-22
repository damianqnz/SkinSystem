'use server';

import { resolveTenantOrgId } from '@/shared/lib/resolve-tenant-org-id';
import { revalidatePath }             from 'next/cache';
import { z }                          from 'zod';
import { eq, and }                    from 'drizzle-orm';
import { db }                         from '@/infrastructure/db';
import { paymentSurcharges }          from '@/domains/billing/schema';
import type { Result }                from '@/shared/types/result';

// ── Types ─────────────────────────────────────────────────────

export type SurchargeRow = {
  id:          string;
  name:        string;
  valueType:   'percent' | 'fixed';
  value:       string;
  isReduction: boolean;
  isActive:    boolean;
};

// ── Auth helper ───────────────────────────────────────────────

function revalidate() { revalidatePath('/dashboard/billing'); }

// ── Get ───────────────────────────────────────────────────────

export async function getSurchargesAction(): Promise<Result<SurchargeRow[]>> {
  const auth = await resolveTenantOrgId();
  if ('error' in auth) return { data: null, error: { message: auth.error, code: 'AUTH_ERROR' } };

  const rows = await db
    .select({ id: paymentSurcharges.id, name: paymentSurcharges.name,
              valueType: paymentSurcharges.valueType, value: paymentSurcharges.value,
              isReduction: paymentSurcharges.isReduction, isActive: paymentSurcharges.isActive })
    .from(paymentSurcharges)
    .where(eq(paymentSurcharges.organizationId, auth.orgId))
    .orderBy(paymentSurcharges.createdAt);

  return { data: rows as SurchargeRow[], error: null };
}

// ── Zod schema ────────────────────────────────────────────────

const surchargeSchema = z.object({
  name:        z.string().min(1).max(80),
  valueType:   z.enum(['percent', 'fixed']),
  value:       z.number().positive().max(100000),
  isReduction: z.boolean(),
});

// ── Create ────────────────────────────────────────────────────

export async function createSurchargeAction(raw: unknown): Promise<Result<SurchargeRow>> {
  const auth = await resolveTenantOrgId();
  if ('error' in auth) return { data: null, error: { message: auth.error, code: 'AUTH_ERROR' } };

  const parsed = surchargeSchema.safeParse(raw);
  if (!parsed.success) return { data: null, error: { message: parsed.error.issues[0]?.message ?? 'Datos inválidos', code: 'VALIDATION_ERROR' } };

  // Enforce limits: max 2 taxes, max 1 reduction
  const existing = await db
    .select({ isReduction: paymentSurcharges.isReduction })
    .from(paymentSurcharges)
    .where(eq(paymentSurcharges.organizationId, auth.orgId));

  const taxes      = existing.filter((r) => !r.isReduction).length;
  const reductions = existing.filter((r) =>  r.isReduction).length;

  if (!parsed.data.isReduction && taxes >= 2)      return { data: null, error: { message: 'Limite de 2 taxas atingido', code: 'LIMIT_EXCEEDED' } };
  if ( parsed.data.isReduction && reductions >= 1) return { data: null, error: { message: 'Limite de 1 redução atingido', code: 'LIMIT_EXCEEDED' } };

  const rows = await db.insert(paymentSurcharges)
    .values({ organizationId: auth.orgId, name: parsed.data.name,
              valueType: parsed.data.valueType, value: String(parsed.data.value),
              isReduction: parsed.data.isReduction })
    .returning();

  if (!rows[0]) return { data: null, error: { message: 'Erro ao criar', code: 'DB_ERROR' } };
  revalidate();
  return { data: rows[0] as SurchargeRow, error: null };
}

// ── Update ────────────────────────────────────────────────────

export async function updateSurchargeAction(id: string, raw: unknown): Promise<Result<SurchargeRow>> {
  const auth = await resolveTenantOrgId();
  if ('error' in auth) return { data: null, error: { message: auth.error, code: 'AUTH_ERROR' } };

  const parsed = surchargeSchema.safeParse(raw);
  if (!parsed.success) return { data: null, error: { message: parsed.error.issues[0]?.message ?? 'Datos inválidos', code: 'VALIDATION_ERROR' } };

  const rows = await db.update(paymentSurcharges)
    .set({ name: parsed.data.name, valueType: parsed.data.valueType,
           value: String(parsed.data.value), isReduction: parsed.data.isReduction, updatedAt: new Date() })
    .where(and(eq(paymentSurcharges.id, id), eq(paymentSurcharges.organizationId, auth.orgId)))
    .returning();

  if (!rows[0]) return { data: null, error: { message: 'Não encontrado', code: 'NOT_FOUND' } };
  revalidate();
  return { data: rows[0] as SurchargeRow, error: null };
}

// ── Delete ────────────────────────────────────────────────────

export async function deleteSurchargeAction(id: string): Promise<{ error?: string }> {
  const auth = await resolveTenantOrgId();
  if ('error' in auth) return { error: auth.error };

  await db.delete(paymentSurcharges)
    .where(and(eq(paymentSurcharges.id, id), eq(paymentSurcharges.organizationId, auth.orgId)));

  revalidate();
  return {};
}
