import { Suspense }                    from 'react';
import { headers }                     from 'next/headers';
import { notFound }                    from 'next/navigation';
import { getTranslations }             from 'next-intl/server';
import { DEFAULT_LOCALE }              from '@/i18n/config';
import { eq }                          from 'drizzle-orm';
import { getOrganizationBySlug }       from '@/domains/organizations/service';
import { db }                          from '@/infrastructure/db';
import { bookingSettings }             from '@/domains/booking/schema';
import { PoliciesSection }             from './_components/PoliciesSection';
import { ConfigSection }               from './_components/ConfigSection';
import { PersonalizationSection }      from './_components/PersonalizationSection';
import { VisibilitySection }           from './_components/VisibilitySection';

export default async function PreferencesPage() {
  return (
    <Suspense fallback={<PreferencesSkeleton />}>
      <PreferencesContent />
    </Suspense>
  );
}

async function PreferencesContent() {
  const hdrs   = await headers();
  const slug   = hdrs.get('x-tenant-slug') ?? '';
  const locale = hdrs.get('x-locale') ?? DEFAULT_LOCALE;
  const t      = await getTranslations({ locale, namespace: 'dashboard.settings.preferences.page' });

  const orgResult = await getOrganizationBySlug(slug);
  if (orgResult.error || !orgResult.data) notFound();

  const rows = await db
    .select({
      bookingLeadTimeHours:    bookingSettings.bookingLeadTimeHours,
      bookingWindowDays:       bookingSettings.bookingWindowDays,
      slotDurationMinutes:     bookingSettings.slotDurationMinutes,
      cancellationHoursNotice: bookingSettings.cancellationHoursNotice,
      cancellationPolicyText:  bookingSettings.cancellationPolicyText,
      firstAvailableSlot:      bookingSettings.firstAvailableSlot,
      skipTeamMember:          bookingSettings.skipTeamMember,
      allowMultipleServices:   bookingSettings.allowMultipleServices,
      anyTeamMemberAllowed:    bookingSettings.anyTeamMemberAllowed,
      clientLoginEnabled:      bookingSettings.clientLoginEnabled,
      clientLoginRequired:     bookingSettings.clientLoginRequired,
      accordionView:           bookingSettings.accordionView,
      allowOnlineRescheduling: bookingSettings.allowOnlineRescheduling,
      allowOnlineCancellation: bookingSettings.allowOnlineCancellation,
      showRebookButton:        bookingSettings.showRebookButton,
      formFieldName:           bookingSettings.formFieldName,
      formFieldPhone:          bookingSettings.formFieldPhone,
      formFieldEmail:          bookingSettings.formFieldEmail,
      formFieldAddress:        bookingSettings.formFieldAddress,
      preferredLanguage:       bookingSettings.preferredLanguage,
      timeFormat:              bookingSettings.timeFormat,
      weekStartDay:            bookingSettings.weekStartDay,
      showServicePrices:       bookingSettings.showServicePrices,
      showServiceDuration:     bookingSettings.showServiceDuration,
      showWorkingHours:        bookingSettings.showWorkingHours,
      showLocalTime:           bookingSettings.showLocalTime,
      termsLabel:              bookingSettings.termsLabel,
      termsUrl:                bookingSettings.termsUrl,
      termsRequired:           bookingSettings.termsRequired,
      redirectLabel:           bookingSettings.redirectLabel,
      redirectUrl:             bookingSettings.redirectUrl,
      showInSearchResults:     bookingSettings.showInSearchResults,
    })
    .from(bookingSettings)
    .where(eq(bookingSettings.organizationId, orgResult.data.id))
    .limit(1);

  const s = rows[0];
  if (!s) notFound();

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-cormorant text-2xl font-semibold text-stone-800">{t('title')}</h1>
        <p className="text-sm text-stone-400 mt-1">{t('description')}</p>
      </div>

      <PoliciesSection
        initial={{
          bookingLeadTimeHours:    s.bookingLeadTimeHours,
          bookingWindowDays:       s.bookingWindowDays,
          slotDurationMinutes:     s.slotDurationMinutes,
          cancellationHoursNotice: s.cancellationHoursNotice,
          cancellationPolicyText:  s.cancellationPolicyText ?? null,
        }}
      />

      <ConfigSection
        initial={{
          firstAvailableSlot:      s.firstAvailableSlot,
          skipTeamMember:          s.skipTeamMember,
          allowMultipleServices:   s.allowMultipleServices,
          anyTeamMemberAllowed:    s.anyTeamMemberAllowed,
          clientLoginEnabled:      s.clientLoginEnabled,
          clientLoginRequired:     s.clientLoginRequired,
          accordionView:           s.accordionView,
          allowOnlineRescheduling: s.allowOnlineRescheduling,
          allowOnlineCancellation: s.allowOnlineCancellation,
          showRebookButton:        s.showRebookButton,
          formFieldName:           s.formFieldName,
          formFieldPhone:          s.formFieldPhone,
          formFieldEmail:          s.formFieldEmail,
          formFieldAddress:        s.formFieldAddress,
        }}
      />

      <PersonalizationSection
        initial={{
          preferredLanguage:   s.preferredLanguage,
          timeFormat:          s.timeFormat,
          weekStartDay:        s.weekStartDay,
          showServicePrices:   s.showServicePrices,
          showServiceDuration: s.showServiceDuration,
          showWorkingHours:    s.showWorkingHours,
          showLocalTime:       s.showLocalTime,
          termsLabel:          s.termsLabel  ?? null,
          termsUrl:            s.termsUrl    ?? null,
          termsRequired:       s.termsRequired,
          redirectLabel:       s.redirectLabel ?? null,
          redirectUrl:         s.redirectUrl   ?? null,
        }}
      />

      <VisibilitySection initial={{ showInSearchResults: s.showInSearchResults }} />
    </div>
  );
}

function PreferencesSkeleton() {
  return (
    <div className="space-y-8 animate-pulse">
      <div className="space-y-2">
        <div className="h-7 w-64 bg-stone-100 rounded-lg" />
        <div className="h-4 w-80 bg-stone-100 rounded" />
      </div>
      {[1, 2, 3, 4].map((s) => (
        <div key={s} className="space-y-2">
          <div className="h-3 w-40 bg-stone-100 rounded" />
          <div className="h-40 bg-stone-100 rounded-2xl" />
        </div>
      ))}
    </div>
  );
}
