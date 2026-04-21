'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react';
import { cn } from '@/shared/lib/utils';

interface CalendarSource {
  id:    string;
  label: string;
  /** Hex tint for the dot (oro = local, otros = providers) */
  color: string;
  /** Display char for the avatar slot ("L" / "G" / "A" / "M") */
  badge: string;
  /** Provider name (rendered subtitle on Google etc.) */
  provider?: 'local' | 'google' | 'apple' | 'microsoft';
}

interface CalendarsSidebarProps {
  tenantName: string;
  /** ID of the calendar provider currently linked, e.g. 'lourdesmegusta@gmail.com' */
  linkedGoogleEmail?: string | null;
}

/** Local-storage key — persists open/closed across navigation. */
const LS_KEY = 'agenda.sidebar.open';

export function CalendarsSidebar({ tenantName, linkedGoogleEmail }: CalendarsSidebarProps) {
  const [open, setOpen] = useState<boolean>(true);
  const [checked, setChecked] = useState<Record<string, boolean>>({});

  // Hydrate persisted state once
  useEffect(() => {
    const stored = typeof window !== 'undefined'
      ? window.localStorage.getItem(LS_KEY)
      : null;
    if (stored === '0') setOpen(false);
  }, []);

  const toggle = () => {
    setOpen((prev) => {
      const next = !prev;
      if (typeof window !== 'undefined') {
        window.localStorage.setItem(LS_KEY, next ? '1' : '0');
      }
      return next;
    });
  };

  const sources: CalendarSource[] = [
    { id: 'tenant',  label: tenantName || 'Estética',  color: '#D4AF37', badge: tenantName?.[0]?.toUpperCase() ?? 'L', provider: 'local' },
    ...(linkedGoogleEmail
      ? [{ id: 'google', label: linkedGoogleEmail, color: '#4285F4', badge: 'G', provider: 'google' as const }]
      : []),
  ];

  // Initialise checks (default true) once sources resolve
  useEffect(() => {
    setChecked((prev) => {
      const next = { ...prev };
      for (const s of sources) if (next[s.id] === undefined) next[s.id] = true;
      return next;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [linkedGoogleEmail, tenantName]);

  return (
    <AnimatePresence initial={false}>
      <motion.aside
        key="calendars-sidebar"
        initial={false}
        animate={{ width: open ? 288 : 36 }}
        transition={{ duration: 0.24, ease: [0.25, 0.46, 0.45, 0.94] }}
        className="hidden md:flex flex-col shrink-0 h-full
                   border-r border-spa-border bg-[#FAFAF9] overflow-hidden"
      >
        {/* ── Header w/ collapse toggle ─────────────────── */}
        <div className="flex items-center justify-between gap-2 h-12 px-3 border-b border-spa-border shrink-0">
          {open && (
            <h2
              className="text-[13px] tracking-wide text-(--color-spa-stone) truncate"
              style={{ fontFamily: 'var(--font-serif)' }}
            >
              Os seus calendários
            </h2>
          )}
          <button
            type="button"
            onClick={toggle}
            aria-label={open ? 'Fechar painel' : 'Abrir painel'}
            className="ml-auto p-1.5 rounded-md text-spa-muted hover:text-(--color-spa-stone) hover:bg-stone-100 transition-colors"
          >
            {open
              ? <ChevronLeft  size={14} strokeWidth={1.5} />
              : <ChevronRight size={14} strokeWidth={1.5} />}
          </button>
        </div>

        {/* ── Body — only when expanded ─────────────────── */}
        <AnimatePresence initial={false}>
          {open && (
            <motion.div
              key="body"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1, transition: { delay: 0.08, duration: 0.18 } }}
              exit={{ opacity: 0, transition: { duration: 0.1 } }}
              className="flex-1 overflow-y-auto no-scrollbar px-3 py-3 space-y-1"
            >
              {sources.map((s) => (
                <SourceRow
                  key={s.id}
                  source={s}
                  checked={checked[s.id] ?? true}
                  onToggle={() => setChecked((c) => ({ ...c, [s.id]: !(c[s.id] ?? true) }))}
                />
              ))}

              {/* Connect new */}
              <button
                type="button"
                className="group w-full flex items-center gap-2.5 px-2.5 py-2 mt-2
                           text-[12px] text-spa-muted hover:text-(--color-spa-stone)
                           rounded-md hover:bg-stone-100/70 transition-colors text-left"
                style={{ fontFamily: 'var(--font-sans)' }}
              >
                <span className="w-5 h-5 rounded-md border border-dashed border-spa-border flex items-center justify-center group-hover:border-[#D4AF37]">
                  <Plus size={10} strokeWidth={1.5} className="group-hover:text-[#D4AF37]" />
                </span>
                Conectar o calendário
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.aside>
    </AnimatePresence>
  );
}

// ── Row ────────────────────────────────────────────────────────────

function SourceRow({
  source,
  checked,
  onToggle,
}: {
  source:   CalendarSource;
  checked:  boolean;
  onToggle: () => void;
}) {
  return (
    <label
      className={cn(
        'flex items-center gap-2.5 px-2 py-1.5 rounded-md cursor-pointer',
        'hover:bg-stone-100/70 transition-colors',
      )}
    >
      <input
        type="checkbox"
        checked={checked}
        onChange={onToggle}
        className="appearance-none w-3.5 h-3.5 rounded-sm border border-spa-border
                   checked:bg-(--color-spa-stone) checked:border-(--color-spa-stone)
                   relative
                   checked:after:content-['✓'] checked:after:text-white
                   checked:after:text-[9px] checked:after:absolute
                   checked:after:left-1/2 checked:after:top-1/2
                   checked:after:-translate-x-1/2 checked:after:-translate-y-1/2"
      />
      <span
        className="w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-medium text-white shrink-0"
        style={{ backgroundColor: source.color, fontFamily: 'var(--font-sans)' }}
        aria-hidden
      >
        {source.badge}
      </span>
      <span
        className="flex-1 min-w-0 truncate text-[12px] text-(--color-spa-stone)"
        style={{ fontFamily: 'var(--font-sans)' }}
      >
        {source.label}
      </span>
    </label>
  );
}
