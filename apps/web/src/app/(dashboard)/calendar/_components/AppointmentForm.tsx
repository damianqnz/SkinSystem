'use client';

import { useEffect, useState, useTransition } from 'react';
import * as Select from '@radix-ui/react-select';
import { Scissors, Clock, Calendar, ChevronDown, Check } from 'lucide-react';
import { toast } from 'sonner';
import { ClientSearchField }                  from './ClientSearchField';
import { getServicesAction }                  from '../actions/get-services';
import { getAvailableTimesAction }            from '../actions/get-available-times';
import { createInternalAppointmentAction }    from '@/app/(dashboard)/dashboard/agenda/actions';
import type { CustomerMatch }                 from '../actions/search-customers';
import type { ServiceOption }                 from '../actions/get-services';

interface AppointmentFormProps {
  locale:           string;
  date:             Date;
  initialTime?:     string;
  selectedCustomer: CustomerMatch | null;
  onCustomerChange: (c: CustomerMatch | null) => void;
  onAddClient:      () => void;
  onClose:          () => void;
}

type ServicesState = { status: 'loading' } | { status: 'ready'; data: ServiceOption[] } | { status: 'error' };

export function AppointmentForm({ locale, date, initialTime, selectedCustomer, onCustomerChange, onAddClient, onClose }: AppointmentFormProps) {
  const [services,  setServices]  = useState<ServicesState>({ status: 'loading' });
  const [serviceId, setServiceId] = useState('');
  const [duration,  setDuration]  = useState('');
  const [times,     setTimes]     = useState<string[] | null>(null); // null = loading
  const [time,      setTime]      = useState('');
  const [notes,     setNotes]     = useState('');
  const [pending,   startTransition] = useTransition();

  useEffect(() => { // eslint-disable-line react-hooks/exhaustive-deps
    getServicesAction(locale).then((res) => {
      setServices(res.error || !res.data ? { status: 'error' } : { status: 'ready', data: res.data });
    });
  }, []);

  useEffect(() => {
    setTimes(null);
    getAvailableTimesAction(date.toISOString().slice(0, 10)).then((res) => {
      const avail = res.data ?? [];
      setTimes(avail);
      if (initialTime && avail.includes(initialTime)) setTime(initialTime);
    });
  }, [date, initialTime]);

  const handleServiceChange = (id: string) => {
    setServiceId(id);
    const svc = services.status === 'ready' ? services.data.find((s) => s.id === id) : null;
    setDuration(svc ? `${svc.durationMinutes} min` : '');
  };

  const noTimes = Array.isArray(times) && times.length === 0;

  const handleSubmit = () => {
    if (!selectedCustomer) { toast.error('Selecciona un cliente'); return; }
    if (!serviceId)         { toast.error('Selecciona un servicio'); return; }
    if (!time)              { toast.error('Selecciona una hora'); return; }

    const dateIso = date.toISOString().slice(0, 10);
    const startAt = new Date(`${dateIso}T${time}:00`).toISOString();

    startTransition(async () => {
      const res = await createInternalAppointmentAction({
        customerId:   selectedCustomer.id,
        serviceId,
        startAt,
        guestComment: notes.trim() || null,
      });
      if (res.status === 'success') {
        toast.success(res.message ?? 'Cita creada');
        onClose();
      } else if (res.status === 'error') {
        toast.error(res.message);
      }
    });
  };

  return (
    <div className="space-y-4">
      <div>
        <h2 className="font-cormorant text-lg font-semibold text-stone-800">Nueva Cita Manual</h2>
        <p className="text-xs text-stone-400 mt-0.5">
          {date.toLocaleDateString(locale, { weekday: 'long', day: 'numeric', month: 'long' })}
        </p>
      </div>

      <Field label="Cliente">
        <ClientSearchField value={selectedCustomer} onChange={onCustomerChange} onAddNew={onAddClient} />
      </Field>

      <Field label="Servicio">
        <div className="relative">
          <Scissors size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400 pointer-events-none" />
          <select value={serviceId} onChange={(e) => handleServiceChange(e.target.value)}
            disabled={services.status === 'loading'}
            className="input-editorial w-full pl-8 text-sm appearance-none bg-transparent disabled:opacity-50">
            <option value="">{services.status === 'loading' ? 'Cargando servicios...' : 'Seleccionar servicio...'}</option>
            {services.status === 'ready' && services.data.map((s) => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
        </div>
        {services.status === 'error' && <p className="mt-1 text-xs text-red-500">Error al cargar servicios</p>}
      </Field>

      <div className="grid grid-cols-2 gap-3">
        <Field label="Hora inicio">
          <Select.Root value={time} onValueChange={setTime} disabled={times === null}>
            <Select.Trigger className="input-editorial w-full text-sm flex items-center justify-between disabled:opacity-50">
              <span className="flex items-center gap-2 min-w-0">
                <Clock size={14} className="text-stone-400 flex-shrink-0" />
                <Select.Value placeholder={times === null ? 'Cargando horarios...' : 'Seleccionar hora'} />
              </span>
              <Select.Icon><ChevronDown size={14} className="text-stone-400 flex-shrink-0" /></Select.Icon>
            </Select.Trigger>
            <Select.Portal>
              <Select.Content className="bg-white rounded-lg border border-stone-200 shadow-xl z-[60] overflow-hidden" position="popper" sideOffset={4}>
                <Select.Viewport className="p-1">
                  {(times ?? []).map((t) => (
                    <Select.Item key={t} value={t} className="flex items-center gap-2 px-3 py-2 text-sm rounded-md cursor-pointer hover:bg-stone-50 outline-none data-[highlighted]:bg-stone-50">
                      <Select.ItemIndicator><Check size={12} className="text-[#D4AF37]" /></Select.ItemIndicator>
                      <Select.ItemText>{t}</Select.ItemText>
                    </Select.Item>
                  ))}
                </Select.Viewport>
              </Select.Content>
            </Select.Portal>
          </Select.Root>
          {noTimes && <p className="mt-1 text-xs text-amber-600">Sin horarios disponibles para este día</p>}
        </Field>

        <Field label="Duración">
          <div className="relative">
            <Calendar size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400 pointer-events-none" />
            <input type="text" value={duration} readOnly placeholder="— min"
              className="input-editorial w-full pl-8 text-sm" />
          </div>
        </Field>
      </div>

      <Field label="Nota interna">
        <textarea rows={2} value={notes} onChange={(e) => setNotes(e.target.value)}
          placeholder="Opcional..." className="input-editorial w-full resize-none text-sm" />
      </Field>

      <button type="button" onClick={handleSubmit} disabled={noTimes || pending}
        className="w-full py-3 rounded-xl bg-stone-900 text-white text-sm font-medium hover:bg-stone-800 active:scale-[0.98] transition-all disabled:opacity-50">
        {pending ? 'Guardando…' : 'Confirmar Cita'}
      </button>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-[11px] font-medium text-stone-500 uppercase tracking-wide mb-1.5">{label}</label>
      {children}
    </div>
  );
}
