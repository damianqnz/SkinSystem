'use client';

import * as Dialog from '@radix-ui/react-dialog';
import { useMemo, useState, useTransition } from 'react';
import { ArrowLeft, ChevronDown, FileText, Sparkles, X } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/shared/lib/utils';

import { EditorialDatePicker } from './EditorialDatePicker';
import { EditorialTimePicker } from './EditorialTimePicker';
import { CustomerCombobox, type CustomerOption } from './CustomerCombobox';
import { createInternalAppointmentAction } from '../actions';

export interface ServiceOption {
  id:              string;
  nameI18n:        Record<string, string>;
  durationMinutes: number;
  priceCents:      number;
  color:           string | null;
}

interface NewAppointmentFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onBack: () => void;
  defaultDateIso: string;
  services:  ServiceOption[];
  customers: CustomerOption[];
  tenantName: string;
  locale?: string;
  onSuccess: () => void;
}

function pad(n: number) { return n.toString().padStart(2, '0'); }
function isoFromDateTime(dateIso: string, hhmm: string): string {
  return new Date(`${dateIso}T${hhmm}:00`).toISOString();
}
function fmtPrice(cents: number) {
  return `€${(cents / 100).toFixed(2)}`;
}
function resolveName(map: Record<string, string>, locale?: string): string {
  return map[locale ?? 'pt'] ?? map.pt ?? map.es ?? map.en ?? '—';
}

