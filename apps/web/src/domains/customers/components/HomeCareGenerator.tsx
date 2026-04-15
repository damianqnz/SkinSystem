'use client';

/**
 * HomeCareGenerator — Client Component.
 *
 * Responsibilities:
 *  1. Form: Morning / Afternoon / Night routine steps (product + instruction).
 *  2. Language selector (Thumb Zone) — ES | PT | EN.
 *  3. PDF generation via @react-pdf/renderer (dynamic import, ssr: false).
 *  4. Server Action: saves routine record to customer_routines table.
 *
 * Security: only the authenticated specialist reaches this component.
 * The Server Action re-validates the session independently.
 */

import { useState, useActionState, useTransition, useCallback } from 'react';
import dynamic from 'next/dynamic';
import { Plus, Trash2, Download, Loader2, CheckCircle2 } from 'lucide-react';
import { cn } from '@/shared/lib/utils';
import { saveRoutineAction } from '@/app/(dashboard)/dashboard/customers/[id]/routine/actions';
import type { RoutineStep } from '../service-routines';
import type { RoutinePDFData } from './pdf/RoutinePDFTemplate';

// ── Dynamic imports (ssr: false — react-pdf is browser-only) ──
const PDFDownloadLink = dynamic(
  () => import('@react-pdf/renderer').then((m) => m.PDFDownloadLink),
  { ssr: false, loading: () => null },
);
const RoutinePDFTemplate = dynamic(
  () => import('./pdf/RoutinePDFTemplate').then((m) => m.RoutinePDFTemplate),
  { ssr: false },
);

// ── Types ─────────────────────────────────────────────────────
type Locale  = 'es' | 'pt' | 'en';
type Period  = 'morning' | 'afternoon' | 'night';

const BLANK_STEP: RoutineStep = { productName: '', instruction: '' };

interface Props {
  customerId:       string;
  organizationId:   string;
  customerName:     string;
  specialistName:   string;
  organizationName: string;
}

// ── Translations ──────────────────────────────────────────────
const L = {
  es: { morning: 'Mañana', afternoon: 'Tarde', night: 'Noche', product: 'Producto', instruction: 'Instrucción', addStep: '+ Paso', save: 'Guardar rutina', download: 'Descargar PDF', generating: 'Generando…', saved: '¡Guardada!', notes: 'Notas para la clienta', notesPlaceholder: 'Indicaciones adicionales…', title: 'Rutina Home Care', lang: 'Idioma del PDF' },
  pt: { morning: 'Manhã', afternoon: 'Tarde', night: 'Noite', product: 'Produto', instruction: 'Instrução', addStep: '+ Passo', save: 'Guardar rotina', download: 'Descarregar PDF', generating: 'Gerando…', saved: 'Guardada!', notes: 'Notas para a cliente', notesPlaceholder: 'Indicações adicionais…', title: 'Rotina Home Care', lang: 'Idioma do PDF' },
  en: { morning: 'Morning', afternoon: 'Afternoon', night: 'Night', product: 'Product', instruction: 'Instructions', addStep: '+ Step', save: 'Save routine', download: 'Download PDF', generating: 'Generating…', saved: 'Saved!', notes: 'Notes for the client', notesPlaceholder: 'Additional instructions…', title: 'Home Care Routine', lang: 'PDF language' },
} as const;

// ── Step editor row ───────────────────────────────────────────
function StepRow({ step, onChange, onRemove, locale }: {
  step: RoutineStep; onChange: (s: RoutineStep) => void;
  onRemove: () => void; locale: Locale;
}) {
  const t = L[locale];
  return (
    <div className="flex items-start gap-2 group">
      <div className="flex-1 grid grid-cols-2 gap-2">
        <input
          value={step.productName}
          onChange={(e) => onChange({ ...step, productName: e.target.value })}
          placeholder={t.product}
          className="input-editorial text-sm"
          maxLength={100}
        />
        <input
          value={step.instruction}
          onChange={(e) => onChange({ ...step, instruction: e.target.value })}
          placeholder={t.instruction}
          className="input-editorial text-sm"
          maxLength={200}
        />
      </div>
      <button
        type="button"
        onClick={onRemove}
        className="mt-2 opacity-0 group-hover:opacity-100 transition-opacity p-1 text-[var(--color-spa-muted)] hover:text-red-500"
        aria-label="Eliminar paso"
      >
        <Trash2 size={13} strokeWidth={1.5} />
      </button>
    </div>
  );
}

