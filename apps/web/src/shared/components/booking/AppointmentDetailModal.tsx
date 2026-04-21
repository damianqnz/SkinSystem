'use client';

import * as Dialog from '@radix-ui/react-dialog';
import * as Tabs   from '@radix-ui/react-tabs';
import { useEffect, useState, useTransition }                       from 'react';
import { Clock, CreditCard, Mail, Phone, RotateCcw, User, X }      from 'lucide-react';
import { toast }   from 'sonner';
import { cn }      from '@/shared/lib/utils';
import {
  cancelAppointmentAction,
  getAppointmentDetailAction,
  restoreAppointmentAction,
} from '@/app/(dashboard)/dashboard/calendar/actions';
import type { AppointmentFull } from '@/domains/booking/service';

// ── Status data ────────────────────────────────────────────────

const SC: Record<string, { es: string; pt: string; en: string; tone: 'amber' | 'emerald' | 'stone' }> = {
  pending:   { es: 'Pendiente',  pt: 'Pendente',   en: 'Pending',   tone: 'amber'   },
  confirmed: { es: 'Confirmada', pt: 'Confirmada', en: 'Confirmed', tone: 'emerald' },
  completed: { es: 'Completada', pt: 'Concluída',  en: 'Completed', tone: 'emerald' },
  cancelled: { es: 'Cancelada',  pt: 'Cancelada',  en: 'Cancelled', tone: 'stone'   },
  no_show:   { es: 'No asistió', pt: 'Não compareceu', en: 'No-show', tone: 'stone' },
};
const TN: Record<string, string> = {
  amber:   'bg-amber-50 text-amber-700 border-amber-200',
  emerald: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  stone:   'bg-stone-50 text-stone-500 border-stone-200',
};
const fmtP  = (c: number) => `€${(c / 100).toFixed(2)}`;
const rName = (m: Record<string, string>, l?: string) => m[l ?? 'pt'] ?? m.pt ?? m.es ?? m.en ?? '—';
const fmtDL = (d: Date, l: string) => d.toLocaleDateString(l === 'pt' ? 'pt-PT' : l === 'en' ? 'en-GB' : 'es-ES', { weekday: 'short', day: 'numeric', month: 'long', timeZone: 'UTC' });
const fmtT  = (d: Date, l: string) => d.toLocaleTimeString(l === 'pt' ? 'pt-PT' : l === 'en' ? 'en-GB' : 'es-ES', { hour: '2-digit', minute: '2-digit', hour12: l !== 'es', timeZone: 'UTC' });
const inits = (n: string) => n.split(/\s+/).slice(0, 2).map(w => w[0]?.toUpperCase() ?? '').join('') || '—';

// ── Props ──────────────────────────────────────────────────────

interface AppointmentDetailModalProps {
  appointmentId: string | null;
  onClose:       () => void;
  locale?:       string;
  onMutated:     () => void;
  preview?:      { customerName: string; serviceColor: string | null } | null;
}

// ── Component ──────────────────────────────────────────────────

