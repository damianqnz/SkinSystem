'use client';

import { useEffect, useRef, useActionState, startTransition } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CheckCircle2, AlertCircle, ExternalLink,
  Loader2, RefreshCw, ArrowRight,
} from 'lucide-react';
import { toast } from 'sonner';
import {
  createStripeConnectAccount,
  refreshStripeOnboardingLink,
} from '../actions';
import type { StripeConnectState } from '../actions';

// ── Stripe wordmark (monochrome SVG) ──────────────────────────
// Official Stripe wordmark, rendered in stone color
function StripeLogo({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 60 25"
      fill="currentColor"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-label="Stripe"
    >
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M5.45 9.43c0-.79.65-1.09 1.72-1.09 1.54 0 3.48.47 5.02 1.3V5.27C10.6 4.63 9.04 4.4 7.17 4.4 3.07 4.4.49 6.55.49 9.63c0 4.79 6.6 4.02 6.6 6.08 0 .93-.81 1.24-1.94 1.24-1.68 0-3.84-.69-5.54-1.62v4.44c1.88.81 3.79 1.15 5.54 1.15C8.53 20.92 12 19 12 15.47c-.01-5.17-6.55-4.25-6.55-6.04zm15.79-4.68l-3.91.83v2.83l-1.6.34v3.11l1.6-.34v5.71c0 2.9 1.54 3.97 3.86 3.97 1.06 0 2.05-.2 2.87-.55v-3.3a6.03 6.03 0 01-1.48.18c-.62 0-1.34-.18-1.34-1.33V11.52l2.82-.6V7.8l-2.82.6V4.75zm9.88 1.93l-.24-1.36h-3.56v15.3h3.98V9.68c.94-1.23 2.52-1.01 3.03-.83V5.32c-.54-.19-2.52-.54-3.21 1.36zm4.63-1.36h4v15.3h-4V5.32zm2-4.27c-1.26 0-2.29 1.03-2.29 2.3 0 1.26 1.03 2.29 2.29 2.29 1.27 0 2.3-1.03 2.3-2.29 0-1.27-1.03-2.3-2.3-2.3zm11.36 4.27l-3.91.83v2.83l-1.6.34v3.11l1.6-.34v5.71c0 2.9 1.54 3.97 3.86 3.97 1.06 0 2.05-.2 2.87-.55v-3.3a6.03 6.03 0 01-1.48.18c-.62 0-1.34-.18-1.34-1.33V11.52l2.82-.6V7.8l-2.82.6V5.32z"
      />
    </svg>
  );
}

// ── Props ─────────────────────────────────────────────────────

interface StripeConnectCardProps {
  stripeAccountId:  string | null;
  stripeOnboarded:  boolean;
  /** Passed via URL search param after redirect back from Stripe */
  stripeParam?:     string | null;
}

const IDLE: StripeConnectState = { status: 'idle' };

const EASE: [number, number, number, number] = [0.25, 0.46, 0.45, 0.94];

// ── Redirecting overlay ───────────────────────────────────────

function RedirectingOverlay() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.18 }}
      role="status"
      aria-live="polite"
      className="fixed inset-0 z-50 bg-stone-950/70 backdrop-blur-md flex items-center justify-center px-6"
    >
      <motion.div
        initial={{ scale: 0.96, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.96, opacity: 0 }}
        transition={{ duration: 0.22, ease: EASE }}
        className="text-center max-w-sm"
      >
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-white/10 ring-1 ring-white/20 mb-5">
          <Loader2 size={28} className="animate-spin text-white" />
        </div>
        <h3 className="font-cormorant text-2xl text-white font-semibold">
          Te estamos llevando a Stripe
        </h3>
        <p className="text-sm text-white/60 mt-2 leading-relaxed">
          Conexión segura con la pasarela de pagos…
        </p>
      </motion.div>
    </motion.div>
  );
}

