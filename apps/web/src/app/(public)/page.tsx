import { Suspense }              from 'react';
import Link                       from 'next/link';
import { headers }                from 'next/headers';
import type { Metadata }          from 'next';
import { getOrganizationBySlug }  from '@/domains/organizations/service';
import { ServicesSection }        from './_components/ServicesSection';

// ── SEO ───────────────────────────────────────────────────────

export async function generateMetadata(): Promise<Metadata> {
  const hdrs  = await headers();
  const slug  = hdrs.get('x-tenant-slug') ?? '';
  const org   = await getOrganizationBySlug(slug);
  const name  = org.data?.name ?? 'SkinSystem';
  return {
    title:       `${name} — Reserva Online`,
    description: `Descubre los tratamientos exclusivos de ${name} y reserva tu cita online en minutos.`,
    openGraph:   { title: `${name} — Reserva Online`, siteName: 'SkinSystem' },
  };
}

// ── Skeleton for services section ─────────────────────────────

function ServicesSkeleton() {
  return (
    <section className="py-20 px-6 bg-[#FAFAF9]">
      <div className="max-w-5xl mx-auto">
        <div className="mb-12 text-center space-y-3">
          <div className="h-3 w-24 bg-stone-200 rounded mx-auto animate-pulse" />
          <div className="h-10 w-64 bg-stone-200 rounded mx-auto animate-pulse" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white rounded-2xl border border-stone-100 h-44 animate-pulse" />
          ))}
        </div>
      </div>
    </section>
  );
}

// ── Page ──────────────────────────────────────────────────────

export default async function PublicHomePage() {
  const hdrs   = await headers();
  const slug   = hdrs.get('x-tenant-slug') ?? '';
  const locale = hdrs.get('x-locale') ?? 'es';

  const orgResult = await getOrganizationBySlug(slug);
  const org       = orgResult.data;

  return (
    <>
      {/* ── HERO ──────────────────────────────────────────────── */}
      <section className="relative min-h-screen flex flex-col items-center justify-center bg-stone-950 overflow-hidden px-6">

        {/* Dot-grid pattern */}
        <div
          className="absolute inset-0 opacity-[0.06]"
          style={{
            backgroundImage:
              'radial-gradient(circle, #D4AF37 1px, transparent 1px)',
            backgroundSize: '28px 28px',
          }}
          aria-hidden
        />

        {/* Decorative gold lines */}
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-amber-400/30 to-transparent" aria-hidden />
        <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-amber-400/20 to-transparent" aria-hidden />

        {/* Radial glow */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              'radial-gradient(ellipse 70% 50% at 50% 50%, rgba(212,175,55,0.07) 0%, transparent 70%)',
          }}
          aria-hidden
        />

        {/* Content */}
        <div className="relative z-10 text-center max-w-2xl">
          {/* Eyebrow */}
          <p className="text-[11px] font-medium text-amber-400/80 uppercase tracking-[0.3em] mb-6">
            Estética Avanzada
          </p>

          {/* Brand name */}
          <h1 className="font-cormorant text-7xl sm:text-8xl md:text-9xl font-light text-white leading-none tracking-tight">
            {org?.name ?? 'SkinSystem'}
          </h1>

          {/* Gold separator */}
          <div className="my-8 flex items-center justify-center gap-4">
            <div className="h-px w-16 bg-gradient-to-r from-transparent to-amber-400/60" />
            <div className="w-1 h-1 rounded-full bg-amber-400" />
            <div className="h-px w-16 bg-gradient-to-l from-transparent to-amber-400/60" />
          </div>

          {/* Tagline */}
          <p className="font-outfit text-base text-stone-400 leading-relaxed max-w-sm mx-auto">
            Donde la ciencia y el arte se unen<br />
            para realzar tu belleza natural
          </p>

          {/* CTA */}
          <div className="mt-12 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/book"
              className="group inline-flex items-center gap-3 px-8 py-4 bg-amber-400 text-stone-950 font-outfit text-sm font-medium rounded-xl hover:bg-amber-300 transition-colors shadow-lg shadow-amber-400/20"
            >
              Reservar ahora
              <span className="inline-block group-hover:translate-x-0.5 transition-transform" aria-hidden>→</span>
            </Link>
            <a
              href="#servicios"
              className="inline-flex items-center gap-2 px-6 py-4 border border-stone-700 text-stone-400 font-outfit text-sm rounded-xl hover:border-stone-500 hover:text-stone-200 transition-colors"
            >
              Ver tratamientos
            </a>
          </div>
        </div>

        {/* Scroll hint */}
        <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 opacity-40">
          <div className="w-px h-10 bg-gradient-to-b from-transparent to-stone-400" aria-hidden />
          <p className="text-[10px] text-stone-500 uppercase tracking-[0.2em]">Descubrir</p>
        </div>
      </section>

      {/* ── SERVICES (PPR dynamic island) ─────────────────────── */}
      <Suspense fallback={<ServicesSkeleton />}>
        <ServicesSection slug={slug} locale={locale} />
      </Suspense>

      {/* ── FOOTER ────────────────────────────────────────────── */}
      <footer className="bg-stone-950 border-t border-stone-800 py-10 px-6">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="font-cormorant text-stone-400 text-lg">
            {org?.name ?? 'SkinSystem'}
          </p>
          <p className="text-[11px] text-stone-600 font-outfit">
            © {new Date().getFullYear()} · Powered by SkinSystem
          </p>
        </div>
      </footer>
    </>
  );
}
