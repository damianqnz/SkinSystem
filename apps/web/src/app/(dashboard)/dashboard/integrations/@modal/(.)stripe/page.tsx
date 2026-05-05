import { StripeConnectModal } from '../../_components/StripeConnectModal';
import { StripeRouteModalShell } from './_modal-shell';

/**
 * Intercepted segment — rendered inside the integrations layout's `@modal`
 * slot whenever the user navigates from `/dashboard/integrations` to
 * `/dashboard/integrations/stripe` via `router.push()`. The Setmore-style
 * card floats over the integrations list; closing it goes back via the
 * router so the URL collapses cleanly to the parent.
 *
 * Hard reloads bypass this segment and fall through to `stripe/page.tsx`.
 */
export default function InterceptedStripeModal() {
  return (
    <StripeRouteModalShell>
      <StripeConnectModal />
    </StripeRouteModalShell>
  );
}
