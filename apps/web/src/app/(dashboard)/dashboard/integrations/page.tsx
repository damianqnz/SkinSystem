import { Suspense }                from 'react';
import { headers }                 from 'next/headers';
import { notFound }                from 'next/navigation';
import { getOrganizationBySlug }   from '@/domains/organizations/service';
import { getOrganizationSettings } from '@/domains/organizations/service';
import { IntegrationsClient }      from './_components/IntegrationsClient';

/**
 * /dashboard/integrations — Integration marketplace
 *
 * Reads ?stripe=success|refresh after returning from Stripe onboarding
 * and passes it to the client so it can start the confirmation polling loop.
 */
export default async function IntegrationsPage({
  searchParams,
}: {
  searchParams: Promise<{ stripe?: string }>;
}) {
  return (
    <Suspense fallback={<IntegrationsSkeleton />}>
      <IntegrationsContent searchParams={searchParams} />
    </Suspense>
  );
}

async function IntegrationsContent({
  searchParams,
}: {
  searchParams: Promise<{ stripe?: string }>;
}) {
  const [hdrs, params] = await Promise.all([headers(), searchParams]);
  const slug = hdrs.get('x-tenant-slug') ?? '';

  const orgResult = await getOrganizationBySlug(slug);
  if (orgResult.error || !orgResult.data) notFound();

  const settingsResult  = await getOrganizationSettings(orgResult.data.id);
  const settings        = settingsResult.data;
  const stripeConnected = !!(settings?.stripeAccountId && settings.stripeOnboarded);

  return (
    <IntegrationsClient
      stripeConnected={stripeConnected}
      stripeParam={params.stripe ?? null}
    />
  );
}

function IntegrationsSkeleton() {
  return (
    <div className="animate-pulse space-y-8">
      <div className="flex justify-between items-end">
        <div className="space-y-2">
          <div className="h-7 w-36 bg-stone-100 rounded-lg" />
          <div className="h-4 w-44 bg-stone-100 rounded" />
        </div>
        <div className="h-9 w-56 bg-stone-100 rounded-xl" />
      </div>
      {[1, 2].map((s) => (
        <div key={s} className="space-y-4">
          <div className="h-3 w-28 bg-stone-100 rounded" />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {[1, 2, 3].map((c) => (
              <div key={c} className="h-28 bg-stone-100 rounded-2xl" />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
