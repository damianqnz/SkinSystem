'use client';

import { useRef, useState, useEffect } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { gsap } from 'gsap';
import { useGSAP } from '@gsap/react';
import { Lock, CalendarPlus, X, AlertCircle } from 'lucide-react';
import { BlockTimeForm } from './BlockTimeForm';

gsap.registerPlugin(useGSAP);

export type SlotInfo = { time: string; date: string };
type View = 'choose' | 'block';

// ── i18n ─────────────────────────────────────────────────────

type CalendarMessages = {
  slot:  { block: string; schedule: string; chooseAction: string; blockDescription: string; scheduleDescription: string; outsideNote?: string };
  block: { title: string; from: string; to: string; reasonLabel: string; confirm: string; success: string; reason: Record<string, string> };
};

function useMessages(locale: string): CalendarMessages {
  const [msgs, setMsgs] = useState<CalendarMessages | null>(null);
  useEffect(() => {
    import(`@/messages/${locale}.json`)
      .then((m) => setMsgs((m.default?.calendar ?? m.calendar) as CalendarMessages))
      .catch(() => import('@/messages/es.json').then((m) => setMsgs(m.default.calendar as CalendarMessages)));
  }, [locale]);
  return msgs ?? FALLBACK;
}

const FALLBACK: CalendarMessages = {
  slot: {
    block: 'Bloquear hora', schedule: 'Agendar cita',
    chooseAction: '¿Qué deseas hacer?',
    blockDescription: 'Marcar este horario como no disponible',
    scheduleDescription: 'Crear una cita manual para un cliente',
    outsideNote: 'Horario fuera de agenda — solo citas especiales',
  },
  block: { title: 'Bloquear horario', from: 'Desde (hs)', to: 'Hasta (hs)', reasonLabel: 'Motivo', confirm: 'Confirmar bloqueo', success: 'Horario bloqueado correctamente', reason: { illness: 'Enfermedad', vacation: 'Vacaciones', training: 'Formación', other: 'Evento' } },
};

// ── Props ────────────────────────────────────────────────────

interface SlotActionModalProps {
  open:            boolean;
  onClose:         () => void;
  slot:            SlotInfo | null;
  locale:          string;
  onSchedule:      (time: string) => void;
  isBusinessHour?: boolean;
}

export function SlotActionModal({ open, onClose, slot, locale, onSchedule, isBusinessHour = true }: SlotActionModalProps) {
  const [view, setView] = useState<View>('choose');
  const t = useMessages(locale);

  const handleClose    = () => { setView('choose'); onClose(); };
  const handleSchedule = () => { if (slot) onSchedule(slot.time); handleClose(); };

  return (
    <Dialog.Root open={open} onOpenChange={(o) => { if (!o) handleClose(); }}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/30 backdrop-blur-sm" />
        <Dialog.Content
          className="fixed z-50 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[calc(100%-2rem)] max-w-md"
          aria-describedby={undefined}
        >
          <AnimatedShell
            view={view} setView={setView}
            slot={slot} t={t}
            isBusinessHour={isBusinessHour}
            onClose={handleClose} onSchedule={handleSchedule}
          />
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

// ── Animated shell ────────────────────────────────────────────

function AnimatedShell({ view, setView, slot, t, isBusinessHour, onClose, onSchedule }: {
  view: View; setView: (v: View) => void; slot: SlotInfo | null;
  t: CalendarMessages; isBusinessHour: boolean;
  onClose: () => void; onSchedule: () => void;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useGSAP(() => {
    gsap.fromTo(ref.current,
      { opacity: 0, y: 24, scale: 0.96 },
      { opacity: 1, y: 0, scale: 1, duration: 0.28, ease: 'power2.out' },
    );
  }, { scope: ref });

  return (
    <div ref={ref} className="rounded-xl bg-white/85 backdrop-blur-xl border border-stone-200/60 shadow-2xl overflow-hidden">
      <div className="flex items-center justify-between px-5 pt-5 pb-3">
        <Dialog.Title className="font-cormorant text-xl font-semibold text-stone-800">
          {view === 'choose' ? t.slot.chooseAction : t.block.title}
        </Dialog.Title>
        <Dialog.Close asChild>
          <button className="p-1.5 rounded-lg hover:bg-stone-100 transition-colors text-stone-400"><X size={16} /></button>
        </Dialog.Close>
      </div>

      {slot && <p className="px-5 pb-2 text-xs text-stone-400 tabular-nums">{slot.time} — {slot.date}</p>}

      {view === 'choose' ? (
        <div className="px-5 pb-5 space-y-2.5">
          {!isBusinessHour && (
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-amber-50 border border-amber-100">
              <AlertCircle size={13} className="text-amber-500 flex-shrink-0" />
              <span className="text-[11px] text-amber-700">{t.slot.outsideNote ?? FALLBACK.slot.outsideNote}</span>
            </div>
          )}
          {isBusinessHour && (
            <ActionTile icon={<Lock size={20} />} title={t.slot.block} desc={t.slot.blockDescription} onClick={() => setView('block')} />
          )}
          <ActionTile icon={<CalendarPlus size={20} />} title={t.slot.schedule} desc={t.slot.scheduleDescription} onClick={onSchedule} />
        </div>
      ) : (
        <BlockTimeForm slot={slot} t={t.block} onClose={onClose} />
      )}
    </div>
  );
}

function ActionTile({ icon, title, desc, onClick }: { icon: React.ReactNode; title: string; desc: string; onClick: () => void }) {
  return (
    <button onClick={onClick} className="flex items-center gap-4 w-full p-4 rounded-lg border border-stone-200/60 hover:border-[#D4AF37]/50 hover:bg-[rgba(212,175,55,0.04)] transition-all text-left min-h-[56px]">
      <span className="text-stone-500">{icon}</span>
      <div className="flex-1 min-w-0">
        <span className="block font-cormorant text-base font-semibold text-stone-800">{title}</span>
        <span className="block text-[11px] text-stone-400 mt-0.5">{desc}</span>
      </div>
    </button>
  );
}
