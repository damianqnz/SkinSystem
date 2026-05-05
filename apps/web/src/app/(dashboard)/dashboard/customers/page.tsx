import { headers } from 'next/headers';

const EMPTY_STATE = {
  pt: { heading: 'Seleciona um cliente',  body: 'Escolhe um cliente da lista para ver o seu perfil, historial e marcações.' },
  es: { heading: 'Selecciona un cliente', body: 'Elige un cliente de la lista para ver su perfil, historial y citas.'       },
  en: { heading: 'Select a client',       body: 'Choose a client from the list to view their profile, history and appointments.' },
} as const;

export default async function CustomersPage() {
  const hdrs   = await headers();
  const locale = hdrs.get('x-locale') ?? 'es';
  const t      = EMPTY_STATE[(locale as keyof typeof EMPTY_STATE)] ?? EMPTY_STATE['es'];

  return (
    <div className="flex flex-col items-center justify-center h-full min-h-[60vh] px-8 text-center">
      <div className="space-y-3 max-w-xs">
        <div className="w-2 h-2 rounded-full bg-[#D4AF37] mx-auto" />
        <h2 className="font-serif text-2xl font-light text-stone-700">{t.heading}</h2>
        <p className="font-sans text-sm text-stone-400 leading-relaxed">{t.body}</p>
      </div>
    </div>
  );
}
