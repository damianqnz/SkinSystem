'use client';

import { useEffect, useActionState, useState } from 'react';
import { useRouter }              from 'next/navigation';
import { Loader2, Shield, Lock }  from 'lucide-react';
import { toast }                  from 'sonner';
import { createSupabaseClient }   from '@/infrastructure/supabase/client';
import { createBookingAction }    from '../actions';
import { bookT, format, toIntlTag } from '../_i18n';
import type { BookingState, PublicSlot, BookingConfig, SurchargeItem } from '../actions';
import type { SelectService }     from '@/domains/catalog/schema';

// ── Helpers ───────────────────────────────────────────────────
// DB-driven i18n JSONB picker (service nameI18n, etc.) — not to be confused
// with the UI label dictionary (bookT).
function pickI18n(field: unknown, locale: string): string {
  if (!field || typeof field !== 'object') return '';
  const o = field as Record<string, string>;
  return o[locale] ?? o['es'] ?? o['en'] ?? Object.values(o)[0] ?? '';
}

function fmtPrice(cents: number, locale: string, currency = 'EUR'): string {
  return (cents / 100).toLocaleString(toIntlTag(locale), {
    style: 'currency', currency,
    minimumFractionDigits: 2, maximumFractionDigits: 2,
  });
}

function fmtDate(iso: string, locale: string): string {
  return new Date(iso).toLocaleString(toIntlTag(locale), {
    weekday: 'long', day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit',
  });
}

// ── Types ─────────────────────────────────────────────────────

interface AppliedCoupon {
  id:            string;
  discountType:  'percent' | 'fixed';
  discountValue: number;
  code:          string;
}

interface AuthUser {
  name:  string;
  email: string;
}

interface Step3ConfirmProps {
  service:       SelectService;
  slot:          PublicSlot;
  locale:        string;
  config:        BookingConfig;
  surcharges:    SurchargeItem[];
  appliedCoupon: AppliedCoupon | null;
  /**
   * Server-resolved session user. When provided we skip the
   * client-side session detection spinner and render the
   * AuthenticatedConfirm view immediately.
   * The client-side `useEffect` still runs as defense-in-depth
   * in case the session expired between server render and click.
   */
  initialAuthUser?: AuthUser | null;
}

const IDLE: BookingState = { status: 'idle' };

// ── Authenticated view ────────────────────────────────────────

