'use server';

import { revalidatePath }              from 'next/cache';
import { z }                           from 'zod';
import { eq, and, isNull }             from 'drizzle-orm';
import { createClient }                from '@supabase/supabase-js';
import { db }                          from '@/infrastructure/db';
import { organizations }               from '@/infrastructure/db/schema/organizations';
import { resolveTenantOrgId }          from '@/shared/lib/resolve-tenant-org-id';
import { organizationPhones }          from '@/infrastructure/db/schema/settings';
import { availabilityRules }           from '@/infrastructure/db/schema/calendar';
import type { Result }                 from '@/shared/types/result';

const ORG_MEDIA_BUCKET = 'org-media';
const MAX_BYTES        = 5 * 1024 * 1024; // 5 MB


function revalidate() {
  revalidatePath('/dashboard/settings/brand');
  // Bust the full layout tree for the public pages so every
  // Next.js cache layer (Full Route Cache + Client Router Cache) is cleared.
  revalidatePath('/', 'layout');
}

// ── Brand details ─────────────────────────────────────────────

const brandDetailsSchema = z.object({
  name:     z.string().min(1).max(100),
  industry: z.string().max(80).optional().nullable(),
  about:    z.string().max(1000).optional().nullable(),
});

export async function updateBrandDetailsAction(raw: unknown): Promise<Result<null>> {
  const auth = await resolveTenantOrgId();
  if ('error' in auth) return { data: null, error: { message: auth.error, code: 'AUTH_ERROR' } };

  const parsed = brandDetailsSchema.safeParse(raw);
  if (!parsed.success) return { data: null, error: { message: parsed.error.issues[0]?.message ?? 'Dados inválidos', code: 'VALIDATION_ERROR' } };

  await db.update(organizations)
    .set({ name: parsed.data.name, industry: parsed.data.industry ?? null, about: parsed.data.about ?? null, updatedAt: new Date() })
    .where(eq(organizations.id, auth.orgId));

  revalidate();
  return { data: null, error: null };
}

// ── Appearance ────────────────────────────────────────────────

const appearanceSchema = z.object({
  brandColor:  z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional().nullable(),
  buttonShape: z.enum(['pill', 'rounded', 'rectangle']).optional().nullable(),
  theme:       z.enum(['system', 'light', 'dark']).optional().nullable(),
});

export async function updateAppearanceAction(raw: unknown): Promise<Result<null>> {
  const auth = await resolveTenantOrgId();
  if ('error' in auth) return { data: null, error: { message: auth.error, code: 'AUTH_ERROR' } };

  const parsed = appearanceSchema.safeParse(raw);
  if (!parsed.success) return { data: null, error: { message: parsed.error.issues[0]?.message ?? 'Dados inválidos', code: 'VALIDATION_ERROR' } };

  // Merge into existing themeConfig
  const existing = await db.select({ themeConfig: organizations.themeConfig }).from(organizations).where(eq(organizations.id, auth.orgId)).limit(1);
  const prev = (existing[0]?.themeConfig ?? {}) as Record<string, unknown>;

  const next = {
    ...prev,
    ...(parsed.data.brandColor  != null && { brandColor:  parsed.data.brandColor  }),
    ...(parsed.data.buttonShape != null && { buttonShape: parsed.data.buttonShape }),
    ...(parsed.data.theme       != null && { theme:       parsed.data.theme       }),
  };

  await db.update(organizations).set({ themeConfig: next, updatedAt: new Date() }).where(eq(organizations.id, auth.orgId));
  revalidate();
  return { data: null, error: null };
}

// ── Contact ───────────────────────────────────────────────────

const contactSchema = z.object({
  primaryEmail:     z.string().email().optional().nullable(),
  primaryPhone:     z.string().max(30).optional().nullable(),
  additionalPhones: z.array(z.string().max(30)).optional().default([]),
  additionalEmails: z.array(z.string().email()).optional().default([]),
});

