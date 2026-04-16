import Link                    from 'next/link';
import { headers }             from 'next/headers';
import { notFound }            from 'next/navigation';
import type { Metadata }       from 'next';
import { getOrganizationBySlug } from '@/domains/organizations/service';
import { getActiveServices }     from '@/domains/catalog/service';
import { BookingFunnel }         from './_components/BookingFunnel';

// ── SEO ───────────────────────────────────────────────────────

export async function generateMetadata(): Promise<Metadata> {
  const hdrs   = await headers();
  const slug   = hdrs.get('x-tenant-slug') ?? '';
  const org    = await getOrganizationBySlug(slug);
  const name   = org.data?.name ?? 'SkinSystem';
  return {
    title: `Reservar cita — ${name}`,
  };
}

// ── Page ──────────────────────────────────────────────────────

interface BookPageProps {
  searchParams: Promise<{ service?: string; cancelled?: string }>;
}

export default async function BookPage({ searchParams }: BookPageProps) {
  const hdrs    = await headers();
  const slug    = hdrs.get('x-tenant-slug') ?? '';
  const locale  = hdrs.get('x-locale') ?? 'es';
  const { service: serviceParam, cancelled } = await searchParams;

  const orgResult = await getOrganizationBySlug(slug);
  if (orgResult.error || !orgResult.data) notFound();
  const org = orgResult.data;

  const svcResult = await getActiveServices(org.id);
  const services  = svcResult.data ?? [];

  return (
    <div className="min-h-screen bg-[#FAFAF9]">

      {/* Top nav */}
      <header className="sticky top-0 z-10 bg-[#FAFAF9]/90 backdrop-blur-md border-b border-stone-100">
        <div className="max-w-2xl mx-auto flex items-center justify-between px-6 h-14">
          <Link href="/" className="font-cormorant text-xl font-semibold text-stone-900">
            {org.name}
          </Link>
          <span className="text-xs text-stone-400 font-outfit">Reserva Online</span>
        </div>
      </header>

      {/* Funnel */}
      <main className="max-w-2xl mx-auto px-6 py-10">
        {/* Cancelled notice */}
        {cancelled === '1' && (
          <div className="mb-6 flex items-center gap-3 bg-amber-50 border border-amber-100 rounded-xl px-4 py-3">
            <span className="text-sm text-amber-700">
              Tu pago fue cancelado. Puedes elegir otro horario o intentarlo de nuevo.
            </span>
          </div>
        )}

        <BookingFunnel
          services={services}
          locale={locale}
          initialService={serviceParam}
        />
      </main>
    </div>
  );
}
