'use server';

import { z }              from 'zod';
import { headers }        from 'next/headers';
import { revalidatePath } from 'next/cache';
import { getOrganizationBySlug } from '@/domains/organizations/service';
import { createSupabaseServerClient }  from '@/infrastructure/supabase/server';
import { getMyCustomer, updateMyProfile } from '@/domains/customers/service-me';

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

  // Auth check
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user?.email) {
    return { status: 'error', message: 'Debes iniciar sesión para actualizar tu perfil.' };
  }

  const parsed = profileSchema.safeParse(raw);
  if (!parsed.success) {
    return { status: 'error', message: parsed.error.issues[0]?.message ?? 'Datos inválidos' };
  }

  const orgResult = await getOrganizationBySlug(slug);
  if (orgResult.error || !orgResult.data) {
    return { status: 'error', message: 'Negocio no encontrado' };
  }

  const customerResult = await getMyCustomer(orgResult.data.id, user.email);
  if (customerResult.error || !customerResult.data) {
    return { status: 'error', message: 'Perfil no encontrado' };
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
