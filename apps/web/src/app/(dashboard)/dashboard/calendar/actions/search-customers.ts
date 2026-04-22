'use server';
import 'server-only';

import { eq }                            from 'drizzle-orm';
import { z }                             from 'zod';
import { db }                            from '@/infrastructure/db';
import { profiles }                      from '@/infrastructure/db/schema/organizations';
import { createSupabaseServerClient }    from '@/infrastructure/supabase/server';
import { getCustomersList } from '@/domains/customers/service';
import type { Result } from '@/shared/types/result';

// ── Public type ───────────────────────────────────────────────
export type CustomerMatch = {
  id:       string;
  fullName: string;
  email:    string | null;
  phone:    string | null;
};

// ── Schema ────────────────────────────────────────────────────
const searchSchema = z.object({ query: z.string().min(1).max(100) });

// ── Action ────────────────────────────────────────────────────
export async function searchCustomersAction(
  query: string,
): Promise<Result<CustomerMatch[]>> {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { data: null, error: { message: 'No autorizado', code: 'AUTH_ERROR' } };

  let orgId = user.user_metadata?.organization_id as string | undefined;
  // Fallback: profiles table (profiles.id === auth.users.id)
  if (!orgId) {
    const profileRows = await db.select({ organizationId: profiles.organizationId })
      .from(profiles).where(eq(profiles.id, user.id)).limit(1);
    orgId = profileRows[0]?.organizationId;
  }
    if (!orgId) return { data: null, error: { message: 'Organización no encontrada', code: 'NOT_FOUND' } };

  const parsed = searchSchema.safeParse({ query });
  // Return empty list (not error) for invalid query — e.g. too short
  if (!parsed.success) return { data: [], error: null };

  const result = await getCustomersList(orgId, parsed.data.query);
  if (result.error) return { data: null, error: result.error };

  const matches: CustomerMatch[] = (result.data ?? []).map((c) => ({
    id:       c.id,
    fullName: c.fullName,
    email:    c.email  ?? null,
    phone:    c.phone  ?? null,
  }));

  return { data: matches, error: null };
}
