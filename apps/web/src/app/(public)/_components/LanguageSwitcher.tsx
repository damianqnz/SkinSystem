'use client';

/**
 * @file LanguageSwitcher.tsx
 * @description Navbar language selector for the public (consumer) segment.
 *
 *  - Radix DropdownMenu for a11y (keyboard nav, ARIA, focus trap).
 *  - Three supported locales: pt · es · en.
 *  - On select → Server Action persists the choice in `NEXT_LOCALE`
 *    and revalidates the root layout so SSR re-renders in the new lang.
 */

import { useTransition }     from 'react';
import * as DropdownMenu     from '@radix-ui/react-dropdown-menu';
import { Check, Globe }      from 'lucide-react';
import { cn }                from '@/shared/lib/utils';
import { setLocaleAction }   from '../actions';

// ── Types ─────────────────────────────────────────────────────

type Locale = 'pt' | 'es' | 'en';

interface Props {
  current:  Locale;
  /** `true` when the parent header has the translucent scrolled style. */
  scrolled: boolean;
}

// ── Static data ───────────────────────────────────────────────

const LANGUAGES: ReadonlyArray<{ code: Locale; label: string; short: string }> = [
  { code: 'pt', label: 'Português', short: 'PT' },
  { code: 'es', label: 'Español',   short: 'ES' },
  { code: 'en', label: 'English',   short: 'EN' },
];

const TRIGGER_ARIA: Record<Locale, string> = {
  pt: 'Mudar idioma',
  es: 'Cambiar idioma',
  en: 'Change language',
};

// ── Component ─────────────────────────────────────────────────

export function LanguageSwitcher({ current, scrolled }: Props) {
  const [isPending, startTransition] = useTransition();

  const handleSelect = (code: Locale) => {
    if (code === current || isPending) return;
    startTransition(async () => {
      await setLocaleAction(code);
    });
  };

  const activeShort = LANGUAGES.find((l) => l.code === current)?.short ?? 'PT';

  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger asChild>
        <button
          type="button"
          aria-label={TRIGGER_ARIA[current]}
          disabled={isPending}
          className={cn(
            'inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5',
            'text-[13px] font-outfit font-medium transition-colors',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
            'focus-visible:ring-[var(--brand-color)] focus-visible:ring-offset-transparent',
            'disabled:opacity-60',
            scrolled
              ? 'text-stone-600 hover:text-stone-900 hover:bg-stone-100 dark:text-stone-400 dark:hover:text-stone-100 dark:hover:bg-stone-800'
              : 'text-white/80 hover:text-white hover:bg-white/10',
          )}
        >
          <Globe className="h-4 w-4" aria-hidden />
          <span>{activeShort}</span>
        </button>
      </DropdownMenu.Trigger>

      <DropdownMenu.Portal>
        <DropdownMenu.Content
          align="end"
          sideOffset={8}
          className={cn(
            'z-[60] min-w-[10rem] rounded-xl border p-1 shadow-lg',
            'bg-white dark:bg-stone-900',
            'border-stone-200 dark:border-stone-800',
            'data-[state=open]:animate-in data-[state=closed]:animate-out',
            'data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0',
            'data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95',
          )}
        >
          {LANGUAGES.map(({ code, label, short }) => {
            const isActive = code === current;
            return (
              <DropdownMenu.Item
                key={code}
                onSelect={(event) => {
                  event.preventDefault();
                  handleSelect(code);
                }}
                className={cn(
                  'relative flex cursor-pointer items-center justify-between',
                  'rounded-lg px-3 py-2 text-[13px] font-outfit',
                  'outline-none transition-colors',
                  'data-[highlighted]:bg-stone-100 dark:data-[highlighted]:bg-stone-800',
                  isActive
                    ? 'font-semibold text-stone-900 dark:text-stone-100'
                    : 'text-stone-600 dark:text-stone-300',
                )}
              >
                <span className="flex items-center gap-2">
                  <span className="inline-block w-7 text-stone-400">{short}</span>
                  <span>{label}</span>
                </span>
                {isActive && <Check className="h-4 w-4 text-[var(--brand-color)]" aria-hidden />}
              </DropdownMenu.Item>
            );
          })}
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
}
