/**
 * /dashboard/customers/[id]/ficha — Ficha Clínica Detallada
 *
 * Server Component. Performs a single-pass full history fetch, generates
 * Supabase signed URLs (60min) for all clinical photos, then streams the
 * clinical content inside <AutoLockOverlay> (10min inactivity blur).
 */

import { Suspense }                         from 'react';
import { headers }                          from 'next/headers';
import { notFound }                         from 'next/navigation';
import { getTranslations }                  from 'next-intl/server';
import { createSupabaseServerClient }       from '@/infrastructure/supabase/server';
import { getOrganizationBySlug }            from '@/domains/organizations/service';
import { getCustomerFullHistory }           from '@/domains/customers/full-history';
import type { AppointmentHistoryRow }       from '@/domains/customers/full-history';

import { PatientHeader, type PatientHeaderData } from './_components/PatientHeader';
import { AutoLockOverlay }                   from './_components/AutoLockOverlay';
import { TreatmentTimeline, type TimelineEntry } from './_components/TreatmentTimeline';
import { PhotoGallery, type PhotoSession }   from './_components/PhotoGallery';
import { PatientSkeleton }                   from './_components/PatientSkeleton';

interface Props { params: Promise<{ id: string }> }

const BUCKET = 'clinical-photos';
const URL_TTL = 3600;

async function generateSignedUrls(appointments: AppointmentHistoryRow[]): Promise<Map<string, string | null>> {
  const supabase = await createSupabaseServerClient();
  const paths    = appointments.flatMap(a => a.photos.map(p => p.storagePath));
  const unique   = [...new Set(paths)];
  const results  = await Promise.all(unique.map(async (path) => {
    const { data } = await supabase.storage.from(BUCKET).createSignedUrl(path, URL_TTL);
    return [path, data?.signedUrl ?? null] as [string, string | null];
  }));
  return new Map(results);
}

function resolveName(nameI18n: unknown, locale: string, fallback: string): string {
  const m = nameI18n as Record<string, string> | null;
  return m?.[locale] ?? m?.['es'] ?? m?.['en'] ?? fallback;
}

async function ClinicalContent({ customerId, orgId, locale }: { customerId: string; orgId: string; locale: string; }) {
  const t = await getTranslations({ locale, namespace: 'dashboard.customers.ficha' });
  const histResult = await getCustomerFullHistory(customerId, orgId);
  if (!histResult.data) notFound();
  const hist = histResult.data;

  const signedMap = await generateSignedUrls(hist.appointments);

  const patientData: PatientHeaderData = {
    id:           hist.id,
    fullName:     hist.fullName,
    email:        hist.email,
    phone:        hist.phone,
    isGuest:      hist.isGuest,
    createdAtIso: hist.createdAt instanceof Date ? hist.createdAt.toISOString() : String(hist.createdAt),
    onboarding:   hist.onboarding,
  };

  const timelineEntries: TimelineEntry[] = hist.appointments.map((a) => ({
    appointmentId:    a.appointmentId,
    startAt:          a.startAt instanceof Date ? a.startAt.toISOString() : String(a.startAt),
    status:           a.status,
    totalCents:       a.totalCents,
    serviceName:      resolveName(a.serviceNameI18n, locale, t('serviceNameFallback')),
    clinicalSessionId: a.clinicalSessionId,
    professionalNotes: a.professionalNotes,
    skinReactionNotes: a.skinReactionNotes,
  }));

  const photoSessions: PhotoSession[] = hist.appointments
    .filter(a => a.clinicalSessionId && a.photos.length > 0)
    .map((a) => ({
      sessionId:   a.clinicalSessionId!,
      sessionDate: a.startAt instanceof Date ? a.startAt.toISOString() : String(a.startAt),
      serviceName: resolveName(a.serviceNameI18n, locale, t('serviceNameFallback')),
      photos:      a.photos.map(p => ({
        id:        p.id,
        photoType: p.photoType,
        signedUrl: signedMap.get(p.storagePath) ?? null,
        takenAt:   p.takenAt instanceof Date ? p.takenAt.toISOString() : String(p.takenAt),
      })),
    }));

  return (
    <AutoLockOverlay>
      <div className="space-y-12">
        <PatientHeader patient={patientData} locale={locale} />
        <section aria-label={t('treatmentHeading')}>
          <h2 className="font-serif text-xl font-light text-(--color-spa-stone) mb-6">
            {t('treatmentHeading')}
          </h2>
          <TreatmentTimeline entries={timelineEntries} locale={locale} />
        </section>
        <section aria-label={t('galleryHeading')}>
          <h2 className="font-serif text-xl font-light text-(--color-spa-stone) mb-6">
            {t('galleryHeading')}
          </h2>
          <PhotoGallery sessions={photoSessions} locale={locale} />
        </section>
      </div>
    </AutoLockOverlay>
  );
}

export default async function FichaPage({ params }: Props) {
  const { id } = await params;
  const h      = await headers();
  const slug   = h.get('x-tenant-slug') ?? '';
  const locale = h.get('x-locale')      ?? 'pt';

  const orgResult = await getOrganizationBySlug(slug);
  if (!orgResult.data) notFound();

  return (
    <div className="space-y-2 max-w-3xl p-6">
      <Suspense fallback={<PatientSkeleton />}>
        <ClinicalContent customerId={id} orgId={orgResult.data.id} locale={locale} />
      </Suspense>
    </div>
  );
}
