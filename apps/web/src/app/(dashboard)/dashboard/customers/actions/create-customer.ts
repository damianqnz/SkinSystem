'use server';
import 'server-only';

import { z }                  from 'zod';
import { revalidatePath }     from 'next/cache';
import { headers }            from 'next/headers';
import { getTranslations }    from 'next-intl/server';
import { resolveTenantOrgId } from '@/shared/lib/resolve-tenant-org-id';
import { db }                 from '@/infrastructure/db';
import { customers }          from '@/infrastructure/db/schema/customers';
import { isUniqueViolation, CUSTOMERS_ORG_EMAIL_UNIQUE_INDEX } from '@/infrastructure/db/unique-violation';
import { uploadAvatarAction } from './upload-avatar';
import { localeFromHeader }   from '@/i18n/detect-locale';
import type { Result }        from '@/shared/types/result';

async function getActionTranslations() {
  const hdrs = await headers();
  return getTranslations({ locale: localeFromHeader(hdrs.get('x-locale')), namespace: 'dashboard.customers.actions' });
}

const schema = z.object({
  fullName:    z.string().min(2).max(120),
  email:       z.string().email().optional().nullable(),
  phone:       z.string().max(30).optional().nullable(),
  company:     z.string().max(200).optional().nullable(),
  country:     z.string().max(100).optional().nullable(),
  countryIso:  z.string().max(2).optional().nullable(),
  address:     z.string().max(300).optional().nullable(),
  city:        z.string().max(100).optional().nullable(),
  state:       z.string().max(100).optional().nullable(),
  postalCode:  z.string().max(20).optional().nullable(),
  socialLinks: z.record(z.string(), z.unknown()).optional().nullable(),
});

export async function createCustomerAction(
  formData: FormData,
): Promise<Result<{ id: string }>> {
  const auth = await resolveTenantOrgId();
  if ('error' in auth) return { data: null, error: { message: auth.error, code: auth.code } };
  const orgId = auth.orgId;

  const t = await getActionTranslations();

  const raw = {
    fullName:    formData.get('fullName'),
    email:       formData.get('email') || null,
    phone:       formData.get('phone') || null,
    company:     formData.get('company') || null,
    country:     formData.get('country') || null,
    countryIso:  formData.get('countryIso') || null,
    address:     formData.get('address') || null,
    city:        formData.get('city') || null,
    state:       formData.get('state') || null,
    postalCode:  formData.get('postalCode') || null,
    socialLinks: (() => { try { const v = formData.get('socialLinks'); return v ? JSON.parse(v as string) : null; } catch { return null; } })(),
  };

  const parsed = schema.safeParse(raw);
  if (!parsed.success) return { data: null, error: { message: parsed.error.issues[0]?.message ?? t('invalidInput'), code: 'VALIDATION_ERROR' } };

  const { fullName, email, phone, company, country, countryIso, address, city, state, postalCode, socialLinks } = parsed.data;

  // Stored lower-case so it matches uq_customers_org_email (organization_id, lower(email)).
  const normalizedEmail = email ? email.toLowerCase() : null;

  let inserted: { id: string } | undefined;
  try {
    [inserted] = await db.insert(customers).values({
      organizationId: orgId,
      fullName,
      email:       normalizedEmail,
      phone:       phone ?? null,
      company:     company ?? null,
      country:     country ?? null,
      countryIso:  countryIso ?? null,
      address:     address ?? null,
      city:        city ?? null,
      state:       state ?? null,
      postalCode:  postalCode ?? null,
      socialLinks: socialLinks ?? {},
    }).returning({ id: customers.id });
  } catch (error) {
    if (isUniqueViolation(error, CUSTOMERS_ORG_EMAIL_UNIQUE_INDEX)) {
      return { data: null, error: { message: t('duplicateEmail'), code: 'DUPLICATE_EMAIL' } };
    }
    throw error;
  }

  if (!inserted) return { data: null, error: { message: t('failedToCreate'), code: 'DB_ERROR' } };

  const avatarFile = formData.get('avatar') as File | null;
  if (avatarFile && avatarFile.size > 0) {
    const avatarFd = new FormData();
    avatarFd.append('avatar', avatarFile);
    await uploadAvatarAction(inserted.id, avatarFd);
  }

  revalidatePath('/dashboard/customers');
  return { data: { id: inserted.id }, error: null };
}