export function NewAppointmentForm({
  open,
  onOpenChange,
  onBack,
  defaultDateIso,
  services,
  customers,
  tenantName,
  locale,
  onSuccess,
}: NewAppointmentFormProps) {
  // Form state
  const [serviceId, setServiceId] = useState<string | null>(services[0]?.id ?? null);
  const [date, setDate] = useState(defaultDateIso);
  const [time, setTime] = useState('12:00');
  const [customerId, setCustomerId] = useState<string | null>(null);
  const [notes, setNotes] = useState('');

  // Track customers added inline
  const [extraCustomers, setExtraCustomers] = useState<CustomerOption[]>([]);
  const allCustomers = useMemo(() => [...extraCustomers, ...customers], [extraCustomers, customers]);

  const [pending, startTransition] = useTransition();

  const selectedService = services.find((s) => s.id === serviceId);
  const endHHMM = useMemo(() => {
    if (!selectedService) return time;
    const [h, m] = time.split(':').map(Number) as [number, number];
    const total = h * 60 + m + selectedService.durationMinutes;
    return `${pad(Math.floor(total / 60) % 24)}:${pad(total % 60)}`;
  }, [time, selectedService]);

  const submit = () => {
    if (!serviceId)  { toast.error('Selecione um serviço');  return; }
    if (!customerId) { toast.error('Selecione um cliente'); return; }

    const startAt = isoFromDateTime(date, time);

    startTransition(async () => {
      const res = await createInternalAppointmentAction({
        serviceId,
        customerId,
        startAt,
        guestComment: notes.trim() || null,
      });
      if (res.status === 'success') {
        toast.success(res.message ?? 'Marcação criada');
        onSuccess();
      } else if (res.status === 'error') {
        toast.error(res.message);
      }
    });
  };

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay
          className={cn(
            'fixed inset-0 z-40 bg-black/30 backdrop-blur-[2px]',
            'data-[state=open]:animate-in data-[state=closed]:animate-out',
            'data-[state=open]:fade-in-0 data-[state=closed]:fade-out-0',
          )}
        />
        <Dialog.Content
          className={cn(
            'fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50',
            'w-[480px] max-w-[calc(100vw-2rem)] rounded-lg border border-spa-border bg-white',
            'shadow-[0_24px_48px_-16px_rgba(28,25,23,0.25)] outline-none',
            'data-[state=open]:animate-in data-[state=closed]:animate-out',
            'data-[state=open]:fade-in-0 data-[state=closed]:fade-out-0',
            'data-[state=open]:zoom-in-95 data-[state=closed]:zoom-out-95',
          )}
        >
          {/* Header */}
          <div className="flex items-center justify-between gap-3 px-5 py-4 border-b border-spa-border">
            <button
              type="button"
              onClick={onBack}
              className="flex items-center gap-1.5 text-[12px] text-spa-muted hover:text-(--color-spa-stone) transition-colors"
              style={{ fontFamily: 'var(--font-sans)' }}
            >
              <ArrowLeft size={12} strokeWidth={1.5} />
              Voltar
            </button>
            <Dialog.Title
              className="text-[16px] tracking-wide text-(--color-spa-stone)"
              style={{ fontFamily: 'var(--font-serif)' }}
            >
              Marcação
            </Dialog.Title>
            <Dialog.Close
              className="p-1.5 rounded-md text-spa-muted hover:text-(--color-spa-stone) hover:bg-stone-50 transition-colors"
              aria-label="Fechar"
            >
              <X size={14} strokeWidth={1.5} />
            </Dialog.Close>
          </div>

          {/* Tabs (placeholder — only Serviço is functional) */}
          <div className="flex items-center gap-1 px-5 pt-3 -mb-px border-b border-spa-border">
            <Tab label="Serviço" active />
            <Tab label="Aula"     disabled />
            <Tab label="Evento"   disabled />
            <Tab label="Lembrete" disabled />
          </div>

          {/* Body */}
          <div className="px-5 py-5 space-y-5 max-h-[60vh] overflow-y-auto no-scrollbar">
            {/* Service */}
            <ServiceSelect
              value={serviceId}
              services={services}
              locale={locale}
              onChange={setServiceId}
            />

            {/* Date / time */}
            <div className="space-y-2">
              <p className="text-[10px] uppercase tracking-[0.16em] text-spa-muted"
                 style={{ fontFamily: 'var(--font-sans)' }}>
                Quando
              </p>
              <div className="flex items-center gap-2 flex-wrap">
                <EditorialDatePicker value={date} onChange={setDate} />
                <EditorialTimePicker value={time} onChange={setTime} />
                <span className="text-[12px] text-spa-muted" style={{ fontFamily: 'var(--font-sans)' }}>
                  → {endHHMM}
                </span>
              </div>
              <p className="text-[11px] text-spa-muted"
                 style={{ fontFamily: 'var(--font-sans)' }}>
                Não se repete
              </p>
            </div>

            {/* Customer */}
            <CustomerCombobox
              label="Cliente"
              options={allCustomers}
              value={customerId}
              onChange={(id) => setCustomerId(id)}
              onCreated={(c) => setExtraCustomers((prev) => [c, ...prev])}
            />

            {/* Notes */}
            <div className="space-y-1">
              <label
                className="flex items-center gap-1.5 text-[10px] uppercase tracking-[0.16em] text-spa-muted"
                style={{ fontFamily: 'var(--font-sans)' }}
              >
                <FileText size={11} strokeWidth={1.5} />
                Notas para o fornecedor e convidado(s)
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                className="w-full input-editorial resize-none"
                style={{ fontFamily: 'var(--font-sans)' }}
                placeholder="—"
              />
            </div>

            {/* Tenant footer */}
            <div className="flex items-center gap-2 pt-1">
              <span className="w-5 h-5 rounded-full bg-(--color-spa-stone) text-white text-[9px] font-medium flex items-center justify-center"
                    style={{ fontFamily: 'var(--font-sans)' }}>
                {tenantName?.[0]?.toUpperCase() ?? 'L'}
              </span>
              <span className="text-[12px] text-spa-muted truncate"
                    style={{ fontFamily: 'var(--font-sans)' }}>
                {tenantName}
              </span>
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-2 px-5 py-3 border-t border-spa-border">
            <Dialog.Close
              className="px-3 py-1.5 rounded-md text-[12px] text-spa-muted hover:text-(--color-spa-stone) transition-colors"
              style={{ fontFamily: 'var(--font-sans)' }}
            >
              Cancelar
            </Dialog.Close>
            <button
              type="button"
              onClick={submit}
              disabled={pending || !serviceId || !customerId}
              className={cn(
                'shimmer-btn px-4 py-1.5 rounded-md text-[12px] font-medium',
                'bg-(--color-spa-stone) text-white hover:bg-stone-800 transition-colors',
                'disabled:opacity-50 disabled:cursor-not-allowed',
              )}
              style={{ fontFamily: 'var(--font-sans)' }}
            >
              {pending ? 'A criar…' : 'Criar →'}
            </button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

// ── Tab pill ───────────────────────────────────────────────────────

function Tab({ label, active, disabled }: { label: string; active?: boolean; disabled?: boolean }) {
  return (
    <button
      type="button"
      disabled={disabled}
      className={cn(
        'px-3 py-2 text-[12px] tracking-wide border-b-2 transition-colors',
        active
          ? 'border-(--color-spa-stone) text-(--color-spa-stone) font-medium'
          : 'border-transparent text-spa-muted',
        disabled && 'opacity-40 cursor-not-allowed',
      )}
      style={{ fontFamily: 'var(--font-sans)' }}
    >
      {label}
    </button>
  );
}

// ── Service select (custom, since Radix Select clashes with nested Popovers) ─

function ServiceSelect({
  value,
  services,
  locale,
  onChange,
}: {
  value: string | null;
  services: ServiceOption[];
  locale?: string;
  onChange: (id: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const selected = services.find((s) => s.id === value);

  return (
    <div className="space-y-1 relative">
      <p className="text-[10px] uppercase tracking-[0.16em] text-spa-muted"
         style={{ fontFamily: 'var(--font-sans)' }}>
        Serviço
      </p>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={cn(
          'w-full flex items-center justify-between gap-2 px-3 py-2 rounded-md',
          'text-[13px] text-(--color-spa-stone)',
          'border border-spa-border bg-white hover:bg-stone-50 transition-colors',
        )}
        style={{ fontFamily: 'var(--font-sans)' }}
      >
        <span className="flex items-center gap-2 min-w-0">
          {selected ? (
            <>
              <span
                className="w-2.5 h-2.5 rounded-full shrink-0"
                style={{ backgroundColor: selected.color ?? '#D4AF37' }}
              />
              <span className="truncate">{resolveName(selected.nameI18n, locale)}</span>
              <span className="text-[11px] text-spa-muted shrink-0">
                · {selected.durationMinutes} min · {fmtPrice(selected.priceCents)}
              </span>
            </>
          ) : (
            <span className="flex items-center gap-2 text-spa-muted">
              <Sparkles size={13} strokeWidth={1.5} />
              Selecione um serviço
            </span>
          )}
        </span>
        <ChevronDown size={12} strokeWidth={1.5} className="text-spa-muted" />
      </button>

      {open && (
        <div className="absolute z-30 left-0 right-0 mt-1 rounded-md border border-spa-border bg-white shadow-[0_8px_24px_-12px_rgba(28,25,23,0.18)] overflow-hidden">
          <div className="max-h-[220px] overflow-y-auto no-scrollbar py-1">
            {services.map((s) => {
              const active = s.id === value;
              return (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => { onChange(s.id); setOpen(false); }}
                  className={cn(
                    'w-full flex items-center gap-2 px-3 py-2 text-left transition-colors',
                    active ? 'bg-stone-50' : 'hover:bg-stone-50',
                  )}
                >
                  <span
                    className="w-2.5 h-2.5 rounded-full shrink-0"
                    style={{ backgroundColor: s.color ?? '#D4AF37' }}
                  />
                  <span className="flex-1 truncate text-[13px] text-(--color-spa-stone)"
                        style={{ fontFamily: 'var(--font-sans)' }}>
                    {resolveName(s.nameI18n, locale)}
                  </span>
                  <span className="text-[11px] text-spa-muted tabular-nums"
                        style={{ fontFamily: 'var(--font-sans)' }}>
                    {s.durationMinutes}min · {fmtPrice(s.priceCents)}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
