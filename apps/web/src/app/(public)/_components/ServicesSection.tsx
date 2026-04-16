import Link from 'next/link';
import { getOrganizationBySlug } from '@/domains/organizations/service';
import { getActiveServices }     from '@/domains/catalog/service';

// ── i18n helper ───────────────────────────────────────────────

function t(field: unknown, locale: string): string {
  if (!field || typeof field !== 'object') return '';
  const o = field as Record<string, string>;
  return o[locale] ?? o['es'] ?? o['en'] ?? Object.values(o)[0] ?? '';
}

function fmtPrice(cents: number, currency = 'EUR'): string {
  return (cents / 100).toLocaleString('es-ES', {
    style: 'currency', currency, minimumFractionDigits: 0, maximumFractionDigits: 0,
  });
}

// ── Component ─────────────────────────────────────────────────

interface ServicesSectionProps {
  slug:   string;
  locale: string;
}

export async function ServicesSection({ slug, locale }: ServicesSectionProps) {
  const orgResult = await getOrganizationBySlug(slug);
  if (orgResult.error || !orgResult.data) return null;

  const svcResult = await getActiveServices(orgResult.data.id);
  const services  = svcResult.data ?? [];

  if (services.length === 0) return null;

  return (
    <section id="servicios" className="py-20 px-6 bg-[#FAFAF9]">
      <div className="max-w-5xl mx-auto">

        {/* Heading */}
        <div className="mb-12 text-center">
          <p className="text-[11px] font-medium text-stone-400 uppercase tracking-[0.2em] mb-3">
            Tratamientos
          </p>
          <h2 className="font-cormorant text-4xl md:text-5xl font-semibold text-stone-900">
            Nuestros Servicios
          </h2>
          <div className="mt-4 mx-auto w-10 h-px bg-amber-400/60" />
        </div>

        {/* Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {services.map((svc) => (
            <Link
              key={svc.id}
              href={`/book?service=${svc.id}`}
              className="group bg-white rounded-2xl border border-stone-100 shadow-sm overflow-hidden hover:shadow-md hover:-translate-y-0.5 transition-all duration-200"
            >
              {/* Color bar */}
              <div
                className="h-1 w-full"
                style={{ backgroundColor: svc.color ?? '#D4AF37' }}
              />

              <div className="p-6">
                <h3 className="font-cormorant text-xl font-semibold text-stone-900 leading-tight mb-2">
                  {t(svc.nameI18n, locale) || 'Tratamiento'}
                </h3>

                {t(svc.descriptionI18n, locale) && (
                  <p className="text-xs text-stone-400 leading-relaxed mb-4 line-clamp-2">
                    {t(svc.descriptionI18n, locale)}
                  </p>
                )}

                <div className="flex items-center justify-between pt-3 border-t border-stone-50">
                  <span className="text-[11px] text-stone-400">
                    {svc.durationMinutes} min
                  </span>
                  <span className="font-outfit font-medium text-stone-800 tabular-nums">
                    {fmtPrice(svc.priceCents, svc.currency)}
                  </span>
                </div>

                {/* CTA hint */}
                <div className="mt-3 text-[11px] text-amber-600 font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                  Reservar →
                </div>
              </div>
            </Link>
          ))}
        </div>

        {/* Main CTA */}
        <div className="mt-14 text-center">
          <Link
            href="/book"
            className="inline-flex items-center gap-3 px-8 py-4 bg-stone-900 text-white font-outfit text-sm font-medium rounded-xl hover:bg-stone-800 transition-colors"
          >
            Ver disponibilidad y reservar
            <span aria-hidden>→</span>
          </Link>
        </div>
      </div>
    </section>
  );
}
