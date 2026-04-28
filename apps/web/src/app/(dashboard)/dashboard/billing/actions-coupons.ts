'use server';

import { resolveTenantOrgId } from '@/shared/lib/resolve-tenant-org-id';
import { revalidatePath }             from 'next/cache';
import { z }                          from 'zod';
import { eq, and }                    from 'drizzle-orm';
import { db }                         from '@/infrastructure/db';
import { coupons }                    from '@/domains/booking/schema';
import type { Result }                from '@/shared/types/result';

// ── Types ─────────────────────────────────────────────────────

export type CouponRow = {
  id:            string;
  code:          string;
  discountType:  'percent' | 'fixed';
  discountValue: string;
  maxUses:       number | null;
  usesCount:     number;
  validFrom:     string;
  validUntil:    string | null;
  isActive:      boolean;
};

// ── Auth helper ───────────────────────────────────────────────

function revalidate() { revalidatePath('/dashboard/billing'); }

// ── Get ───────────────────────────────────────────────────────

export async function getCouponsAction(): Promise<Result<CouponRow[]>> {
  const auth = await resolveTenantOrgId();
  if ('error' in auth) return { data: null, error: { message: auth.error, code: 'AUTH_ERROR' } };

  const rows = await db
    .select({ id: coupons.id, code: coupons.code, discountType: coupons.discountType,
              discountValue: coupons.discountValue, maxUses: coupons.maxUses,
              usesCount: coupons.usesCount, validFrom: coupons.validFrom,
              validUntil: coupons.validUntil, isActive: coupons.isActive })
    .from(coupons)
    .where(eq(coupons.organizationId, auth.orgId))
    .orderBy(coupons.createdAt);

  return { data: rows as CouponRow[], error: null };
}

// ── Zod schema ────────────────────────────────────────────────

const couponSchema = z.object({
  code:          z.string().min(2).max(30).toUpperCase(),
  discountType:  z.enum(['percent', 'fixed']),
  discountValue: z.number().positive().max(100000),
  maxUses:       z.number().int().positive().nullable().optional(),
  validFrom:     z.string().min(1),
  validUntil:    z.string().nullable().optional(),
});

// ── Create ────────────────────────────────────────────────────

export async function createCouponAction(raw: unknown): Promise<Result<CouponRow>> {
  const auth = await resolveTenantOrgId();
  if ('error' in auth) return { data: null, error: { message: auth.error, code: 'AUTH_ERROR' } };

  const parsed = couponSchema.safeParse(raw);
  if (!parsed.success) return { data: null, error: { message: parsed.error.issues[0]?.message ?? 'Datos inválidos', code: 'VALIDATION_ERROR' } };

  try {
    const rows = await db.insert(coupons)
      .values({
        organizationId: auth.orgId,
        code:           parsed.data.code,
        discountType:   parsed.data.discountType,
        discountValue:  String(parsed.data.discountValue),
        maxUses:        parsed.data.maxUses ?? null,
        validFrom:      parsed.data.validFrom,
        validUntil:     parsed.data.validUntil ?? null,
        isActive:       true,
      })
      .returning();

    if (!rows[0]) return { data: null, error: { message: 'Erro ao criar cupão', code: 'DB_ERROR' } };
    revalidate();
    return { data: rows[0] as CouponRow, error: null };
  } catch {
    return { data: null, error: { message: 'Código já existe para esta organização', code: 'DUPLICATE' } };
  }
}

// ── Update ────────────────────────────────────────────────────

export async function updateCouponAction(id: string, raw: unknown): Promise<Result<CouponRow>> {
  const auth = await resolveTenantOrgId();
  if ('error' in auth) return { data: null, error: { message: auth.error, code: 'AUTH_ERROR' } };

  const parsed = couponSchema.safeParse(raw);
  if (!parsed.success) return { data: null, error: { message: parsed.error.issues[0]?.message ?? 'Datos inválidos', code: 'VALIDATION_ERROR' } };

  const rows = await db.update(coupons)
    .set({
      code: parsed.data.code, discountType: parsed.data.discountType,
      discountValue: String(parsed.data.discountValue),
      maxUses: parsed.data.maxUses ?? null,
      validFrom: parsed.data.validFrom, validUntil: parsed.data.validUntil ?? null,
      updatedAt: new Date(),
    })
    .where(and(eq(coupons.id, id), eq(coupons.organizationId, auth.orgId)))
    .returning();

  if (!rows[0]) return { data: null, error: { message: 'Não encontrado', code: 'NOT_FOUND' } };
  revalidate();
  return { data: rows[0] as CouponRow, error: null };
}

// ── Toggle active ─────────────────────────────────────────────

export async function toggleCouponAction(id: string, isActive: boolean): Promise<{ error?: string }> {
  const auth = await resolveTenantOrgId();
  if ('error' in auth) return { error: auth.error };

  await db.update(coupons)
    .set({ isActive, updatedAt: new Date() })
    .where(and(eq(coupons.id, id), eq(coupons.organizationId, auth.orgId)));

  revalidate();
  return {};
}

// ── Delete ────────────────────────────────────────────────────

export async function deleteCouponAction(id: string): Promise<{ error?: string }> {
  const auth = await resolveTenantOrgId();
  if ('error' in auth) return { error: auth.error };

  await db.delete(coupons)
    .where(and(eq(coupons.id, id), eq(coupons.organizationId, auth.orgId)));

  revalidate();
  return {};
}
