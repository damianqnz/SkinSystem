'use server';
import 'server-only';

import { createClient } from '@supabase/supabase-js';
import { eq, and }      from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { headers }        from 'next/headers';
import { getTranslations }    from 'next-intl/server';
import { resolveTenantOrgId } from '@/shared/lib/resolve-tenant-org-id';
import { db }                 from '@/infrastructure/db';
import { customers }          from '@/infrastructure/db/schema/customers';
import { localeFromHeader }   from '@/i18n/detect-locale';
import type { Result }        from '@/shared/types/result';

async function getActionTranslations() {
  const hdrs = await headers();
  return getTranslations({ locale: localeFromHeader(hdrs.get('x-locale')), namespace: 'dashboard.customers.actions' });
}

const MAX_BYTES = 2 * 1024 * 1024; // 2 MB
const BUCKET    = 'customer-avatars';

export async function uploadAvatarAction(
  customerId: string,
  formData:   FormData,
): Promise<Result<{ avatarUrl: string }>> {
  const auth = await resolveTenantOrgId();
  if ('error' in auth) return { data: null, error: { message: auth.error, code: auth.code } };
  const orgId = auth.orgId;

  const t = await getActionTranslations();

  const file = formData.get('avatar');
  if (!(file instanceof File)) return { data: null, error: { message: t('noFileProvided'), code: 'VALIDATION_ERROR' } };
  if (file.size > MAX_BYTES)   return { data: null, error: { message: t('fileTooLarge'), code: 'VALIDATION_ERROR' } };
  if (!file.type.startsWith('image/')) return { data: null, error: { message: t('invalidFileType'), code: 'VALIDATION_ERROR' } };

  const ext  = file.name.split('.').pop() ?? 'jpg';
  const path = `${orgId}/${customerId}.${ext}`;

  const adminClient = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );

  const { error: uploadErr } = await adminClient.storage.from(BUCKET).upload(path, file, { upsert: true, contentType: file.type });
  if (uploadErr) return { data: null, error: { message: uploadErr.message, code: 'STORAGE_ERROR' } };

  const { data: { publicUrl } } = adminClient.storage.from(BUCKET).getPublicUrl(path);

  await db.update(customers)
    .set({ avatarUrl: publicUrl })
    .where(and(eq(customers.id, customerId), eq(customers.organizationId, orgId)));

  revalidatePath(`/dashboard/customers/${customerId}`);
  return { data: { avatarUrl: publicUrl }, error: null };
}
