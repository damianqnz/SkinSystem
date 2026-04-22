'use client';

import { useState }           from 'react';
import Link                   from 'next/link';
import Image                  from 'next/image';
import { ChevronUp, ChevronDown, ChevronRight } from 'lucide-react';
import type { CategoryWithServices } from '@/domains/catalog/service';

// ── Helpers ───────────────────────────────────────────────────

function t(field: unknown, locale: string): string {
  if (!field || typeof field !== 'object') return '';
  const o = field as Record<string, string>;
  return o[locale] ?? o['pt'] ?? o['es'] ?? o['en'] ?? Object.values(o)[0] ?? '';
}

function fmtDuration(minutes: number): string {
  if (minutes < 60) return `${minutes} min`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m === 0 ? `${h} h` : `${h} h ${m} min`;
}

function fmtPrice(cents: number, currency = 'EUR'): string {
  return (cents / 100).toLocaleString('pt-PT', {
    style: 'currency', currency,
    minimumFractionDigits: 0, maximumFractionDigits: 0,
  });
}

// ── ServiceRow ────────────────────────────────────────────────

function ServiceRow({ svc, locale }: { svc: CategoryWithServices['services'][number]; locale: string }) {
  const [expanded, setExpanded] = useState(false);
  const description = t(svc.descriptionI18n, locale);
  const name        = t(svc.nameI18n, locale) || 'Tratamento';

  return (
    <div className="border-b border-stone-100 dark:border-stone-800 last:border-0">
      <div className="flex items-center gap-4 py-4 px-1">
        {/* Thumbnail */}
        <div className="shrink-0 w-[72px] h-[72px] rounded-xl overflow-hidden bg-stone-100 dark:bg-stone-800">
          {svc.coverImageUrl ? (
            <Image
              src={svc.coverImageUrl} alt={name}
              width={72} height={72}
              className="object-cover w-full h-full"
            />
          ) : (
            <div
              className="w-full h-full"
              style={{ backgroundColor: svc.color ?? '#D4AF37', opacity: 0.3 }}
            />
          )}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <p className="font-outfit font-medium text-stone-900 dark:text-stone-100 text-[15px] leading-tight">
            {name}
          </p>
          <div className="flex items-center gap-2 mt-1 text-[13px] text-stone-400">
            <span>{fmtDuration(svc.durationMinutes)}</span>
            {description && (
              <>
                <span>·</span>
                <button
                  onClick={() => setExpanded(v => !v)}
                  className="underline underline-offset-2 hover:text-stone-600 dark:hover:text-stone-200 transition-colors"
                >
                  {expanded ? 'Ocultar detalhes' : 'Detalhes'}
                </button>
              </>
            )}
            <span>·</span>
            <span className="text-stone-700 dark:text-stone-300 font-medium">
              {fmtPrice(svc.priceCents, svc.currency)}
            </span>
          </div>

          {expanded && description && (
            <p className="mt-2 text-[13px] text-stone-500 dark:text-stone-400 leading-relaxed">
              {description}
            </p>
          )}
        </div>

        {/* Arrow to booking */}
        <Link
          href={`/book?service=${svc.id}`}
          className="shrink-0 p-2 rounded-full hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors text-stone-400 hover:text-stone-700 dark:hover:text-stone-200"
          aria-label={`Reservar ${name}`}
        >
          <ChevronRight size={18} />
        </Link>
      </div>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────

interface Props {
  categories: CategoryWithServices[];
  locale:     string;
}

export function ServicesAccordion({ categories, locale }: Props) {
  // First category open by default
  const [openIds, setOpenIds] = useState<Set<string>>(
    () => new Set(categories[0] ? [categories[0].id] : []),
  );

  const toggle = (id: string) =>
    setOpenIds(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });

  if (categories.length === 0) return null;

  return (
    <section id="servicos" className="py-14">
      <div className="mb-8">
        <p className="text-[11px] font-outfit font-medium text-stone-400 uppercase tracking-[0.2em] mb-2">
          Tratamentos
        </p>
        <h2 className="font-cormorant text-4xl font-semibold text-stone-900 dark:text-stone-100">
          Serviços
        </h2>
        <div className="mt-3 w-10 h-px bg-amber-400/60" />
      </div>

      <div className="space-y-1">
        {categories.map((cat) => {
          const isOpen    = openIds.has(cat.id);
          const catName   = t(cat.nameI18n, locale) || 'Categoria';
          const hasActive = cat.services.filter(s => s.isActive).length > 0;
          if (!hasActive) return null;

          return (
            <div
              key={cat.id}
              className="border border-stone-100 dark:border-stone-800 rounded-xl overflow-hidden bg-white dark:bg-stone-900/40"
            >
              {/* Category header */}
              <button
                onClick={() => toggle(cat.id)}
                className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-stone-50 dark:hover:bg-stone-800/50 transition-colors"
              >
                <span className="font-outfit font-semibold text-[13px] uppercase tracking-widest text-stone-700 dark:text-stone-300">
                  {catName}
                </span>
                {isOpen
                  ? <ChevronUp size={16} className="text-stone-400 shrink-0" />
                  : <ChevronDown size={16} className="text-stone-400 shrink-0" />
                }
              </button>

              {/* Services list */}
              {isOpen && (
                <div className="px-4 pb-2">
                  {cat.services
                    .filter(s => s.isActive)
                    .map(svc => (
                      <ServiceRow key={svc.id} svc={svc} locale={locale} />
                    ))
                  }
                </div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}
