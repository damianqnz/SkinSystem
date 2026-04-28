'use server';

/**
 * Dashboard server actions.
 *
 * `seedTenantDataAction` is a DEV-ONLY helper that wipes any previously-seeded
 * mock data for the current tenant and then injects a fresh set (3 categories,
 * 8 services, 15 customers, 20 appointments — including 3 cancelled ones).
 *
 * Production calls return an error and never touch the database.
 */

import { headers } from 'next/headers';
import { revalidatePath } from 'next/cache';
import { eq, and } from 'drizzle-orm';

import { db } from '@/infrastructure/db';
import { profiles } from '@/infrastructure/db/schema/organizations';
import { createSupabaseServerClient } from '@/infrastructure/supabase/server';
import { getOrganizationBySlug } from '@/domains/organizations/service';
import { clearSeedData, seedTenantData } from '@/domains/booking/seed';

export type SeedActionState =
  | { status: 'idle' }
  | { status: 'success'; counts: { categories: number; services: number; customers: number; appointments: number }; removed: number }
  | { status: 'error';   message: string };

export async function seedTenantDataAction(): Promise<SeedActionState> {
  // 1. Hard environment gate — never run in prod
  if (process.env.NODE_ENV !== 'development') {
    return { status: 'error', message: 'Disponible solo en desarrollo' };
  }

  // 2. Resolve current tenant from middleware-injected header
  const headersList = await headers();
  const slug = headersList.get('x-tenant-slug') ?? '';
  if (!slug) return { status: 'error', message: 'Tenant no encontrado en cabeceras' };

  const orgRes = await getOrganizationBySlug(slug);
  if (!orgRes.data) return { status: 'error', message: `Organización "${slug}" no existe` };
  const orgId = orgRes.data.id;

  // 3. Pick a staff profile (FK requirement on appointments.staff_profile_id).
  //    Prefer the logged-in user; fall back to any profile in the org.
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  let staffProfileId: string | null = null;
  if (user) {
    const own = await db
      .select({ id: profiles.id })
      .from(profiles)
      .where(and(eq(profiles.id, user.id), eq(profiles.organizationId, orgId)))
      .limit(1);
    staffProfileId = own[0]?.id ?? null;
  }
  if (!staffProfileId) {
    const any = await db
      .select({ id: profiles.id })
      .from(profiles)
      .where(eq(profiles.organizationId, orgId))
      .limit(1);
    staffProfileId = any[0]?.id ?? null;
  }
  if (!staffProfileId) {
    return { status: 'error', message: 'No hay profesional registrado en esta organización' };
  }

  // 4. Wipe previous seed data, then insert fresh
  const cleared = await clearSeedData(orgId);
  if (cleared.error) return { status: 'error', message: cleared.error.message };

  const seeded = await seedTenantData(orgId, staffProfileId);
  if (seeded.error) return { status: 'error', message: seeded.error.message };

  // 5. Refresh dashboard
  revalidatePath('/dashboard');
  revalidatePath('/dashboard/calendar');
  revalidatePath('/dashboard/customers');
  revalidatePath('/dashboard/catalog');

  return { status: 'success', counts: seeded.data, removed: cleared.data.removed };
}
