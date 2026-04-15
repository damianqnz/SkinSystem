import 'server-only';

import { eq } from 'drizzle-orm';
import { db } from '@/infrastructure/db';
import { organizations } from '@/infrastructure/db/schema/organizations';
import type { Result } from '@/shared/types/result';

export type OrgSummary = { id: string; name: string; slug: string; locale: string };

const COLS = {
  id:     organizations.id,
  name:   organizations.name,
  slug:   organizations.slug,
  locale: organizations.locale,
};

/** Resolves a subdomain slug ("lourdes") to its org UUID + metadata. */
export async function getOrganizationBySlug(slug: string): Promise<Result<OrgSummary>> {
  try {
    const rows = await db
      .select(COLS)
      .from(organizations)
      .where(eq(organizations.slug, slug))
      .limit(1);
    if (!rows[0]) return { data: null, error: { message: 'Organization not found', code: 'NOT_FOUND' } };
    return { data: rows[0] as OrgSummary, error: null };
  } catch {
    return { data: null, error: { message: 'Failed to fetch organization', code: 'DB_ERROR' } };
  }
}
