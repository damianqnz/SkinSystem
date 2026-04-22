'use client';

import { useState, useTransition } from 'react';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { updateLocationAction } from '../actions';

function notifyPreview() {
  if (typeof window !== 'undefined')
    window.dispatchEvent(new CustomEvent('skinsystem:settings-saved'));
}

interface Props {
  initial: {
    address: string | null;
    city: string | null;
    state: string | null;
    postalCode: string | null;
    country: string | null;
    defaultCurrency: string;
    timezone: string;
  };
}

const CURRENCIES = [
  { code: 'EUR', symbol: '€', name: 'Euro' },
  { code: 'USD', symbol: '$', name: 'US Dollar' },
  { code: 'GBP', symbol: '£', name: 'British Pound' },
  { code: 'BRL', symbol: 'R$', name: 'Brazilian Real' },
  { code: 'MXN', symbol: '$', name: 'Mexican Peso' },
] as const;

const TIMEZONES = [
  'Europe/Lisbon',
  'Europe/Madrid',
  'Europe/London',
  'America/Sao_Paulo',
] as const;

export function LocationSection({ initial }: Props) {
  const [values, setValues] = useState({
    address: initial.address || '',
    city: initial.city || '',
    state: initial.state || '',
    postalCode: initial.postalCode || '',
    country: initial.country || '',
    defaultCurrency: initial.defaultCurrency || 'EUR',
    timezone: initial.timezone || 'Europe/Lisbon',
  });

  const [isPending, startTransition] = useTransition();

  const handleChange = (
    field: keyof typeof values,
    value: string
  ) => {
    setValues((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = () => {
    startTransition(async () => {
      const result = await updateLocationAction({
        address: values.address || null,
        city: values.city || null,
        state: values.state || null,
        postalCode: values.postalCode || null,
        country: values.country || null,
        defaultCurrency: values.defaultCurrency,
        timezone: values.timezone,
      });

      if (result.error) {
        toast.error(result.error.message);
      } else {
        toast.success('Localização atualizada com sucesso');
        notifyPreview();
      }
    });
  };

  return (
    <section id="localizacao" className="bg-white rounded-2xl border border-stone-100 shadow-sm p-6">
      <h2 className="text-xs font-medium text-stone-400 uppercase tracking-widest mb-2">
        Localização
      </h2>
      <p className="text-sm text-stone-500 mb-6">
        Forneça o seu endereço comercial para listar na sua página de reservas.
      </p>

      {/* Address Field */}
      <div className="mb-4">
        <label className="block text-xs font-medium text-stone-700 mb-2">
          Endereço
        </label>
        <input
          type="text"
          value={values.address}
          onChange={(e) => handleChange('address', e.target.value)}
          placeholder="Rua exemplo, 123"
          className="w-full border border-stone-200 rounded-xl px-3 py-2.5 text-sm text-stone-800 focus:outline-none focus:border-amber-300 focus:ring-1 focus:ring-amber-200 transition-colors"
        />
      </div>

      {/* City & State Row */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div>
          <label className="block text-xs font-medium text-stone-700 mb-2">
            Cidade
          </label>
          <input
            type="text"
            value={values.city}
            onChange={(e) => handleChange('city', e.target.value)}
            placeholder="Lisboa"
            className="w-full border border-stone-200 rounded-xl px-3 py-2.5 text-sm text-stone-800 focus:outline-none focus:border-amber-300 focus:ring-1 focus:ring-amber-200 transition-colors"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-stone-700 mb-2">
            Estado
          </label>
          <input
            type="text"
            value={values.state}
            onChange={(e) => handleChange('state', e.target.value)}
            placeholder="Lisboa"
            className="w-full border border-stone-200 rounded-xl px-3 py-2.5 text-sm text-stone-800 focus:outline-none focus:border-amber-300 focus:ring-1 focus:ring-amber-200 transition-colors"
          />
        </div>
      </div>

      {/* Postal Code & Country Row */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div>
          <label className="block text-xs font-medium text-stone-700 mb-2">
            CEP
          </label>
          <input
            type="text"
            value={values.postalCode}
            onChange={(e) => handleChange('postalCode', e.target.value)}
            placeholder="1000-000"
            className="w-full border border-stone-200 rounded-xl px-3 py-2.5 text-sm text-stone-800 focus:outline-none focus:border-amber-300 focus:ring-1 focus:ring-amber-200 transition-colors"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-stone-700 mb-2">
            País
          </label>
          <input
            type="text"
            value={values.country}
            onChange={(e) => handleChange('country', e.target.value)}
            placeholder="Portugal"
            className="w-full border border-stone-200 rounded-xl px-3 py-2.5 text-sm text-stone-800 focus:outline-none focus:border-amber-300 focus:ring-1 focus:ring-amber-200 transition-colors"
          />
        </div>
      </div>

      {/* Currency */}
      <div className="mb-2">
        <label className="block text-xs font-medium text-stone-700 mb-2">
          Moeda
        </label>
        <select
          value={values.defaultCurrency}
          onChange={(e) => handleChange('defaultCurrency', e.target.value)}
          className="w-full border border-stone-200 rounded-xl px-3 py-2.5 text-sm text-stone-800 focus:outline-none focus:border-amber-300 focus:ring-1 focus:ring-amber-200 transition-colors"
        >
          {CURRENCIES.map((currency) => (
            <option key={currency.code} value={currency.code}>
              {currency.symbol} {currency.code} - {currency.name}
            </option>
          ))}
        </select>
      </div>

      {/* Currency Warning */}
      <div className="mb-4 p-3 rounded-xl bg-amber-50 border border-amber-200">
        <p className="text-xs text-amber-700">
          Desconecte o seu provedor de pagamentos para alterar a moeda. Reconecte-o quando terminar.
        </p>
      </div>

      {/* Timezone */}
      <div className="mb-6">
        <label className="block text-xs font-medium text-stone-700 mb-2">
          Fuso horário
        </label>
        <select
          value={values.timezone}
          onChange={(e) => handleChange('timezone', e.target.value)}
          className="w-full border border-stone-200 rounded-xl px-3 py-2.5 text-sm text-stone-800 focus:outline-none focus:border-amber-300 focus:ring-1 focus:ring-amber-200 transition-colors"
        >
          {TIMEZONES.map((tz) => (
            <option key={tz} value={tz}>
              {tz}
            </option>
          ))}
        </select>
      </div>

      {/* Save Button */}
      <button
        onClick={handleSave}
        disabled={isPending}
        className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-stone-900 text-white text-sm font-medium hover:bg-stone-800 disabled:opacity-60 transition-colors"
      >
        {isPending && <Loader2 size={16} className="animate-spin" />}
        Guardar
      </button>
    </section>
  );
}
