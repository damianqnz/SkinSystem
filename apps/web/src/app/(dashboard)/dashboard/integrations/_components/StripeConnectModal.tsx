import { headers } from 'next/headers';
import { ExternalLink, Check, AlertCircle, ShieldCheck } from 'lucide-react';
import { getOrganizationBySlug, getOrganizationSettings } from '@/domains/organizations/service';
import { stripeT } from '../_i18n/stripe';
import { StripeConnectControls } from './StripeConnectControls';
import { StripeDisconnectDialog } from './StripeDisconnectDialog';

type CardState = 'connected' | 'pending' | 'disconnected';

function pickState(args: {
  hasAccount: boolean;
  onboarded: boolean;
  charges: boolean;
}): CardState {
  if (!args.hasAccount) return 'disconnected';
  if (args.onboarded && args.charges) return 'connected';
  return 'pending';
}

/**
 * Server component. Single source of truth for the Stripe Connect card
 * regardless of whether it's rendered as an intercepted modal or as the
 * full-page fallback. Reads `stripeAccountId + stripeOnboarded +
 * stripeChargesEnabled` from the DB on every navigation, so a `router.refresh()`
 * after the webhook fires shows the new state without a remount.
 */
export async function StripeConnectModal() {
  const hdrs = await headers();
  const slug = hdrs.get('x-tenant-slug') ?? '';
  const locale = hdrs.get('x-locale') ?? 'es';
  const t = stripeT(locale);

  const orgRes = await getOrganizationBySlug(slug);
  if (orgRes.error || !orgRes.data) {
    return (
      <div className="rounded-2xl border border-stone-100 bg-white p-6 text-sm text-stone-500">
        {t.errors.generic}
      </div>
    );
  }

  const settingsRes = await getOrganizationSettings(orgRes.data.id);
  const settings = settingsRes.data;

  const hasAccount = !!settings?.stripeAccountId;
  const onboarded = !!settings?.stripeOnboarded;
  const charges = !!settings?.stripeChargesEnabled;
  const state = pickState({ hasAccount, onboarded, charges });

  return (
    <article className="overflow-hidden rounded-2xl border border-stone-100 bg-white shadow-sm">
      {/* Header */}
      <header className="flex items-start justify-between gap-3 border-b border-stone-50 px-6 py-5">
        <div className="flex items-center gap-4">
          <div className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-stone-900">
            <StripeWordmark className="w-8 text-white" />
          </div>
          <div>
            <h2 className="font-cormorant text-lg font-semibold text-stone-800">
              {t.title}
            </h2>
            <p className="mt-0.5 text-xs text-stone-400">{t.tagline}</p>
          </div>
        </div>
        <StatusBadge state={state} t={t} />
      </header>

      {/* Body — split by state */}
      <div className="space-y-5 px-6 py-6">
        {state === 'disconnected' && <DisconnectedBody t={t} />}
        {state === 'pending' && <PendingBody t={t} />}
        {state === 'connected' && (
          <ConnectedBody t={t} accountId={settings!.stripeAccountId!} />
        )}
      </div>

      {/* Footer */}
      <footer className="border-t border-stone-100 bg-stone-50/60 px-6 py-3">
        <p className="text-[11px] leading-relaxed text-stone-400">{t.platformFeeNote}</p>
      </footer>
    </article>
  );
}

// ── States ────────────────────────────────────────────────────

function DisconnectedBody({ t }: { t: ReturnType<typeof stripeT> }) {
  return (
    <>
      <div>
        <h3 className="font-cormorant text-base font-semibold text-stone-800">
          {t.disconnected.heading}
        </h3>
        <p className="mt-1.5 text-sm leading-relaxed text-stone-500">
          {t.disconnected.body}
        </p>
      </div>
      <ul className="space-y-2">
        {[
          t.disconnected.bullets.methods,
          t.disconnected.bullets.transfers,
          t.disconnected.bullets.dashboard,
        ].map((item) => (
          <li key={item} className="flex items-center gap-2 text-xs text-stone-500">
            <span className="size-1 shrink-0 rounded-full bg-amber-400" aria-hidden />
            {item}
          </li>
        ))}
      </ul>
      <StripeConnectControls
        variant="connect"
        labels={{
          buttonIdle: t.actions.connectIdle,
          buttonLoading: t.actions.connectLoading,
          errorPrefix: t.errors.generic,
          popupBlocked: t.errors.popupBlocked,
          bannerTitle: t.newTabBanner.title,
          bannerBody: t.newTabBanner.description,
          successToast: t.disconnectDialog.success, // overridden by callback toast keys below
          refreshToast: t.errors.linkExpired,
        }}
      />
    </>
  );
}

