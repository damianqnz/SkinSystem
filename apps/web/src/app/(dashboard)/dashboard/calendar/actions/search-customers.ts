'use server';
import 'server-only';

import { z }                             from 'zod';
import { resolveTenantOrgId }    from '@/shared/lib/resolve-tenant-org-id';
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
  // Tenant from an active membership in the request's tenant — never from
  // user_metadata, which the signed-in user can rewrite via the Auth API.
  const auth = await resolveTenantOrgId();
  if ('error' in auth) return { data: null, error: { message: auth.error, code: 'AUTH_ERROR' } };
  const { orgId } = auth;

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