function AuthenticatedConfirm({
  user,
  service,
  slot,
  locale,
  config,
  surcharges,
  appliedCoupon,
}: { user: AuthUser } & Omit<Step3ConfirmProps, 'config'> & { config: BookingConfig }) {
  const router = useRouter();
  const tAll = bookT(locale);
  const t    = tAll.confirm;
  const [state, dispatch, isPending] =
    useActionState<BookingState, unknown>(createBookingAction, IDLE);

  const priceCents = service.priceCents;
  const currency   = service.currency;

  const reductionCents = surcharges.filter((s) => s.isReduction).reduce((sum, s) => {
    const v = s.value;
    return sum + (s.valueType === 'percent' ? Math.round(priceCents * v / 100) : Math.round(v));
  }, 0);

  const onlineSubtotal = config.advancePaymentRequired
    ? Math.max(0, priceCents - reductionCents)
    : priceCents;

  let couponDiscount = 0;
  if (appliedCoupon) {
    couponDiscount = appliedCoupon.discountType === 'percent'
      ? Math.round(onlineSubtotal * appliedCoupon.discountValue / 100)
      : Math.min(Math.round(appliedCoupon.discountValue * 100), onlineSubtotal);
  }

  const onlineAmountCents = config.onlinePaymentEnabled
    ? Math.max(0, onlineSubtotal - couponDiscount)
    : 0;

  useEffect(() => {
    if (state.status === 'redirect') router.push(state.url);
    if (state.status === 'error')    toast.error(state.message);
    if (state.status === 'conflict') toast.error(t.conflictError);
  }, [state, router, t.conflictError]);

  function handlePay() {
    (dispatch as (p: unknown) => void)({
      serviceId:    service.id,
      slotStartISO: slot.startISO,
      slotEndISO:   slot.endISO,
      guestName:    user.name,
      guestEmail:   user.email,
      guestPhone:   'N/A',      // OAuth users — phone collected in /me profile
      couponId:     appliedCoupon?.id,
    });
  }

  const btnLabel = config.onlinePaymentEnabled
    ? format(t.payButton, { amount: fmtPrice(onlineAmountCents, locale, currency) })
    : t.bookButton;

  return (
    <div className="space-y-5">
      <h2 className="font-cormorant text-2xl font-semibold text-stone-900 text-center">
        {t.heading}
      </h2>

      {/* Booking summary card */}
      <div className="bg-stone-50 border border-stone-100 rounded-2xl p-5 space-y-3">
        <div className="flex items-start gap-3">
          <div
            className="mt-1 w-2 h-7 rounded-full flex-shrink-0"
            style={{ backgroundColor: service.color ?? '#D4AF37' }}
          />
          <div className="flex-1">
            <p className="font-cormorant text-lg font-semibold text-stone-900">
              {pickI18n(service.nameI18n, locale)}
            </p>
            {config.showServiceDuration && (
              <p className="text-xs text-stone-400">
                {service.durationMinutes} {tAll.common.minutes}
              </p>
            )}
          </div>
          {config.showServicePrices && (
            <span className="font-outfit font-medium text-stone-800 tabular-nums">
              {fmtPrice(priceCents, locale, currency)}
            </span>
          )}
        </div>

        <div className="border-t border-stone-100 pt-3 flex items-center justify-between text-sm">
          <span className="text-stone-500">{t.dateTime}</span>
          <span className="font-outfit font-medium text-stone-700 capitalize text-right">
            {fmtDate(slot.startISO, locale)}
          </span>
        </div>

        <div className="flex items-center justify-between text-sm">
          <span className="text-stone-500">{t.reservedAs}</span>
          <span className="font-outfit text-stone-700 truncate max-w-[180px] text-right">
            {user.name} · {user.email}
          </span>
        </div>
      </div>

      {/* Policy notice */}
      {config.cancellationPolicyText ? (
        <div className="bg-stone-50 border border-stone-100 rounded-xl px-4 py-3">
          <p className="text-[11px] text-stone-500 leading-relaxed">
            {config.cancellationPolicyText}
          </p>
        </div>
      ) : (
        <p className="text-[10px] text-stone-400 text-center leading-relaxed">
          {t.policyFallback}
        </p>
      )}

      {/* Stripe security badge */}
      {config.onlinePaymentEnabled && (
        <div className="flex items-center justify-center gap-2 text-stone-300">
          <Lock size={12} />
          <span className="text-[11px] font-outfit">{t.stripeSecure}</span>
          <Shield size={12} />
        </div>
      )}

      {/* CTA */}
      <button
        type="button"
        onClick={handlePay}
        disabled={isPending}
        className="w-full flex items-center justify-center gap-2.5 py-4 px-6 text-stone-950 font-outfit font-semibold text-base hover:opacity-90 disabled:opacity-60 transition-opacity shadow-sm rounded-2xl"
        style={{ backgroundColor: 'var(--brand-color)', borderRadius: 'var(--btn-radius)' }}
      >
        {isPending ? (
          <>
            <Loader2 size={18} className="animate-spin" />
            <span className="text-sm">{t.redirecting}</span>
          </>
        ) : (
          <>
            <span>{btnLabel}</span>
            <span>→</span>
          </>
        )}
      </button>
    </div>
  );
}

// ── Guest view ────────────────────────────────────────────────