function PendingBody({ t }: { t: ReturnType<typeof stripeT> }) {
  return (
    <>
      <div>
        <h3 className="font-cormorant text-base font-semibold text-stone-800">
          {t.pending.heading}
        </h3>
        <p className="mt-1.5 text-sm leading-relaxed text-stone-500">
          {t.pending.body}
        </p>
      </div>
      <div
        role="status"
        className="flex items-center gap-2 rounded-xl border border-amber-100 bg-amber-50 p-3"
      >
        <AlertCircle size={14} className="shrink-0 text-amber-500" aria-hidden />
        <p className="text-xs text-amber-700">{t.pending.warning}</p>
      </div>
      <StripeConnectControls
        variant="continue"
        labels={{
          buttonIdle: t.actions.continueIdle,
          buttonLoading: t.actions.continueLoading,
          errorPrefix: t.errors.generic,
          popupBlocked: t.errors.popupBlocked,
          bannerTitle: t.newTabBanner.title,
          bannerBody: t.newTabBanner.description,
          successToast: t.connected.heading,
          refreshToast: t.errors.linkExpired,
        }}
      />
    </>
  );
}

function ConnectedBody({
  t,
  accountId,
}: {
  t: ReturnType<typeof stripeT>;
  accountId: string;
}) {
  return (
    <>
      <div className="flex items-start gap-3 rounded-xl border border-emerald-100 bg-emerald-50 p-3">
        <ShieldCheck size={16} className="mt-0.5 shrink-0 text-emerald-600" aria-hidden />
        <div>
          <h3 className="font-cormorant text-base font-semibold text-emerald-900">
            {t.connected.heading}
          </h3>
          <p className="mt-0.5 text-xs leading-relaxed text-emerald-800">
            {t.connected.body}
          </p>
        </div>
      </div>

      <dl className="grid grid-cols-2 gap-x-4 gap-y-3">
        <InfoRow label={t.connected.accountIdLabel} value={`••••${accountId.slice(-6)}`} mono />
        <InfoRow label={t.connected.typeLabel} value={t.connected.typeValue} />
        <InfoRow label={t.connected.transfersLabel} value={t.connected.transfersValue} />
      </dl>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <a
          href="https://dashboard.stripe.com"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 text-xs text-stone-500 transition-colors hover:text-stone-800"
        >
          <ExternalLink size={12} aria-hidden />
          {t.connected.openDashboard}
        </a>
        <StripeDisconnectDialog
          labels={{
            trigger: t.actions.disconnect,
            title: t.disconnectDialog.title,
            description: t.disconnectDialog.description,
            confirm: t.disconnectDialog.confirm,
            loading: t.disconnectDialog.loading,
            cancel: t.disconnectDialog.cancel,
            success: t.disconnectDialog.success,
            errorForbidden: t.disconnectDialog.errorForbidden,
            errorGeneric: t.disconnectDialog.errorGeneric,
          }}
        />
      </div>
    </>
  );
}

// ── Atoms ─────────────────────────────────────────────────────

function StatusBadge({
  state,
  t,
}: {
  state: CardState;
  t: ReturnType<typeof stripeT>;
}) {
  if (state === 'connected') {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-medium text-emerald-700">
        <Check size={12} aria-hidden />
        {t.status.connected}
      </span>
    );
  }
  if (state === 'pending') {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-2.5 py-1 text-[11px] font-medium text-amber-700">
        <AlertCircle size={12} aria-hidden />
        {t.status.pending}
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-stone-100 px-2.5 py-1 text-[11px] font-medium text-stone-500">
      {t.status.disconnected}
    </span>
  );
}

function InfoRow({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div>
      <dt className="text-[10px] font-medium uppercase tracking-wider text-stone-400">{label}</dt>
      <dd className={['mt-0.5 text-sm text-stone-700', mono ? 'font-mono' : ''].join(' ')}>
        {value}
      </dd>
    </div>
  );
}

function StripeWordmark({ className }: { className?: string }) {
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
        d="M2 0a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V2a2 2 0 0 0-2-2zm6.226 5.385c-.584 0-.937.164-.937.593 0 .468.607.674 1.36.93 1.228.415 2.844.963 2.851 2.993C11.5 11.868 9.924 13 7.63 13a7.7 7.7 0 0 1-3.009-.626V9.758c.926.506 2.095.88 3.01.88.617 0 1.058-.165 1.058-.671 0-.518-.658-.755-1.453-1.041C6.026 8.49 4.5 7.94 4.5 6.11 4.5 4.165 5.988 3 8.226 3a7.3 7.3 0 0 1 2.734.505v2.583c-.838-.45-1.896-.703-2.734-.703"
      />
    </svg>
  );
}
