'use client';

const STEPS = ['Servicio', 'Horario', 'Confirmar'];

interface StepIndicatorProps {
  current: 1 | 2 | 3;
}

export function StepIndicator({ current }: StepIndicatorProps) {
  return (
    <div className="flex items-center justify-center gap-0 mb-8">
      {STEPS.map((label, i) => {
        const n     = (i + 1) as 1 | 2 | 3;
        const done  = n < current;
        const active = n === current;
        return (
          <div key={n} className="flex items-center">
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
                {done ? '✓' : n}
              </div>
              <span className={['text-[10px] font-medium uppercase tracking-wider',
                active ? 'text-stone-700' : 'text-stone-400'].join(' ')}>
                {label}
              </span>
            </div>

            {/* Connector */}
            {i < STEPS.length - 1 && (
              <div
                className={[
                  'w-16 h-px mx-2 mb-4 transition-colors',
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
