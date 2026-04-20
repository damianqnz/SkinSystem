'use server';
import 'server-only';

import { z }                  from 'zod';
import { revalidatePath }     from 'next/cache';
import { createServerClient } from '@supabase/ssr';
import { cookies }            from 'next/headers';
import { db }                 from '@/infrastructure/db';
import { customers }          from '@/infrastructure/db/schema/customers';
import { uploadAvatarAction } from './upload-avatar';
import type { Result }        from '@/shared/types/result';

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
  const jar = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    { cookies: { getAll: () => jar.getAll(), setAll: (pairs) => pairs.forEach(({ name, value, options }) => jar.set(name, value, options)) } },
  );

  const { data: { user }, error: authErr } = await supabase.auth.getUser();
  if (authErr || !user) return { data: null, error: { message: 'Unauthorized', code: 'UNAUTHORIZED' } };

  const orgId = user.user_metadata?.organization_id as string | undefined;
  if (!orgId) return { data: null, error: { message: 'No organization', code: 'UNAUTHORIZED' } };

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
  if (!parsed.success) return { data: null, error: { message: parsed.error.issues[0]?.message ?? 'Invalid input', code: 'VALIDATION_ERROR' } };

  const { fullName, email, phone, company, country, countryIso, address, city, state, postalCode, socialLinks } = parsed.data;

  const [inserted] = await db.insert(customers).values({
    organizationId: orgId,
    fullName,
    email:       email ?? null,
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

  if (!inserted) return { data: null, error: { message: 'Failed to create customer', code: 'DB_ERROR' } };

  const avatarFile = formData.get('avatar') as File | null;
  if (avatarFile && avatarFile.size > 0) {
    const avatarFd = new FormData();
    avatarFd.append('avatar', avatarFile);
    await uploadAvatarAction(inserted.id, avatarFd);
  }

  revalidatePath('/dashboard/customers');
  return { data: { id: inserted.id }, error: null };
}
