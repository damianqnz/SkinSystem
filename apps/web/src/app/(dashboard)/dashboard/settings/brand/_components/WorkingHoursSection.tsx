'use client';

import { useState, useTransition }    from 'react';
import * as Switch                    from '@radix-ui/react-switch';
import { Loader2 }                    from 'lucide-react';
import { toast }                      from 'sonner';
import { useTranslations }            from 'next-intl';
import { updateWorkingHoursAction }   from '../actions';

export interface DayRule {
  dayOfWeek: number;
  isActive:  boolean;
  openTime:  string;
  closeTime: string;
}

interface Props { initial: DayRule[]; }

// Day-of-week → named key map (matching workingHours.days.{mon,tue,...})
const DOW_KEY: Record<number, string> = {
  1: 'mon', 2: 'tue', 3: 'wed', 4: 'thu', 5: 'fri', 6: 'sat', 0: 'sun',
};

const DAY_ORDER = [1, 2, 3, 4, 5, 6, 0] as const;

function defaultDay(dow: number): DayRule {
  return { dayOfWeek: dow, isActive: dow >= 1 && dow <= 5, openTime: '09:00', closeTime: '18:00' };
}

function normalizeTime(t: string): string {
  return t.length > 5 ? t.substring(0, 5) : t;
}

function buildRules(initial: DayRule[]): DayRule[] {
  return DAY_ORDER.map((dow) => {
    const found = initial.find((r) => r.dayOfWeek === dow);
    if (!found) return defaultDay(dow);
    return { ...found, openTime: normalizeTime(found.openTime), closeTime: normalizeTime(found.closeTime) };
  });
}

function notifyPreview() {
  if (typeof window !== 'undefined')
    window.dispatchEvent(new CustomEvent('skinsystem:settings-saved'));
}

export function WorkingHoursSection({ initial }: Props) {
  const t = useTranslations('dashboard.settings.brand.workingHours');
  const days = t.raw('days') as Record<string, string>;
  const [rules,   setRules]   = useState<DayRule[]>(buildRules(initial));
  const [pending, startTransition] = useTransition();

  function updateField(dow: number, key: keyof DayRule, value: string | boolean) {
    setRules((prev) => prev.map((r) => r.dayOfWeek === dow ? { ...r, [key]: value } : r));
  }

  function handleSave() {
    startTransition(async () => {
      const res = await updateWorkingHoursAction(rules);
      if (res.error) { toast.error(res.error.message); return; }
      toast.success(t('successSave'));
      notifyPreview();
    });
  }

  return (
    <section id="horario" className="space-y-3">
      <h2 className="text-xs font-medium text-stone-400 uppercase tracking-widest">{t('sectionTitle')}</h2>
      <p className="text-xs text-stone-400">{t('sectionDesc')}</p>

      <div className="bg-white rounded-2xl border border-stone-100 shadow-sm overflow-hidden">
        {rules.map((rule, idx) => {
          const dayLabel = days[DOW_KEY[rule.dayOfWeek] ?? ''] ?? '';
          return (
            <div
              key={rule.dayOfWeek}
              className={`flex items-center gap-4 px-5 py-3.5 ${idx < rules.length - 1 ? 'border-b border-stone-50' : ''}`}
            >
              <Switch.Root
                checked={rule.isActive}
                onCheckedChange={(v) => updateField(rule.dayOfWeek, 'isActive', v)}
                className="relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent bg-stone-200 transition-colors data-[state=checked]:bg-amber-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-amber-400"
              >
                <Switch.Thumb className="block h-4 w-4 rounded-full bg-white shadow-sm transition-transform data-[state=checked]:translate-x-4 data-[state=unchecked]:translate-x-0" />
              </Switch.Root>

              <span className={`w-32 text-sm shrink-0 ${rule.isActive ? 'text-stone-800' : 'text-stone-400'}`}>
                {dayLabel}
              </span>

              {rule.isActive ? (
                <div className="flex items-center gap-2 ml-auto">
                  <input type="time" value={rule.openTime}
                    onChange={(e) => updateField(rule.dayOfWeek, 'openTime', e.target.value)}
                    className="border border-stone-200 rounded-lg px-2 py-1.5 text-sm text-stone-700 focus:outline-none focus:border-amber-300 focus:ring-1 focus:ring-amber-200 transition-colors"
                  />
                  <span className="text-stone-400 text-sm">—</span>
                  <input type="time" value={rule.closeTime}
                    onChange={(e) => updateField(rule.dayOfWeek, 'closeTime', e.target.value)}
                    className="border border-stone-200 rounded-lg px-2 py-1.5 text-sm text-stone-700 focus:outline-none focus:border-amber-300 focus:ring-1 focus:ring-amber-200 transition-colors"
                  />
                </div>
              ) : (
                <span className="ml-auto text-xs text-stone-400 font-medium uppercase tracking-wide">{t('closed')}</span>
              )}
            </div>
          );
        })}

        <div className="px-5 py-3.5 border-t border-stone-50 flex justify-end">
          <button onClick={handleSave} disabled={pending}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-stone-900 text-white text-sm font-medium hover:bg-stone-800 disabled:opacity-60 transition-colors">
            {pending && <Loader2 size={13} className="animate-spin" />}
            {t('save')}
          </button>
        </div>
      </div>
    </section>
  );
}
