/**
 * @deprecated Use AppointmentDetailModal from
 * @/shared/components/booking/AppointmentDetailModal instead.
 * EventDetailSheet (side panel) has been replaced by a centered Dialog.
 */
'use client';

import * as Dialog from '@radix-ui/react-dialog';
import * as Tabs from '@radix-ui/react-tabs';
import { useEffect, useState, useTransition } from 'react';
import { Clock, CreditCard, Mail, Phone, RotateCcw, User, X } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/shared/lib/utils';
import { useTranslations, useLocale } from 'next-intl';
import {
  cancelAppointmentAction,
  getAppointmentDetailAction,
  restoreAppointmentAction,
} from '../actions';
import type { AppointmentFull } from '@/domains/booking/service';

interface EventDetailSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  appointmentId: string | null;
  preview?: { customerName: string; serviceColor: string | null } | null;
  locale?: string;
  onMutated: () => void;
}

const TONE: Record<string, string> = {
  amber:   'bg-amber-50   text-amber-700   border-amber-200',
  emerald: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  stone:   'bg-stone-50   text-stone-500   border-stone-200',
};

const STATUS_TONE: Record<string, string> = {
  pending:   'amber',
  confirmed: 'emerald',
  completed: 'emerald',
  cancelled: 'stone',
  no_show:   'stone',
};

const INTL_LOCALE_MAP: Record<string, string> = { pt: 'pt-PT', es: 'es-ES', en: 'en-GB' };

function fmtPrice(cents: number) { return `€${(cents / 100).toFixed(2)}`; }

function resolveServiceName(map: Record<string, string>, locale: string): string {
  return map[locale] ?? map.pt ?? map.es ?? map.en ?? '—';
}

function initials(name: string): string {
  return name.split(/\s+/).slice(0, 2).map((w) => w[0]?.toUpperCase() ?? '').join('') || '—';
}

