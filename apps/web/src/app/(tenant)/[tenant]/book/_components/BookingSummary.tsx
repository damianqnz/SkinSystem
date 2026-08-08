'use client';

import { useState, useTransition } from 'react';
import Image from 'next/image';
import { Star, MapPin, Tag, Loader2, X } from 'lucide-react';
import { validateCouponAction } from '../actions';
import { bookT, toIntlTag } from '../_i18n';
import type { PublicSlot, SurchargeItem, CouponResult } from '../actions';
import type { SelectService } from '@/domains/catalog/schema';

// ── Helpers ───────────────────────────────────────────────────
// DB-driven i18n JSONB picker (service nameI18n). Distinct from bookT (UI labels).
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

// ── Sub-components ────────────────────────────────────────────

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((n) => (
        <Star
          key={n}
          size={12}
          className={n <= Math.round(rating) ? 'text-amber-400 fill-amber-400' : 'text-stone-200 fill-stone-200'}
        />
      ))}
    </div>
  );
}

// ── Props ─────────────────────────────────────────────────────

interface OrgData {
  name: string;
  logoUrl: string | null;
  address: string | null;
  city: string | null;
  avgRating: number;
  reviewCount: number;
}

interface AppliedCoupon {
  id: string;
  discountType: 'percent' | 'fixed';
  discountValue: number;
  code: string;
}

interface BookingSummaryProps {
  orgData: OrgData;
  service: SelectService | null;
  slot: PublicSlot | null;
  surcharges: SurchargeItem[];
  locale: string;
  showPrices: boolean;
  appliedCoupon: AppliedCoupon | null;
  onCouponApply: (coupon: AppliedCoupon) => void;
  onCouponRemove: () => void;
}

// ── Component ─────────────────────────────────────────────────

