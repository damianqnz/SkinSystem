'use client';

/**
 * AddCustomerModal — placeholder form modal.
 * Opens from the FAB (mobile) or the "Nuevo Cliente" header button.
 * Submission is stubbed for now; will wire to a Server Action in the CRM phase.
 */

import { X, User, Mail, Phone } from 'lucide-react';
import { useEffect, useRef } from 'react';

interface Props {
  open: boolean;
  onClose: () => void;
}

export function AddCustomerModal({ open, onClose }: Props) {
  const firstInputRef = useRef<HTMLInputElement>(null);

  // Trap focus & close on Escape
  useEffect(() => {
    if (!open) return;
    firstInputRef.current?.focus();
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Añadir cliente"
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-[var(--color-spa-stone)]/30 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden
      />

      {/* Panel */}
      <div className="relative z-10 w-full sm:max-w-md bg-[var(--color-spa-bg)] border border-[var(--color-spa-border)] rounded-t-lg sm:rounded-sm shadow-xl p-6 space-y-5">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <h2 className="font-serif text-xl font-light text-[var(--color-spa-stone)]">
              Nuevo Cliente
            </h2>
            <p className="font-sans text-xs text-[var(--color-spa-muted)] mt-0.5">
              Rellena los datos básicos para crear el perfil.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-sm text-[var(--color-spa-muted)] hover:text-[var(--color-spa-stone)] hover:bg-stone-100 transition-colors"
            aria-label="Cerrar"
          >
            <X size={16} strokeWidth={1.5} />
          </button>
        </div>

        {/* Form — stub */}
        <form
          onSubmit={(e) => { e.preventDefault(); onClose(); }}
          className="space-y-4"
          noValidate
        >
          <label className="block space-y-1.5">
            <span className="font-sans text-[10px] uppercase tracking-[0.15em] text-[var(--color-spa-muted)]">
              Nombre completo *
            </span>
            <div className="relative">
              <User size={14} strokeWidth={1.5} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-spa-muted)]" />
              <input
                ref={firstInputRef}
                type="text"
                required
                placeholder="María González"
                className="input-editorial pl-8"
              />
            </div>
          </label>

          <label className="block space-y-1.5">
            <span className="font-sans text-[10px] uppercase tracking-[0.15em] text-[var(--color-spa-muted)]">
              Email
            </span>
            <div className="relative">
              <Mail size={14} strokeWidth={1.5} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-spa-muted)]" />
              <input
                type="email"
                placeholder="maria@ejemplo.com"
                className="input-editorial pl-8"
              />
            </div>
          </label>

          <label className="block space-y-1.5">
            <span className="font-sans text-[10px] uppercase tracking-[0.15em] text-[var(--color-spa-muted)]">
              Teléfono
            </span>
            <div className="relative">
              <Phone size={14} strokeWidth={1.5} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-spa-muted)]" />
              <input
                type="tel"
                placeholder="+34 600 000 000"
                className="input-editorial pl-8"
              />
            </div>
          </label>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 font-sans text-sm text-[var(--color-spa-muted)] border border-[var(--color-spa-border)] rounded-sm hover:border-[var(--color-spa-stone)] transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="flex-1 py-2.5 font-sans text-sm font-medium bg-[var(--color-spa-stone)] text-[var(--color-spa-bg)] rounded-sm shimmer-btn hover:opacity-90 transition-opacity"
            >
              Crear Cliente
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
