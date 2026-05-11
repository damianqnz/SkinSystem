'use client';

import { useRef, useState } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { gsap } from 'gsap';
import { useGSAP } from '@gsap/react';
import { CalendarOff, CalendarPlus, X } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { BlockDaysForm } from './BlockDaysForm';

gsap.registerPlugin(useGSAP);

type View = 'choose' | 'block';

interface MonthActionModalProps {
  open:         boolean;
  onClose:      () => void;
  selectedDate: Date;
  locale:       string;
  onSchedule:   () => void;
}

export function MonthActionModal({ open, onClose, selectedDate, locale, onSchedule }: MonthActionModalProps) {
  const t = useTranslations('dashboard.calendar.monthAction');
  const [view, setView] = useState<View>('choose');

  const handleClose    = () => { setView('choose'); onClose(); };
  const handleSchedule = () => { onSchedule(); handleClose(); };

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
            selectedDate={selectedDate} t={t} locale={locale}
            onClose={handleClose} onSchedule={handleSchedule}
          />
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

function AnimatedShell({ view, setView, selectedDate, t, locale, onClose, onSchedule }: {
  view: View; setView: (v: View) => void;
  selectedDate: Date;
  t: ReturnType<typeof useTranslations<'dashboard.calendar.monthAction'>>;
  locale: string;
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
          {view === 'choose' ? t('chooseAction') : t('blockDaysTitle')}
        </Dialog.Title>
        <Dialog.Close asChild>
          <button className="p-1.5 rounded-lg hover:bg-stone-100 transition-colors text-stone-400"><X size={16} /></button>
        </Dialog.Close>
      </div>

      {view === 'choose' ? (
        <div className="px-5 pb-5 space-y-2.5">
          <Tile icon={<CalendarOff size={20} />} title={t('blockDays')} desc={t('blockDaysDesc')} onClick={() => setView('block')} />
          <Tile icon={<CalendarPlus size={20} />} title={t('schedule')} desc={t('scheduleDesc')} onClick={onSchedule} />
        </div>
      ) : (
        <BlockDaysForm selectedDate={selectedDate} locale={locale} onClose={onClose} />
      )}
    </div>
  );
}

function Tile({ icon, title, desc, onClick }: { icon: React.ReactNode; title: string; desc: string; onClick: () => void }) {
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
