/**
 * /dashboard/customers — CRM overview.
 *
 * Server Component. Fetches customers + visit stats from Supabase,
 * serialises dates to ISO strings, then hands off to the Client
 * search/table shell for real-time filtering.
 */

import { Suspense } from 'react';
import { headers } from 'next/headers';

import { getOrganizationBySlug }  from '@/domains/organizations/service';
import { getCustomersWithStats }  from '@/domains/customers/service';
import type { CustomerRow }       from './_components/CustomersTable';
import { CustomerSearch, CustomersTableSkeleton } from './_components/CustomerSearch';

// ── Inner async component (suspendable) ──────────────────────
async function CustomersContent({ orgId, locale }: { orgId: string; locale: string }) {
  const result = await getCustomersWithStats(orgId);

  const rows: CustomerRow[] = (result.data ?? []).map((c) => ({
    id:             c.id,
    fullName:       c.fullName,
    email:          c.email,
    phone:          c.phone,
    isGuest:        c.isGuest,
    createdAtIso:   c.createdAt instanceof Date ? c.createdAt.toISOString() : String(c.createdAt),
    lastVisitAtIso: c.lastVisitAt
      ? (c.lastVisitAt instanceof Date ? c.lastVisitAt.toISOString() : String(c.lastVisitAt))
      : null,
    visitCount: Number(c.visitCount ?? 0),
  }));

  return <CustomerSearch customers={rows} locale={locale} />;
}

// ── Page ──────────────────────────────────────────────────────
export default async function CustomersPage() {
  const h      = await headers();
  const slug   = h.get('x-tenant-slug') ?? '';
  const locale = h.get('x-locale')      ?? 'es';

  const orgResult = await getOrganizationBySlug(slug);
  if (!orgResult.data) {
    return (
      <p className="font-sans text-sm text-[var(--color-spa-muted)] p-6">
        Organización &quot;{slug}&quot; no encontrada.
      </p>
    );
  }

  const orgId = orgResult.data.id;

  return (
    <div className="space-y-6">
      {/* ── Page heading ──────────────────────────────── */}
      <div className="flex items-end justify-between">
        <div className="space-y-0.5">
          <p className="font-sans text-[10px] uppercase tracking-[0.18em] text-[var(--color-spa-muted)]">
            {locale === 'en' ? 'CRM' : 'CRM'}
          </p>
          <h1 className="font-serif text-3xl font-light tracking-wide text-[var(--color-spa-stone)]">
            {locale === 'en' ? 'Clients' : locale === 'pt' ? 'Clientes' : 'Gestión de Clientes'}
          </h1>
        </div>
      </div>

      {/* ── Table (streams via Suspense) ──────────────── */}
      <Suspense fallback={<CustomersTableSkeleton />}>
        <CustomersContent orgId={orgId} locale={locale} />
      </Suspense>
    </div>
  );
}
