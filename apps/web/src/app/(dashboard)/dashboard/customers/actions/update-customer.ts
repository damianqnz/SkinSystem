'use server';
import 'server-only';

import { z }                  from 'zod';
import { eq, and }            from 'drizzle-orm';
import { revalidatePath }     from 'next/cache';
import { createServerClient } from '@supabase/ssr';
import { cookies }            from 'next/headers';
import { db }                 from '@/infrastructure/db';
import { profiles } from '@/infrastructure/db/schema/organizations';
import { customers }          from '@/infrastructure/db/schema/customers';
import type { Result }        from '@/shared/types/result';

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
  const jar  = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    { cookies: { getAll: () => jar.getAll(), setAll: (pairs) => pairs.forEach(({ name, value, options }) => jar.set(name, value, options)) } },
  );

  const { data: { user }, error: authErr } = await supabase.auth.getUser();
  if (authErr || !user) return { data: null, error: { message: 'Unauthorized', code: 'UNAUTHORIZED' } };

  let orgId = user.user_metadata?.organization_id as string | undefined;
  // Fallback: profiles table (profiles.id === auth.users.id)
  if (!orgId) {
    const profileRows = await db.select({ organizationId: profiles.organizationId })
      .from(profiles).where(eq(profiles.id, user.id)).limit(1);
    orgId = profileRows[0]?.organizationId;
  }
    if (!orgId) return { data: null, error: { message: 'No organization', code: 'UNAUTHORIZED' } };

  const parsed = schema.safeParse(raw);
  if (!parsed.success) return { data: null, error: { message: parsed.error.issues[0]?.message ?? 'Invalid input', code: 'VALIDATION_ERROR' } };

  const { id, fullName, email, phone, notes, company, country, countryIso, address, city, state, postalCode, socialLinks } = parsed.data;

  await db.update(customers)
    .set({
      fullName,
      email:       email ?? null,
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

  revalidatePath(`/dashboard/customers/${id}`);
  revalidatePath('/dashboard/customers');
  return { data: undefined, error: null };
}
