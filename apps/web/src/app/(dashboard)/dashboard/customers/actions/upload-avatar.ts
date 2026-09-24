'use server';
import 'server-only';

import { createClient } from '@supabase/supabase-js';
import { eq, and }      from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { createServerClient } from '@supabase/ssr';
import { cookies, headers }   from 'next/headers';
import { getTranslations }    from 'next-intl/server';
import { db }                 from '@/infrastructure/db';
import { profiles } from '@/infrastructure/db/schema/organizations';
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
  const jar  = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    { cookies: { getAll: () => jar.getAll(), setAll: (pairs) => pairs.forEach(({ name, value, options }) => jar.set(name, value, options)) } },
  );

  const { data: { user }, error: authErr } = await supabase.auth.getUser();
  const t = await getActionTranslations();
  if (authErr || !user) return { data: null, error: { message: t('unauthorized'), code: 'UNAUTHORIZED' } };

  let orgId = user.user_metadata?.organization_id as string | undefined;
  // Fallback: profiles table (profiles.id === auth.users.id)
  if (!orgId) {
    const profileRows = await db.select({ organizationId: profiles.organizationId })
      .from(profiles).where(eq(profiles.id, user.id)).limit(1);
    orgId = profileRows[0]?.organizationId;
  }
    if (!orgId) return { data: null, error: { message: t('noOrganization'), code: 'UNAUTHORIZED' } };

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
