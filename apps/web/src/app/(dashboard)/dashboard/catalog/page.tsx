import { Suspense }               from 'react';
import { headers }                from 'next/headers';
import { notFound }               from 'next/navigation';
import { getOrganizationBySlug }  from '@/domains/organizations/service';
import { getCategoriesWithServices } from '@/domains/catalog/service';
import { CatalogClient }          from './_components/CatalogClient';
import { CatalogSkeleton }        from './_components/CatalogSkeleton';

/**
 * /catalog — Service & Category Management
 *
 * PPR pattern:
 *   Static shell: page heading (rendered during build)
 *   Streamed:     CatalogContent (DB fetch, Suspense boundary)
 *
 * Data Islands: categories act as collapsible islands grouping their services.
 * Each island carries full CRUD via ServiceDrawer + CategoryDrawer.
 *
 * Ready for Stripe Connect:
 *   - depositPercent (0-100) stored on every service → passed to Stripe
 *     PaymentIntent as `application_fee_amount` calculation
 *   - priceCents already in smallest currency unit → direct Stripe input
 *   - currency field per service → multi-currency support
 */
export default async function CatalogPage() {
  return (
    <Suspense fallback={<CatalogSkeleton />}>
      <CatalogContent />
    </Suspense>
  );
}

async function CatalogContent() {
  const hdrs   = await headers();
  const slug   = hdrs.get('x-tenant-slug') ?? '';
  const locale = hdrs.get('x-locale') ?? 'pt';

  const orgResult = await getOrganizationBySlug(slug);
  if (orgResult.error || !orgResult.data) notFound();
  const org = orgResult.data;

  const catalogResult = await getCategoriesWithServices(org.id);

  if (catalogResult.error) {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-sm text-red-400">{catalogResult.error.message}</p>
      </div>
    );
  }

  const { categories, orphans } = catalogResult.data;

  return (
    <CatalogClient
      categories={categories}
      orphans={orphans}
      locale={locale}
      organizationId={org.id}
    />
  );
}
