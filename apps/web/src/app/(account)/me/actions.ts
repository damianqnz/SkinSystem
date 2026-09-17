'use server';

import { z }                from 'zod';
import { headers }          from 'next/headers';
import { revalidatePath }   from 'next/cache';
import { getTranslations }  from 'next-intl/server';
import { localeFromHeader } from '@/i18n/detect-locale';
import { getOrganizationBySlug } from '@/domains/organizations/service';
import { createSupabaseServerClient }  from '@/infrastructure/supabase/server';
import { getMyCustomer, updateMyProfile } from '@/domains/customers/service-me';

async function getActionTranslations() {
  const hdrs = await headers();
  return getTranslations({ locale: localeFromHeader(hdrs.get('x-locale')), namespace: 'account.me.perfil.errors' });
}

// ── State type ────────────────────────────────────────────────

export type ProfileState =
  | { status: 'idle' }
  | { status: 'success' }
  | { status: 'error'; message: string };

// ── updateProfileAction ───────────────────────────────────────

const profileSchema = z.object({
  fullName: z.string().min(2).max(100),
  phone:    z.string().max(30).optional(),
});

export async function updateProfileAction(
  _prev: ProfileState,
  raw:   unknown,
): Promise<ProfileState> {
  const hdrs = await headers();
  const slug = hdrs.get('x-tenant-slug') ?? '';
  const t    = await getActionTranslations();

  // Auth check
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user?.email) {
    return { status: 'error', message: t('notAuthorized') };
  }

  const parsed = profileSchema.safeParse(raw);
  if (!parsed.success) {
    return { status: 'error', message: t('invalidData') };
  }

  const orgResult = await getOrganizationBySlug(slug);
  if (orgResult.error || !orgResult.data) {
    return { status: 'error', message: t('orgNotFound') };
  }

  const customerResult = await getMyCustomer(orgResult.data.id, user.email);
  if (customerResult.error || !customerResult.data) {
    return { status: 'error', message: t('profileNotFound') };
  }

  const result = await updateMyProfile(
    orgResult.data.id,
    customerResult.data.id,
    { fullName: parsed.data.fullName, phone: parsed.data.phone ?? '' },
  );

  if (result.error) {
    return { status: 'error', message: result.error.message };
  }

  revalidatePath('/me');
  return { status: 'success' };
}
