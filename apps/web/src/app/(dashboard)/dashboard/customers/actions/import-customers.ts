'use server';

import 'server-only';
import { z } from 'zod';
import { eq, and, inArray } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { headers } from 'next/headers';
import { getTranslations } from 'next-intl/server';
import { db } from '@/infrastructure/db';
import { customers } from '@/infrastructure/db/schema/customers';
import { createSupabaseServerClient } from '@/infrastructure/supabase/server';
import { localeFromHeader } from '@/i18n/detect-locale';
import type { Result } from '@/shared/types/result';

async function getActionTranslations() {
  const hdrs = await headers();
  return getTranslations({ locale: localeFromHeader(hdrs.get('x-locale')), namespace: 'dashboard.customers.actions' });
}

const rowSchema = z.object({
  fullName: z.string().min(2).max(120),
  email:    z.string().email().optional().nullable(),
  phone:    z.string().max(30).optional().nullable(),
});

const inputSchema = z.object({
  rows: z.array(rowSchema).min(1).max(500),
});

export type ImportResult = { imported: number; skipped: number };

export async function importCustomersAction(
  raw: { rows: { fullName: string; email?: string | null; phone?: string | null }[] },
): Promise<Result<ImportResult>> {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  const t = await getActionTranslations();
  if (!user) return { data: null, error: { message: t('unauthorized'), code: 'AUTH_ERROR' } };

  const orgId = user.user_metadata.organization_id as string | undefined;
  if (!orgId) return { data: null, error: { message: t('noOrganization'), code: 'AUTH_ERROR' } };

  const parsed = inputSchema.safeParse(raw);
  if (!parsed.success) {
    const msg = parsed.error.issues[0]?.message ?? t('invalidInput');
    return { data: null, error: { message: msg, code: 'VALIDATION_ERROR' } };
  }

  const { rows } = parsed.data;

  // Deduplicate by email within this org — fetch only emails present in the batch
  const batchEmails = rows.flatMap(r => (r.email ? [r.email.toLowerCase()] : []));
  let existingEmails = new Set<string>();
  if (batchEmails.length > 0) {
    const existing = await db
      .select({ email: customers.email })
      .from(customers)
      .where(and(
        eq(customers.organizationId, orgId),
        inArray(customers.email, batchEmails),
      ));
    existingEmails = new Set(existing.flatMap(r => (r.email ? [r.email.toLowerCase()] : [])));
  }

  const toInsert = rows.filter(r => !r.email || !existingEmails.has(r.email.toLowerCase()));
  const skipped  = rows.length - toInsert.length;

  if (toInsert.length === 0) {
    revalidatePath('/dashboard/customers');
    return { data: { imported: 0, skipped }, error: null };
  }

  try {
    await db.insert(customers).values(
      toInsert.map(r => ({
        organizationId: orgId,
        fullName:       r.fullName,
        email:          r.email ?? null,
        phone:          r.phone ?? null,
        isGuest:        false,
        clientStatus:   'nuevo' as const,
      })),
    );
    revalidatePath('/dashboard/customers');
    return { data: { imported: toInsert.length, skipped }, error: null };
  } catch {
    return { data: null, error: { message: t('importFailed'), code: 'DB_ERROR' } };
  }
}
