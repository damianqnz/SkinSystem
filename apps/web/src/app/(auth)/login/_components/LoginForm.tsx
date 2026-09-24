'use client';

import { useActionState, useState } from 'react';
import { ChevronDown, Eye, EyeOff } from 'lucide-react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslations } from 'next-intl';
import { loginAction, type LoginState } from '../actions';
import { OtpForm } from './OtpForm';
import { OAuthButtons } from './OAuthButtons';
import { MagicCard } from '@/shared/components/ui/magic-card';
import { cn } from '@/shared/lib/utils';

interface LoginFormProps {
  next?: string;
  /** The `?error=` value forwarded by the page (e.g. an expired magic link). */
  initialError?: string;
}

export function LoginForm({ next, initialError }: LoginFormProps) {
  const [state, formAction, isPending] = useActionState<LoginState, FormData>(
    loginAction,
    null,
  );
  const [showPassword, setShowPassword] = useState(false);
  const t = useTranslations('auth.login');

  // The displayed error comes from BOTH sources: a password-submit result and an
  // arriving `?error=` (e.g. a magic link redirected here after expiring). It is
  // rendered ABOVE the tiers so it stays visible while the password disclosure
  // (tier 2) is collapsed. `t` types keys narrowly, so the dynamic `errors.*`
  // key is cast to a known argument-free error key: this satisfies both `has`
  // (existence probe) and the render call without pulling in ICU values (e.g.
  // otp.sent's {email}). The real path is resolved by next-intl at runtime.
  const shownError = state?.error ?? initialError;
  const errorKey = `errors.${shownError}` as 'errors.generic';
  const errorMsg = shownError
    ? (t.has(errorKey) ? t(errorKey) : t('errors.generic'))
    : null;
  const showBookCta = shownError === 'no_account';

  return (
    <MagicCard
      className="w-full"
      gradientColor="rgba(212, 212, 216, 0.18)"
      gradientSize={280}
    >
      {/* ── Error (both sources) — always visible, above the tiers ── */}
      <AnimatePresence>
        {errorMsg && (
          <motion.div
            role="alert"
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="mb-7 flex items-start gap-3 border border-red-200 bg-red-50 px-4 py-3"
          >
            <span className="mt-[7px] h-1.5 w-1.5 shrink-0 rounded-full bg-red-400" />
            <p className="text-sm text-red-700 font-sans">{errorMsg}</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── No-account CTA (either source, when `no_account`) ── */}
      <AnimatePresence>
        {showBookCta && (
          <motion.p
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="mb-7 text-center font-sans text-xs text-stone-500"
          >
            {t('noAccountCtaLead')}{' '}
            <Link
              href="/book"
              className="font-medium text-stone-800 underline-offset-4 transition-colors hover:text-stone-950 hover:underline"
            >
              {t('noAccountCtaAction')}
            </Link>
          </motion.p>
        )}
      </AnimatePresence>

      {/* ══ TIER 1 — passwordless (primary) ════════════════════════ */}
      {/* Magic-link (OTP) — sibling form, never nested */}
      <OtpForm />

      {/* Social sign-in */}
      <div className="mt-4">
        <OAuthButtons />
      </div>

      {/* ── Divider (separates tier 1 from the password disclosure) ── */}
      <div className="my-8 flex items-center gap-4">
        <span className="h-px flex-1 bg-stone-200" aria-hidden />
        <span className="font-sans text-[10px] font-medium tracking-[0.18em] uppercase text-stone-400">
          {t('otp.orPassword')}
        </span>
        <span className="h-px flex-1 bg-stone-200" aria-hidden />
      </div>

      {/* ══ TIER 2 — password (secondary, de-emphasized disclosure) ══ */}
      <details className="group">
        <summary
          className={cn(
            'flex cursor-pointer list-none items-center justify-between gap-3',
            'font-sans text-[10px] font-medium tracking-[0.18em] uppercase text-stone-400',
            'transition-colors hover:text-stone-600',
            'focus-visible:text-stone-700 focus-visible:outline-none',
            '[&::-webkit-details-marker]:hidden',
          )}
        >
          <span>{t('passwordDisclosure')}</span>
          <ChevronDown
            size={14}
            strokeWidth={1.5}
            aria-hidden
            className="text-stone-400 transition-transform duration-200 group-open:rotate-180"
          />
        </summary>

        <form action={formAction} noValidate className="mt-7 w-full">
          {next && <input type="hidden" name="next" value={next} />}

          {/* ── Email ──────────────────────────────────────────── */}
          <div className="mb-7">
            <label
              htmlFor="email"
              className="mb-2 block font-sans text-[10px] font-medium tracking-[0.18em] uppercase text-stone-400"
            >
              {t('email')}
            </label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              disabled={isPending}
              placeholder="hola@example.com"
              className="input-editorial"
            />
          </div>

          {/* ── Password ───────────────────────────────────────── */}
          <div className="mb-10">
            <label
              htmlFor="password"
              className="mb-2 block font-sans text-[10px] font-medium tracking-[0.18em] uppercase text-stone-400"
            >
              {t('password')}
            </label>
            <div className="relative">
              <input
                id="password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                required
                disabled={isPending}
                placeholder="••••••••"
                className="input-editorial pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute right-0 bottom-3 text-stone-400 hover:text-stone-700 transition-colors focus-visible:outline-none"
                aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
              >
                {showPassword
                  ? <EyeOff size={16} strokeWidth={1.5} />
                  : <Eye     size={16} strokeWidth={1.5} />
                }
              </button>
            </div>
          </div>

          {/* ── Submit (ShinyButton) ────────────────────────────── */}
          <button
            type="submit"
            disabled={isPending}
            className={cn(
              'shimmer-btn',
              'w-full h-[52px]',
              'bg-stone-900 text-stone-50',
              'font-sans text-[11px] font-medium tracking-[0.25em] uppercase',
              'transition-all duration-200',
              'active:scale-[0.98]',
              'disabled:opacity-50 disabled:cursor-not-allowed',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stone-900 focus-visible:ring-offset-2',
            )}
          >
            {isPending ? (
              <span className="flex items-center justify-center gap-2">
                <LoadingDots />
                <span>{t('loading')}</span>
              </span>
            ) : (
              t('submit')
            )}
          </button>
        </form>
      </details>

      {/* ══ TIER 3 — no-password hint ══════════════════════════════ */}
      <p className="mt-6 text-center font-sans text-xs text-stone-400">
        {t('noPasswordHint')}
      </p>
    </MagicCard>
  );
}

function LoadingDots() {
  return (
    <span className="flex gap-[3px]" aria-hidden>
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="h-1 w-1 rounded-full bg-stone-400 animate-bounce"
          style={{ animationDelay: `${i * 0.14}s` }}
        />
      ))}
    </span>
  );
}
