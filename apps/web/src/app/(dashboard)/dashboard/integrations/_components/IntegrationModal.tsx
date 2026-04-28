'use client';

import * as Dialog from '@radix-ui/react-dialog';
import * as Tabs   from '@radix-ui/react-tabs';
import { X, ExternalLink, BookOpen, MessageCircle, Phone, ArrowRight, Check, Loader2 } from 'lucide-react';
import { useActionState, useEffect, startTransition } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { IntegrationLogo } from './IntegrationLogos';
import { createStripeConnectAccount } from '../../settings/actions';
import type { StripeConnectState } from '../../settings/actions';
import type { Integration } from './integrations-data';

interface IntegrationModalProps {
  integration:    Integration | null;
  connected:      boolean;
  onClose:        () => void;
}

const IDLE: StripeConnectState = { status: 'idle' };

export function IntegrationModal({ integration, connected, onClose }: IntegrationModalProps) {
  const router = useRouter();

  const [stripeState, stripeDispatch, stripePending] =
    useActionState<StripeConnectState, unknown>(createStripeConnectAccount, IDLE);

  useEffect(() => {
    if (stripeState.status === 'redirect') router.push(stripeState.url);
    if (stripeState.status === 'error')    toast.error(stripeState.message);
  }, [stripeState, router]);

  if (!integration) return null;

  const isStripe = integration.id === 'stripe';

  function handleConnect() {
    if (isStripe) {
      startTransition(() => {
        (stripeDispatch as (p: unknown) => void)({ returnPath: '/dashboard/integrations' });
      });
      return;
    }
    toast.info('Esta integração estará disponível em breve.');
  }

  return (
    <Dialog.Root open={!!integration} onOpenChange={(open) => { if (!open) onClose(); }}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/40 backdrop-blur-[2px] data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=open]:fade-in-0 data-[state=closed]:fade-out-0" />

        <Dialog.Content className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
          <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl overflow-hidden
                          data-[state=open]:animate-in data-[state=closed]:animate-out
                          data-[state=open]:zoom-in-95 data-[state=closed]:zoom-out-95
                          data-[state=open]:fade-in-0 data-[state=closed]:fade-out-0">

            {/* Close */}
            <Dialog.Close className="absolute top-4 right-4 z-10 p-1.5 rounded-lg text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition-colors">
              <X size={16} />
            </Dialog.Close>

            {/* Header */}
            <div className="flex items-start gap-4 px-6 pt-6 pb-4 border-b border-stone-100">
              <IntegrationLogo id={integration.id} size="lg" />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <Dialog.Title className="font-cormorant text-xl font-semibold text-stone-900">
                    {integration.name}
                  </Dialog.Title>
                  {connected && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-medium">
                      <Check size={10} />
                      Conectado
                    </span>
                  )}
                  {integration.comingSoon && !connected && (
                    <span className="px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 text-[10px] font-medium">
                      Em breve
                    </span>
                  )}
                </div>
                <Dialog.Description className="text-sm text-stone-500 mt-0.5 leading-relaxed">
                  {integration.tagline}
                </Dialog.Description>
              </div>
            </div>

            {/* Body — two columns */}
            <div className="flex gap-0 min-h-[280px]">
              {/* Left: tabs */}
              <Tabs.Root defaultValue="sobre" className="flex-1 min-w-0 flex flex-col">
                <Tabs.List className="flex gap-0 border-b border-stone-100 px-6">
                  {(['sobre', 'instrucoes'] as const).map((tab) => (
                    <Tabs.Trigger
                      key={tab}
                      value={tab}
                      className="pb-3 pt-4 px-1 mr-6 text-sm text-stone-400 border-b-2 border-transparent
                                 data-[state=active]:text-stone-800 data-[state=active]:border-stone-800
                                 transition-colors font-outfit"
                    >
                      {tab === 'sobre' ? 'Sobre' : 'Instruções'}
                    </Tabs.Trigger>
                  ))}
                </Tabs.List>

                <Tabs.Content value="sobre" className="flex-1 px-6 py-5">
                  <ul className="space-y-3">
                    {integration.about.map((item, i) => (
                      <li key={i} className="flex items-start gap-2.5 text-sm text-stone-600 leading-relaxed">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-400 flex-shrink-0 mt-1.5" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </Tabs.Content>

                <Tabs.Content value="instrucoes" className="flex-1 px-6 py-5">
                  <ol className="space-y-3">
                    {integration.instructions.map((step, i) => (
                      <li key={i} className="flex items-start gap-3 text-sm text-stone-600 leading-relaxed">
                        <span className="w-5 h-5 rounded-full bg-stone-100 text-stone-500 text-[11px] font-medium flex items-center justify-center flex-shrink-0 mt-0.5">
                          {i + 1}
                        </span>
                        {step}
                      </li>
                    ))}
                  </ol>
                </Tabs.Content>
              </Tabs.Root>

              {/* Right: action panel */}
              <div className="w-44 flex-shrink-0 border-l border-stone-100 px-5 py-5 flex flex-col gap-5">
                {/* Connect / Connected button */}
                {connected ? (
                  <div className="flex flex-col gap-2">
                    <span className="inline-flex items-center justify-center gap-1.5 w-full px-3 py-2.5 rounded-xl bg-emerald-50 text-emerald-700 text-xs font-medium">
                      <Check size={12} />
                      Conectado
                    </span>
                    {isStripe && (
                      <a
                        href="https://dashboard.stripe.com"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center justify-center gap-1.5 w-full px-3 py-2 rounded-xl border border-stone-200 text-xs text-stone-500 hover:bg-stone-50 transition-colors"
                      >
                        <ExternalLink size={11} />
                        Dashboard
                      </a>
                    )}
                  </div>
                ) : (
                  <button
                    onClick={handleConnect}
                    disabled={stripePending}
                    className="inline-flex items-center justify-center gap-1.5 w-full px-3 py-2.5 rounded-xl
                               bg-stone-900 text-white text-xs font-medium
                               hover:bg-stone-800 disabled:opacity-60 transition-colors"
                  >
                    {stripePending
                      ? <Loader2 size={12} className="animate-spin" />
                      : <><span>Conectar</span><ArrowRight size={11} /></>
                    }
                  </button>
                )}

                {/* Support links */}
                <div className="space-y-1">
                  <p className="text-[10px] font-medium text-stone-400 uppercase tracking-wider mb-2">
                    Tens uma questão?
                  </p>
                  {integration.docsUrl && (
                    <a href={integration.docsUrl} target="_blank" rel="noopener noreferrer"
                       className="flex items-center gap-2 text-xs text-stone-500 hover:text-stone-800 transition-colors py-1">
                      <BookOpen size={12} className="text-stone-400" />
                      Documentação
                    </a>
                  )}
                  <a href="mailto:suporte@skinsystem.pt"
                     className="flex items-center gap-2 text-xs text-stone-500 hover:text-stone-800 transition-colors py-1">
                    <MessageCircle size={12} className="text-stone-400" />
                    Fale connosco
                  </a>
                  <a href="tel:+351000000000"
                     className="flex items-center gap-2 text-xs text-stone-500 hover:text-stone-800 transition-colors py-1">
                    <Phone size={12} className="text-stone-400" />
                    Ligue-nos
                  </a>
                </div>
              </div>
            </div>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
