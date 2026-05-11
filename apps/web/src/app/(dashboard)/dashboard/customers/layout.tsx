/**
 * /dashboard/customers — Master-detail layout.
 *
 * Server Component: fetches all customers for the sidebar,
 * then renders the two-column shell via CustomersRoot (Client).
 * Left: CustomersSidebar (w-72, scrollable list).
 * Right: {children} (detail panel — customer profile, ficha, etc.).
 */

import { headers }                  from 'next/headers';
import type { ReactNode }           from 'react';
import { getOrganizationBySlug }    from '@/domains/organizations/service';
import { getCustomersWithStats }    from '@/domains/customers/service';
import { CustomersRoot }            from './_components/CustomersRoot';
import type { CustomerSer }         from './_components/CustomerListItem';

interface Props { children: ReactNode }

export default async function CustomersLayout({ children }: Props) {
  const h      = await headers();
  const slug   = h.get('x-tenant-slug') ?? '';
  const locale = h.get('x-locale')      ?? 'pt';

  // Pre-fetch customers for sidebar (errors soft-fail to empty list)
  const orgResult = await getOrganizationBySlug(slug);
  const orgId     = orgResult.data?.id ?? '';

  const statsResult = orgId ? await getCustomersWithStats(orgId) : { data: null, error: null };
  const customers: CustomerSer[] = (statsResult.data ?? []).map((c) => ({
    id:             c.id,
    fullName:       c.fullName,
    email:          c.email,
    phone:          c.phone,
    lastVisitAtIso: c.lastVisitAt
      ? (c.lastVisitAt instanceof Date ? c.lastVisitAt.toISOString() : String(c.lastVisitAt))
      : null,
    visitCount: Number(c.visitCount ?? 0),
    status:     c.status,
    isBlocked:  c.isBlocked,
  }));

  return (
    <div className="h-full min-h-0 flex flex-col">
      <CustomersRoot customers={customers} locale={locale}>
        {children}
      </CustomersRoot>
    </div>
  );
}
