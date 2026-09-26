'use server';
import 'server-only';

import { z }                  from 'zod';
import { eq, and }            from 'drizzle-orm';
import { revalidatePath }     from 'next/cache';
import { headers }            from 'next/headers';
import { getTranslations }    from 'next-intl/server';
import { resolveTenantOrgId } from '@/shared/lib/resolve-tenant-org-id';
import { db }                 from '@/infrastructure/db';
import { customers }          from '@/infrastructure/db/schema/customers';
import { isUniqueViolation, CUSTOMERS_ORG_EMAIL_UNIQUE_INDEX } from '@/infrastructure/db/unique-violation';
import { localeFromHeader }   from '@/i18n/detect-locale';
import type { Result }        from '@/shared/types/result';

async function getActionTranslations() {
  const hdrs = await headers();
  return getTranslations({ locale: localeFromHeader(hdrs.get('x-locale')), namespace: 'dashboard.customers.actions' });
}

const schema = z.object({
  id:          z.string().uuid(),
  fullName:    z.string().min(2).max(120),
  email:       z.string().email().optional().nullable(),
  phone:       z.string().max(30).optional().nullable(),
  notes:       z.string().max(1000).optional().nullable(),
  company:     z.string().max(200).optional().nullable(),
  country:     z.string().max(100).optional().nullable(),
  countryIso:  z.string().max(2).optional().nullable(),
  address:     z.string().max(300).optional().nullable(),
  city:        z.string().max(100).optional().nullable(),
  state:       z.string().max(100).optional().nullable(),
  postalCode:  z.string().max(20).optional().nullable(),
  socialLinks: z.record(z.string(), z.unknown()).optional().nullable(),
});

export async function updateCustomerAction(
  raw: unknown,
): Promise<Result<void>> {
  const auth = await resolveTenantOrgId();
  if ('error' in auth) return { data: null, error: { message: auth.error, code: auth.code } };
  const orgId = auth.orgId;

  const t = await getActionTranslations();

  const parsed = schema.safeParse(raw);
  if (!parsed.success) return { data: null, error: { message: parsed.error.issues[0]?.message ?? t('invalidInput'), code: 'VALIDATION_ERROR' } };

  const { id, fullName, email, phone, notes, company, country, countryIso, address, city, state, postalCode, socialLinks } = parsed.data;

  try {
    await db.update(customers)
      .set({
        fullName,
        // Stored lower-case so it matches uq_customers_org_email (organization_id, lower(email)).
        email:       email ? email.toLowerCase() : null,
        phone:       phone ?? null,
        notes:       notes ?? null,
        company:     company ?? null,
        country:     country ?? null,
        countryIso:  countryIso ?? null,
        address:     address ?? null,
        city:        city ?? null,
        state:       state ?? null,
        postalCode:  postalCode ?? null,
        socialLinks: socialLinks ?? {},
      })
      .where(and(eq(customers.id, id), eq(customers.organizationId, orgId)));
  } catch (error) {
    if (isUniqueViolation(error, CUSTOMERS_ORG_EMAIL_UNIQUE_INDEX)) {
      return { data: null, error: { message: t('duplicateEmail'), code: 'DUPLICATE_EMAIL' } };
    }
    throw error;
  }

  revalidatePath(`/dashboard/customers/${id}`);
  revalidatePath('/dashboard/customers');
  return { data: undefined, error: null };
}
