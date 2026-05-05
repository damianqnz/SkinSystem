import { Suspense }                    from 'react';
import { headers }                     from 'next/headers';
import { notFound }                    from 'next/navigation';
import { getSettingsT }                from '../_i18n';
import { eq, and, isNull }             from 'drizzle-orm';
import { getOrganizationBySlug }       from '@/domains/organizations/service';
import { db }                          from '@/infrastructure/db';
import { organizations }               from '@/infrastructure/db/schema/organizations';
import { organizationPhones }          from '@/infrastructure/db/schema/settings';
import { availabilityRules }           from '@/infrastructure/db/schema/calendar';
import { BrandDetailsSection }         from './_components/BrandDetailsSection';
import { AppearanceSection }           from './_components/AppearanceSection';
import { ContactSection }              from './_components/ContactSection';
import { LocationSection }             from './_components/LocationSection';
import { WorkingHoursSection }         from './_components/WorkingHoursSection';
import { LinksSection }                from './_components/LinksSection';

export default async function BrandSettingsPage() {
  return (
    <Suspense fallback={<BrandSkeleton />}>
      <BrandContent />
    </Suspense>
  );
}

async function BrandContent() {
  const hdrs   = await headers();
  const slug   = hdrs.get('x-tenant-slug') ?? '';
  const t      = getSettingsT(hdrs.get('x-locale') ?? 'pt');

  const orgResult = await getOrganizationBySlug(slug);
  if (orgResult.error || !orgResult.data) notFound();
  const orgId = orgResult.data.id;

  // Fetch org full row
  const [orgRows, phonesRows, rulesRows] = await Promise.all([
    db.select({
      id: organizations.id, name: organizations.name, slug: organizations.slug,
      industry: organizations.industry, about: organizations.about,
      bannerUrl: organizations.bannerUrl, logoUrl: organizations.logoUrl,
      themeConfig: organizations.themeConfig,
      address: organizations.address, city: organizations.city,
      state: organizations.state, postalCode: organizations.postalCode,
      country: organizations.country, defaultCurrency: organizations.defaultCurrency,
      timezone: organizations.timezone, primaryEmail: organizations.primaryEmail,
      socialLinks: organizations.socialLinks,
    }).from(organizations).where(eq(organizations.id, orgId)).limit(1),

    db.select({ phone: organizationPhones.phone, isPrimary: organizationPhones.isPrimary })
      .from(organizationPhones)
      .where(eq(organizationPhones.organizationId, orgId)),

    db.select({
      dayOfWeek: availabilityRules.dayOfWeek,
      isActive:  availabilityRules.isActive,
      openTime:  availabilityRules.openTime,
      closeTime: availabilityRules.closeTime,
    }).from(availabilityRules)
      .where(and(eq(availabilityRules.organizationId, orgId), isNull(availabilityRules.profileId))),
  ]);

  const org = orgRows[0];
  if (!org) notFound();

  const theme = (org.themeConfig ?? {}) as Record<string, string>;
  const links = (org.socialLinks  ?? {}) as Record<string, unknown>;

  // Split primary vs additional phones
  const primaryPhone     = phonesRows.find(r => r.isPrimary);
  const additionalPhones = phonesRows.filter(r => !r.isPrimary).map(r => r.phone);
  const additionalEmails = Array.isArray(links.additionalEmails)
    ? (links.additionalEmails as string[])
    : [];

  return (
    <div className="space-y-8">
      {/* Page heading */}
      <div>
        <h1 className="font-cormorant text-2xl font-semibold text-stone-800">{t.brandPage.title}</h1>
        <p className="text-sm text-stone-400 mt-1">{t.brandPage.description}</p>
      </div>

      <BrandDetailsSection
        orgId={orgId}
        initial={{
          name:      org.name,
          slug:      org.slug,
          industry:  org.industry ?? null,
          about:     org.about    ?? null,
          bannerUrl: org.bannerUrl ?? null,
          logoUrl:   org.logoUrl  ?? null,
        }}
      />

      <AppearanceSection
        initial={{
          brandColor:  theme.brandColor  ?? '#1C1917',
          buttonShape: (theme.buttonShape as 'pill'|'rounded'|'rectangle') ?? 'rounded',
          theme:       (theme.theme as 'system'|'light'|'dark') ?? 'system',
        }}
      />

      <ContactSection
        initial={{
          primaryEmail:     org.primaryEmail    ?? null,
          primaryPhone:     primaryPhone?.phone ?? null,
          additionalPhones,
          additionalEmails,
        }}
      />

      <LocationSection
        initial={{
          address:         org.address         ?? null,
          city:            org.city             ?? null,
          state:           org.state            ?? null,
          postalCode:      org.postalCode       ?? null,
          country:         org.country          ?? null,
          defaultCurrency: org.defaultCurrency,
          timezone:        org.timezone,
        }}
      />

      <WorkingHoursSection
        initial={rulesRows.map((r) => ({
          dayOfWeek: r.dayOfWeek as number,
          isActive:  r.isActive,
          openTime:  r.openTime,
          closeTime: r.closeTime,
        }))}
      />

      <LinksSection
        initial={{
          website:   (links.website   as string) ?? '',
          instagram: (links.instagram as string) ?? '',
          facebook:  (links.facebook  as string) ?? '',
          tiktok:    (links.tiktok    as string) ?? '',
          youtube:   (links.youtube   as string) ?? '',
          linkedin:  (links.linkedin  as string) ?? '',
          pinterest: (links.pinterest as string) ?? '',
        }}
      />
    </div>
  );
}

function BrandSkeleton() {
  return (
    <div className="space-y-8 animate-pulse">
      <div className="space-y-2">
        <div className="h-7 w-32 bg-stone-100 rounded-lg" />
        <div className="h-4 w-64 bg-stone-100 rounded" />
      </div>
      {[1,2,3,4,5,6].map((s) => (
        <div key={s} className="space-y-2">
          <div className="h-3 w-36 bg-stone-100 rounded" />
          <div className="h-24 bg-stone-100 rounded-2xl" />
        </div>
      ))}
    </div>
  );
}
