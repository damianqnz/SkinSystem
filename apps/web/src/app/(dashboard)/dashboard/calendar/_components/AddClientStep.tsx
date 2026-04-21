'use client';

import { useActionState, useEffect } from 'react';
import { ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';
import { createCustomerAction } from '../actions/create-customer';
import type { CreateCustomerState, CreatedCustomer } from '../actions/create-customer';

interface Props {
  onBack:          () => void;
  onClientCreated: (c: CreatedCustomer) => void;
}

const INIT: CreateCustomerState = { status: 'idle' };

export function AddClientStep({ onBack, onClientCreated }: Props) {
  const [state, formAction, isPending] = useActionState<CreateCustomerState, FormData>(
    createCustomerAction,
    INIT,
  );

  useEffect(() => {
    if (state.status === 'success') {
      toast.success('Cliente agregado');
      onClientCreated(state.data);
    }
  }, [state, onClientCreated]);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button type="button" onClick={onBack}
          className="p-1.5 rounded-lg hover:bg-stone-100 transition-colors text-stone-400"
          aria-label="Volver">
          <ArrowLeft size={16} />
        </button>
        <h2 className="font-cormorant text-lg font-semibold text-stone-800">Nuevo cliente</h2>
      </div>

      <form action={formAction} className="space-y-4">
        <FieldInput name="fullName" label="Nombre completo" placeholder="Ej. Ana García" required />
        <FieldInput name="phone"    label="Teléfono"         placeholder="+34 600 000 000" type="tel" />
        <FieldInput name="email"    label="Email"            placeholder="ana@ejemplo.com" type="email" />

        {state.status === 'error' && (
          <p className="text-xs text-red-500 bg-red-50 rounded-md px-3 py-2">{state.message}</p>
        )}

        <button type="submit" disabled={isPending}
          className="w-full py-3 rounded-xl bg-stone-900 text-white text-sm font-medium hover:bg-stone-800 active:scale-[0.98] transition-all disabled:opacity-60">
          {isPending ? '...' : 'Guardar cliente'}
        </button>
      </form>
    </div>
  );
}

function FieldInput({ name, label, placeholder, type = 'text', required }: {
  name: string; label: string; placeholder?: string; type?: string; required?: boolean;
}) {
  return (
    <div>
      <label className="block text-[11px] font-medium text-stone-500 uppercase tracking-wide mb-1.5">
        {label}{required && <span className="ml-0.5 text-[#D4AF37]">*</span>}
      </label>
      <input name={name} type={type} placeholder={placeholder} required={required}
        className="input-editorial w-full text-sm" />
    </div>
  );
}
