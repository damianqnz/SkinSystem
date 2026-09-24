'use client';

import { useActionState } from 'react';
import { useTranslations } from 'next-intl';
import { requestOtpAction, type OtpState } from '../actions';
import { cn } from '@/shared/lib/utils';

/**
 * Passwordless magic-link (OTP) request form.
 *
 * Self-contained: it renders its OWN <form> and lives as a SIBLING above the
 * password form inside the login MagicCard — never nested (nested forms are
 * invalid HTML). Reads the `auth.login` namespace, which is allow-listed for
 * the (auth) route group.
 */
export function OtpForm() {
  const [state, formAction, isPending] = useActionState<OtpState, FormData>(
    requestOtpAction,
    null,
  );
  const t = useTranslations('auth.login');

  // ── Confirmation ("check your inbox") ─────────────────────────
  if (state?.status === 'sent') {
    return (
      <div
        role="status"
        className="flex items-start gap-3 border border-stone-200 bg-stone-50 px-4 py-4"
      >
        <span className="mt-[7px] h-1.5 w-1.5 shrink-0 rounded-full bg-stone-400" />
        <p className="font-sans text-sm leading-relaxed text-stone-600">
          {t('otp.sent', { email: state.email })}
        </p>
      </div>
    );
  }

  // rateLimited has its own key; anything else falls back to generic.
  let errorMsg: string | null = null;
  if (state?.status === 'error') {
    errorMsg =
      state.error === 'rateLimited'
        ? t('errors.rateLimited')
        : t.has(`errors.${state.error}`)
          ? t(`errors.${state.error}`)
          : t('errors.generic');
  }

  return (
    <form action={formAction} noValidate className="w-full">
      {/* ── Error ──────────────────────────────────────────── */}
      {errorMsg && (
        <div
          role="alert"
          className="mb-7 flex items-start gap-3 border border-red-200 bg-red-50 px-4 py-3"
        >
          <span className="mt-[7px] h-1.5 w-1.5 shrink-0 rounded-full bg-red-400" />
          <p className="font-sans text-sm text-red-700">{errorMsg}</p>
        </div>
      )}

      {/* ── Email ──────────────────────────────────────────── */}
      <div className="mb-7">
        <label
          htmlFor="otp-email"
          className="mb-2 block font-sans text-[10px] font-medium tracking-[0.18em] uppercase text-stone-400"
        >
          {t('otp.label')}
        </label>
        <input
          id="otp-email"
          name="email"
          type="email"
          autoComplete="email"
          required
          disabled={isPending}
          placeholder="hola@example.com"
          className="input-editorial"
        />
      </div>

      {/* ── Submit (shimmer-btn) ───────────────────────────── */}
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
            <OtpLoadingDots />
            <span>{t('otp.cta')}</span>
          </span>
        ) : (
          t('otp.cta')
        )}
      </button>
    </form>
  );
}

function OtpLoadingDots() {
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
