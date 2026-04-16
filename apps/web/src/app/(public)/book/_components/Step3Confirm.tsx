'use client';

import { useEffect, useActionState } from 'react';
import { useRouter }   from 'next/navigation';
import { Loader2 }     from 'lucide-react';
import { toast }       from 'sonner';
import { createBookingAction } from '../actions';
import type { BookingState, PublicSlot } from '../actions';
import type { SelectService }  from '@/domains/catalog/schema';

// ── i18n helper ───────────────────────────────────────────────

function t(field: unknown, locale: string): string {
  if (!field || typeof field !== 'object') return '';
  const o = field as Record<string, string>;
  return o[locale] ?? o['es'] ?? o['en'] ?? Object.values(o)[0] ?? '';
}

function fmtPrice(cents: number, currency = 'EUR'): string {
  return (cents / 100).toLocaleString('es-ES', {
    style: 'currency', currency,
    minimumFractionDigits: 2, maximumFractionDigits: 2,
  });
}

// ── Props ─────────────────────────────────────────────────────

interface Step3ConfirmProps {
  service:  SelectService;
  slot:     PublicSlot;
  locale:   string;
}

const IDLE: BookingState = { status: 'idle' };

// ── Component ─────────────────────────────────────────────────

export function Step3Confirm({ service, slot, locale }: Step3ConfirmProps) {
  const router = useRouter();

  const depositCents = Math.round(service.priceCents * service.depositPercent / 100);

  const [state, dispatch, isPending] =
    useActionState<BookingState, unknown>(createBookingAction, IDLE);

  // Handle action result
  useEffect(() => {
    if (state.status === 'redirect') {
      router.push(state.url);
    }
    if (state.status === 'error') {
      toast.error(state.message);
    }
    if (state.status === 'conflict') {
      toast.error('Este horario acaba de ser reservado. Por favor elige otro.');
    }
  }, [state, router]);

  // Build the payload on form submit
  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const payload = {
      serviceId:    service.id,
      slotStartISO: slot.startISO,
      slotEndISO:   slot.endISO,
      guestName:    fd.get('guestName') as string,
      guestEmail:   fd.get('guestEmail') as string,
      guestPhone:   fd.get('guestPhone') as string,
      guestComment: (fd.get('guestComment') as string) || undefined,
    };
    (dispatch as (p: unknown) => void)(payload);
  }

  return (
    <div>
      <h2 className="font-cormorant text-2xl font-semibold text-stone-900 mb-6 text-center">
        Confirma tu reserva
      </h2>

      {/* Summary card */}
      <div className="bg-stone-50 rounded-2xl border border-stone-100 p-5 mb-6 space-y-3">
        <div className="flex items-center gap-3">
          <div
            className="w-2 h-8 rounded-full flex-shrink-0"
            style={{ backgroundColor: service.color ?? '#D4AF37' }}
          />
          <div>
            <p className="font-cormorant text-lg font-semibold text-stone-900">
              {t(service.nameI18n, locale)}
            </p>
            <p className="text-xs text-stone-400">{service.durationMinutes} min</p>
          </div>
        </div>

        <div className="flex items-center justify-between text-sm border-t border-stone-100 pt-3">
          <span className="text-stone-500">Fecha y hora</span>
          <span className="font-outfit font-medium text-stone-800">
            {new Date(slot.startISO).toLocaleString(locale === 'pt' ? 'pt-PT' : locale === 'en' ? 'en-GB' : 'es-ES', {
              weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit',
            })}
          </span>
        </div>

        <div className="flex items-center justify-between text-sm">
          <span className="text-stone-500">Precio total</span>
          <span className="font-outfit tabular-nums text-stone-800">
            {fmtPrice(service.priceCents, service.currency)}
          </span>
        </div>

        {service.depositPercent < 100 && (
          <div className="flex items-center justify-between text-sm bg-amber-50 rounded-xl px-4 py-2.5">
            <span className="text-amber-700 font-medium">Pago ahora ({service.depositPercent}%)</span>
            <span className="font-outfit font-semibold tabular-nums text-amber-700">
              {fmtPrice(depositCents, service.currency)}
            </span>
          </div>
        )}
      </div>

      {/* Guest form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="field-label">Nombre completo</label>
            <input
              name="guestName"
              type="text"
              required
              minLength={2}
              maxLength={100}
              placeholder="Ana García"
              className="mt-1.5 w-full border border-stone-200 rounded-xl px-4 py-3 text-sm text-stone-900 bg-white focus:outline-none focus:ring-2 focus:ring-stone-900/20 focus:border-stone-400 placeholder:text-stone-300 transition-colors"
            />
          </div>
          <div>
            <label className="field-label">Teléfono</label>
            <input
              name="guestPhone"
              type="tel"
              required
              minLength={6}
              placeholder="+34 600 000 000"
              className="mt-1.5 w-full border border-stone-200 rounded-xl px-4 py-3 text-sm text-stone-900 bg-white focus:outline-none focus:ring-2 focus:ring-stone-900/20 focus:border-stone-400 placeholder:text-stone-300 transition-colors"
            />
          </div>
        </div>

        <div>
          <label className="field-label">Email</label>
          <input
            name="guestEmail"
            type="email"
            required
            placeholder="ana@email.com"
            className="mt-1.5 w-full border border-stone-200 rounded-xl px-4 py-3 text-sm text-stone-900 bg-white focus:outline-none focus:ring-2 focus:ring-stone-900/20 focus:border-stone-400 placeholder:text-stone-300 transition-colors"
          />
          <p className="mt-1 text-[10px] text-stone-400">
            Recibirás la confirmación y el enlace de pago en este email.
          </p>
        </div>

        <div>
          <label className="field-label">Nota (opcional)</label>
          <textarea
            name="guestComment"
            rows={2}
            maxLength={500}
            placeholder="Alergias, preferencias, información relevante..."
            className="mt-1.5 w-full border border-stone-200 rounded-xl px-4 py-3 text-sm text-stone-900 bg-white focus:outline-none focus:ring-2 focus:ring-stone-900/20 focus:border-stone-400 placeholder:text-stone-300 transition-colors resize-none"
          />
        </div>

        {/* Policy */}
        <p className="text-[10px] text-stone-400 leading-relaxed">
          Al reservar aceptas la política de cancelación. Los depósitos no son reembolsables con menos de 24h de antelación.
        </p>

        {/* Submit */}
        <button
          type="submit"
          disabled={isPending}
          className="w-full flex items-center justify-center gap-2 py-4 px-6 bg-amber-400 text-stone-950 font-outfit font-medium text-sm rounded-xl hover:bg-amber-300 disabled:opacity-60 transition-colors shadow-sm shadow-amber-400/20"
        >
          {isPending ? (
            <>
              <Loader2 size={16} className="animate-spin" />
              Procesando…
            </>
          ) : (
            <>
              {service.depositPercent < 100
                ? `Pagar depósito ${fmtPrice(depositCents, service.currency)}`
                : `Pagar ${fmtPrice(service.priceCents, service.currency)}`}
              {' '}→
            </>
          )}
        </button>
      </form>
    </div>
  );
}
