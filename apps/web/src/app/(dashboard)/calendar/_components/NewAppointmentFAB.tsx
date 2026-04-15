'use client';

import { useState } from 'react';
import { Plus, X, User, Scissors, Clock, Calendar } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface NewAppointmentFABProps {
  locale:   string;
  date:     Date;
}

const EASE: [number, number, number, number] = [0.25, 0.46, 0.45, 0.94];

export function NewAppointmentFAB({ locale, date }: NewAppointmentFABProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      {/* FAB — Thumb-Zone: fixed bottom-right */}
      <button
        onClick={() => setOpen(true)}
        aria-label="Nueva cita"
        className="fixed bottom-24 right-4 z-40 w-14 h-14 rounded-full bg-stone-900 text-white shadow-lg shadow-stone-900/30 flex items-center justify-center hover:bg-stone-800 active:scale-95 transition-all"
      >
        <Plus size={22} />
      </button>

      {/* Modal */}
      <AnimatePresence>
        {open && (
          <>
            {/* Backdrop */}
            <motion.div
              key="backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.18 }}
              className="fixed inset-0 z-50 bg-black/30 backdrop-blur-sm"
              onClick={() => setOpen(false)}
            />

            {/* Sheet */}
            <motion.div
              key="sheet"
              initial={{ opacity: 0, y: 32 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 32 }}
              transition={{ duration: 0.22, ease: EASE }}
              className="fixed bottom-0 left-0 right-0 z-50 bg-white rounded-t-2xl shadow-2xl max-h-[85vh] overflow-y-auto md:relative md:inset-auto md:rounded-xl md:mx-auto md:max-w-md md:top-1/2 md:-translate-y-1/2 md:fixed"
            >
              <div className="p-5">
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h2 className="font-cormorant text-lg font-semibold text-stone-800">
                      Nueva Cita Manual
                    </h2>
                    <p className="text-xs text-stone-400 mt-0.5">
                      {date.toLocaleDateString(locale, { weekday: 'long', day: 'numeric', month: 'long' })}
                    </p>
                  </div>
                  <button
                    onClick={() => setOpen(false)}
                    className="p-1.5 rounded-lg hover:bg-stone-100 transition-colors text-stone-400"
                  >
                    <X size={16} />
                  </button>
                </div>

                {/* Form — stub (full booking flow is separate feature) */}
                <div className="space-y-4">
                  {/* Client */}
                  <FormField
                    icon={<User size={14} className="text-stone-400" />}
                    label="Cliente"
                    placeholder="Buscar cliente..."
                  />

                  {/* Service */}
                  <FormField
                    icon={<Scissors size={14} className="text-stone-400" />}
                    label="Servicio"
                    placeholder="Seleccionar servicio..."
                    type="select"
                  />

                  {/* Time */}
                  <div className="grid grid-cols-2 gap-3">
                    <FormField
                      icon={<Clock size={14} className="text-stone-400" />}
                      label="Hora inicio"
                      type="time"
                    />
                    <FormField
                      icon={<Calendar size={14} className="text-stone-400" />}
                      label="Duración"
                      placeholder="60 min"
                      readOnly
                    />
                  </div>

                  {/* Notes */}
                  <div>
                    <label className="block text-[11px] font-medium text-stone-500 uppercase tracking-wide mb-1.5">
                      Nota interna
                    </label>
                    <textarea
                      rows={2}
                      placeholder="Opcional..."
                      className="input-editorial w-full resize-none text-sm"
                    />
                  </div>

                  {/* CTA */}
                  <button
                    className="w-full py-3 rounded-xl bg-stone-900 text-white text-sm font-medium hover:bg-stone-800 active:scale-98 transition-all"
                    onClick={() => setOpen(false)}
                  >
                    Confirmar Cita
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}

function FormField({
  icon,
  label,
  placeholder,
  type = 'text',
  readOnly = false,
}: {
  icon:         React.ReactNode;
  label:        string;
  placeholder?: string;
  type?:        string;
  readOnly?:    boolean;
}) {
  return (
    <div>
      <label className="block text-[11px] font-medium text-stone-500 uppercase tracking-wide mb-1.5">
        {label}
      </label>
      <div className="relative">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none">
          {icon}
        </span>
        {type === 'select' ? (
          <select className="input-editorial w-full pl-8 text-sm appearance-none">
            <option value="">{placeholder}</option>
          </select>
        ) : (
          <input
            type={type}
            placeholder={placeholder}
            readOnly={readOnly}
            className="input-editorial w-full pl-8 text-sm"
          />
        )}
      </div>
    </div>
  );
}
