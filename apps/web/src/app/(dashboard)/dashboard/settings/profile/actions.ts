'use server';

import { headers }         from 'next/headers';
import { revalidatePath }  from 'next/cache';
import { getTranslations } from 'next-intl/server';
import { z }                from 'zod';
import { eq }                from 'drizzle-orm';
import { createClient }      from '@supabase/supabase-js';
import { db }                 from '@/infrastructure/db';
import { profiles }           from '@/infrastructure/db/schema/organizations';
import { resolveTenantOrgId } from '@/shared/lib/resolve-tenant-org-id';
import { localeFromHeader }   from '@/i18n/detect-locale';
import { UPLOAD_MAX_BYTES, ALLOWED_IMAGE_TYPES } from '@/shared/config/uploads';
import type { Result } from '@/shared/types/result';

const AVATAR_BUCKET = 'staff-avatars';

async function getActionTranslations() {
  const hdrs = await headers();
  return getTranslations({ locale: localeFromHeader(hdrs.get('x-locale')), namespace: 'dashboard.settings.profile.errors' });
}

// ── Update name / phone ──────────────────────────────────────

const profileSchema = z.object({
  fullName: z.string().min(2).max(100),
  phone:    z.string().max(30).optional(),
});

export async function updateProfileAction(raw: unknown): Promise<Result<null>> {
  const auth = await resolveTenantOrgId();
  const t    = await getActionTranslations();
  if ('error' in auth) return { data: null, error: { message: t('notAuthorized'), code: 'AUTH_ERROR' } };

  const parsed = profileSchema.safeParse(raw);
  if (!parsed.success) return { data: null, error: { message: t('invalidData'), code: 'VALIDATION_ERROR' } };

  await db.update(profiles)
    .set({ fullName: parsed.data.fullName, phone: parsed.data.phone ?? null, updatedAt: new Date() })
    .where(eq(profiles.id, auth.userId));

  revalidatePath('/dashboard/settings/profile');
  return { data: null, error: null };
}

// ── Avatar upload ─────────────────────────────────────────────

export async function uploadProfileAvatarAction(formData: FormData): Promise<Result<{ url: string }>> {
  const auth = await resolveTenantOrgId();
  const t    = await getActionTranslations();
  if ('error' in auth) return { data: null, error: { message: t('notAuthorized'), code: 'AUTH_ERROR' } };

  const file = formData.get('file');
  if (!(file instanceof File)) return { data: null, error: { message: t('avatarNoFile'), code: 'VALIDATION_ERROR' } };
  if (file.size > UPLOAD_MAX_BYTES) return { data: null, error: { message: t('avatarTooLarge'), code: 'VALIDATION_ERROR' } };
  if (!(ALLOWED_IMAGE_TYPES as readonly string[]).includes(file.type)) {
    return { data: null, error: { message: t('avatarInvalidType'), code: 'VALIDATION_ERROR' } };
  }

  const ext  = (file.name.split('.').pop() ?? 'jpg').toLowerCase();
  const path = `${auth.orgId}/${auth.userId}.${ext}`;

  const admin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );

  const { error: uploadErr } = await admin.storage
    .from(AVATAR_BUCKET)
    .upload(path, file, { upsert: true, contentType: file.type });
  if (uploadErr) return { data: null, error: { message: t('storage'), code: 'STORAGE_ERROR' } };

  const { data: { publicUrl } } = admin.storage.from(AVATAR_BUCKET).getPublicUrl(path);
  const url = `${publicUrl}?v=${Date.now()}`;

  await db.update(profiles).set({ avatarUrl: url, updatedAt: new Date() }).where(eq(profiles.id, auth.userId));

  revalidatePath('/dashboard/settings/profile');
  return { data: { url }, error: null };
}
