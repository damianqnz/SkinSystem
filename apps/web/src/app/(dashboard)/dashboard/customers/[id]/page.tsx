/**
 * /dashboard/customers/[id] — Ficha Clínica Detallada
 *
 * Server Component. Performs a single-pass full history fetch, generates
 * Supabase signed URLs (60min) for all clinical photos, then streams the
 * clinical content inside <AutoLockOverlay> (10min inactivity blur).
 */

import { Suspense }                         from 'react';
import { headers }                          from 'next/headers';
import { notFound }                         from 'next/navigation';
import { createSupabaseServerClient }       from '@/infrastructure/supabase/server';
import { getOrganizationBySlug }            from '@/domains/organizations/service';
import { getCustomerFullHistory }           from '@/domains/customers/full-history';
import type { AppointmentHistoryRow }       from '@/domains/customers/full-history';

import { PatientHeader, type PatientHeaderData } from './_components/PatientHeader';
import { AutoLockOverlay }                   from './_components/AutoLockOverlay';
import { TreatmentTimeline, type TimelineEntry } from './_components/TreatmentTimeline';
import { PhotoGallery, type PhotoSession }   from './_components/PhotoGallery';
import { PatientSkeleton }                   from './_components/PatientSkeleton';

// ── Types ─────────────────────────────────────────────────────

interface Props { params: Promise<{ id: string }> }

// ── Signed URL helper ─────────────────────────────────────────

const BUCKET = 'clinical-photos';
const URL_TTL = 3600; // 60 minutes

async function generateSignedUrls(
  appointments: AppointmentHistoryRow[],
): Promise<Map<string, string | null>> {
  const supabase = await createSupabaseServerClient();
  const paths    = appointments.flatMap(a => a.photos.map(p => p.storagePath));
  const unique   = [...new Set(paths)];

  const results = await Promise.all(
    unique.map(async (path) => {
      const { data } = await supabase.storage.from(BUCKET).createSignedUrl(path, URL_TTL);
      return [path, data?.signedUrl ?? null] as [string, string | null];
    }),
  );

  return new Map(results);
}

// ── Locale helper ─────────────────────────────────────────────

function resolveName(nameI18n: unknown, locale: string): string {
  const m = nameI18n as Record<string, string> | null;
  return m?.[locale] ?? m?.['es'] ?? m?.['en'] ?? 'Servicio';
}

// ── Inner async component (Suspense boundary) ─────────────────

async function ClinicalContent({
  customerId,
  orgId,
  locale,
}: {
  customerId: string;
  orgId: string;
  locale: string;
}) {
  const histResult = await getCustomerFullHistory(customerId, orgId);
  if (!histResult.data) notFound();

  const hist = histResult.data;

  // Signed URLs for all clinical photos
  const signedMap = await generateSignedUrls(hist.appointments);

  // Serialise patient header data (dates → ISO strings)
  const patientData: PatientHeaderData = {
    id:           hist.id,
    fullName:     hist.fullName,
    email:        hist.email,
    phone:        hist.phone,
    isGuest:      hist.isGuest,
    createdAtIso: hist.createdAt instanceof Date ? hist.createdAt.toISOString() : String(hist.createdAt),
    onboarding:   hist.onboarding,
  };

  // Build timeline entries
  const timelineEntries: TimelineEntry[] = hist.appointments.map((a) => ({
    appointmentId:    a.appointmentId,
    startAt:          a.startAt instanceof Date ? a.startAt.toISOString() : String(a.startAt),
    status:           a.status,
    totalCents:       a.totalCents,
    serviceName:      resolveName(a.serviceNameI18n, locale),
    clinicalSessionId: a.clinicalSessionId,
    professionalNotes: a.professionalNotes,
    skinReactionNotes: a.skinReactionNotes,
  }));

  // Build photo sessions (only those with photos)
  const photoSessions: PhotoSession[] = hist.appointments
    .filter(a => a.clinicalSessionId && a.photos.length > 0)
    .map((a) => ({
      sessionId:   a.clinicalSessionId!,
      sessionDate: a.startAt instanceof Date ? a.startAt.toISOString() : String(a.startAt),
      serviceName: resolveName(a.serviceNameI18n, locale),
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
        {/* Patient header — has RevealField for encrypted data */}
        <PatientHeader patient={patientData} locale={locale} />

        {/* Treatment timeline */}
        <section aria-label="Historial de tratamientos">
          <h2 className="font-serif text-xl font-light text-[var(--color-spa-stone)] mb-6">
            {locale === 'en' ? 'Treatment History' : locale === 'pt' ? 'Histórico de Tratamentos' : 'Evolución del Tratamiento'}
          </h2>
          <TreatmentTimeline entries={timelineEntries} locale={locale} />
        </section>

        {/* Before / After gallery */}
        <section aria-label="Galería antes y después">
          <h2 className="font-serif text-xl font-light text-[var(--color-spa-stone)] mb-6">
            {locale === 'en' ? 'Before & After Gallery' : locale === 'pt' ? 'Galeria Antes e Depois' : 'Galería Antes y Después'}
          </h2>
          <PhotoGallery sessions={photoSessions} locale={locale} />
        </section>
      </div>
    </AutoLockOverlay>
  );
}

// ── Page ──────────────────────────────────────────────────────

export default async function PatientPage({ params }: Props) {
  const { id } = await params;
  const h      = await headers();
  const slug   = h.get('x-tenant-slug') ?? '';
  const locale = h.get('x-locale')      ?? 'es';

  const orgResult = await getOrganizationBySlug(slug);
  if (!orgResult.data) notFound();

  return (
    <div className="space-y-2 max-w-3xl">
      <Suspense fallback={<PatientSkeleton />}>
        <ClinicalContent customerId={id} orgId={orgResult.data.id} locale={locale} />
      </Suspense>
    </div>
  );
}
