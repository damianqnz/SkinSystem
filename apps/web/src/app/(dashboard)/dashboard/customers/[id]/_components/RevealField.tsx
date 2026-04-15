'use client';

/**
 * RevealField — click-to-reveal for encrypted/sensitive clinical data.
 * Default: shows redacted placeholder (•••••).
 * On click: reveals value. Auto-re-redacts after 60s.
 * GDPR/§11: medical notes must not be visible in an unattended screen.
 */

import { useState, useEffect } from 'react';
import { Eye, EyeOff, AlertTriangle } from 'lucide-react';

interface Props {
  value: string | null;
  label: string;
  variant?: 'default' | 'danger'; // danger = allergies, medications
}

export function RevealField({ value, label, variant = 'default' }: Props) {
  const [revealed, setRevealed] = useState(false);

  // Auto-re-lock after 60 seconds
  useEffect(() => {
    if (!revealed) return;
    const t = setTimeout(() => setRevealed(false), 60_000);
    return () => clearTimeout(t);
  }, [revealed]);

  if (!value) return null;

  const isDanger = variant === 'danger';

  return (
    <div className="space-y-1.5">
      <p className="font-sans text-[10px] uppercase tracking-[0.15em] text-[var(--color-spa-muted)] flex items-center gap-1.5">
        {isDanger && <AlertTriangle size={10} strokeWidth={2} className="text-red-400" />}
        {label}
      </p>
      <button
        type="button"
        onClick={() => setRevealed(v => !v)}
        className="group flex items-start gap-2 text-left w-full"
        aria-label={revealed ? `Ocultar ${label}` : `Revelar ${label}`}
      >
        <span className={`
          font-sans text-sm leading-relaxed transition-all duration-200
          ${revealed
            ? isDanger ? 'text-red-600' : 'text-[var(--color-spa-stone)]'
            : 'text-[var(--color-spa-muted)] tracking-[0.25em]'
          }
        `}>
          {revealed ? value : '•••••••••••••'}
        </span>
        <span className="mt-0.5 flex-shrink-0 text-[var(--color-spa-muted)] group-hover:text-[var(--color-spa-stone)] transition-colors">
          {revealed
            ? <EyeOff size={12} strokeWidth={1.5} />
            : <Eye size={12} strokeWidth={1.5} />
          }
        </span>
      </button>
      {revealed && (
        <p className="font-sans text-[9px] text-[var(--color-spa-muted)] opacity-60">
          Se ocultará automáticamente en 60s
        </p>
      )}
    </div>
  );
}
