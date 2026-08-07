'use client';

import { bookT } from '../_i18n';

type Step = 'service' | 'calendar' | 'auth' | 'confirm';

const STEP_KEYS: Step[] = ['service', 'calendar', 'auth', 'confirm'];

interface StepIndicatorProps {
  current:      Step;
  showAuthStep: boolean;
  locale:       string;
}

export function StepIndicator({ current, showAuthStep, locale }: StepIndicatorProps) {
  const t = bookT(locale);

  const steps: { key: Step; label: string }[] = STEP_KEYS
    .filter((k) => showAuthStep || k !== 'auth')
    .map((k) => ({ key: k, label: t.steps[k] }));

  const currentIndex = steps.findIndex((s) => s.key === current);

  return (
    <div className="flex items-center justify-center gap-0 mb-8">
      {steps.map((step, i) => {
        const done   = i < currentIndex;
        const active = i === currentIndex;
        return (
          <div key={step.key} className="flex items-center">
            {/* Node */}
            <div className="flex flex-col items-center gap-1.5">
              <div
                className={[
                  'w-7 h-7 rounded-full flex items-center justify-center text-xs font-medium transition-colors',
                  done    ? 'bg-amber-400 text-stone-950' :
                  active  ? 'bg-stone-900 text-white ring-2 ring-stone-900 ring-offset-2' :
                            'bg-stone-100 text-stone-400',
                ].join(' ')}
              >
                {done ? '✓' : i + 1}
              </div>
              <span className={['text-[10px] font-medium uppercase tracking-wider whitespace-nowrap',
                active ? 'text-stone-700' : 'text-stone-400'].join(' ')}>
                {step.label}
              </span>
            </div>

            {/* Connector */}
            {i < steps.length - 1 && (
              <div
                className={[
                  'w-10 h-px mx-1.5 mb-4 transition-colors',
                  done ? 'bg-amber-400' : 'bg-stone-200',
                ].join(' ')}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