function GuestConfirm({
  service,
  slot,
  locale,
  config,
  surcharges,
  appliedCoupon,
}: Step3ConfirmProps) {
  const router = useRouter();
  const tAll = bookT(locale);
  const t    = tAll.confirm;
  const [termsAccepted, setTermsAccepted] = useState(false);

  const [state, dispatch, isPending] =
    useActionState<BookingState, unknown>(createBookingAction, IDLE);

  const priceCents = service.priceCents;
  const currency   = service.currency;

  const reductionCents = surcharges.filter((s) => s.isReduction).reduce((sum, s) => {
    return sum + (s.valueType === 'percent'
      ? Math.round(priceCents * s.value / 100)
      : Math.round(s.value));
  }, 0);

  const onlineSubtotal = priceCents - reductionCents;

  let couponDiscountCents = 0;
  if (appliedCoupon) {
    couponDiscountCents = appliedCoupon.discountType === 'percent'
      ? Math.round(onlineSubtotal * appliedCoupon.discountValue / 100)
      : Math.min(Math.round(appliedCoupon.discountValue * 100), onlineSubtotal);
  }

  const onlineAmountCents = !config.onlinePaymentEnabled ? 0
    : config.advancePaymentRequired
      ? Math.max(0, onlineSubtotal - couponDiscountCents)
      : priceCents;

  useEffect(() => {
    if (state.status === 'redirect') router.push(state.url);
    if (state.status === 'error')    toast.error(state.message);
    if (state.status === 'conflict') toast.error(t.conflictError);
  }, [state, router, t.conflictError]);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (config.termsRequired && !termsAccepted) {
      toast.error(t.termsRequiredError);
      return;
    }
    const fd = new FormData(e.currentTarget);
    (dispatch as (p: unknown) => void)({
      serviceId:    service.id,
      slotStartISO: slot.startISO,
      slotEndISO:   slot.endISO,
      guestName:    (fd.get('guestName') as string) || 'Invitado',
      guestEmail:   fd.get('guestEmail') as string,
      guestPhone:   (fd.get('guestPhone') as string) || '000000',
      guestComment: (fd.get('guestComment') as string) || undefined,
      couponId:     appliedCoupon?.id,
    });
  }

  const inputClass =
    'mt-1.5 w-full border border-stone-200 rounded-xl px-4 py-3 text-sm text-stone-900 bg-white ' +
    'focus:outline-none focus:ring-2 focus:ring-stone-900/20 focus:border-stone-400 ' +
    'placeholder:text-stone-300 transition-colors';

  const btnLabel = !config.onlinePaymentEnabled
    ? t.bookButtonGuest
    : format(t.payButtonGuest, { amount: fmtPrice(onlineAmountCents, locale, currency) });

  return (
    <div>
      <h2 className="font-cormorant text-2xl font-semibold text-stone-900 mb-6 text-center">
        {t.heading}
      </h2>

      {/* Mobile-only summary */}
      <div className="lg:hidden bg-stone-50 rounded-2xl border border-stone-100 p-4 mb-5 space-y-2">
        <div className="flex items-center gap-2.5">
          <div
            className="w-2 h-7 rounded-full flex-shrink-0"
            style={{ backgroundColor: service.color ?? '#D4AF37' }}
          />
          <div>
            <p className="font-cormorant text-base font-semibold text-stone-900">
              {pickI18n(service.nameI18n, locale)}
            </p>
            {config.showServiceDuration && (
              <p className="text-xs text-stone-400">
                {service.durationMinutes} {tAll.common.minutes}
              </p>
            )}
          </div>
          {config.showServicePrices && (
            <span className="ml-auto font-outfit font-medium text-stone-800 text-sm tabular-nums">
              {fmtPrice(priceCents, locale, currency)}
            </span>
          )}
        </div>
        <div className="text-xs text-stone-500 border-t border-stone-100 pt-2 capitalize">
          {new Date(slot.startISO).toLocaleString(toIntlTag(locale), {
            weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit',
          })}
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {config.formFieldName && (
          <div>
            <label className="field-label">{t.nameLabel}</label>
            <input name="guestName" type="text" required minLength={2} maxLength={100}
              placeholder={t.namePlaceholder} className={inputClass} />
          </div>
        )}

        <div className={config.formFieldPhone && config.formFieldEmail ? 'grid grid-cols-1 sm:grid-cols-2 gap-4' : ''}>
          {config.formFieldPhone && (
            <div>
              <label className="field-label">{t.phoneLabel}</label>
              <input name="guestPhone" type="tel" required minLength={6}
                placeholder={t.phonePlaceholder} className={inputClass} />
            </div>
          )}
          {config.formFieldEmail && (
            <div>
              <label className="field-label">{t.emailLabel}</label>
              <input name="guestEmail" type="email" required
                placeholder={t.emailPlaceholder} className={inputClass} />
              <p className="mt-1 text-[10px] text-stone-400">{t.emailHelp}</p>
            </div>
          )}
        </div>

        {config.formFieldAddress && (
          <div>
            <label className="field-label">{t.addressLabel}</label>
            <input name="guestAddress" type="text" placeholder={t.addressPlaceholder} className={inputClass} />
          </div>
        )}

        <div>
          <label className="field-label">{t.noteLabel}</label>
          <textarea name="guestComment" rows={2} maxLength={500}
            placeholder={t.notePlaceholder}
            className={`${inputClass} resize-none`} />
        </div>

        {config.cancellationPolicyText && (
          <div className="bg-stone-50 border border-stone-100 rounded-xl px-4 py-3">
            <p className="text-[11px] text-stone-500 leading-relaxed">{config.cancellationPolicyText}</p>
          </div>
        )}

        {config.termsRequired && (config.termsLabel || config.termsUrl) && (
          <label className="flex items-start gap-3 cursor-pointer">
            <input type="checkbox" checked={termsAccepted}
              onChange={(e) => setTermsAccepted(e.target.checked)} className="mt-0.5 accent-stone-900" />
            <span className="text-xs text-stone-500 leading-relaxed">
              {config.termsLabel ?? t.acceptTerms}
              {config.termsUrl && (
                <> <a href={config.termsUrl} target="_blank" rel="noopener noreferrer"
                  className="underline hover:text-stone-800 transition-colors">{t.viewPolicy}</a></>
              )}
            </span>
          </label>
        )}

        {!config.cancellationPolicyText && !config.termsRequired && (
          <p className="text-[10px] text-stone-400 leading-relaxed">
            {t.policyFallback}
          </p>
        )}

        {config.onlinePaymentEnabled && (
          <div className="flex items-center justify-center gap-2 text-stone-300">
            <Lock size={12} />
            <span className="text-[11px] font-outfit">{t.stripeSecure}</span>
            <Shield size={12} />
          </div>
        )}

        <button type="submit"
          disabled={isPending || (config.termsRequired && !termsAccepted)}
          className="w-full flex items-center justify-center gap-2 py-4 px-6 text-stone-950 font-outfit font-medium text-sm hover:opacity-90 disabled:opacity-60 transition-opacity shadow-sm"
          style={{ backgroundColor: 'var(--brand-color)', borderRadius: 'var(--btn-radius)' }}
        >
          {isPending ? (<><Loader2 size={16} className="animate-spin" />{t.redirecting}</>) : btnLabel}
        </button>
      </form>
    </div>
  );
}

