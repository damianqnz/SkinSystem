'use client';

import { useState } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { X, FileSpreadsheet } from 'lucide-react';
import { CSVUploadStep } from './CSVUploadStep';

interface Props { open: boolean; onClose: () => void; locale: string; }

const T = {
  es: { title: '¿Vamos a importar tus clientes?',        subtitle: 'Elige cómo quieres importar tu lista de contactos.',        google: 'Google Contacts', googleDesc: 'Importa directamente sin límites',         comingSoon: 'Próximamente', csv: 'Archivo CSV',    csvDesc: 'Sube un archivo .csv (máx. 3 MB)'    },
  pt: { title: 'Vamos importar os seus clientes?',        subtitle: 'Escolha como quer importar a sua lista de contactos.',     google: 'Google Contacts', googleDesc: 'Importe diretamente sem limites',         comingSoon: 'Em breve',     csv: 'Ficheiro CSV',   csvDesc: 'Carregue um ficheiro .csv (máx. 3 MB)' },
  en: { title: "Let's import your clients",               subtitle: 'Choose how you want to import your contact list.',         google: 'Google Contacts', googleDesc: 'Import directly with no limits',          comingSoon: 'Coming soon',  csv: 'CSV File',       csvDesc: 'Upload a .csv file (max 3 MB)'         },
};

function GoogleIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" className="shrink-0 mt-0.5" aria-hidden>
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
    </svg>
  );
}

export function ImportCustomersModal({ open, onClose, locale }: Props) {
  const [step, setStep] = useState<'choose' | 'csv'>('choose');
  const t = T[locale as keyof typeof T] ?? T.es;

  function handleClose() { setStep('choose'); onClose(); }

  return (
    <Dialog.Root open={open} onOpenChange={(v) => { if (!v) handleClose(); }}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/25 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-full max-w-[440px] -translate-x-1/2 -translate-y-1/2 bg-white rounded-2xl shadow-2xl p-6 focus:outline-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 duration-200">

          <button onClick={handleClose} className="absolute top-4 right-4 p-1.5 rounded-lg hover:bg-stone-100 text-stone-400 transition-colors" aria-label="Cerrar">
            <X size={15} strokeWidth={1.5} />
          </button>

          {step === 'choose' && (
            <>
              <Dialog.Title className="font-serif text-2xl font-light text-stone-900 leading-snug pr-8 mb-1">{t.title}</Dialog.Title>
              <Dialog.Description className="font-sans text-sm text-stone-500 mb-5">{t.subtitle}</Dialog.Description>

              {/* Google Contacts — stub */}
              <button disabled className="relative w-full min-h-[80px] flex items-start gap-4 p-4 mb-3 rounded-sm border border-stone-200 text-left opacity-60 cursor-not-allowed">
                <GoogleIcon />
                <div className="flex-1 min-w-0">
                  <p className="font-sans text-sm font-medium text-stone-800">{t.google}</p>
                  <p className="font-sans text-xs text-stone-400 mt-0.5">{t.googleDesc}</p>
                </div>
                <span className="shrink-0 px-2 py-0.5 rounded-sm bg-amber-100 text-amber-700 font-sans text-[10px] uppercase tracking-wide">
                  {t.comingSoon}
                </span>
              </button>

              {/* CSV */}
              <button onClick={() => setStep('csv')}
                className="w-full min-h-[80px] flex items-start gap-4 p-4 rounded-sm border border-stone-200 hover:border-stone-400 hover:bg-stone-50/50 text-left transition-colors">
                <FileSpreadsheet size={22} strokeWidth={1.5} className="text-stone-500 mt-0.5 shrink-0" />
                <div>
                  <p className="font-sans text-sm font-medium text-stone-800">{t.csv}</p>
                  <p className="font-sans text-xs text-stone-400 mt-0.5">{t.csvDesc}</p>
                </div>
              </button>
            </>
          )}

          {step === 'csv' && (
            <CSVUploadStep locale={locale} onBack={() => setStep('choose')} onClose={handleClose} />
          )}

        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
