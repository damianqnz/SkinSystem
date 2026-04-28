'use client';

import { useState, useTransition } from 'react';
import * as Switch               from '@radix-ui/react-switch';
import { Loader2, HelpCircle }   from 'lucide-react';
import { toast }                 from 'sonner';
import { updatePoliciesAction }  from '../actions';
import { AccordionSection }      from './AccordionSection';

// ── Unit types ────────────────────────────────────────────────
type LeadUnit   = 'minutos' | 'horas' | 'dias';
type WindowUnit = 'dias'    | 'meses';
type SlotUnit   = 'minutos' | 'horas';

// ── Conversion helpers ────────────────────────────────────────
function detectLeadUnit(hours: number): { value: number; unit: LeadUnit } {
  if (hours === 0)          return { value: 0,          unit: 'horas' };
  if (hours % 24 === 0)     return { value: hours / 24,  unit: 'dias'  };
  return                           { value: hours,        unit: 'horas' };
}

function detectWindowUnit(days: number): { value: number; unit: WindowUnit } {
  if (days >= 30 && days % 30 === 0) return { value: days / 30, unit: 'meses' };
  return                                    { value: days,        unit: 'dias'  };
}

function detectSlotUnit(minutes: number): { value: number; unit: SlotUnit } {
  if (minutes % 60 === 0) return { value: minutes / 60, unit: 'horas'   };
  return                         { value: minutes,        unit: 'minutos' };
}

function leadToHours(value: number, unit: LeadUnit): number {
  if (unit === 'minutos') return Math.round(value / 60);
  if (unit === 'dias')    return value * 24;
  return value;
}

function windowToDays(value: number, unit: WindowUnit): number {
  return unit === 'meses' ? value * 30 : value;
}

function slotToMinutes(value: number, unit: SlotUnit): number {
  return unit === 'horas' ? Math.round(value * 60) : value;
}

// ── Cancellation options ──────────────────────────────────────
const CANCELLATION_OPTIONS = [
  { label: 'En cualquier momento', value:   0 },
  { label: '1 hora',               value:   1 },
  { label: '2 horas',              value:   2 },
  { label: '4 horas',              value:   4 },
  { label: '6 horas',              value:   6 },
  { label: '10 horas',             value:  10 },
  { label: '12 horas',             value:  12 },
  { label: '24 horas',             value:  24 },
  { label: '48 horas',             value:  48 },
  { label: '72 horas',             value:  72 },
  { label: '1 semana',             value: 168 },
  { label: 'Nunca',                value:  -1 },
] as const;

// ── Shared unit selector ──────────────────────────────────────
function UnitSelect<T extends string>({
  value,
  onChange,
  options,
}: {
  value:   T;
  onChange: (v: T) => void;
  options: readonly { label: string; value: T }[];
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value as T)}
      className="border border-stone-200 rounded-xl px-2.5 py-2 text-sm text-stone-700 bg-white focus:outline-none focus:border-amber-300 transition-colors appearance-none cursor-pointer"
    >
      {options.map((o) => (
        <option key={o.value} value={o.value}>{o.label}</option>
      ))}
    </select>
  );
}

// ── Props ─────────────────────────────────────────────────────
interface Props {
  initial: {
    bookingLeadTimeHours:    number;
    bookingWindowDays:       number;
    slotDurationMinutes:     number;
    cancellationHoursNotice: number;
    cancellationPolicyText:  string | null;
  };
}