export async function updateContactAction(raw: unknown): Promise<Result<null>> {
  const auth = await resolveTenantOrgId();
  if ('error' in auth) return { data: null, error: { message: auth.error, code: 'AUTH_ERROR' } };

  const parsed = contactSchema.safeParse(raw);
  if (!parsed.success) return { data: null, error: { message: parsed.error.issues[0]?.message ?? 'Dados inválidos', code: 'VALIDATION_ERROR' } };

  // 1. Update primary email
  await db.update(organizations)
    .set({ primaryEmail: parsed.data.primaryEmail ?? null, updatedAt: new Date() })
    .where(eq(organizations.id, auth.orgId));

  // 2. Upsert primary phone
  if (parsed.data.primaryPhone !== undefined) {
    const existingPrimary = await db.select({ id: organizationPhones.id }).from(organizationPhones)
      .where(and(eq(organizationPhones.organizationId, auth.orgId), eq(organizationPhones.isPrimary, true))).limit(1);
    if (existingPrimary[0]) {
      await db.update(organizationPhones)
        .set({ phone: parsed.data.primaryPhone ?? '' })
        .where(eq(organizationPhones.id, existingPrimary[0].id));
    } else if (parsed.data.primaryPhone) {
      await db.insert(organizationPhones).values({ organizationId: auth.orgId, phone: parsed.data.primaryPhone, isPrimary: true });
    }
  }

  // 3. Replace all non-primary phones
  await db.delete(organizationPhones)
    .where(and(eq(organizationPhones.organizationId, auth.orgId), eq(organizationPhones.isPrimary, false)));
  if (parsed.data.additionalPhones.length > 0) {
    await db.insert(organizationPhones).values(
      parsed.data.additionalPhones.map(phone => ({
        organizationId: auth.orgId,
        phone,
        isPrimary:      false,
        label:          'Adicional',
      })),
    );
  }

  // 4. Persist additional emails inside socialLinks JSON
  const existingOrg = await db.select({ socialLinks: organizations.socialLinks })
    .from(organizations).where(eq(organizations.id, auth.orgId)).limit(1);
  const prevLinks = (existingOrg[0]?.socialLinks ?? {}) as Record<string, unknown>;
  await db.update(organizations)
    .set({ socialLinks: { ...prevLinks, additionalEmails: parsed.data.additionalEmails }, updatedAt: new Date() })
    .where(eq(organizations.id, auth.orgId));

  revalidate();
  return { data: null, error: null };
}

// ── Location ──────────────────────────────────────────────────

const locationSchema = z.object({
  address:         z.string().max(200).optional().nullable(),
  city:            z.string().max(100).optional().nullable(),
  state:           z.string().max(100).optional().nullable(),
  postalCode:      z.string().max(20).optional().nullable(),
  country:         z.string().max(100).optional().nullable(),
  defaultCurrency: z.string().length(3).optional(),
  timezone:        z.string().max(60).optional(),
});

export async function updateLocationAction(raw: unknown): Promise<Result<null>> {
  const auth = await resolveTenantOrgId();
  if ('error' in auth) return { data: null, error: { message: auth.error, code: 'AUTH_ERROR' } };

  const parsed = locationSchema.safeParse(raw);
  if (!parsed.success) return { data: null, error: { message: parsed.error.issues[0]?.message ?? 'Dados inválidos', code: 'VALIDATION_ERROR' } };

  await db.update(organizations).set({
    address:         parsed.data.address ?? null,
    city:            parsed.data.city ?? null,
    state:           parsed.data.state ?? null,
    postalCode:      parsed.data.postalCode ?? null,
    country:         parsed.data.country ?? null,
    ...(parsed.data.defaultCurrency && { defaultCurrency: parsed.data.defaultCurrency }),
    ...(parsed.data.timezone        && { timezone: parsed.data.timezone }),
    updatedAt: new Date(),
  }).where(eq(organizations.id, auth.orgId));

  revalidate();
  return { data: null, error: null };
}

// ── Working hours ─────────────────────────────────────────────

const daySchema = z.object({
  dayOfWeek: z.number().int().min(0).max(6),
  isActive:  z.boolean(),
  // Accept both "HH:MM" and "HH:MM:SS" (PostgreSQL time type returns the latter)
  openTime:  z.string().regex(/^\d{2}:\d{2}(:\d{2})?$/).transform(t => t.substring(0, 5)),
  closeTime: z.string().regex(/^\d{2}:\d{2}(:\d{2})?$/).transform(t => t.substring(0, 5)),
});

