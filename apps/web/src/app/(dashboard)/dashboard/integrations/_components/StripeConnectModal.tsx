import { headers } from 'next/headers';
import { ExternalLink, Check, AlertCircle, ShieldCheck } from 'lucide-react';
import { getTranslations } from 'next-intl/server';
import { getOrganizationBySlug, getOrganizationSettings } from '@/domains/organizations/service';
import { resolveStripeConnectState, type StripeConnectState } from '@/shared/lib/stripe-policy';
import { StripeIcon } from '@/shared/components/icons/StripeIcon';
import { StripeConnectControls } from './StripeConnectControls';
import { StripeDisconnectDialog } from './StripeDisconnectDialog';
import { localeFromHeader } from '@/i18n/detect-locale';

/**
 * Server component. Single source of truth for the Stripe Connect card
 * regardless of whether it's rendered as an intercepted modal or as the
 * full-page fallback.
 */
export async function StripeConnectModal() {
  const hdrs   = await headers();
  const slug   = hdrs.get('x-tenant-slug') ?? '';
  const locale = localeFromHeader(hdrs.get('x-locale'));
  const t      = await getTranslations({ locale, namespace: 'integrations.stripe' });

  const orgRes = await getOrganizationBySlug(slug);
  if (orgRes.error || !orgRes.data) {
    return (
      <div className="rounded-2xl border border-stone-100 bg-white p-6 text-sm text-stone-500">
        {t('errors.generic')}
      </div>
    );
  }

  const settingsRes = await getOrganizationSettings(orgRes.data.id);
  const settings    = settingsRes.data;

  const hasAccount = !!settings?.stripeAccountId;
  const onboarded  = !!settings?.stripeOnboarded;
  const charges    = !!settings?.stripeChargesEnabled;
  const payouts    = !!settings?.stripePayoutsEnabled;
  const state      = resolveStripeConnectState({ hasAccount, onboarded, chargesEnabled: charges, payoutsEnabled: payouts });

  return (
    <article className="overflow-hidden rounded-2xl border border-stone-100 bg-white shadow-sm">
      {/* Header */}
      <header className="flex items-start justify-between gap-3 border-b border-stone-50 px-6 py-5">
        <div className="flex items-center gap-4">
          <div className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-[#635BFF]">
            <StripeIcon className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="font-cormorant text-lg font-semibold text-stone-800">{t('title')}</h2>
            <p className="mt-0.5 text-xs text-stone-400">{t('tagline')}</p>
          </div>
        </div>
        <StatusBadge state={state} labels={{ connected: t('status.connected'), pending: t('status.pending'), disconnected: t('status.disconnected') }} />
      </header>

      {/* Body */}
      <div className="space-y-5 px-6 py-6">
        {state === 'disconnected' && (
          <>
            <div>
              <h3 className="font-cormorant text-base font-semibold text-stone-800">{t('disconnected.heading')}</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-stone-500">{t('disconnected.body')}</p>
            </div>
            <ul className="space-y-2">
              {([
                t('disconnected.bullets.methods'),
                t('disconnected.bullets.transfers'),
                t('disconnected.bullets.dashboard'),
              ] as string[]).map((item) => (
                <li key={item} className="flex items-center gap-2 text-xs text-stone-500">
                  <span className="size-1 shrink-0 rounded-full bg-amber-400" aria-hidden />
                  {item}
                </li>
              ))}
            </ul>
            <StripeConnectControls
              variant="connect"
              labels={{
                buttonIdle:    t('actions.connectIdle'),
                buttonLoading: t('actions.connectLoading'),
                errorPrefix:   t('errors.generic'),
                popupBlocked:  t('errors.popupBlocked'),
                bannerTitle:   t('newTabBanner.title'),
                bannerBody:    t('newTabBanner.description'),
                successToast:  t('disconnectDialog.success'),
                refreshToast:  t('errors.linkExpired'),
              }}
            />
          </>
        )}

        {state === 'pending' && (
          <>
            <div>
              <h3 className="font-cormorant text-base font-semibold text-stone-800">{t('pending.heading')}</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-stone-500">{t('pending.body')}</p>
            </div>
            {!onboarded ? (
              <div role="status" className="flex items-center gap-2 rounded-xl border border-amber-100 bg-amber-50 p-3">
                <AlertCircle size={14} className="shrink-0 text-amber-500" aria-hidden />
                <p className="text-xs text-amber-700">{t('pending.warning')}</p>
              </div>
            ) : (
              <ul role="status" className="space-y-2">
                {!charges && (
                  <li className="flex items-center gap-2 rounded-xl border border-amber-100 bg-amber-50 p-3">
                    <AlertCircle size={14} className="shrink-0 text-amber-500" aria-hidden />
                    <p className="text-xs text-amber-700">{t('pending.capabilityCharges')}</p>
                  </li>
                )}
                {!payouts && (
                  <li className="flex items-center gap-2 rounded-xl border border-amber-100 bg-amber-50 p-3">
                    <AlertCircle size={14} className="shrink-0 text-amber-500" aria-hidden />
                    <p className="text-xs text-amber-700">{t('pending.capabilityPayouts')}</p>
                  </li>
                )}
              </ul>
            )}
            <StripeConnectControls
              variant="continue"
              labels={{
                buttonIdle:    t('actions.continueIdle'),
                buttonLoading: t('actions.continueLoading'),
                errorPrefix:   t('errors.generic'),
                popupBlocked:  t('errors.popupBlocked'),
                bannerTitle:   t('newTabBanner.title'),
                bannerBody:    t('newTabBanner.description'),
                successToast:  t('connected.heading'),
                refreshToast:  t('errors.linkExpired'),
              }}
            />
            <div className="flex justify-end">
              <StripeDisconnectDialog
                labels={{
                  trigger:        t('actions.disconnect'),
                  title:          t('disconnectDialog.title'),
                  description:    t('disconnectDialog.description'),
                  confirm:        t('disconnectDialog.confirm'),
                  loading:        t('disconnectDialog.loading'),
                  cancel:         t('disconnectDialog.cancel'),
                  success:        t('disconnectDialog.success'),
                  errorForbidden: t('disconnectDialog.errorForbidden'),
                  errorGeneric:   t('disconnectDialog.errorGeneric'),
                }}
              />
            </div>
          </>
        )}

        {state === 'connected' && (
          <>
            <div className="flex items-start gap-3 rounded-xl border border-emerald-100 bg-emerald-50 p-3">
              <ShieldCheck size={16} className="mt-0.5 shrink-0 text-emerald-600" aria-hidden />
              <div>
                <h3 className="font-cormorant text-base font-semibold text-emerald-900">{t('connected.heading')}</h3>
                <p className="mt-0.5 text-xs leading-relaxed text-emerald-800">{t('connected.body')}</p>
              </div>
            </div>

            <dl className="grid grid-cols-2 gap-x-4 gap-y-3">
              <InfoRow label={t('connected.accountIdLabel')} value={`••••${settings!.stripeAccountId!.slice(-6)}`} mono />
              <InfoRow label={t('connected.typeLabel')}      value={t('connected.typeValue')} />
              <InfoRow label={t('connected.transfersLabel')} value={t('connected.transfersValue')} />
            </dl>

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <a
                href="https://dashboard.stripe.com"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-xs text-stone-500 transition-colors hover:text-stone-800"
              >
                <ExternalLink size={12} aria-hidden />
                {t('connected.openDashboard')}
              </a>
              <StripeDisconnectDialog
                labels={{
                  trigger:        t('actions.disconnect'),
                  title:          t('disconnectDialog.title'),
                  description:    t('disconnectDialog.description'),
                  confirm:        t('disconnectDialog.confirm'),
                  loading:        t('disconnectDialog.loading'),
                  cancel:         t('disconnectDialog.cancel'),
                  success:        t('disconnectDialog.success'),
                  errorForbidden: t('disconnectDialog.errorForbidden'),
                  errorGeneric:   t('disconnectDialog.errorGeneric'),
                }}
              />
            </div>
          </>
        )}
      </div>

      {/* Footer */}
      <footer className="border-t border-stone-100 bg-stone-50/60 px-6 py-3">
        <p className="text-[11px] leading-relaxed text-stone-400">{t('platformFeeNote')}</p>
      </footer>
    </article>
  );
}

// ── Atoms ─────────────────────────────────────────────────────

function StatusBadge({ state, labels }: { state: StripeConnectState; labels: { connected: string; pending: string; disconnected: string } }) {
  if (state === 'connected') return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-medium text-emerald-700">
      <Check size={12} aria-hidden />
      {labels.connected}
    </span>
  );
  if (state === 'pending') return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-2.5 py-1 text-[11px] font-medium text-amber-700">
      <AlertCircle size={12} aria-hidden />
      {labels.pending}
    </span>
  );
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-stone-100 px-2.5 py-1 text-[11px] font-medium text-stone-500">
      {labels.disconnected}
    </span>
  );
}

function InfoRow({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div>
      <dt className="text-[10px] font-medium uppercase tracking-wider text-stone-400">{label}</dt>
      <dd className={['mt-0.5 text-sm text-stone-700', mono ? 'font-mono' : ''].join(' ')}>{value}</dd>
    </div>
  );
}
