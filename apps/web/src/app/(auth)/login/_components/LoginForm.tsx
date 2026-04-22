'use client';

import { useActionState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { loginAction, type LoginState } from '../actions';
import { MagicCard } from '@/shared/components/ui/magic-card';
import { cn } from '@/shared/lib/utils';
import type { AuthT } from '@/shared/lib/i18n/auth';

interface LoginFormProps {
  next?: string;
  t: AuthT;
}

export function LoginForm({ next, t }: LoginFormProps) {
  const [state, formAction, isPending] = useActionState<LoginState, FormData>(
    loginAction,
    null,
  );
  const [showPassword, setShowPassword] = useState(false);

  const errorMsg = state?.error
    ? t.errors[state.error as keyof typeof t.errors] ?? t.errors.generic
    : null;
  const showBookCta = state?.error === 'no_account';

  return (
    <MagicCard
      className="w-full"
      gradientColor="rgba(212, 212, 216, 0.18)"
      gradientSize={280}
    >
      <form action={formAction} noValidate className="w-full">
        {next && <input type="hidden" name="next" value={next} />}

        {/* ── Error ──────────────────────────────────────────── */}
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

        {/* ── Email ──────────────────────────────────────────── */}
        <div className="mb-7">
          <label
            htmlFor="email"
            className="mb-2 block font-sans text-[10px] font-medium tracking-[0.18em] uppercase text-stone-400"
          >
            {t.email}
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
            {t.password}
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
              <span>{t.loading}</span>
            </span>
          ) : (
            t.submit
          )}
        </button>

        {/* ── Forgot password ─────────────────────────────────── */}
        <p className="mt-6 text-center font-sans text-xs text-stone-400">
          <a
            href="#"
            className="transition-colors hover:text-stone-700 underline-offset-4 hover:underline"
          >
            {t.forgot}
          </a>
        </p>

        {/* ── No-account CTA (only after a `no_account` error) ── */}
        <AnimatePresence>
          {showBookCta && (
            <motion.p
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="mt-4 text-center font-sans text-xs text-stone-500"
            >
              {t.noAccountCtaLead}{' '}
              <a
                href="/book"
                className="font-medium text-stone-800 underline-offset-4 transition-colors hover:text-stone-950 hover:underline"
              >
                {t.noAccountCtaAction}
              </a>
            </motion.p>
          )}
        </AnimatePresence>
      </form>
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
