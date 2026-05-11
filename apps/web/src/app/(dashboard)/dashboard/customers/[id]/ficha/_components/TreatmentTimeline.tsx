'use client';

import { motion } from 'framer-motion';
import { CheckCircle2, Clock, XCircle, AlertCircle, CalendarX } from 'lucide-react';
import { useTranslations, useLocale } from 'next-intl';
import { RevealField } from './RevealField';

export type TimelineEntry = {
  appointmentId: string;
  startAt: string;
  status: string;
  totalCents: number;
  serviceName: string;
  clinicalSessionId: string | null;
  professionalNotes: string | null;
  skinReactionNotes: string | null;
};

const STATUS_ICON: Record<string, { icon: typeof CheckCircle2; color: string }> = {
  completed: { icon: CheckCircle2, color: '#10B981' },
  confirmed: { icon: Clock,         color: '#D4AF37' },
  pending:   { icon: Clock,         color: '#78716C' },
  cancelled: { icon: XCircle,       color: '#EF4444' },
  no_show:   { icon: AlertCircle,   color: '#F59E0B' },
};

const INTL_LOCALE_MAP: Record<string, string> = { pt: 'pt-PT', es: 'es-ES', en: 'en-GB' };

function formatCents(cents: number) {
  return (cents / 100).toLocaleString('es-ES', { style: 'currency', currency: 'EUR' });
}

const container = { hidden: {}, show: { transition: { staggerChildren: 0.06 } } };
const EASE: [number, number, number, number] = [0.25, 0.46, 0.45, 0.94];
const item = { hidden: { opacity: 0, x: -16 }, show: { opacity: 1, x: 0, transition: { duration: 0.35, ease: EASE } } };

interface Props { entries: TimelineEntry[]; locale: string }

export function TreatmentTimeline({ entries, locale }: Props) {
  const t          = useTranslations('dashboard.customers.ficha');
  const intlLocale = INTL_LOCALE_MAP[useLocale()] ?? 'pt-PT';

  if (entries.length === 0) {
    return (
      <div className="flex items-center gap-3 py-10 text-spa-muted">
        <CalendarX size={18} strokeWidth={1.5} />
        <p className="font-sans text-sm">{t('timelineEmpty')}</p>
      </div>
    );
  }

  return (
    <motion.ol variants={container} initial="hidden" animate="show" className="relative space-y-0">
      <div className="absolute left-[19px] top-5 bottom-5 w-px bg-spa-border" aria-hidden />
      {entries.map((entry) => {
        const d    = new Date(entry.startAt);
        const date = d.toLocaleDateString(intlLocale, { day: 'numeric', month: 'long', year: 'numeric' });
        const time = d.toLocaleTimeString(intlLocale, { hour: '2-digit', minute: '2-digit' });
        const meta  = STATUS_ICON[entry.status] ?? STATUS_ICON.pending!;
        const Icon  = meta.icon;
        return (
          <motion.li key={entry.appointmentId} variants={item} className="relative flex gap-4 pb-8 last:pb-0">
            <div className="shrink-0 w-10 flex items-start justify-center pt-0.5 z-10">
              <div className="w-[10px] h-[10px] rounded-full mt-[5px] ring-2 ring-(--color-spa-bg)" style={{ backgroundColor: meta.color }} />
            </div>
            <div className="flex-1 bg-white/50 backdrop-blur-sm border border-spa-border rounded-sm p-4 space-y-3 hover:bg-white/80 transition-colors duration-150">
              <div className="flex items-start justify-between gap-2 flex-wrap">
                <div className="space-y-0.5">
                  <p className="font-serif text-base font-light text-(--color-spa-stone) leading-tight">{entry.serviceName}</p>
                  <p className="font-sans text-xs text-spa-muted">{date} · {time}</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="font-sans text-sm text-spa-muted tabular-nums">{formatCents(entry.totalCents)}</span>
                  <div className="flex items-center gap-1">
                    <Icon size={13} strokeWidth={1.5} style={{ color: meta.color }} />
                    <span className="font-sans text-[10px] uppercase tracking-wider" style={{ color: meta.color }}>{entry.status}</span>
                  </div>
                </div>
              </div>
              {entry.clinicalSessionId && (
                <div className="pt-2 border-t border-spa-border space-y-3">
                  <p className="font-sans text-[10px] uppercase tracking-[0.15em] text-spa-muted">{t('clinicalNotesLabel')}</p>
                  {entry.professionalNotes && <RevealField value={entry.professionalNotes} label={t('profNotesLabel')} />}
                  {entry.skinReactionNotes && <RevealField value={entry.skinReactionNotes} label={t('skinReactionLabel')} variant="danger" />}
                </div>
              )}
            </div>
          </motion.li>
        );
      })}
    </motion.ol>
  );
}
