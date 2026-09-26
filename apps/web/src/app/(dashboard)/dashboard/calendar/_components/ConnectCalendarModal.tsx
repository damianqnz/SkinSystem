'use client';

import type { ReactNode } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { Apple, X } from 'lucide-react';
import { useTranslations } from 'next-intl';

// ── Google "G" icon ────────────────────────────────────────────
// Local replica of the inline SVG in `(tenant)/[tenant]/book/_components/
// Step2Auth.tsx` (its `GoogleIcon`). Duplicated on purpose to keep this
// modal self-contained — Step2Auth is intentionally left untouched.
function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden>
      <path fill="#FFC107" d="M43.611 20.083H42V20H24v8h11.303C33.654 33.656 29.25 36 24 36c-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039L37.618 9.39C34.522 6.483 29.461 4 24 4 12.955 4 4 12.955 4 24s8.955 20 20 20 20-8.955 20-20c0-1.341-.138-2.65-.389-3.917z"/>
      <path fill="#FF3D00" d="M6.306 14.691l6.571 4.819C14.655 15.108 18.961 12 24 12c3.059 0 5.842 1.154 7.961 3.039L37.618 9.39C34.522 6.483 29.461 4 24 4 16.318 4 9.656 8.337 6.306 14.691z"/>
      <path fill="#4CAF50" d="M24 44c5.166 0 9.86-1.977 13.409-5.192l-6.19-5.238C29.211 35.091 26.715 36 24 36c-5.232 0-9.624-3.324-11.283-7.946l-6.522 5.025C9.505 39.556 16.227 44 24 44z"/>
      <path fill="#1976D2" d="M43.611 20.083H42V20H24v8h11.303a12.04 12.04 0 0 1-4.087 5.571l.003-.002 6.19 5.238C36.971 39.205 44 34 44 24c0-1.341-.138-2.65-.389-3.917z"/>
    </svg>
  );
}

// ── Provider row (non-interactive, "coming soon") ──────────────
// A plain <div> — never a button/link — so it can start no action. The
// visible badge plus `aria-disabled` announce the unavailable state.
function ProviderRow({ icon, label, comingSoon }: { icon: ReactNode; label: string; comingSoon: string }) {
  return (
    <div
      aria-disabled
      className="flex items-center gap-3 px-3 py-3 rounded-xl border border-spa-border bg-[#FAFAF9]
                 cursor-default select-none"
    >
      <span
        className="w-9 h-9 rounded-lg bg-white border border-spa-border flex items-center justify-center shrink-0"
        aria-hidden
      >
        {icon}
      </span>
      <span
        className="flex-1 min-w-0 truncate text-sm text-(--color-spa-stone)"
        style={{ fontFamily: 'var(--font-sans)' }}
      >
        {label}
      </span>
      <span
        className="px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 text-[10px] font-medium shrink-0"
        style={{ fontFamily: 'var(--font-sans)' }}
      >
        {comingSoon}
      </span>
    </div>
  );
}

// ── Modal ──────────────────────────────────────────────────────

interface ConnectCalendarModalProps {
  /** The trigger element (e.g. the sidebar "connect" button). */
  children: ReactNode;
}

/**
 * Honest "connect calendar" dialog. There is NO Google/Apple Calendar
 * integration yet (only the DB schema exists), so this modal starts no OAuth
 * flow and calls no API — it only presents the two providers as "coming soon".
 */
export function ConnectCalendarModal({ children }: ConnectCalendarModalProps) {
  const t = useTranslations('dashboard.calendar.connect');

  return (
    <Dialog.Root>
      <Dialog.Trigger asChild>{children}</Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/30 backdrop-blur-[2px] data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 duration-200" />
        <Dialog.Content className="fixed z-50 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md bg-white rounded-2xl shadow-xl p-6 focus:outline-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 duration-200">
          {/* Header */}
          <div className="flex items-start justify-between gap-4 mb-5">
            <div className="min-w-0">
              <Dialog.Title
                className="text-xl font-light text-(--color-spa-stone)"
                style={{ fontFamily: 'var(--font-serif)' }}
              >
                {t('title')}
              </Dialog.Title>
              <Dialog.Description
                className="mt-1.5 text-sm leading-relaxed text-spa-muted"
                style={{ fontFamily: 'var(--font-sans)' }}
              >
                {t('description')}
              </Dialog.Description>
            </div>
            <Dialog.Close asChild>
              <button
                type="button"
                aria-label={t('closeAria')}
                className="shrink-0 p-1.5 rounded-md text-spa-muted hover:text-(--color-spa-stone) hover:bg-stone-100 transition-colors"
              >
                <X size={16} strokeWidth={1.5} />
              </button>
            </Dialog.Close>
          </div>

          {/* Providers — presented only, never interactive */}
          <div className="space-y-2.5">
            <ProviderRow icon={<GoogleIcon />} label={t('google')} comingSoon={t('comingSoon')} />
            <ProviderRow
              icon={<Apple size={18} strokeWidth={1.5} className="text-(--color-spa-stone)" />}
              label={t('apple')}
              comingSoon={t('comingSoon')}
            />
          </div>

          {/* Closing note */}
          <p
            className="mt-5 text-xs leading-relaxed text-spa-muted"
            style={{ fontFamily: 'var(--font-sans)' }}
          >
            {t('note')}
          </p>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