// ── Main component — detects session ──────────────────────────

export function Step3Confirm(props: Step3ConfirmProps) {
  const { initialAuthUser } = props;

  // Seed from the server-resolved session (if any) — avoids the
  // session-check spinner flash for users we already know are logged in.
  const [authUser,     setAuthUser]     = useState<AuthUser | null>(initialAuthUser ?? null);
  const [sessionReady, setSessionReady] = useState<boolean>(initialAuthUser !== undefined);

  useEffect(() => {
    // Defense-in-depth: re-verify on the client in case the session
    // expired between server render and the user landing here.
    const supabase = createSupabaseClient();
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) {
        const name = (data.user.user_metadata?.full_name as string)
          ?? (data.user.user_metadata?.name as string)
          ?? data.user.email?.split('@')[0]
          ?? 'Usuario';
        setAuthUser({ name, email: data.user.email ?? '' });
      } else {
        setAuthUser(null);
      }
      setSessionReady(true);
    });
  }, []);

  // Small loading state while we check the session (only when the
  // server didn't pass a seed — i.e. legacy callers).
  if (!sessionReady) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 size={22} className="animate-spin text-stone-300" />
      </div>
    );
  }

  // Authenticated → clean confirm view (no form)
  if (authUser) {
    return <AuthenticatedConfirm user={authUser} {...props} />;
  }

  // Guest → full form
  return <GuestConfirm {...props} />;
}
