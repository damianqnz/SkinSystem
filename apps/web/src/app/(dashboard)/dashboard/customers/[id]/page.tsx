/**
 * /dashboard/customers/[id] — CRM customer profile.
 *
 * Server Component. Fetches the customer + visit stats, then renders
 * the interactive profile panel (tabs, GSAP entrance, appointment FAB).
 */

import { headers }                from 'next/headers';
import { notFound }               from 'next/navigation';
import { getOrganizationBySlug }  from '@/domains/organizations/service';
import { getCustomerProfile }     from '@/domains/customers/service';
import { CustomerProfileClient }  from './_components/CustomerProfileClient';

interface Props { params: Promise<{ id: string }> }

export default async function CustomerPage({ params }: Props) {
  const { id } = await params;
  const h      = await headers();
  const slug   = h.get('x-tenant-slug') ?? '';
  const locale = h.get('x-locale')      ?? 'es';

  const orgResult = await getOrganizationBySlug(slug);
  if (!orgResult.data) notFound();

  const profileResult = await getCustomerProfile(orgResult.data.id, id);
  if (!profileResult.data) notFound();

  const c = profileResult.data;

  return (
    <CustomerProfileClient
      id={c.id}
      fullName={c.fullName}
      email={c.email}
      phone={c.phone}
      isGuest={c.isGuest}
      visitCount={Number(c.visitCount ?? 0)}
      lastVisitAtIso={
        c.lastVisitAt instanceof Date ? c.lastVisitAt.toISOString()
        : c.lastVisitAt ? String(c.lastVisitAt) : null
      }
      status={c.status}
      createdAtIso={c.createdAt instanceof Date ? c.createdAt.toISOString() : String(c.createdAt)}
      locale={locale}
      isBlocked={c.isBlocked}
      avatarUrl={c.avatarUrl ?? null}
      notes={c.notes ?? null}
      company={c.company ?? null}
      country={c.country ?? null}
      countryIso={c.countryIso ?? null}
      address={c.address ?? null}
      city={c.city ?? null}
      state={c.state ?? null}
      postalCode={c.postalCode ?? null}
      socialLinks={c.socialLinks ?? null}
    />
  );
}