export function BookingSummary({
  orgData,
  service,
  slot,
  surcharges,
  locale,
  showPrices,
  appliedCoupon,
  onCouponApply,
  onCouponRemove,
}: BookingSummaryProps) {
  const tAll = bookT(locale);
  const t    = tAll.summary;
  const [couponCode, setCouponCode] = useState('');
  const [couponError, setCouponError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  // ── Price calculations ────────────────────────────────────
  const priceCents = service?.priceCents ?? 0;
  const currency = service?.currency ?? 'EUR';

  // Apply active reductions (they reduce the online payment amount)
  // surcharges passed in are already filtered to isActive=true from the page
  const reductions = surcharges.filter((s) => s.isReduction);
  const additions = surcharges.filter((s) => !s.isReduction);

  let onlineCents = priceCents;

  // Add surcharges first
  for (const s of additions) {
    if (s.valueType === 'percent') {
      onlineCents += Math.round(priceCents * s.value / 100);
    } else {
      onlineCents += Math.round(s.value);
    }
  }

  // Reduction lines (displayed separately)
  const reductionLines = reductions.map((s) => {
    const cents = s.valueType === 'percent'
      ? Math.round(priceCents * s.value / 100)
      : Math.round(s.value);
    return { name: s.name, cents, isReduction: true };
  });
  const totalReductionCents = reductionLines.reduce((sum, r) => sum + r.cents, 0);
  const subtotalOnlineCents = onlineCents - totalReductionCents;

  // Coupon
  let couponDiscountCents = 0;
  if (appliedCoupon) {
    if (appliedCoupon.discountType === 'percent') {
      couponDiscountCents = Math.round(subtotalOnlineCents * appliedCoupon.discountValue / 100);
    } else {
      couponDiscountCents = Math.min(Math.round(appliedCoupon.discountValue * 100), subtotalOnlineCents);
    }
  }

  const totalOnlineCents = Math.max(0, subtotalOnlineCents - couponDiscountCents);

  // Simpler: saldo = what's left after paying online
  const paidLocalCents = Math.max(0, priceCents - totalOnlineCents);
  const hasReductions = reductionLines.length > 0;

  function handleValidateCoupon() {
    if (!couponCode.trim()) return;
    setCouponError(null);
    startTransition(async () => {
      const result: CouponResult = await validateCouponAction(couponCode.trim());
      if (!result.valid) {
        setCouponError(result.message);
        return;
      }
      onCouponApply({
        id: result.id,
        discountType: result.discountType,
        discountValue: result.discountValue,
        code: couponCode.trim().toUpperCase(),
      });
      setCouponCode('');
    });
  }

  return (
    <div className="space-y-4">

      {/* Org info card */}
      <div className="bg-white rounded-2xl border border-stone-100 p-5 shadow-sm">
        <div className="flex items-center gap-3 mb-3">
          {orgData.logoUrl ? (
            <Image
              src={orgData.logoUrl}
              alt={orgData.name}
              width={44}
              height={44}
              className="rounded-xl object-cover flex-shrink-0"
            />
          ) : (
            <div className="w-11 h-11 rounded-xl bg-stone-100 flex items-center justify-center flex-shrink-0">
              <span className="text-stone-400 text-lg font-cormorant font-semibold">
                {orgData.name.charAt(0)}
              </span>
            </div>
          )}
          <div>
            <p className="font-cormorant text-base font-semibold text-stone-900 leading-tight">
              {orgData.name}
            </p>
            {orgData.reviewCount > 0 && (
              <div className="flex items-center gap-1.5 mt-0.5">
                <StarRating rating={orgData.avgRating} />
                <span className="text-[11px] text-stone-400 font-outfit">
                  {orgData.avgRating} ({orgData.reviewCount})
                </span>
              </div>
            )}
          </div>
        </div>

        {(orgData.address || orgData.city) && (
          <div className="flex items-start gap-1.5 text-xs text-stone-400">
            <MapPin size={12} className="mt-0.5 flex-shrink-0" />
            <span>{[orgData.address, orgData.city].filter(Boolean).join(', ')}</span>
          </div>
        )}
      </div>

      {/* Booking summary card — only when service selected */}
      {service && showPrices && (
        <div className="bg-white rounded-2xl border border-stone-100 p-5 shadow-sm space-y-3">
          <p className="text-xs font-medium text-stone-400 uppercase tracking-widest">
            {t.heading}
          </p>

          {/* Service */}
          <div className="flex items-start gap-2.5">
            <div
              className="mt-1 w-2 h-6 rounded-full flex-shrink-0"
              style={{ backgroundColor: service.color ?? '#D4AF37' }}
            />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-stone-900 leading-tight">
                {pickI18n(service.nameI18n, locale)}
              </p>
              {slot && (
                <p className="text-xs text-stone-400 mt-0.5 capitalize">
                  {fmtDate(slot.startISO, locale)}
                </p>
              )}
            </div>
            <span className="text-sm font-outfit font-medium text-stone-800 tabular-nums flex-shrink-0">
              {fmtPrice(priceCents, locale, currency)}
            </span>
          </div>

          {/* Surcharge additions */}
          {additions.map((s) => {
            const cents = s.valueType === 'percent'
              ? Math.round(priceCents * s.value / 100)
              : Math.round(s.value);
            return (
              <div key={s.id} className="flex justify-between text-xs text-stone-500">
                <span>{s.name} {s.valueType === 'percent' ? `(${s.value}%)` : ''}</span>
                <span className="font-outfit tabular-nums">+{fmtPrice(cents, locale, currency)}</span>
              </div>
            );
          })}

          {/* Reductions — shown as "paid locally" */}
          {reductionLines.map((r, i) => (
            <div key={i} className="flex justify-between text-xs text-stone-400">
              <span>{r.name}</span>
              <span className="font-outfit tabular-nums">-{fmtPrice(r.cents, locale, currency)}</span>
            </div>
          ))}

          {hasReductions && (
            <div className="flex justify-between text-xs font-medium text-stone-700 border-t border-stone-100 pt-2">
              <span>{t.subtotalOnline}</span>
              <span className="font-outfit tabular-nums">{fmtPrice(subtotalOnlineCents, locale, currency)}</span>
            </div>
          )}

          {/* Coupon input */}
          {appliedCoupon ? (
            <div className="flex items-center justify-between bg-green-50 border border-green-100 rounded-xl px-3 py-2">
              <div className="flex items-center gap-1.5">
                <Tag size={12} className="text-green-600" />
                <span className="text-xs font-medium text-green-700">{appliedCoupon.code}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-outfit font-semibold text-green-700 tabular-nums">
                  -{fmtPrice(couponDiscountCents, locale, currency)}
                </span>
                <button
                  type="button"
                  onClick={onCouponRemove}
                  className="text-green-500 hover:text-green-700 transition-colors"
                >
                  <X size={13} />
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-1.5">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={couponCode}
                  onChange={(e) => { setCouponCode(e.target.value.toUpperCase()); setCouponError(null); }}
                  onKeyDown={(e) => e.key === 'Enter' && handleValidateCoupon()}
                  placeholder={t.couponPlaceholder}
                  className="flex-1 border border-stone-200 rounded-xl px-3 py-2 text-xs text-stone-800 bg-white focus:outline-none focus:ring-2 focus:ring-stone-900/20 focus:border-stone-400 placeholder:text-stone-300 transition-colors uppercase"
                />
                <button
                  type="button"
                  onClick={handleValidateCoupon}
                  disabled={isPending || !couponCode.trim()}
                  className="px-3 py-2 bg-stone-900 text-white text-xs font-outfit font-medium rounded-xl hover:bg-stone-700 disabled:opacity-50 transition-colors flex-shrink-0"
                >
                  {isPending ? <Loader2 size={12} className="animate-spin" /> : t.couponApply}
                </button>
              </div>
              {couponError && (
                <p className="text-[11px] text-red-500">{couponError}</p>
              )}
            </div>
          )}

          {/* Total online */}
          <div className="flex items-center justify-between bg-amber-50 border border-amber-100 rounded-xl px-4 py-2.5">
            <span className="text-sm font-medium text-amber-800">{t.totalNow}</span>
            <span className="text-sm font-outfit font-bold tabular-nums text-amber-800">
              {fmtPrice(totalOnlineCents, locale, currency)}
            </span>
          </div>

          {/* Saldo local */}
          {hasReductions && paidLocalCents > 0 && (
            <div className="flex justify-between text-xs text-stone-400">
              <span>{t.localBalance}</span>
              <span className="font-outfit tabular-nums">{fmtPrice(paidLocalCents, locale, currency)}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