// ── Component ─────────────────────────────────────────────────
export function PoliciesSection({ initial }: Props) {
  const [isPending, startTransition] = useTransition();

  // 1. Lead time
  const initLead   = detectLeadUnit(initial.bookingLeadTimeHours);
  const [leadValue, setLeadValue] = useState(initLead.value);
  const [leadUnit,  setLeadUnit]  = useState<LeadUnit>(initLead.unit);

  // 2. Booking window
  const initWindow = detectWindowUnit(initial.bookingWindowDays);
  const [windowValue, setWindowValue] = useState(initWindow.value);
  const [windowUnit,  setWindowUnit]  = useState<WindowUnit>(initWindow.unit);

  // 3. Slot duration
  const initSlot = detectSlotUnit(initial.slotDurationMinutes);
  const [slotValue, setSlotValue] = useState(initSlot.value);
  const [slotUnit,  setSlotUnit]  = useState<SlotUnit>(initSlot.unit);

  // 4. Cancellation notice
  const [cancellationHoursNotice, setCancellationHoursNotice] = useState(
    initial.cancellationHoursNotice,
  );

  // 5. Policy text
  const [cancellationPolicyText, setCancellationPolicyText] = useState(
    initial.cancellationPolicyText ?? '',
  );
  const [showPolicyOnHomepage, setShowPolicyOnHomepage] = useState(false);

  // ── Save ────────────────────────────────────────────────────
  const handleSave = () => {
    startTransition(async () => {
      const result = await updatePoliciesAction({
        bookingLeadTimeHours:    leadToHours(leadValue, leadUnit),
        bookingWindowDays:       windowToDays(windowValue, windowUnit),
        slotDurationMinutes:     slotToMinutes(slotValue, slotUnit),
        cancellationHoursNotice,
        cancellationPolicyText:  cancellationPolicyText || null,
      });

      if (result.error) {
        toast.error(result.error.message ?? 'Erro ao guardar políticas');
      } else {
        toast.success('Políticas guardadas com sucesso');
      }
    });
  };

  const numInputCls =
    'border border-stone-200 rounded-xl px-3 py-2 text-sm text-stone-800 w-20 text-center focus:outline-none focus:border-amber-300 transition-colors';
  const rowCls = 'pb-5 border-b border-stone-50 last:pb-0 last:border-b-0';

  return (
    <AccordionSection id="politicas" title="Políticas de reserva">
      <div className="bg-white rounded-2xl border border-stone-100 shadow-sm p-6 space-y-5">

        {/* 1 ── Tiempo de reserva */}
        <div className={rowCls}>
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <p className="text-sm font-medium text-stone-900">Tiempo de reserva</p>
              <p className="text-xs text-stone-500 mt-1">
                ¿Con cuánta antelación hay que avisar antes de una cita?
              </p>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <input
                type="number"
                value={leadValue}
                min={0}
                onChange={(e) =>
                  setLeadValue(Math.max(0, parseInt(e.target.value, 10) || 0))
                }
                className={numInputCls}
              />
              <UnitSelect<LeadUnit>
                value={leadUnit}
                onChange={setLeadUnit}
                options={[
                  { label: 'Minutos', value: 'minutos' },
                  { label: 'Horas',   value: 'horas'   },
                  { label: 'Días',    value: 'dias'    },
                ] as const}
              />
            </div>
          </div>
        </div>

        {/* 2 ── Janela de agendamento */}
        <div className={rowCls}>
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <p className="text-sm font-medium text-stone-900">Janela de agendamento</p>
              <p className="text-xs text-stone-500 mt-1">
                Com quanto de antecedência os clientes podem marcar
              </p>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <input
                type="number"
                value={windowValue}
                min={0}
                onChange={(e) =>
                  setWindowValue(Math.max(0, parseInt(e.target.value, 10) || 0))
                }
                className={numInputCls}
              />
              <UnitSelect<WindowUnit>
                value={windowUnit}
                onChange={setWindowUnit}
                options={[
                  { label: 'Días',  value: 'dias'  },
                  { label: 'Meses', value: 'meses' },
                ] as const}
              />
            </div>
          </div>
        </div>

        {/* 3 ── Tamaño del horario */}
        <div className={rowCls}>
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-1.5">
                <p className="text-sm font-medium text-stone-900">
                  Tamanho do horário de reserva
                </p>
                {/* Tooltip */}
                <div className="relative group">
                  <HelpCircle size={13} className="text-stone-400 cursor-help" />
                  <div
                    className="
                      absolute left-1/2 -translate-x-1/2 bottom-full mb-2.5
                      w-64 bg-stone-900 text-white text-xs rounded-xl
                      px-3 py-2.5 shadow-lg leading-relaxed
                      opacity-0 group-hover:opacity-100
                      transition-opacity duration-150 pointer-events-none z-20
                    "
                  >
                    Si seleccionas un horario de cita de 1 hora, aparecerán los
                    horarios disponibles cada hora a partir de la hora de
                    apertura de tu negocio.
                    <span className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-stone-900" />
                  </div>
                </div>
              </div>
              <p className="text-xs text-stone-500 mt-1">
                Com que frequência devem aparecer as vagas disponíveis?
              </p>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <input
                type="number"
                value={slotValue}
                min={slotUnit === 'horas' ? 0.5 : 5}
                step={slotUnit === 'horas' ? 0.5 : 5}
                onChange={(e) =>
                  setSlotValue(Math.max(0, parseFloat(e.target.value) || 0))
                }
                className={numInputCls}
              />
              <UnitSelect<SlotUnit>
                value={slotUnit}
                onChange={(unit) => {
                  // Convert current value to the new unit on switch
                  if (unit === 'horas'   && slotUnit === 'minutos')
                    setSlotValue(parseFloat((slotValue / 60).toFixed(2)));
                  if (unit === 'minutos' && slotUnit === 'horas')
                    setSlotValue(Math.round(slotValue * 60));
                  setSlotUnit(unit);
                }}
                options={[
                  { label: 'Minutos', value: 'minutos' },
                  { label: 'Horas',   value: 'horas'   },
                ] as const}
              />
            </div>
          </div>
        </div>

        {/* 4 ── Política de cancelamento */}
        <div className={rowCls}>
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <p className="text-sm font-medium text-stone-900">Política de cancelamento</p>
              <p className="text-xs text-stone-500 mt-1">
                Quanto antes de um compromisso os Clientes podem remarcar ou cancelar?
              </p>
            </div>
            <div className="flex-shrink-0">
              <select
                value={cancellationHoursNotice}
                onChange={(e) =>
                  setCancellationHoursNotice(parseInt(e.target.value, 10))
                }
                className="border border-stone-200 rounded-xl px-3 py-2 text-sm text-stone-800 bg-white focus:outline-none focus:border-amber-300 transition-colors appearance-none cursor-pointer"
              >
                {CANCELLATION_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* 5 ── Mensagem personalizada */}
        <div className="pt-2">
          <label className="text-sm font-medium text-stone-900 block">
            Mensagem personalizada
          </label>
          <p className="text-xs text-stone-500 mt-1 mb-3">
            Comparte la información que necesitas saber —sobre cambios en las
            reservas, reembolsos y mucho más— antes de que los clientes
            confirmen sus reservas.
          </p>
          <textarea
            value={cancellationPolicyText}
            onChange={(e) => setCancellationPolicyText(e.target.value)}
            rows={4}
            className="w-full border border-stone-200 rounded-xl px-3 py-2 text-sm text-stone-800 focus:outline-none focus:border-amber-300 transition-colors resize-none"
          />
        </div>

        {/* Adicionar política à página inicial */}
        <div className="pt-2 flex items-center justify-between gap-4">
          <label className="text-sm font-medium text-stone-900">
            Adicionar política à página inicial
          </label>
          <Switch.Root
            checked={showPolicyOnHomepage}
            onCheckedChange={setShowPolicyOnHomepage}
            className="relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent bg-stone-200 transition-colors data-[state=checked]:bg-amber-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-amber-400"
          >
            <Switch.Thumb className="block h-4 w-4 rounded-full bg-white shadow-sm transition-transform data-[state=checked]:translate-x-4 data-[state=unchecked]:translate-x-0" />
          </Switch.Root>
        </div>

        {/* Save */}
        <div className="pt-4 flex justify-end">
          <button
            onClick={handleSave}
            disabled={isPending}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-stone-900 text-white text-sm font-medium hover:bg-stone-800 disabled:opacity-60 transition-colors"
          >
            {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
            {isPending ? 'Guardando...' : 'Guardar'}
          </button>
        </div>
      </div>
    </AccordionSection>
  );
}
