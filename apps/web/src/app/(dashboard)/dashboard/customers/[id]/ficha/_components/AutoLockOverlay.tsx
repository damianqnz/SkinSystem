'use client';

/**
 * AutoLockOverlay — GDPR §11 / STANDARDS.md §11
 * Blurs all clinical content if the tab is hidden or user is inactive
 * for more than 10 minutes. Requires a click to unlock.
 */

import { useEffect, useState, useCallback, type ReactNode } from 'react';
import { Lock } from 'lucide-react';
import { useTranslations } from 'next-intl';

const LOCK_MS = 10 * 60 * 1000;

export function AutoLockOverlay({ children }: { children: ReactNode }) {
  const t      = useTranslations('dashboard.customers.autolock');
  const [locked, setLocked] = useState(false);

  const unlock = useCallback(() => setLocked(false), []);

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;

    const arm = () => {
      clearTimeout(timer);
      timer = setTimeout(() => setLocked(true), LOCK_MS);
    };
    const onActivity   = () => { if (!document.hidden) arm(); };
    const onVisibility = () => { if (document.hidden) arm(); else clearTimeout(timer); };

    arm();
    document.addEventListener('visibilitychange', onVisibility);
    document.addEventListener('mousemove',  onActivity, { passive: true });
    document.addEventListener('keydown',    onActivity, { passive: true });
    document.addEventListener('touchstart', onActivity, { passive: true });

    return () => {
      clearTimeout(timer);
      document.removeEventListener('visibilitychange', onVisibility);
      document.removeEventListener('mousemove',  onActivity);
      document.removeEventListener('keydown',    onActivity);
      document.removeEventListener('touchstart', onActivity);
    };
  }, []);

  return (
    <div className="relative">
      <div
        className={locked ? 'blur-md select-none pointer-events-none transition-[filter] duration-500' : 'transition-[filter] duration-300'}
        aria-hidden={locked}
      >
        {children}
      </div>

      {locked && (
        <div
          role="alertdialog"
          aria-label={t('ariaLabel')}
          onClick={unlock}
          className="absolute inset-0 z-50 flex flex-col items-center justify-center gap-5 cursor-pointer bg-(--color-spa-bg)/80 backdrop-blur-sm"
        >
          <div className="flex flex-col items-center gap-3 text-center px-8">
            <div className="w-14 h-14 rounded-sm border border-spa-border bg-white/60 flex items-center justify-center shadow-sm">
              <Lock size={22} strokeWidth={1.5} className="text-spa-muted" />
            </div>
            <h3 className="font-serif text-xl font-light text-(--color-spa-stone)">{t('title')}</h3>
            <p className="font-sans text-sm text-spa-muted max-w-xs leading-relaxed">{t('description')}</p>
            <span className="font-sans text-[10px] uppercase tracking-widest text-spa-muted opacity-60 mt-1">
              {t('gdprBadge')}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