export function AppointmentDetailModal({ appointmentId, onClose, locale = 'pt', onMutated, preview }: AppointmentDetailModalProps) {
  const [data,    setData]    = useState<AppointmentFull | null>(null);
  const [loading, setLoading] = useState(false);
  const [pending, start]      = useTransition();

  useEffect(() => {
    if (!appointmentId) { setData(null); return; }
    setLoading(true);
    getAppointmentDetailAction({ appointmentId })
      .then(r => { if (r.ok) setData(r.data); else toast.error(r.message); })
      .finally(() => setLoading(false));
  }, [appointmentId]);

  const handleCancel = () => {
    if (!appointmentId || !data) return;
    start(async () => {
      const r = await cancelAppointmentAction({ appointmentId });
      if (!r.ok) { toast.error(r.message); return; }
      const prev = r.previousStatus;
      toast.success('Marcação cancelada', {
        action: { label: 'Desfazer', onClick: async () => {
          const res = await restoreAppointmentAction({ appointmentId, status: prev });
          if (res.status === 'success') { toast.success('Restaurada'); onMutated(); setData(d => d ? { ...d, status: prev } : d); }
        }},
        icon: <RotateCcw size={14} />,
      });
      onMutated(); setData(d => d ? { ...d, status: 'cancelled' } : d);
    });
  };

  const stub   = (l: string) => toast(`${l} · em breve`, { description: 'Esta ação chega na próxima fase.' });
  const status = data?.status ?? 'pending';
  const si     = SC[status]!;
  const sl     = si[locale === 'pt' ? 'pt' : locale === 'en' ? 'en' : 'es'];

  return (
    <Dialog.Root open={!!appointmentId} onOpenChange={o => { if (!o) onClose(); }}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-40 bg-black/30 backdrop-blur-[2px] data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=open]:fade-in-0 data-[state=closed]:fade-out-0" />
        <Dialog.Content
          aria-describedby={undefined}
          className="fixed z-50 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[calc(100%-2rem)] max-w-lg rounded-2xl bg-white/90 backdrop-blur-xl border border-stone-200/60 shadow-2xl flex flex-col max-h-[85vh] overflow-hidden outline-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95 data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 duration-200"
        >
          <div className="flex items-center justify-between px-5 py-4 border-b border-spa-border shrink-0">
            <Dialog.Title className="text-[12px] uppercase tracking-[0.16em] text-spa-muted" style={{ fontFamily: 'var(--font-sans)' }}>Detalhe da marcação</Dialog.Title>
            <Dialog.Close className="p-1.5 rounded-md text-spa-muted hover:text-(--color-spa-stone) hover:bg-stone-50 transition-colors" aria-label="Fechar"><X size={14} strokeWidth={1.5} /></Dialog.Close>
          </div>
          <div className="px-5 py-5 border-b border-spa-border shrink-0">
            <div className="flex items-start gap-3">
              <span aria-hidden className="mt-2 w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: data?.serviceColor ?? preview?.serviceColor ?? '#D4AF37' }} />
              <div className="flex-1 min-w-0">
                <h2 className="text-2xl font-light leading-tight tracking-wide text-(--color-spa-stone) uppercase truncate" style={{ fontFamily: 'var(--font-serif)' }}>{data ? rName(data.serviceName, locale) : (loading ? '…' : '—')}</h2>
                {data && <p className="mt-1 text-[12px] text-spa-muted tabular-nums" style={{ fontFamily: 'var(--font-sans)' }}>{fmtP(data.totalCents)} · {data.durationMinutes} min</p>}
              </div>
            </div>
          </div>
          <Tabs.Root defaultValue="detalhes" className="flex-1 flex flex-col min-h-0">
            <Tabs.List className="flex items-center gap-1 px-5 border-b border-spa-border shrink-0">
              <Tb value="detalhes" label="Detalhes" /><Tb value="historico" label="Histórico" disabled />
            </Tabs.List>
            <Tabs.Content value="detalhes" className="flex-1 overflow-y-auto no-scrollbar px-5 py-5 space-y-5">
              <Sc icon={<Clock size={13} strokeWidth={1.5} />} label="Quando">{data ? <p className="text-[13px] text-(--color-spa-stone) tabular-nums capitalize" style={{ fontFamily: 'var(--font-sans)' }}>{fmtDL(data.startAt, locale)} · {fmtT(data.startAt, locale)} — {fmtT(data.endAt, locale)}</p> : <Ph />}</Sc>
              <Sc icon={<User size={13} strokeWidth={1.5} />} label="Cliente">
                {data ? (<div className="flex items-start gap-3"><span className="w-9 h-9 rounded-full bg-stone-100 text-(--color-spa-stone) text-[11px] font-medium flex items-center justify-center shrink-0" style={{ fontFamily: 'var(--font-sans)' }}>{inits(data.customerName)}</span><div className="flex-1 min-w-0 space-y-0.5"><p className="text-[14px] leading-snug text-(--color-spa-stone)" style={{ fontFamily: 'var(--font-serif)' }}>{data.customerName}</p>{data.customerEmail && <p className="flex items-center gap-1.5 text-[12px] text-spa-muted truncate" style={{ fontFamily: 'var(--font-sans)' }}><Mail size={11} strokeWidth={1.5} />{data.customerEmail}</p>}{data.customerPhone && <p className="flex items-center gap-1.5 text-[12px] text-spa-muted" style={{ fontFamily: 'var(--font-sans)' }}><Phone size={11} strokeWidth={1.5} />{data.customerPhone}</p>}</div></div>) : <Ph />}
              </Sc>
              <Sc icon={<User size={13} strokeWidth={1.5} />} label="Equipa">{data ? <p className="text-[13px] text-(--color-spa-stone)" style={{ fontFamily: 'var(--font-sans)' }}>{data.staffName ?? '—'}</p> : <Ph />}</Sc>
              <Sc icon={<Clock size={13} strokeWidth={1.5} />} label="Notas">{data ? <p className="text-[12px] text-(--color-spa-stone) whitespace-pre-wrap" style={{ fontFamily: 'var(--font-sans)' }}>{data.guestComment?.trim() || '—'}</p> : <Ph />}</Sc>
              <Sc icon={<Clock size={13} strokeWidth={1.5} />} label="Status">{data && <span className={cn('inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] uppercase tracking-wider border', TN[si.tone])} style={{ fontFamily: 'var(--font-sans)' }}><span className="w-1.5 h-1.5 rounded-full bg-current" />{sl}</span>}</Sc>
            </Tabs.Content>
            <Tabs.Content value="historico" className="flex-1 overflow-y-auto px-5 py-5"><p className="text-[12px] text-spa-muted text-center mt-6" style={{ fontFamily: 'var(--font-sans)' }}>Histórico chega em breve.</p></Tabs.Content>
          </Tabs.Root>
          <div className="flex items-center gap-2 px-5 py-3 border-t border-spa-border shrink-0">
            <button type="button" onClick={() => stub('Reagendar')} className="px-3 py-1.5 rounded-md text-[12px] text-(--color-spa-stone) border border-spa-border hover:bg-stone-50 transition-colors" style={{ fontFamily: 'var(--font-sans)' }}>Reagendar</button>
            <button type="button" onClick={handleCancel} disabled={pending || status === 'cancelled'} className="px-3 py-1.5 rounded-md text-[12px] text-stone-600 border border-spa-border hover:bg-stone-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed" style={{ fontFamily: 'var(--font-sans)' }}>{pending ? 'A cancelar…' : 'Cancelar'}</button>
            <button type="button" onClick={() => stub('Pagar')} className="ml-auto inline-flex items-center gap-2 px-4 py-1.5 rounded-md text-[12px] font-medium bg-(--color-spa-stone) text-white hover:bg-stone-800 transition-colors" style={{ fontFamily: 'var(--font-sans)' }}><CreditCard size={12} strokeWidth={1.5} />Aceitar pagamento →</button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

// ── Sub-components ─────────────────────────────────────────────

function Tb({ value, label, disabled }: { value: string; label: string; disabled?: boolean }) {
  return <Tabs.Trigger value={value} disabled={disabled} className={cn('px-3 py-2 text-[12px] tracking-wide border-b-2 border-transparent transition-colors data-[state=active]:border-(--color-spa-stone) data-[state=active]:text-(--color-spa-stone) data-[state=active]:font-medium data-[state=inactive]:text-spa-muted', disabled && 'opacity-40 cursor-not-allowed')} style={{ fontFamily: 'var(--font-sans)' }}>{label}</Tabs.Trigger>;
}
function Sc({ icon, label, children }: { icon: React.ReactNode; label: string; children: React.ReactNode }) {
  return <div className="space-y-1.5"><p className="flex items-center gap-1.5 text-[10px] uppercase tracking-[0.16em] text-spa-muted" style={{ fontFamily: 'var(--font-sans)' }}><span className="text-spa-muted">{icon}</span>{label}</p><div>{children}</div></div>;
}
function Ph() { return <div className="h-4 w-32 rounded skeleton-shimmer" />; }
