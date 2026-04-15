'use client';

/**
 * CustomersTable — editorial table rows with glassmorphism hover.
 * Receives pre-filtered CustomerRow[] from CustomerSearch.
 */

import { CustomerEmptyState } from './CustomerEmptyState';

// ── Types ──────────────────────────────────────────────────────
export type CustomerRow = {
  id: string;
  fullName: string;
  email: string | null;
  phone: string | null;
  isGuest: boolean;
  createdAtIso: string;
  lastVisitAtIso: string | null;
  visitCount: number;
};

// ── Helpers ────────────────────────────────────────────────────
const AVATAR_PALETTES = [
  { bg: '#F5F0E8', fg: '#8B7355' },
  { bg: '#EFF6FF', fg: '#3B82F6' },
  { bg: '#F0FDF4', fg: '#15803D' },
  { bg: '#FFF7ED', fg: '#C2410C' },
  { bg: '#FDF4FF', fg: '#9333EA' },
  { bg: '#F0FDFA', fg: '#0F766E' },
];

function avatarPalette(name: string) {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h << 5) - h + name.charCodeAt(i);
  return AVATAR_PALETTES[Math.abs(h) % AVATAR_PALETTES.length]!;
}

function initials(name: string) {
  const parts = name.trim().split(/\s+/);
  return parts.length > 1
    ? (parts[0]![0]! + parts[parts.length - 1]![0]!).toUpperCase()
    : name.slice(0, 2).toUpperCase();
}

function fmtDate(iso: string | null, locale: string): string {
  if (!iso) return '—';
  const d    = new Date(iso);
  const now  = new Date();
  const diff = Math.floor((now.getTime() - d.getTime()) / 86_400_000);
  if (diff === 0) return locale === 'pt' ? 'Hoje' : locale === 'en' ? 'Today' : 'Hoy';
  if (diff < 7)   return `${diff}d`;
  const tag = locale === 'pt' ? 'pt-PT' : locale === 'en' ? 'en-GB' : 'es-ES';
  return d.toLocaleDateString(tag, { day: 'numeric', month: 'short' });
}

// ── Component ──────────────────────────────────────────────────
interface Props {
  rows: CustomerRow[];
  locale: string;
  onAddFirst?: () => void;
}

export function CustomersTable({ rows, locale, onAddFirst }: Props) {
  if (rows.length === 0) return <CustomerEmptyState onAdd={onAddFirst} />;

  return (
    <div className="rounded-sm border border-[var(--color-spa-border)] overflow-hidden">
      {/* Table header */}
      <div className="grid grid-cols-[1fr_auto_auto_auto] md:grid-cols-[2fr_1fr_1fr_1fr] items-center px-5 py-2.5 bg-[var(--color-spa-bg)] border-b border-[var(--color-spa-border)]">
        <span className="font-sans text-[10px] uppercase tracking-[0.18em] text-[var(--color-spa-muted)]">
          {locale === 'en' ? 'Name' : locale === 'pt' ? 'Nome' : 'Nombre'}
        </span>
        <span className="hidden md:block font-sans text-[10px] uppercase tracking-[0.18em] text-[var(--color-spa-muted)]">
          {locale === 'en' ? 'Last visit' : locale === 'pt' ? 'Última visita' : 'Última visita'}
        </span>
        <span className="hidden md:block font-sans text-[10px] uppercase tracking-[0.18em] text-[var(--color-spa-muted)]">
          Email
        </span>
        <span className="font-sans text-[10px] uppercase tracking-[0.18em] text-[var(--color-spa-muted)] text-right md:text-left">
          {locale === 'en' ? 'Status' : 'Estado'}
        </span>
      </div>

      {/* Rows */}
      <ul>
        {rows.map((c, i) => {
          const pal        = avatarPalette(c.fullName);
          const inits      = initials(c.fullName);
          const isNew      = c.visitCount === 0;
          const isLast     = i === rows.length - 1;

          return (
            <li
              key={c.id}
              className={`
                grid grid-cols-[1fr_auto_auto_auto] md:grid-cols-[2fr_1fr_1fr_1fr]
                items-center px-5 py-3.5 cursor-pointer
                transition-colors duration-150
                hover:bg-white/80 hover:backdrop-blur-sm
                ${!isLast ? 'border-b border-[var(--color-spa-border)]' : ''}
              `}
            >
              {/* Name + avatar */}
              <div className="flex items-center gap-3 min-w-0">
                <div
                  className="flex-shrink-0 w-9 h-9 rounded-sm flex items-center justify-center"
                  style={{ backgroundColor: pal.bg }}
                >
                  <span className="font-sans text-[11px] font-semibold" style={{ color: pal.fg }}>
                    {inits}
                  </span>
                </div>
                <div className="min-w-0">
                  <p className="font-sans text-sm font-medium text-[var(--color-spa-stone)] truncate">
                    {c.fullName}
                  </p>
                  {c.phone && (
                    <p className="font-sans text-xs text-[var(--color-spa-muted)] truncate mt-0.5">
                      {c.phone}
                    </p>
                  )}
                </div>
              </div>

              {/* Last visit */}
              <span className="hidden md:block font-sans text-sm text-[var(--color-spa-muted)] tabular-nums">
                {fmtDate(c.lastVisitAtIso, locale)}
              </span>

              {/* Email */}
              <span className="hidden md:block font-sans text-sm text-[var(--color-spa-muted)] truncate max-w-[180px]">
                {c.email ?? '—'}
              </span>

              {/* Status badge */}
              <div className="flex justify-end md:justify-start">
                <span className={`
                  inline-flex font-sans text-[10px] uppercase tracking-wider
                  px-2.5 py-1 rounded-full border
                  ${isNew
                    ? 'bg-amber-50 text-amber-700 border-amber-200'
                    : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                  }
                `}>
                  {isNew
                    ? (locale === 'en' ? 'New' : locale === 'pt' ? 'Novo' : 'Nuevo')
                    : (locale === 'en' ? 'Regular' : locale === 'pt' ? 'Recorrente' : 'Recurrente')
                  }
                </span>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
