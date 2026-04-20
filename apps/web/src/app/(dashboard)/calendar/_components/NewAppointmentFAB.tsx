'use client';

import { useState } from 'react';
import { Plus, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { AppointmentForm } from './AppointmentForm';
import { AddClientStep } from './AddClientStep';
import type { CustomerMatch } from '../actions/search-customers';
import type { CreatedCustomer } from '../actions/create-customer';

interface NewAppointmentFABProps {
  locale:           string;
  date:             Date;
  initialTime?:     string;
  externalOpen?:    boolean;
  onExternalClose?: () => void;
}

const EASE: [number, number, number, number] = [0.25, 0.46, 0.45, 0.94];

export function NewAppointmentFAB({
  locale, date, initialTime, externalOpen, onExternalClose,
}: NewAppointmentFABProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const [step,         setStep]         = useState<1 | 2>(1);
  const [customer,     setCustomer]     = useState<CustomerMatch | null>(null);
  const [formKey,      setFormKey]      = useState(0);

  const open = externalOpen ?? internalOpen;

  function setOpen(v: boolean) {
    if (!v && onExternalClose) onExternalClose();
    setInternalOpen(v);
    if (!v) { setStep(1); setCustomer(null); }
  }

  function handleClientCreated(c: CreatedCustomer) {
    setCustomer({ id: c.id, fullName: c.fullName, email: null, phone: null });
    setFormKey((k) => k + 1); // remount AppointmentForm with pre-selected customer
    setStep(1);
  }

  return (
    <>
      {/* FAB — Thumb-Zone: fixed bottom-right */}
      <button onClick={() => setOpen(true)} aria-label="Nueva cita"
        className="fixed bottom-24 right-4 z-40 w-14 h-14 rounded-full bg-stone-900 text-white shadow-lg shadow-stone-900/30 flex items-center justify-center hover:bg-stone-800 active:scale-95 transition-all">
        <Plus size={22} />
      </button>

      <AnimatePresence>
        {open && (
          <>
            {/* Backdrop */}
            <motion.div key="backdrop" initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              exit={{ opacity: 0 }} transition={{ duration: 0.18 }}
              className="fixed inset-0 z-50 bg-black/30 backdrop-blur-sm"
              onClick={() => setOpen(false)} />

            {/* Sheet */}
            <motion.div key="sheet" initial={{ opacity: 0, y: 32 }} animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 32 }} transition={{ duration: 0.22, ease: EASE }}
              className="fixed bottom-0 left-0 right-0 z-50 bg-white rounded-t-2xl shadow-2xl max-h-[85vh] overflow-y-auto md:relative md:inset-auto md:rounded-xl md:mx-auto md:max-w-md md:top-1/2 md:-translate-y-1/2 md:fixed">
              <div className="p-5">
                {/* Close button */}
                <button onClick={() => setOpen(false)}
                  className="absolute top-4 right-4 p-1.5 rounded-lg hover:bg-stone-100 transition-colors text-stone-400"
                  aria-label="Cerrar">
                  <X size={16} />
                </button>

                {step === 1 && (
                  <AppointmentForm
                    key={formKey}
                    locale={locale}
                    date={date}
                    initialTime={initialTime}
                    selectedCustomer={customer}
                    onCustomerChange={setCustomer}
                    onAddClient={() => setStep(2)}
                    onClose={() => setOpen(false)}
                  />
                )}

                {step === 2 && (
                  <AddClientStep
                    onBack={() => setStep(1)}
                    onClientCreated={handleClientCreated}
                  />
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