// ── Period section ────────────────────────────────────────────
function PeriodSection({ period, steps, onChange, locale }: {
  period: Period; steps: RoutineStep[];
  onChange: (steps: RoutineStep[]) => void; locale: Locale;
}) {
  const t = L[locale];
  const label = { morning: t.morning, afternoon: t.afternoon, night: t.night }[period];
  const dot   = { morning: '#D4AF37', afternoon: '#F59E0B', night: '#6366F1' }[period];

  const update = (i: number, s: RoutineStep) => onChange(steps.map((r, idx) => idx === i ? s : r));
  const remove = (i: number) => onChange(steps.filter((_, idx) => idx !== i));
  const add    = () => onChange([...steps, { ...BLANK_STEP }]);

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: dot }} />
        <span className="font-sans text-[10px] uppercase tracking-[0.18em] text-[var(--color-spa-muted)]">
          {label}
        </span>
      </div>
      <div className="space-y-3 pl-4">
        {steps.map((s, i) => (
          <StepRow key={i} step={s} locale={locale}
            onChange={(ns) => update(i, ns)} onRemove={() => remove(i)} />
        ))}
        <button
          type="button"
          onClick={add}
          disabled={steps.length >= 8}
          className="font-sans text-xs text-[var(--color-spa-muted)] hover:text-[var(--color-spa-stone)] transition-colors disabled:opacity-30"
        >
          {t.addStep}
        </button>
      </div>
    </div>
  );
}

// ── Language selector (Thumb Zone) ────────────────────────────
function LangSelector({ value, onChange }: { value: Locale; onChange: (l: Locale) => void }) {
  const langs: { code: Locale; flag: string }[] = [
    { code: 'es', flag: '🇪🇸' }, { code: 'pt', flag: '🇵🇹' }, { code: 'en', flag: '🇬🇧' },
  ];
  return (
    <div className="flex gap-2">
      {langs.map(({ code, flag }) => (
        <button
          key={code}
          type="button"
          onClick={() => onChange(code)}
          className={cn(
            'flex-1 flex flex-col items-center justify-center py-3 gap-1 rounded-sm border text-sm transition-all min-h-[60px]',
            value === code
              ? 'border-[var(--color-spa-stone)] bg-[var(--color-spa-stone)] text-[var(--color-spa-bg)]'
              : 'border-[var(--color-spa-border)] text-[var(--color-spa-muted)] hover:border-[var(--color-spa-stone)]',
          )}
        >
          <span className="text-xl">{flag}</span>
          <span className="font-sans text-[10px] uppercase tracking-widest">{code}</span>
        </button>
      ))}
    </div>
  );
}

