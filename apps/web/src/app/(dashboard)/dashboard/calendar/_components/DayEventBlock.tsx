'use client';

// ── Status → color mapping (mirrors SlotCell palette) ─────────

const COLORS: Record<string, { bg: string; border: string; text: string; sub: string }> = {
  confirmed:   { bg: 'bg-sky-50',                        border: 'border-l-sky-400',     text: 'text-sky-800',    sub: 'text-sky-500'   },
  pending:     { bg: 'bg-amber-50',                      border: 'border-l-amber-400',   text: 'text-amber-800',  sub: 'text-amber-500' },
  in_progress: { bg: 'bg-[rgba(212,175,55,0.08)]',       border: 'border-l-[#D4AF37]',   text: 'text-stone-800',  sub: 'text-stone-500' },
  completed:   { bg: 'bg-emerald-50',                    border: 'border-l-emerald-400', text: 'text-emerald-800',sub: 'text-emerald-500'},
  cancelled:   { bg: 'bg-stone-100',                     border: 'border-l-stone-300',   text: 'text-stone-400',  sub: 'text-stone-400' },
  blocked: {
    bg:     'bg-[repeating-linear-gradient(-45deg,transparent,transparent_4px,rgba(100,116,139,0.06)_4px,rgba(100,116,139,0.06)_8px)]',
    border: 'border-l-slate-400',
    text:   'text-slate-600',
    sub:    'text-slate-400',
  },
};

// ── Props ────────────────────────────────────────────────────

interface DayEventBlockProps {
  type:                 'appointment' | 'blocked';
  label:                string;
  timeRange:            string;   // "10:00 – 11:00"
  variant:              string;   // appointment status or "blocked"
  /** Only relevant when type='appointment' */
  appointmentId?:       string;
  onAppointmentClick?:  (id: string) => void;
}

// ── Component ────────────────────────────────────────────────

export function DayEventBlock({ label, timeRange, variant, type, appointmentId, onAppointmentClick }: DayEventBlockProps) {
  const c = COLORS[variant] ?? COLORS['confirmed']!;
  const clickable = type === 'appointment' && !!onAppointmentClick;

  return (
    <div
      className={[
        'flex items-center gap-2 pl-2 pr-3 py-1',
        'rounded-r-md border-l-2 max-h-[52px] overflow-hidden',
        c.bg, c.border,
        clickable ? 'cursor-pointer' : '',
      ].join(' ')}
      onClick={(e) => {
        e.stopPropagation();
        if (clickable && appointmentId) onAppointmentClick(appointmentId);
      }}
    >
      <div className="flex-1 min-w-0">
        <p className={`text-[11px] font-medium leading-tight truncate ${c.text}`}>{label}</p>
        <p className={`text-[10px] tabular-nums mt-0.5 ${c.sub}`}>{timeRange}</p>
      </div>
    </div>
  );
}
