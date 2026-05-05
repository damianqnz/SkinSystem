'use client';

import { useState, useTransition } from 'react';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { updateLocationAction } from '../actions';
import { useSettingsT } from '../../_i18n';

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
  { code: 'EUR', symbol: '€', name: 'Euro'          },
  { code: 'USD', symbol: '$', name: 'US Dollar'      },
  { code: 'GBP', symbol: '£', name: 'British Pound'  },
  { code: 'BRL', symbol: 'R$', name: 'Brazilian Real' },
  { code: 'MXN', symbol: '$', name: 'Mexican Peso'   },
] as const;

const TIMEZONES = [
  'Europe/Lisbon',
  'Europe/Madrid',
  'Europe/London',
  'America/Sao_Paulo',
] as const;

export function LocationSection({ initial }: Props) {
  const t = useSettingsT().location;
  const [values, setValues] = useState({
    address:         initial.address         || '',
    city:            initial.city            || '',
    state:           initial.state           || '',
    postalCode:      initial.postalCode      || '',
    country:         initial.country         || '',
    defaultCurrency: initial.defaultCurrency || 'EUR',
    timezone:        initial.timezone        || 'Europe/Lisbon',
  });
  const [isPending, startTransition] = useTransition();

  function handleChange(field: keyof typeof values, value: string) {
    setValues((prev) => ({ ...prev, [field]: value }));
  }

  function handleSave() {
    startTransition(async () => {
      const result = await updateLocationAction({
        address:         values.address      || null,
        city:            values.city         || null,
        state:           values.state        || null,
        postalCode:      values.postalCode   || null,
        country:         values.country      || null,
        defaultCurrency: values.defaultCurrency,
        timezone:        values.timezone,
      });
      if (result.error) { toast.error(result.error.message); }
      else { toast.success(t.successSave); notifyPreview(); }
    });
  }

  const fieldCls = 'w-full border border-stone-200 rounded-xl px-3 py-2.5 text-sm text-stone-800 focus:outline-none focus:border-amber-300 focus:ring-1 focus:ring-amber-200 transition-colors';
  const labelCls = 'block text-xs font-medium text-stone-700 mb-2';

  return (
    <section id="localizacao" className="bg-white rounded-2xl border border-stone-100 shadow-sm p-6">
      <h2 className="text-xs font-medium text-stone-400 uppercase tracking-widest mb-2">{t.sectionTitle}</h2>
      <p className="text-sm text-stone-500 mb-6">{t.sectionDesc}</p>

      <div className="mb-4">
        <label className={labelCls}>{t.address}</label>
        <input type="text" value={values.address} onChange={e => handleChange('address', e.target.value)}
          placeholder={t.addressPlaceholder} className={fieldCls} />
      </div>

      <div className="grid grid-cols-2 gap-4 mb-4">
        <div>
          <label className={labelCls}>{t.city}</label>
          <input type="text" value={values.city} onChange={e => handleChange('city', e.target.value)}
            placeholder={t.cityPlaceholder} className={fieldCls} />
        </div>
        <div>
          <label className={labelCls}>{t.state}</label>
          <input type="text" value={values.state} onChange={e => handleChange('state', e.target.value)}
            placeholder={t.cityPlaceholder} className={fieldCls} />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-4">
        <div>
          <label className={labelCls}>{t.postalCode}</label>
          <input type="text" value={values.postalCode} onChange={e => handleChange('postalCode', e.target.value)}
            placeholder={t.postalPlaceholder} className={fieldCls} />
        </div>
        <div>
          <label className={labelCls}>{t.country}</label>
          <input type="text" value={values.country} onChange={e => handleChange('country', e.target.value)}
            placeholder={t.countryPlaceholder} className={fieldCls} />
        </div>
      </div>

      <div className="mb-2">
        <label className={labelCls}>{t.currency}</label>
        <select value={values.defaultCurrency} onChange={e => handleChange('defaultCurrency', e.target.value)} className={fieldCls}>
          {CURRENCIES.map(c => <option key={c.code} value={c.code}>{c.symbol} {c.code} - {c.name}</option>)}
        </select>
      </div>

      <div className="mb-4 p-3 rounded-xl bg-amber-50 border border-amber-200">
        <p className="text-xs text-amber-700">{t.currencyWarning}</p>
      </div>

      <div className="mb-6">
        <label className={labelCls}>{t.timezone}</label>
        <select value={values.timezone} onChange={e => handleChange('timezone', e.target.value)} className={fieldCls}>
          {TIMEZONES.map(tz => <option key={tz} value={tz}>{tz}</option>)}
        </select>
      </div>

      <button onClick={handleSave} disabled={isPending}
        className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-stone-900 text-white text-sm font-medium hover:bg-stone-800 disabled:opacity-60 transition-colors">
        {isPending && <Loader2 size={16} className="animate-spin" />}
        {t.save}
      </button>
    </section>
  );
}