export function StripeConnectCard({
  stripeAccountId,
  stripeOnboarded,
  stripeParam,
}: StripeConnectCardProps) {
  const router = useRouter();

  const isConnected = stripeOnboarded && !!stripeAccountId;
  const isPending   = !!stripeAccountId && !stripeOnboarded;

  const pollingStarted = useRef(false);

  // On return from Stripe: refresh immediately + poll until webhook confirms
  useEffect(() => {
    if (stripeParam === 'refresh') {
      toast.info('El enlace de onboarding expiró. Genera uno nuevo.');
      return;
    }
    if (stripeParam !== 'success') return;
    if (isConnected) {
      toast.success('¡Stripe conectado con éxito! Los pagos están activos.');
      router.replace('/dashboard/settings/brand');
      return;
    }
    if (pollingStarted.current) return;
    pollingStarted.current = true;

    toast.info('Confirmando verificación con Stripe…');
    router.refresh();

    const timers = [1500, 3500, 7000].map((ms) => setTimeout(() => router.refresh(), ms));
    return () => timers.forEach(clearTimeout);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // mount-only: stripeParam is URL-derived and won't change

  // ── Connect action ─────────────────────────────────────────
  const [connectState, connectDispatch, connectPending] =
    useActionState<StripeConnectState, unknown>(createStripeConnectAccount, IDLE);

  // ── Refresh action ─────────────────────────────────────────
  const [refreshState, refreshDispatch, refreshPending] =
    useActionState<StripeConnectState, unknown>(refreshStripeOnboardingLink, IDLE);

  // Handle redirects from actions
  useEffect(() => {
    if (connectState.status === 'redirect') router.push(connectState.url);
    if (connectState.status === 'error')    toast.error(connectState.message);
  }, [connectState]);

  useEffect(() => {
    if (refreshState.status === 'redirect') router.push(refreshState.url);
    if (refreshState.status === 'error')    toast.error(refreshState.message);
  }, [refreshState]);

  const isRedirecting =
    connectPending || refreshPending ||
    connectState.status === 'redirect' ||
    refreshState.status === 'redirect';

  return (
    <>
    <AnimatePresence>{isRedirecting && <RedirectingOverlay />}</AnimatePresence>
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.28, ease: EASE }}
      className="bg-white rounded-2xl border border-stone-100 shadow-sm overflow-hidden"
    >
      {/* Header */}
      <div className="flex items-start justify-between px-6 py-5 border-b border-stone-50">
        <div className="flex items-center gap-4">
          {/* Stripe logo — monochrome */}
          <div className="w-12 h-12 rounded-xl bg-stone-900 flex items-center justify-center flex-shrink-0">
            <StripeLogo className="w-8 text-white" />
          </div>
          <div>
            <h3 className="font-cormorant text-[17px] font-semibold text-stone-800">
              Stripe Connect
            </h3>
            <p className="text-xs text-stone-400 mt-0.5">Plataforma de pagos · Connect Standard</p>
          </div>
        </div>

        {/* Status badge */}
        <StatusBadge connected={isConnected} pending={isPending} />
      </div>

      {/* Body */}
      <div className="px-6 py-5">
        {isConnected ? (
          <ConnectedState accountId={stripeAccountId!} />
        ) : isPending ? (
          <PendingState
            onRefresh={() => startTransition(() =>
              (refreshDispatch as (p: unknown) => void)({ returnPath: '/dashboard/settings' })
            )}
            isPending={refreshPending}
          />
        ) : (
          <DisconnectedState
            onConnect={() => startTransition(() =>
              (connectDispatch as (p: unknown) => void)({ returnPath: '/dashboard/settings' })
            )}
            isPending={connectPending}
          />
        )}
      </div>

      {/* Footer — info strip */}
      <div className="px-6 py-3 bg-stone-50/60 border-t border-stone-100 flex items-center gap-2">
        <span className="text-[10px] text-stone-400 leading-relaxed">
          Los pagos se transfieren directamente a tu cuenta bancaria. SkinSystem cobra una comisión de plataforma del 10%.
        </span>
      </div>
    </motion.div>
    </>
  );
}

