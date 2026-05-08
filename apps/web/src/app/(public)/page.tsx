import { headers } from 'next/headers';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { getLandingData } from './_data/getLandingData';
import { PublicHeader } from './_components/PublicHeader';
import { resolvePublicSessionUser } from '@/shared/lib/resolve-public-session';
import { HeroSection } from './_components/HeroSection';
import { GalleryModal } from './_components/GalleryModal';
import { ServicesAccordion } from './_components/ServicesAccordion';
import { StickyInfoCard } from './_components/StickyInfoCard';
import { AboutSection } from './_components/AboutSection';
import { GalleryGrid } from './_components/GalleryGrid';
import { ReviewsSection } from './_components/ReviewsSection';
import { MapSection } from './_components/MapSection';

// ── SEO ───────────────────────────────────────────────────────

export async function generateMetadata(): Promise<Metadata> {
  const hdrs = await headers();
  const slug = hdrs.get('x-tenant-slug') ?? '';
  const data = await getLandingData(slug);
  const name = data?.org.name ?? 'SkinSystem';
  return {
    title: `${name} — Reserva Online`,
    description: `Descobre os tratamentos exclusivos de ${name} e reserva a tua consulta online.`,
    openGraph: { title: `${name} — Reserva Online`, siteName: 'SkinSystem' },
  };
}

// ── Page ──────────────────────────────────────────────────────

export default async function PublicHomePage() {
  const hdrs = await headers();
  const slug = hdrs.get('x-tenant-slug') ?? '';
  const locale = hdrs.get('x-locale') ?? 'pt';

  const [data, sessionUser] = await Promise.all([
    getLandingData(slug),
    resolvePublicSessionUser(),
  ]);
  if (!data) notFound();

  const { org, phones, gallery, reviews, availability, openStatus, avgRating, reviewCount, categories } = data;

  const cardProps = { org, phones, availability, openStatus, avgRating, reviewCount };

  return (
    <div className="min-h-screen bg-stone-50 dark:bg-stone-950 text-stone-900 dark:text-stone-100">

      {/* Fixed header */}
      <PublicHeader orgName={org.name} logoUrl={org.logoUrl} locale={locale} user={sessionUser} />

      {/* Gallery modal (listens to custom events) */}
      <GalleryModal images={gallery} />

      {/* ── Hero ───────────────────────────────────────────── */}
      <HeroSection org={org} gallery={gallery} />

      {/* ── Body ───────────────────────────────────────────── */}
      <div className="max-w-6xl mx-auto px-4">

        {/* Mobile: Info card as top section */}
        <div className="lg:hidden py-6">
          <StickyInfoCard {...cardProps} />
        </div>

        {/* Two-column grid */}
        <div className="lg:grid lg:grid-cols-[1fr_310px] lg:gap-10 lg:items-start">

          {/* ── Left column: all sections ─────────────────── */}
          <main>
            <ServicesAccordion categories={categories} locale={locale} />
            <AboutSection orgName={org.name} about={org.about} />
            <GalleryGrid images={gallery} />
            <ReviewsSection reviews={reviews} avgRating={avgRating} reviewCount={reviewCount} />
            <MapSection org={org} />

            {/* Bottom padding */}
            <div className="h-16" />
          </main>

          {/* ── Right column: sticky card (desktop only) ──── */}
          <aside className="hidden lg:block">
            <div className="sticky top-24 py-8">
              <StickyInfoCard {...cardProps} />
            </div>
          </aside>
        </div>
      </div>

      {/* ── Footer ─────────────────────────────────────────── */}
      <footer className="border-t border-stone-100 dark:border-stone-800 py-8 px-4">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="font-cormorant text-stone-400 text-lg">
            {org.name}
          </p>
          <p className="text-[11px] text-stone-400 font-outfit">
            © {new Date().getFullYear()} · Powered by SkinSystem for Dev Damian Quiñonez
          </p>
        </div>
      </footer>
    </div>
  );
}
