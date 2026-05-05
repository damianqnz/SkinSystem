'use client';

/**
 * @file DashboardLanguageSelector.tsx
 * @description Per-staff dashboard language selector.
 *
 *   - Floating-label visual pattern (label sits on the input border, accent
 *     blue) to match the screen mock.
 *   - Auto-saves on change via `setDashboardLocaleAction` and surfaces a
 *     Sonner toast for both success and failure paths.
 *   - The action persists into `profiles.locale` (durable, cross-device) and
 *     mirrors into the `DASHBOARD_LOCALE` cookie (per-browser).
 */

import { useId, useState, useTransition } from 'react';
import { useRouter }                       from 'next/navigation';
import { Loader2, ChevronDown }            from 'lucide-react';
import { toast }                           from 'sonner';
import { setDashboardLocaleAction }        from '../actions';

type Locale = 'pt' | 'es' | 'en';

interface Props {
  /** Resolved server-side from `x-locale` (DASHBOARD_LOCALE → fallback chain). */
  current: Locale;
  labels: {
    languageLabel:   string;
    languageHelper:  string;
    optionPt:        string;
    optionEs:        string;
    optionEn:        string;
    toastSuccess:    string;
    toastError:      string;
  };
}

const ORDERED_LOCALES: readonly Locale[] = ['pt', 'es', 'en'];

export function DashboardLanguageSelector({ current, labels }: Props) {
  const selectId               = useId();
  const router                 = useRouter();
  const [value, setValue]      = useState<Locale>(current);
  const [pending, startTransition] = useTransition();

  function handleChange(event: React.ChangeEvent<HTMLSelectElement>) {
    const next = event.target.value as Locale;
    if (next === value || pending) return;

    const previous = value;
    setValue(next); // optimistic

    startTransition(async () => {
      const result = await setDashboardLocaleAction(next);
      if (result.error) {
        setValue(previous); // rollback
        toast.error(labels.toastError);
        return;
      }
      toast.success(labels.toastSuccess);
      router.refresh();
    });
  }

  const optionLabels: Record<Locale, string> = {
    pt: labels.optionPt,
    es: labels.optionEs,
    en: labels.optionEn,
  };

  return (
    <div className="space-y-2">
      <div className="relative">
        <label
          htmlFor={selectId}
          className="
            absolute -top-2 left-3 z-10 px-1.5
            bg-white text-[11px] font-medium tracking-wide
            text-sky-600
            font-outfit
          "
        >
          {labels.languageLabel}
        </label>

        <select
          id={selectId}
          value={value}
          onChange={handleChange}
          disabled={pending}
          aria-busy={pending}
          className="
            block w-full appearance-none
            min-h-[44px] rounded-2xl
            border border-stone-200 bg-white
            px-4 py-3 pr-11
            text-sm text-stone-800 font-outfit
            shadow-sm
            transition-colors
            focus:outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-100
            disabled:opacity-60 disabled:cursor-not-allowed
          "
        >
          {ORDERED_LOCALES.map((code) => (
            <option key={code} value={code}>
              {optionLabels[code]}
            </option>
          ))}
        </select>

        <div className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-stone-400">
          {pending
            ? <Loader2 size={16} className="animate-spin" aria-hidden />
            : <ChevronDown size={16} aria-hidden />
          }
        </div>
      </div>

      <p className="text-xs text-stone-500 font-outfit">
        {labels.languageHelper}
      </p>
    </div>
  );
}