// ── Sub-components ────────────────────────────────────────────

function StatusBadge({ connected, pending }: { connected: boolean; pending: boolean }) {
  if (connected) {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 text-[11px] font-medium">
        <CheckCircle2 size={12} />
        Conectado
      </span>
    );
  }
  if (pending) {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 text-[11px] font-medium">
        <AlertCircle size={12} />
        Pendiente
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-stone-100 text-stone-500 text-[11px] font-medium">
      No conectado
    </span>
  );
}

function ConnectedState({ accountId }: { accountId: string }) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <InfoRow label="ID de cuenta" value={`••••${accountId.slice(-6)}`} mono />
        <InfoRow label="Tipo" value="Standard" />
        <InfoRow label="Transferencias" value="Automáticas" />
        <InfoRow label="Moneda" value="EUR" />
      </div>

      <a
        href="https://dashboard.stripe.com"
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-2 text-xs text-stone-500 hover:text-stone-800 transition-colors"
      >
        <ExternalLink size={12} />
        Ver Dashboard de Stripe
      </a>
    </div>
  );
}

function PendingState({
  onRefresh,
  isPending,
}: {
  onRefresh: () => void;
  isPending: boolean;
}) {
  return (
    <div className="space-y-4">
      <p className="text-sm text-stone-500 leading-relaxed">
        Tu cuenta de Stripe fue creada pero el proceso de verificación no se completó.
        Haz clic abajo para continuar donde lo dejaste.
      </p>

      <div className="flex items-center gap-2 p-3 rounded-xl bg-amber-50 border border-amber-100">
        <AlertCircle size={14} className="text-amber-500 flex-shrink-0" />
        <p className="text-xs text-amber-700">
          Completa el onboarding para activar los cobros a clientas.
        </p>
      </div>

      <button
        onClick={onRefresh}
        disabled={isPending}
        className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-stone-200 text-sm text-stone-600 hover:bg-stone-50 disabled:opacity-60 transition-colors"
      >
        {isPending ? <Loader2 size={14} className="animate-spin" /> : <RefreshCw size={14} />}
        Continuar verificación
      </button>
    </div>
  );
}

function DisconnectedState({
  onConnect,
  isPending,
}: {
  onConnect: () => void;
  isPending: boolean;
}) {
  return (
    <div className="space-y-5">
      <p className="text-sm text-stone-500 leading-relaxed">
        Conecta tu cuenta bancaria a través de Stripe para recibir pagos de tus clientas directamente.
        El proceso tarda menos de 5 minutos.
      </p>

      <ul className="space-y-2">
        {[
          'Pagos con tarjeta, Apple Pay y Google Pay',
          'Transferencias automáticas a tu cuenta bancaria',
          'Panel de control de cobros propio',
        ].map((item) => (
          <li key={item} className="flex items-center gap-2 text-xs text-stone-500">
            <span className="w-1 h-1 rounded-full bg-amber-400 flex-shrink-0" />
            {item}
          </li>
        ))}
      </ul>

      <button
        onClick={onConnect}
        disabled={isPending}
        className="group flex items-center gap-2 px-5 py-3 rounded-xl bg-stone-900 text-white text-sm font-medium hover:bg-stone-800 disabled:opacity-60 transition-colors w-full justify-center"
      >
        {isPending ? (
          <Loader2 size={15} className="animate-spin" />
        ) : (
          <>
            <StripeLogo className="w-10 text-white" />
            <span>Conectar con Stripe</span>
            <ArrowRight size={15} className="ml-auto group-hover:translate-x-0.5 transition-transform" />
          </>
        )}
      </button>
    </div>
  );
}

function InfoRow({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div>
      <p className="text-[10px] font-medium text-stone-400 uppercase tracking-wider">{label}</p>
      <p className={['text-sm text-stone-700 mt-0.5', mono ? 'font-mono' : ''].join(' ')}>{value}</p>
    </div>
  );
}
