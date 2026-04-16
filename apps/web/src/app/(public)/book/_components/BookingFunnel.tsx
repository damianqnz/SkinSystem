'use client';

import { useState }        from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ChevronLeft }     from 'lucide-react';
import { StepIndicator }   from './StepIndicator';
import { Step1Service }    from './Step1Service';
import { Step2Calendar }   from './Step2Calendar';
import { Step3Confirm }    from './Step3Confirm';
import type { SelectService } from '@/domains/catalog/schema';
import type { PublicSlot }    from '../actions';

// ── Motion config ─────────────────────────────────────────────

const EASE: [number, number, number, number] = [0.25, 0.46, 0.45, 0.94];

const variants = {
  enter:   (dir: number) => ({ x: dir * 40, opacity: 0 }),
  center:  { x: 0, opacity: 1 },
  exit:    (dir: number) => ({ x: dir * -40, opacity: 0 }),
};

type Step = 1 | 2 | 3;

// ── Props ─────────────────────────────────────────────────────

interface BookingFunnelProps {
  services:       SelectService[];
  locale:         string;
  initialService?: string;    // pre-selected serviceId from URL
}

// ── Component ─────────────────────────────────────────────────

export function BookingFunnel({
  services,
  locale,
  initialService,
}: BookingFunnelProps) {
  const preSelected = initialService
    ? services.find((s) => s.id === initialService)
    : undefined;

  const [step,    setStep]    = useState<Step>(preSelected ? 2 : 1);
  const [dir,     setDir]     = useState<1 | -1>(1);
  const [service, setService] = useState<SelectService | null>(preSelected ?? null);
  const [slot,    setSlot]    = useState<PublicSlot | null>(null);

  function goTo(next: Step) {
    setDir(next > step ? 1 : -1);
    setStep(next);
  }

  function handleServiceSelect(svc: SelectService) {
    setService(svc);
    goTo(2);
  }

  function handleSlotSelect(s: PublicSlot) {
    setSlot(s);
    goTo(3);
  }

  function handleBack() {
    if (step === 2) goTo(1);
    if (step === 3) { setSlot(null); goTo(2); }
  }

  return (
    <div className="max-w-xl mx-auto">

      {/* Step indicator */}
      <StepIndicator current={step} />

      {/* Back button (steps 2 & 3) */}
      {step > 1 && (
        <button
          onClick={handleBack}
          className="flex items-center gap-1.5 text-xs text-stone-400 hover:text-stone-700 mb-4 transition-colors"
        >
          <ChevronLeft size={14} />
          Volver
        </button>
      )}

      {/* Step content with slide animation */}
      <AnimatePresence mode="wait" custom={dir}>
        <motion.div
          key={step}
          custom={dir}
          variants={variants}
          initial="enter"
          animate="center"
          exit="exit"
          transition={{ duration: 0.22, ease: EASE }}
        >
          {step === 1 && (
            <Step1Service
              services={services}
              locale={locale}
              onSelect={handleServiceSelect}
            />
          )}

          {step === 2 && service && (
            <Step2Calendar
              serviceId={service.id}
              locale={locale}
              onSelect={handleSlotSelect}
            />
          )}

          {step === 3 && service && slot && (
            <Step3Confirm
              service={service}
              slot={slot}
              locale={locale}
            />
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
