'use client';

/**
 * AutoLockOverlay — GDPR §11 / STANDARDS.md §11
 * Blurs all clinical content if the tab is hidden or user is inactive
 * for more than 10 minutes. Requires a click to unlock.
 *
 * Triggers:
 *  - document.visibilitychange (tab hidden → start 10min countdown)
 *  - No mousemove / keydown / touchstart for 10min
 */

import { useEffect, useState, useCallback, type ReactNode } from 'react';
import { Lock } from 'lucide-react';

const LOCK_MS = 10 * 60 * 1000; // 10 minutes

export function AutoLockOverlay({ children }: { children: ReactNode }) {
  const [locked, setLocked] = useState(false);

  const unlock = useCallback(() => setLocked(false), []);

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;

    const arm = () => {
      clearTimeout(timer);
      timer = setTimeout(() => setLocked(true), LOCK_MS);
    };

    const onActivity = () => {
      if (!document.hidden) arm();
    };

    const onVisibility = () => {
      if (document.hidden) {
        arm(); // start countdown when hidden
      } else {
        clearTimeout(timer); // reset when visible again (user returned quickly)
      }
    };

    arm(); // start immediately on mount
    document.addEventListener('visibilitychange', onVisibility);
    document.addEventListener('mousemove',        onActivity,  { passive: true });
    document.addEventListener('keydown',          onActivity,  { passive: true });
    document.addEventListener('touchstart',       onActivity,  { passive: true });

    return () => {
      clearTimeout(timer);
      document.removeEventListener('visibilitychange', onVisibility);
      document.removeEventListener('mousemove',        onActivity);
      document.removeEventListener('keydown',          onActivity);
      document.removeEventListener('touchstart',       onActivity);
    };
  }, []);

  return (
    <div className="relative">
      {/* Content — blurred when locked */}
      <div
        className={locked ? 'blur-md select-none pointer-events-none transition-[filter] duration-500' : 'transition-[filter] duration-300'}
        aria-hidden={locked}
      >
        {children}
      </div>

      {/* Lock overlay */}
      {locked && (
        <div
          role="alertdialog"
          aria-label="Sesión clínica bloqueada por inactividad"
          onClick={unlock}
          className="absolute inset-0 z-50 flex flex-col items-center justify-center gap-5 cursor-pointer bg-[var(--color-spa-bg)]/80 backdrop-blur-sm"
        >
          <div className="flex flex-col items-center gap-3 text-center px-8">
            <div className="w-14 h-14 rounded-sm border border-[var(--color-spa-border)] bg-white/60 flex items-center justify-center shadow-sm">
              <Lock size={22} strokeWidth={1.5} className="text-[var(--color-spa-muted)]" />
            </div>
            <h3 className="font-serif text-xl font-light text-[var(--color-spa-stone)]">
              Sesión Protegida
            </h3>
            <p className="font-sans text-sm text-[var(--color-spa-muted)] max-w-xs leading-relaxed">
              Los datos clínicos se bloquearon por inactividad. Haz clic para continuar.
            </p>
            <span className="font-sans text-[10px] uppercase tracking-widest text-[var(--color-spa-muted)] opacity-60 mt-1">
              GDPR · Datos de Salud
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
