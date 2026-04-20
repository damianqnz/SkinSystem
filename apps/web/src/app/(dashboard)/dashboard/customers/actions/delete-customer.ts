'use server';
import 'server-only';

import { eq, and }            from 'drizzle-orm';
import { revalidatePath }     from 'next/cache';
import { createServerClient } from '@supabase/ssr';
import { cookies }            from 'next/headers';
import { db }                 from '@/infrastructure/db';
import { customers }          from '@/infrastructure/db/schema/customers';
import { appointments }       from '@/infrastructure/db/schema/booking';
import type { Result }        from '@/shared/types/result';

export async function deleteCustomerAction(
  customerId: string,
): Promise<Result<void>> {
  const jar  = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => jar.getAll(), setAll: (pairs) => pairs.forEach(({ name, value, options }) => jar.set(name, value, options)) } },
  );

  const { data: { user }, error: authErr } = await supabase.auth.getUser();
  if (authErr || !user) return { data: null, error: { message: 'Unauthorized', code: 'UNAUTHORIZED' } };

  const orgId = user.user_metadata?.organization_id as string | undefined;
  if (!orgId) return { data: null, error: { message: 'No organization', code: 'UNAUTHORIZED' } };

  // Guard: check for existing appointments (financial integrity)
  const apptRows = await db
    .select({ id: appointments.id })
    .from(appointments)
    .where(and(eq(appointments.customerId, customerId), eq(appointments.organizationId, orgId)))
    .limit(1);

  if (apptRows.length > 0) {
    return {
      data: null,
      error: {
        message: 'Este cliente tiene citas registradas. Sus datos se conservarán por integridad financiera.',
        code: 'HAS_APPOINTMENTS',
      },
    };
  }

  await db.delete(customers)
    .where(and(eq(customers.id, customerId), eq(customers.organizationId, orgId)));

  revalidatePath('/dashboard/customers');
  return { data: undefined, error: null };
}