export function EventDetailSheet({
  open, onOpenChange, appointmentId, preview, locale = 'pt', onMutated,
}: EventDetailSheetProps) {
  const t          = useTranslations('dashboard.calendar.eventDetail');
  const tAppt      = useTranslations('dashboard.customers.appointments');
  const intlLocale = INTL_LOCALE_MAP[useLocale()] ?? 'pt-PT';

  const [data, setData] = useState<AppointmentFull | null>(null);
  const [loading, setLoading] = useState(false);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    if (!open || !appointmentId) return;
    setData(null);
    setLoading(true);
    getAppointmentDetailAction({ appointmentId })
      .then((r) => { if (r.ok) setData(r.data); else toast.error(r.message); })
      .finally(() => setLoading(false));
  }, [open, appointmentId]);

  function fmtDateLong(d: Date): string {
    return d.toLocaleDateString(intlLocale, {
      weekday: 'short', day: 'numeric', month: 'long', timeZone: 'UTC',
    });
  }
  function fmtTime(d: Date): string {
    return d.toLocaleTimeString(intlLocale, {
      hour: '2-digit', minute: '2-digit', hour12: locale !== 'es', timeZone: 'UTC',
    });
  }

  const handleCancel = () => {
    if (!appointmentId || !data) return;
    startTransition(async () => {
      const r = await cancelAppointmentAction({ appointmentId });
      if (!r.ok) { toast.error(r.message); return; }

      const previousStatus = r.previousStatus;
      toast.success(t('toastCancelled'), {
        action: {
          label: t('toastUndo'),
          onClick: async () => {
            const restore = await restoreAppointmentAction({ appointmentId, status: previousStatus });
            if (restore.status === 'success') {
              toast.success(t('toastRestored'));
              onMutated();
              setData((prev) => prev ? { ...prev, status: previousStatus } : prev);
            }
          },
        },
        icon: <RotateCcw size={14} />,
      });
      onMutated();
      setData((prev) => prev ? { ...prev, status: 'cancelled' } : prev);
    });
  };

  const stub = (label: string) =>
    toast(t('toastSoon', { label }), { description: t('toastSoonDesc') });

  const status     = data?.status ?? 'pending';
  const tone       = STATUS_TONE[status] ?? 'stone';
  const statusLabel = tAppt(`status.${status}` as Parameters<typeof tAppt>[0]);

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className={cn('fixed inset-0 z-40 bg-black/30 backdrop-blur-[2px]', 'data-[state=open]:animate-in data-[state=closed]:animate-out', 'data-[state=open]:fade-in-0 data-[state=closed]:fade-out-0')} />
        <Dialog.Content
          className={cn(
            'fixed right-0 top-0 bottom-0 z-50 w-[420px] max-w-[100vw]',
            'flex flex-col bg-white border-l border-spa-border shadow-[0_0_64px_-16px_rgba(28,25,23,0.30)]',
            'outline-none',
            'data-[state=open]:animate-in data-[state=closed]:animate-out',
            'data-[state=open]:slide-in-from-right data-[state=closed]:slide-out-to-right',
            'duration-300 ease-out',
          )}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-spa-border shrink-0">
            <Dialog.Title className="text-[12px] uppercase tracking-[0.16em] text-spa-muted" style={{ fontFamily: 'var(--font-sans)' }}>
              {t('title')}
            </Dialog.Title>
            <Dialog.Close
              className="p-1.5 rounded-md text-spa-muted hover:text-(--color-spa-stone) hover:bg-stone-50 transition-colors"
              aria-label={t('closeAriaLabel')}
            >
              <X size={14} strokeWidth={1.5} />
            </Dialog.Close>
          </div>

          {/* Service header */}
          <div className="px-5 py-5 border-b border-spa-border shrink-0">
            <div className="flex items-start gap-3">
              <span aria-hidden className="mt-2 w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: data?.serviceColor ?? preview?.serviceColor ?? '#D4AF37' }} />
              <div className="flex-1 min-w-0">
                <h2 className="text-2xl font-light leading-tight tracking-wide text-(--color-spa-stone) uppercase truncate" style={{ fontFamily: 'var(--font-serif)' }}>
                  {data ? resolveServiceName(data.serviceName, locale) : (loading ? '…' : '—')}
                </h2>
                {data && (
                  <p className="mt-1 text-[12px] text-spa-muted tabular-nums" style={{ fontFamily: 'var(--font-sans)' }}>
                    {fmtPrice(data.totalCents)} · {data.durationMinutes} min
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Tabs */}
          <Tabs.Root defaultValue="detalhes" className="flex-1 flex flex-col min-h-0">
            <Tabs.List className="flex items-center gap-1 px-5 border-b border-spa-border shrink-0">
              <TabTrigger value="detalhes" label={t('tabDetails')} />
              <TabTrigger value="historico" label={t('tabHistory')} disabled />
            </Tabs.List>

            <Tabs.Content value="detalhes" className="flex-1 overflow-y-auto no-scrollbar px-5 py-5 space-y-5">
              <Section icon={<Clock size={13} strokeWidth={1.5} />} label={t('sectionWhen')}>
                {data ? (
                  <p className="text-[13px] text-(--color-spa-stone) tabular-nums capitalize" style={{ fontFamily: 'var(--font-sans)' }}>
                    {fmtDateLong(data.startAt)} · {fmtTime(data.startAt)} — {fmtTime(data.endAt)}
                  </p>
                ) : <Placeholder />}
              </Section>

              <Section icon={<User size={13} strokeWidth={1.5} />} label={t('sectionClient')}>
                {data ? (
                  <div className="flex items-start gap-3">
                    <span className="w-9 h-9 rounded-full bg-stone-100 text-(--color-spa-stone) text-[11px] font-medium flex items-center justify-center shrink-0" style={{ fontFamily: 'var(--font-sans)' }}>
                      {initials(data.customerName)}
                    </span>
                    <div className="flex-1 min-w-0 space-y-0.5">
                      <p className="text-[14px] leading-snug text-(--color-spa-stone)" style={{ fontFamily: 'var(--font-serif)' }}>{data.customerName}</p>
                      {data.customerEmail && (
                        <p className="flex items-center gap-1.5 text-[12px] text-spa-muted truncate" style={{ fontFamily: 'var(--font-sans)' }}>
                          <Mail size={11} strokeWidth={1.5} />{data.customerEmail}
                        </p>
                      )}
                      {data.customerPhone && (
                        <p className="flex items-center gap-1.5 text-[12px] text-spa-muted" style={{ fontFamily: 'var(--font-sans)' }}>
                          <Phone size={11} strokeWidth={1.5} />{data.customerPhone}
                        </p>
                      )}
                    </div>
                  </div>
                ) : <Placeholder />}
              </Section>

              <Section icon={<User size={13} strokeWidth={1.5} />} label={t('sectionStaff')}>
                {data ? <p className="text-[13px] text-(--color-spa-stone)" style={{ fontFamily: 'var(--font-sans)' }}>{data.staffName ?? '—'}</p> : <Placeholder />}
              </Section>

              <Section icon={<Clock size={13} strokeWidth={1.5} />} label={t('sectionNotes')}>
                {data
                  ? <p className="text-[12px] text-(--color-spa-stone) whitespace-pre-wrap" style={{ fontFamily: 'var(--font-sans)' }}>{data.guestComment?.trim() || '—'}</p>
                  : <Placeholder />}
              </Section>

              <Section icon={<Clock size={13} strokeWidth={1.5} />} label={t('sectionStatus')}>
                {data && (
                  <span className={cn('inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] uppercase tracking-wider border', TONE[tone])} style={{ fontFamily: 'var(--font-sans)' }}>
                    <span className="w-1.5 h-1.5 rounded-full bg-current" />
                    {statusLabel}
                  </span>
                )}
              </Section>
            </Tabs.Content>

            <Tabs.Content value="historico" className="flex-1 overflow-y-auto px-5 py-5">
              <p className="text-[12px] text-spa-muted text-center mt-6" style={{ fontFamily: 'var(--font-sans)' }}>
                {t('historySoon')}
              </p>
            </Tabs.Content>
          </Tabs.Root>

          {/* Footer */}
          <div className="flex items-center gap-2 px-5 py-3 border-t border-spa-border shrink-0">
            <button type="button" onClick={() => stub(t('rescheduleBtn'))}
              className="px-3 py-1.5 rounded-md text-[12px] text-(--color-spa-stone) border border-spa-border hover:bg-stone-50 transition-colors"
              style={{ fontFamily: 'var(--font-sans)' }}>
              {t('rescheduleBtn')}
            </button>
            <button type="button" onClick={handleCancel}
              disabled={pending || status === 'cancelled'}
              className="px-3 py-1.5 rounded-md text-[12px] text-stone-600 border border-spa-border hover:bg-stone-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ fontFamily: 'var(--font-sans)' }}>
              {pending ? t('cancellingBtn') : t('cancelBtn')}
            </button>
            <button type="button" onClick={() => stub(t('payBtn'))}
              className="ml-auto inline-flex items-center gap-2 px-4 py-1.5 rounded-md text-[12px] font-medium bg-(--color-spa-stone) text-white hover:bg-stone-800 transition-colors"
              style={{ fontFamily: 'var(--font-sans)' }}>
              <CreditCard size={12} strokeWidth={1.5} />
              {t('payBtn')}
            </button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

function TabTrigger({ value, label, disabled }: { value: string; label: string; disabled?: boolean }) {
  return (
    <Tabs.Trigger value={value} disabled={disabled}
      className={cn('px-3 py-2 text-[12px] tracking-wide border-b-2 border-transparent transition-colors',
        'data-[state=active]:border-(--color-spa-stone) data-[state=active]:text-(--color-spa-stone) data-[state=active]:font-medium',
        'data-[state=inactive]:text-spa-muted',
        disabled && 'opacity-40 cursor-not-allowed')}
      style={{ fontFamily: 'var(--font-sans)' }}>
      {label}
    </Tabs.Trigger>
  );
}

function Section({ icon, label, children }: { icon: React.ReactNode; label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <p className="flex items-center gap-1.5 text-[10px] uppercase tracking-[0.16em] text-spa-muted" style={{ fontFamily: 'var(--font-sans)' }}>
        <span className="text-spa-muted">{icon}</span>
        {label}
      </p>
      <div>{children}</div>
    </div>
  );
}

function Placeholder() {
  return <div className="h-4 w-32 rounded skeleton-shimmer" />;
}
