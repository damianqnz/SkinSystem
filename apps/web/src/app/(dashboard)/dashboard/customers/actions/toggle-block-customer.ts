'use server';
import 'server-only';

import { eq, and, not }       from 'drizzle-orm';
import { revalidatePath }     from 'next/cache';
import { createServerClient } from '@supabase/ssr';
import { cookies }            from 'next/headers';
import { db }                 from '@/infrastructure/db';
import { profiles } from '@/infrastructure/db/schema/organizations';
import { customers }          from '@/infrastructure/db/schema/customers';
import type { Result }        from '@/shared/types/result';

export async function toggleBlockCustomerAction(
  customerId: string,
): Promise<Result<{ isBlocked: boolean }>> {
  const jar  = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
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

  const rows = await db
    .update(customers)
    .set({ isBlocked: not(customers.isBlocked) })
    .where(and(eq(customers.id, customerId), eq(customers.organizationId, orgId)))
    .returning({ isBlocked: customers.isBlocked });

  if (!rows[0]) return { data: null, error: { message: 'Customer not found', code: 'NOT_FOUND' } };

  revalidatePath(`/dashboard/customers/${customerId}`);
  revalidatePath('/dashboard/customers');
  return { data: { isBlocked: rows[0].isBlocked }, error: null };
}
