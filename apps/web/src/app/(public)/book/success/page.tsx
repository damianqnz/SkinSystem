import Link                    from 'next/link';
import { headers }             from 'next/headers';
import { CheckCircle2 }        from 'lucide-react';
import { getOrganizationBySlug } from '@/domains/organizations/service';
import { db }                  from '@/infrastructure/db';
import { appointments }        from '@/domains/booking/schema';
import { catalogServices }     from '@/domains/catalog/schema';
import { eq, and }             from 'drizzle-orm';
import type { Metadata }       from 'next';

export const metadata: Metadata = { title: 'Reserva confirmada' };

// ── i18n helper ───────────────────────────────────────────────

function t(field: unknown, locale: string): string {
  if (!field || typeof field !== 'object') return '';
  const o = field as Record<string, string>;
  return o[locale] ?? o['es'] ?? o['en'] ?? Object.values(o)[0] ?? '';
}

// ── Page ──────────────────────────────────────────────────────

interface SuccessPageProps {
  searchParams: Promise<{ appointment?: string }>;
}

export default async function BookSuccessPage({ searchParams }: SuccessPageProps) {
  const hdrs          = await headers();
  const slug          = hdrs.get('x-tenant-slug') ?? '';
  const locale        = hdrs.get('x-locale') ?? 'es';
  const { appointment: appointmentId } = await searchParams;

  const orgResult = await getOrganizationBySlug(slug);
  const org       = orgResult.data;

  // Fetch appointment details if ID provided
  let appointmentInfo: { serviceName: string; startAt: Date } | null = null;

  if (appointmentId && org) {
    const rows = await db
      .select({
        startAt:  appointments.startAt,
        nameI18n: catalogServices.nameI18n,
      })
      .from(appointments)
      .innerJoin(catalogServices, eq(appointments.serviceId, catalogServices.id))
      .where(and(
        eq(appointments.id, appointmentId),
        eq(appointments.organizationId, org.id),
      ))
      .limit(1);

    if (rows[0]) {
      appointmentInfo = {
        serviceName: t(rows[0].nameI18n, locale),
        startAt:     rows[0].startAt,
      };
    }
  }

  return (
    <div className="min-h-screen bg-[#FAFAF9] flex flex-col">

      {/* Nav */}
      <header className="border-b border-stone-100 bg-white/80 backdrop-blur-sm">
        <div className="max-w-lg mx-auto px-6 h-14 flex items-center">
          <Link href="/" className="font-cormorant text-xl font-semibold text-stone-900">
            {org?.name ?? 'SkinSystem'}
          </Link>
        </div>
      </header>

      {/* Content */}
      <main className="flex-1 flex items-center justify-center px-6 py-16">
        <div className="max-w-sm w-full text-center space-y-6">

          {/* Success icon */}
          <div className="flex justify-center">
            <div className="w-16 h-16 rounded-full bg-emerald-50 flex items-center justify-center">
              <CheckCircle2 size={32} className="text-emerald-500" />
            </div>
          </div>

          {/* Heading */}
          <div>
            <h1 className="font-cormorant text-3xl font-semibold text-stone-900">
              ¡Reserva confirmada!
            </h1>
            <p className="mt-2 text-sm text-stone-500">
              Hemos recibido tu pago. Te esperamos.
            </p>
          </div>

          {/* Appointment details */}
          {appointmentInfo && (
            <div className="bg-white rounded-2xl border border-stone-100 shadow-sm p-5 text-left space-y-3">
              <div>
                <p className="text-[10px] font-medium text-stone-400 uppercase tracking-wider">Tratamiento</p>
                <p className="font-cormorant text-lg font-semibold text-stone-900 mt-0.5">
                  {appointmentInfo.serviceName}
                </p>
              </div>
              <div>
                <p className="text-[10px] font-medium text-stone-400 uppercase tracking-wider">Fecha y hora</p>
                <p className="text-sm font-outfit text-stone-700 mt-0.5">
                  {appointmentInfo.startAt.toLocaleString(
                    locale === 'pt' ? 'pt-PT' : locale === 'en' ? 'en-GB' : 'es-ES',
                    { weekday: 'long', day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' },
                  )}
                </p>
              </div>
            </div>
          )}

          <p className="text-xs text-stone-400 leading-relaxed">
            Recibirás una confirmación por email. Si necesitas cancelar, hazlo con al menos 24h de antelación.
          </p>

          <Link
            href="/"
            className="inline-flex items-center gap-2 px-6 py-3 bg-stone-900 text-white font-outfit text-sm rounded-xl hover:bg-stone-800 transition-colors"
          >
            Volver al inicio
          </Link>
        </div>
      </main>
    </div>
  );
}
