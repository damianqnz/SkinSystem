'use server';

import 'server-only';

import { z } from 'zod';
import { resolveTenantOrgId } from '@/shared/lib/resolve-tenant-org-id';
import { headers } from 'next/headers';
import { getTranslations } from 'next-intl/server';
import { localeFromHeader } from '@/i18n/detect-locale';
import { db } from '@/infrastructure/db';
import { customers } from '@/domains/customers/schema';

async function getActionTranslations() {
  const hdrs = await headers();
  return getTranslations({ locale: localeFromHeader(hdrs.get('x-locale')), namespace: 'dashboard.calendar.actions' });
}

// ── Public types ──────────────────────────────────────────────
export type CreatedCustomer = { id: string; fullName: string };

export type CreateCustomerState =
  | { status: 'idle' }
  | { status: 'success'; data: CreatedCustomer }
  | { status: 'error'; message: string };

// ── Schema ────────────────────────────────────────────────────
const createSchema = z.object({
  // No user-facing text here: the action maps each issue to a translated key
  // by `path`, so the schema stays free of copy (and of Zod's English text).
  fullName: z.string().min(2).max(120),
  phone:    z.string().max(30).optional(),
  email:    z.string().email().optional().or(z.literal('')),
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
  const t = await getActionTranslations();

  const rawEmail = (formData.get('email') as string | null) ?? '';
  const parsed = createSchema.safeParse({
    fullName: formData.get('fullName'),
    phone:    formData.get('phone')  || undefined,
    email:    rawEmail               || undefined,
  });
  if (!parsed.success) {
    switch (parsed.error.issues[0]?.path[0]) {
      case 'fullName': return { status: 'error', message: t('invalidName') };
      case 'email':    return { status: 'error', message: t('invalidEmail') };
      default:         return { status: 'error', message: t('invalidData') };
    }
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
    return { status: 'error', message: t('errorCreatingCustomer') };
  }
}
