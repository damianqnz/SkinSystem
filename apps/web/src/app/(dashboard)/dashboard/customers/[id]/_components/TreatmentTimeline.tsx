'use client';

/**
 * TreatmentTimeline — Framer Motion staggered timeline.
 * Each item represents one appointment + its optional clinical session.
 * Notes are hidden behind RevealField (privacy in cabin).
 */

import { motion } from 'framer-motion';
import { CheckCircle2, Clock, XCircle, AlertCircle, CalendarX } from 'lucide-react';
import { RevealField } from './RevealField';

// ── Types ────────────────────────────────────────────────────

export type TimelineEntry = {
  appointmentId: string;
  startAt: string;        // ISO
  status: string;
  totalCents: number;
  serviceName: string;
  clinicalSessionId: string | null;
  professionalNotes: string | null;
  skinReactionNotes: string | null;
};

// ── Helpers ──────────────────────────────────────────────────

const STATUS_ICON: Record<string, { icon: typeof CheckCircle2; color: string }> = {
  completed: { icon: CheckCircle2, color: '#10B981' },
  confirmed: { icon: Clock,         color: '#D4AF37' },
  pending:   { icon: Clock,         color: '#78716C' },
  cancelled: { icon: XCircle,       color: '#EF4444' },
  no_show:   { icon: AlertCircle,   color: '#F59E0B' },
};

function fmtDateTime(iso: string, locale: string) {
  const d = new Date(iso);
  const tag = locale === 'pt' ? 'pt-PT' : locale === 'en' ? 'en-GB' : 'es-ES';
  return {
    date: d.toLocaleDateString(tag, { day: 'numeric', month: 'long', year: 'numeric' }),
    time: d.toLocaleTimeString(tag, { hour: '2-digit', minute: '2-digit' }),
  };
}

function formatCents(cents: number) {
  return (cents / 100).toLocaleString('es-ES', { style: 'currency', currency: 'EUR' });
}

// ── Animation variants ────────────────────────────────────────

const container = {
  hidden: {},
  show:   { transition: { staggerChildren: 0.06 } },
};

const EASE: [number, number, number, number] = [0.25, 0.46, 0.45, 0.94];

const item = {
  hidden: { opacity: 0, x: -16 },
  show:   { opacity: 1, x: 0, transition: { duration: 0.35, ease: EASE } },
};

// ── Component ─────────────────────────────────────────────────

interface Props { entries: TimelineEntry[]; locale: string }

export function TreatmentTimeline({ entries, locale }: Props) {
  if (entries.length === 0) {
    return (
      <div className="flex items-center gap-3 py-10 text-[var(--color-spa-muted)]">
        <CalendarX size={18} strokeWidth={1.5} />
        <p className="font-sans text-sm">Sin historial de citas aún.</p>
      </div>
    );
  }

  return (
    <motion.ol
      variants={container}
      initial="hidden"
      animate="show"
      className="relative space-y-0"
    >
      {/* Vertical rule */}
      <div className="absolute left-[19px] top-5 bottom-5 w-px bg-[var(--color-spa-border)]" aria-hidden />

      {entries.map((entry) => {
        const { date, time }  = fmtDateTime(entry.startAt, locale);
        const meta  = STATUS_ICON[entry.status] ?? STATUS_ICON.pending!;
        const Icon  = meta.icon;
        const hasClinical = !!entry.clinicalSessionId;

        return (
          <motion.li key={entry.appointmentId} variants={item} className="relative flex gap-4 pb-8 last:pb-0">
            {/* Status dot */}
            <div className="flex-shrink-0 w-10 flex items-start justify-center pt-0.5 z-10">
              <div
                className="w-[10px] h-[10px] rounded-full mt-[5px] ring-2 ring-[var(--color-spa-bg)]"
                style={{ backgroundColor: meta.color }}
              />
            </div>

            {/* Content card */}
            <div className="flex-1 bg-white/50 backdrop-blur-sm border border-[var(--color-spa-border)] rounded-sm p-4 space-y-3 hover:bg-white/80 transition-colors duration-150 group">
              {/* Header row */}
              <div className="flex items-start justify-between gap-2 flex-wrap">
                <div className="space-y-0.5">
                  <p className="font-serif text-base font-light text-[var(--color-spa-stone)] leading-tight">
                    {entry.serviceName}
                  </p>
                  <p className="font-sans text-xs text-[var(--color-spa-muted)]">
                    {date} · {time}
                  </p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <span className="font-sans text-sm text-[var(--color-spa-muted)] tabular-nums">
                    {formatCents(entry.totalCents)}
                  </span>
                  <div className="flex items-center gap-1">
                    <Icon size={13} strokeWidth={1.5} style={{ color: meta.color }} />
                    <span className="font-sans text-[10px] uppercase tracking-wider" style={{ color: meta.color }}>
                      {entry.status}
                    </span>
                  </div>
                </div>
              </div>

              {/* Clinical notes — revealed on click */}
              {hasClinical && (
                <div className="pt-2 border-t border-[var(--color-spa-border)] space-y-3">
                  <p className="font-sans text-[10px] uppercase tracking-[0.15em] text-[var(--color-spa-muted)]">
                    Notas Clínicas
                  </p>
                  {entry.professionalNotes && (
                    <RevealField value={entry.professionalNotes} label="Notas del profesional" />
                  )}
                  {entry.skinReactionNotes && (
                    <RevealField value={entry.skinReactionNotes} label="Reacción cutánea" variant="danger" />
                  )}
                </div>
              )}
            </div>
          </motion.li>
        );
      })}
    </motion.ol>
  );
}
