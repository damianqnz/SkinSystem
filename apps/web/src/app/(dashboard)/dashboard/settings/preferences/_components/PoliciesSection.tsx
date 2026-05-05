'use client';

import { useState, useTransition } from 'react';
import * as Switch               from '@radix-ui/react-switch';
import { Loader2, HelpCircle }   from 'lucide-react';
import { toast }                 from 'sonner';
import { updatePoliciesAction }  from '../actions';
import { AccordionSection }      from './AccordionSection';
import { useSettingsT }          from '../../_i18n';

type LeadUnit   = 'minutos' | 'horas' | 'dias';
type WindowUnit = 'dias'    | 'meses';
type SlotUnit   = 'minutos' | 'horas';

function detectLeadUnit(hours: number): { value: number; unit: LeadUnit } {
  if (hours === 0)        return { value: 0,         unit: 'horas' };
  if (hours % 24 === 0)  return { value: hours / 24, unit: 'dias'  };
  return                        { value: hours,       unit: 'horas' };
}
function detectWindowUnit(days: number): { value: number; unit: WindowUnit } {
  if (days >= 30 && days % 30 === 0) return { value: days / 30, unit: 'meses' };
  return                                    { value: days,       unit: 'dias'  };
}
function detectSlotUnit(minutes: number): { value: number; unit: SlotUnit } {
  if (minutes % 60 === 0) return { value: minutes / 60, unit: 'horas'   };
  return                         { value: minutes,       unit: 'minutos' };
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

const CANCELLATION_VALUES = [0, 1, 2, 4, 6, 10, 12, 24, 48, 72, 168, -1] as const;

function UnitSelect<T extends string>({ value, onChange, options }: {
  value: T; onChange: (v: T) => void;
  options: readonly { label: string; value: T }[];
}) {
  return (
    <select value={value} onChange={(e) => onChange(e.target.value as T)}
      className="border border-stone-200 rounded-xl px-2.5 py-2 text-sm text-stone-700 bg-white focus:outline-none focus:border-amber-300 transition-colors appearance-none cursor-pointer">
      {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
    </select>
  );
}

interface Props {
  initial: {
    bookingLeadTimeHours:    number;
    bookingWindowDays:       number;
    slotDurationMinutes:     number;
    cancellationHoursNotice: number;
    cancellationPolicyText:  string | null;
  };
}

export function PoliciesSection({ initial }: Props) {
  const t = useSettingsT().policies;
  const [isPending, startTransition] = useTransition();

  const initLead   = detectLeadUnit(initial.bookingLeadTimeHours);
  const [leadValue, setLeadValue] = useState(initLead.value);
  const [leadUnit,  setLeadUnit]  = useState<LeadUnit>(initLead.unit);

  const initWindow = detectWindowUnit(initial.bookingWindowDays);
  const [windowValue, setWindowValue] = useState(initWindow.value);
  const [windowUnit,  setWindowUnit]  = useState<WindowUnit>(initWindow.unit);

  const initSlot = detectSlotUnit(initial.slotDurationMinutes);
  const [slotValue, setSlotValue] = useState(initSlot.value);
  const [slotUnit,  setSlotUnit]  = useState<SlotUnit>(initSlot.unit);

  const [cancellationHoursNotice, setCancellationHoursNotice] = useState(initial.cancellationHoursNotice);
  const [cancellationPolicyText,  setCancellationPolicyText]  = useState(initial.cancellationPolicyText ?? '');
  const [showPolicyOnHomepage,    setShowPolicyOnHomepage]    = useState(false);

  const handleSave = () => {
    startTransition(async () => {
      const result = await updatePoliciesAction({
        bookingLeadTimeHours:    leadToHours(leadValue, leadUnit),
        bookingWindowDays:       windowToDays(windowValue, windowUnit),
        slotDurationMinutes:     slotToMinutes(slotValue, slotUnit),
        cancellationHoursNotice,
        cancellationPolicyText:  cancellationPolicyText || null,
      });
      if (result.error) { toast.error(result.error.message ?? t.errorSave); }
      else              { toast.success(t.successSave); }
    });
  };

  const numInputCls = 'border border-stone-200 rounded-xl px-3 py-2 text-sm text-stone-800 w-20 text-center focus:outline-none focus:border-amber-300 transition-colors';
  const rowCls = 'pb-5 border-b border-stone-50 last:pb-0 last:border-b-0';

  const leadUnits    = [{ label: t.units.minutes, value: 'minutos' as LeadUnit   }, { label: t.units.hours, value: 'horas' as LeadUnit }, { label: t.units.days, value: 'dias' as LeadUnit }] as const;
  const windowUnits  = [{ label: t.units.days,    value: 'dias'    as WindowUnit }, { label: t.units.months, value: 'meses' as WindowUnit }] as const;
  const slotUnits    = [{ label: t.units.minutes, value: 'minutos' as SlotUnit   }, { label: t.units.hours, value: 'horas' as SlotUnit }] as const;

  return (
    <AccordionSection id="politicas" title={t.accordionTitle}>
      <div className="bg-white rounded-2xl border border-stone-100 shadow-sm p-6 space-y-5">

        {/* 1 ── Lead time */}
        <div className={rowCls}>
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <p className="text-sm font-medium text-stone-900">{t.leadTime.title}</p>
              <p className="text-xs text-stone-500 mt-1">{t.leadTime.desc}</p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <input type="number" value={leadValue} min={0}
                onChange={(e) => setLeadValue(Math.max(0, parseInt(e.target.value, 10) || 0))}
                className={numInputCls} />
              <UnitSelect<LeadUnit> value={leadUnit} onChange={setLeadUnit} options={leadUnits} />
            </div>
          </div>
        </div>

        {/* 2 ── Booking window */}
        <div className={rowCls}>
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <p className="text-sm font-medium text-stone-900">{t.bookingWindow.title}</p>
              <p className="text-xs text-stone-500 mt-1">{t.bookingWindow.desc}</p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <input type="number" value={windowValue} min={0}
                onChange={(e) => setWindowValue(Math.max(0, parseInt(e.target.value, 10) || 0))}
                className={numInputCls} />
              <UnitSelect<WindowUnit> value={windowUnit} onChange={setWindowUnit} options={windowUnits} />
            </div>
          </div>
        </div>

        {/* 3 ── Slot duration */}
        <div className={rowCls}>
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-1.5">
                <p className="text-sm font-medium text-stone-900">{t.slotDuration.title}</p>
                <div className="relative group">
                  <HelpCircle size={13} className="text-stone-400 cursor-help" />
                  <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2.5 w-64 bg-stone-900 text-white text-xs rounded-xl px-3 py-2.5 shadow-lg leading-relaxed opacity-0 group-hover:opacity-100 transition-opacity duration-150 pointer-events-none z-20">
                    {t.slotDuration.tooltip}
                    <span className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-stone-900" />
                  </div>
                </div>
              </div>
              <p className="text-xs text-stone-500 mt-1">{t.slotDuration.desc}</p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <input type="number" value={slotValue} min={slotUnit === 'horas' ? 0.5 : 5} step={slotUnit === 'horas' ? 0.5 : 5}
                onChange={(e) => setSlotValue(Math.max(0, parseFloat(e.target.value) || 0))}
                className={numInputCls} />
              <UnitSelect<SlotUnit> value={slotUnit} onChange={(unit) => {
                if (unit === 'horas'   && slotUnit === 'minutos') setSlotValue(parseFloat((slotValue / 60).toFixed(2)));
                if (unit === 'minutos' && slotUnit === 'horas')   setSlotValue(Math.round(slotValue * 60));
                setSlotUnit(unit);
              }} options={slotUnits} />
            </div>
          </div>
        </div>

        {/* 4 ── Cancellation policy */}
        <div className={rowCls}>
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <p className="text-sm font-medium text-stone-900">{t.cancellation.title}</p>
              <p className="text-xs text-stone-500 mt-1">{t.cancellation.desc}</p>
            </div>
            <div className="shrink-0">
              <select value={cancellationHoursNotice}
                onChange={(e) => setCancellationHoursNotice(parseInt(e.target.value, 10))}
                className="border border-stone-200 rounded-xl px-3 py-2 text-sm text-stone-800 bg-white focus:outline-none focus:border-amber-300 transition-colors appearance-none cursor-pointer">
                {CANCELLATION_VALUES.map((v, idx) => (
                  <option key={v} value={v}>{t.cancellationOptions[idx]}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* 5 ── Custom message */}
        <div className="pt-2">
          <label className="text-sm font-medium text-stone-900 block">{t.customMessage.title}</label>
          <p className="text-xs text-stone-500 mt-1 mb-3">{t.customMessage.desc}</p>
          <textarea value={cancellationPolicyText} onChange={(e) => setCancellationPolicyText(e.target.value)}
            rows={4} className="w-full border border-stone-200 rounded-xl px-3 py-2 text-sm text-stone-800 focus:outline-none focus:border-amber-300 transition-colors resize-none" />
        </div>

        {/* Add to homepage */}
        <div className="pt-2 flex items-center justify-between gap-4">
          <label className="text-sm font-medium text-stone-900">{t.addPolicyToHomepage}</label>
          <Switch.Root checked={showPolicyOnHomepage} onCheckedChange={setShowPolicyOnHomepage}
            className="relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent bg-stone-200 transition-colors data-[state=checked]:bg-amber-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400">
            <Switch.Thumb className="block h-4 w-4 rounded-full bg-white shadow-sm transition-transform data-[state=checked]:translate-x-4 data-[state=unchecked]:translate-x-0" />
          </Switch.Root>
        </div>

        <div className="pt-4 flex justify-end">
          <button onClick={handleSave} disabled={isPending}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-stone-900 text-white text-sm font-medium hover:bg-stone-800 disabled:opacity-60 transition-colors">
            {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
            {isPending ? t.saving : t.save}
          </button>
        </div>
      </div>
    </AccordionSection>
  );
}