export async function updateWorkingHoursAction(days: z.infer<typeof daySchema>[]): Promise<Result<null>> {
  const auth = await resolveTenantOrgId();
  if ('error' in auth) return { data: null, error: { message: auth.error, code: 'AUTH_ERROR' } };

  for (const day of days) {
    const v = daySchema.safeParse(day);
    if (!v.success) continue;

    const existing = await db.select({ id: availabilityRules.id }).from(availabilityRules)
      .where(and(
        eq(availabilityRules.organizationId, auth.orgId),
        isNull(availabilityRules.profileId),
        eq(availabilityRules.dayOfWeek, v.data.dayOfWeek),
      )).limit(1);

    if (existing[0]) {
      await db.update(availabilityRules)
        .set({ isActive: v.data.isActive, openTime: v.data.openTime, closeTime: v.data.closeTime, updatedAt: new Date() })
        .where(eq(availabilityRules.id, existing[0].id));
    } else {
      await db.insert(availabilityRules).values({
        organizationId: auth.orgId,
        profileId:      null,
        dayOfWeek:      v.data.dayOfWeek,
        isActive:       v.data.isActive,
        openTime:       v.data.openTime,
        closeTime:      v.data.closeTime,
      });
    }
  }

  revalidate();
  return { data: null, error: null };
}

// ── Social links ──────────────────────────────────────────────

const linksSchema = z.object({
  website:   z.string().url().optional().nullable().or(z.literal('')),
  instagram: z.string().max(200).optional().nullable(),
  facebook:  z.string().max(200).optional().nullable(),
  tiktok:    z.string().max(200).optional().nullable(),
  youtube:   z.string().max(200).optional().nullable(),
  linkedin:  z.string().max(200).optional().nullable(),
  pinterest: z.string().max(200).optional().nullable(),
});

export async function updateLinksAction(raw: unknown): Promise<Result<null>> {
  const auth = await resolveTenantOrgId();
  if ('error' in auth) return { data: null, error: { message: auth.error, code: 'AUTH_ERROR' } };

  const parsed = linksSchema.safeParse(raw);
  if (!parsed.success) return { data: null, error: { message: parsed.error.issues[0]?.message ?? 'Dados inválidos', code: 'VALIDATION_ERROR' } };

  await db.update(organizations).set({ socialLinks: parsed.data as Record<string, unknown>, updatedAt: new Date() }).where(eq(organizations.id, auth.orgId));
  revalidate();
  return { data: null, error: null };
}

// ── Media upload (banner / logo) ──────────────────────────────

export async function uploadOrgMediaAction(
  formData: FormData,
): Promise<Result<{ url: string }>> {
  const auth = await resolveTenantOrgId();
  if ('error' in auth) return { data: null, error: { message: auth.error, code: 'AUTH_ERROR' } };
  const orgId = auth.orgId;

  const file = formData.get('file');
  const type = formData.get('type') as 'logo' | 'banner';

  if (!(file instanceof File))       return { data: null, error: { message: 'Ficheiro não encontrado', code: 'VALIDATION_ERROR' } };
  if (file.size > MAX_BYTES)         return { data: null, error: { message: 'Ficheiro superior a 5 MB', code: 'VALIDATION_ERROR' } };
  if (!file.type.startsWith('image/')) return { data: null, error: { message: 'Tipo de ficheiro inválido', code: 'VALIDATION_ERROR' } };
  if (type !== 'logo' && type !== 'banner') return { data: null, error: { message: 'Tipo inválido', code: 'VALIDATION_ERROR' } };

  const ext  = (file.name.split('.').pop() ?? 'jpg').toLowerCase();
  const path = `${orgId}/${type}.${ext}`;

  const admin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );

  const { error: uploadErr } = await admin.storage
    .from(ORG_MEDIA_BUCKET)
    .upload(path, file, { upsert: true, contentType: file.type });

  if (uploadErr) return { data: null, error: { message: uploadErr.message, code: 'STORAGE_ERROR' } };

  // Add cache-bust so the iframe always shows the latest version
  const { data: { publicUrl } } = admin.storage.from(ORG_MEDIA_BUCKET).getPublicUrl(path);
  const url = `${publicUrl}?v=${Date.now()}`;

  const field = type === 'logo' ? { logoUrl: url } : { bannerUrl: url };
  await db.update(organizations).set({ ...field, updatedAt: new Date() }).where(eq(organizations.id, orgId));

  revalidate();
  return { data: { url }, error: null };
}
