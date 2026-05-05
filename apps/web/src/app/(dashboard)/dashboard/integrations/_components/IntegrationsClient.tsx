'use client';

import { useState, useMemo, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Search, Check, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { IntegrationLogo }  from './IntegrationLogos';
import { IntegrationModal } from './IntegrationModal';
import {
  INTEGRATIONS,
  INTEGRATIONS_BY_CATEGORY,
  CATEGORY_LABELS,
} from './integrations-data';
import type { Integration, IntegrationCategory } from './integrations-data';

interface IntegrationsClientProps {
  stripeConnected: boolean;
  /** ?stripe=success|refresh query param forwarded from the server page */
  stripeParam?: string | null;
}

function isConnected(id: Integration['id'], stripeConnected: boolean): boolean {
  if (id === 'stripe') return stripeConnected;
  return false;
}

const EASE: [number, number, number, number] = [0.25, 0.46, 0.45, 0.94];

// Delays (ms) between each router.refresh() poll attempt after Stripe return
const POLL_DELAYS = [1500, 3500, 7000] as const;

export function IntegrationsClient({ stripeConnected, stripeParam }: IntegrationsClientProps) {
  const router  = useRouter();
  const [search,   setSearch]   = useState('');
  const [selected, setSelected] = useState<Integration | null>(null);

  // True while we're waiting for the webhook + DB to confirm the connection
  const [confirming, setConfirming] = useState(
    stripeParam === 'success' && !stripeConnected,
  );

  // Guard: only start the polling sequence once per mount
  const pollingStarted = useRef(false);

  // ── Polling logic ────────────────────────────────────────────
  useEffect(() => {
    if (stripeParam !== 'success') return;

    if (stripeConnected) {
      toast.success('¡Stripe conectado con éxito! Los pagos están activos.');
      router.replace('/dashboard/integrations');
      return;
    }

    if (pollingStarted.current) return;
    pollingStarted.current = true;

    toast.info('Confirmando verificación con Stripe…');
    router.refresh(); // immediate first attempt

    const timers = POLL_DELAYS.map((ms) => setTimeout(() => router.refresh(), ms));
    return () => timers.forEach(clearTimeout);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // intentionally mount-only: stripeParam comes from the URL and won't change

  // When a refresh causes stripeConnected to flip true, clear the banner
  useEffect(() => {
    if (!confirming || !stripeConnected) return;
    setConfirming(false);
    toast.success('¡Stripe conectado con éxito! Los pagos están activos.');
    router.replace('/dashboard/integrations');
  }, [stripeConnected, confirming, router]);

  // ── Navigation ───────────────────────────────────────────────
  // Stripe owns its own dedicated route (Parallel + Intercepting).
  // Other integrations use the lightweight in-page modal.
  function openIntegration(integration: Integration) {
    if (integration.id === 'stripe') {
      router.push('/dashboard/integrations/stripe');
      return;
    }
    setSelected(integration);
  }

  // ── Search / filter ──────────────────────────────────────────
  const term = search.trim().toLowerCase();

  const filteredByCategory = useMemo(() => {
    if (!term) return INTEGRATIONS_BY_CATEGORY;
    const out = {} as typeof INTEGRATIONS_BY_CATEGORY;
    (Object.keys(INTEGRATIONS_BY_CATEGORY) as IntegrationCategory[]).forEach((cat) => {
      const filtered = INTEGRATIONS_BY_CATEGORY[cat].filter((i) =>
        i.name.toLowerCase().includes(term) || i.tagline.toLowerCase().includes(term),
      );
      if (filtered.length > 0) out[cat] = filtered;
    });
    return out;
  }, [term]);

  const visibleCategories = Object.keys(filteredByCategory) as IntegrationCategory[];
  const noResults = term.length > 0 && visibleCategories.length === 0;

  return (
    <>
      {/* ── Confirmation banner (post-Stripe return) ────────── */}
      {confirming && (
        <motion.div
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.2, ease: EASE }}
          className="flex items-center gap-3 px-4 py-3 mb-6 rounded-xl
                     bg-amber-50 border border-amber-100 text-sm text-amber-800"
        >
          <Loader2 size={14} className="animate-spin text-amber-500 shrink-0" />
          <span>
            Confirmando verificación con Stripe… esto puede tardar unos segundos.
          </span>
        </motion.div>
      )}

      {/* ── Header ──────────────────────────────────────────── */}
      <div className="flex flex-col gap-4 mb-8 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-cormorant text-2xl font-semibold text-stone-800">Integrações</h1>
          <p className="text-sm text-stone-400 mt-1">
            {INTEGRATIONS.length} aplicações disponíveis
          </p>
        </div>

        <div className="relative">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400 pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Pesquisar aplicações..."
            className="pl-8 pr-3 py-2 rounded-xl border border-stone-200 text-sm text-stone-700
                       placeholder:text-stone-400 bg-white hover:border-stone-300
                       focus:outline-none focus:border-amber-300 focus:ring-1 focus:ring-amber-200
                       transition-colors w-52 sm:w-60"
          />
        </div>
      </div>

      {/* ── No results ──────────────────────────────────────── */}
      {noResults && (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <Search size={28} className="text-stone-300 mb-4" strokeWidth={1} />
          <p className="font-cormorant text-lg font-semibold text-stone-600 mb-1">
            Sem resultados para &ldquo;{search}&rdquo;
          </p>
          <button
            onClick={() => setSearch('')}
            className="mt-3 text-xs text-amber-600 hover:text-amber-700 underline underline-offset-2"
          >
            Limpar pesquisa
          </button>
        </div>
      )}

      {/* ── Integration grid ────────────────────────────────── */}
      <div className="space-y-8">
        {visibleCategories.map((cat) => (
          <section key={cat}>
            <h2 className="text-xs font-medium text-stone-400 uppercase tracking-widest mb-4 px-0.5">
              {CATEGORY_LABELS[cat]}
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {filteredByCategory[cat]?.map((integration, i) => {
                const connected = isConnected(integration.id, stripeConnected);
                return (
                  <motion.button
                    key={integration.id}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.22, ease: EASE, delay: i * 0.04 }}
                    onClick={() => openIntegration(integration)}
                    className="group relative text-left bg-white rounded-2xl border border-stone-100
                               shadow-sm p-5 hover:border-stone-200 hover:shadow-md
                               transition-all duration-150 cursor-pointer"
                  >
                    {connected && (
                      <span className="absolute top-3 right-3 inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-medium">
                        <Check size={10} />
                        Conectado
                      </span>
                    )}

                    <div className="flex items-center gap-3 mb-3">
                      <IntegrationLogo id={integration.id} size="sm" />
                      <div className="min-w-0">
                        <p className="font-cormorant text-[15px] font-semibold text-stone-800 leading-tight truncate">
                          {integration.name}
                        </p>
                        {integration.comingSoon && !connected && (
                          <span className="text-[10px] text-amber-600 font-medium">Em breve</span>
                        )}
                      </div>
                    </div>

                    <p className="text-xs text-stone-500 leading-relaxed line-clamp-2">
                      {integration.tagline}
                    </p>
                  </motion.button>
                );
              })}
            </div>
          </section>
        ))}
      </div>

      {/* ── Modal ───────────────────────────────────────────── */}
      <IntegrationModal
        integration={selected}
        connected={selected ? isConnected(selected.id, stripeConnected) : false}
        onClose={() => setSelected(null)}
      />
    </>
  );
}