// ── Main component ────────────────────────────────────────────
export function HomeCareGenerator({
  customerId, organizationId, customerName, specialistName, organizationName,
}: Props) {
  const [locale, setLocale]         = useState<Locale>('es');
  const [morningSteps, setMorning]  = useState<RoutineStep[]>([{ ...BLANK_STEP }]);
  const [afternoonSteps, setAfternoon] = useState<RoutineStep[]>([]);
  const [nightSteps, setNight]      = useState<RoutineStep[]>([{ ...BLANK_STEP }]);
  const [notes, setNotes]           = useState('');
  const [pdfReady, setPdfReady]     = useState(false);
  const [isPending, startTransition] = useTransition();

  const [actionState, dispatch] = useActionState(saveRoutineAction, { status: 'idle' });

  const t = L[locale];
  const hasSteps = morningSteps.some(s => s.productName) ||
                   afternoonSteps.some(s => s.productName) ||
                   nightSteps.some(s => s.productName);

  const pdfData: RoutinePDFData = {
    organizationName, customerName, specialistName,
    generatedAt: new Date().toISOString(),
    locale, morningSteps, afternoonSteps, nightSteps,
    specialistNotes: notes || undefined,
  };

  const handleSave = useCallback(() => {
    const payload = {
      customerId, organizationId, locale,
      title: t.title,
      morningSteps:   morningSteps.filter(s => s.productName),
      afternoonSteps: afternoonSteps.filter(s => s.productName),
      nightSteps:     nightSteps.filter(s => s.productName),
      specialistNotes: notes || undefined,
    };
    startTransition(() => {
      // React 19 useActionState: dispatch takes action input (prev is injected by the hook)
      (dispatch as (input: unknown) => void)(payload);
    });
    setPdfReady(true);
  }, [customerId, organizationId, locale, t.title, morningSteps, afternoonSteps, nightSteps, notes, dispatch]);

  const saved = actionState.status === 'success';

  return (
    <div className="space-y-8 max-w-2xl">

      {/* ── Language selector (Thumb Zone, always visible) ── */}
      <div className="space-y-2">
        <p className="font-sans text-[10px] uppercase tracking-[0.18em] text-[var(--color-spa-muted)]">{t.lang}</p>
        <LangSelector value={locale} onChange={(l) => { setLocale(l); setPdfReady(false); }} />
      </div>

      {/* ── Routine form ─────────────────────────────────── */}
      <div className="space-y-6 rounded-sm border border-[var(--color-spa-border)] bg-white/50 p-6">
        <PeriodSection period="morning"   steps={morningSteps}   onChange={setMorning}   locale={locale} />
        <div className="border-t border-[var(--color-spa-border)]" />
        <PeriodSection period="afternoon" steps={afternoonSteps} onChange={setAfternoon} locale={locale} />
        <div className="border-t border-[var(--color-spa-border)]" />
        <PeriodSection period="night"     steps={nightSteps}     onChange={setNight}     locale={locale} />
      </div>

      {/* ── Specialist notes ─────────────────────────────── */}
      <div className="space-y-1.5">
        <p className="font-sans text-[10px] uppercase tracking-[0.18em] text-[var(--color-spa-muted)]">{t.notes}</p>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder={t.notesPlaceholder}
          rows={3}
          maxLength={600}
          className="w-full font-sans text-sm bg-white/60 border border-[var(--color-spa-border)] rounded-sm p-3 text-[var(--color-spa-stone)] placeholder:text-[var(--color-spa-muted)] focus:outline-none focus:border-[var(--color-spa-stone)] resize-none transition-colors"
        />
      </div>

      {/* ── Actions (Thumb Zone on mobile: sticky bottom) ── */}
      <div className="flex gap-3 sticky bottom-4 z-30 pb-safe sm:static sm:bottom-auto">
        {/* Save to DB */}
        <button
          type="button"
          onClick={handleSave}
          disabled={!hasSteps || isPending || saved}
          className={cn(
            'flex-1 flex items-center justify-center gap-2 py-3.5 font-sans text-sm font-medium rounded-sm border transition-all min-h-[52px]',
            saved
              ? 'border-emerald-300 text-emerald-700 bg-emerald-50'
              : 'border-[var(--color-spa-stone)] bg-[var(--color-spa-stone)] text-[var(--color-spa-bg)] hover:opacity-90 disabled:opacity-40',
          )}
        >
          {isPending ? <Loader2 size={15} strokeWidth={1.5} className="animate-spin" /> : saved ? <CheckCircle2 size={15} strokeWidth={1.5} /> : null}
          {isPending ? t.generating : saved ? t.saved : t.save}
        </button>

        {/* Download PDF (async, browser-only) */}
        {pdfReady && hasSteps ? (
          <PDFDownloadLink
            document={<RoutinePDFTemplate data={pdfData} />}
            fileName={`routine_${customerName.replace(/\s+/g, '_').toLowerCase()}_${new Date().toISOString().slice(0, 10)}.pdf`}
            className="flex-1 flex items-center justify-center gap-2 py-3.5 font-sans text-sm border border-[#D4AF37] text-[#D4AF37] rounded-sm hover:bg-[#D4AF37] hover:text-white transition-all min-h-[52px] no-underline"
          >
            {/* PDFDownloadLink v3 children as ReactNode (non-function form) */}
            <span className="flex items-center gap-2">
              <Download size={15} strokeWidth={1.5} />
              {t.download}
            </span>
          </PDFDownloadLink>
        ) : (
          <button
            type="button"
            onClick={() => { if (hasSteps) { setPdfReady(true); handleSave(); } }}
            disabled={!hasSteps}
            className="flex-1 flex items-center justify-center gap-2 py-3.5 font-sans text-sm border border-[#D4AF37] text-[#D4AF37] rounded-sm hover:bg-[#D4AF37] hover:text-white transition-all min-h-[52px] disabled:opacity-30"
          >
            <Download size={15} strokeWidth={1.5} />
            {t.download}
          </button>
        )}
      </div>

      {/* Error feedback */}
      {actionState.status === 'error' && (
        <p className="font-sans text-sm text-red-600 mt-2">{actionState.message}</p>
      )}
    </div>
  );
}
