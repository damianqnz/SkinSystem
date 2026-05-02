'use client';

import { useState } from 'react';
import { StripeConnectButton, type StripeConnectButtonVariant } from './StripeConnectButton';
import { StripeNewTabBanner } from './StripeNewTabBanner';
import { StripeConnectListener } from './StripeConnectListener';

export interface StripeConnectControlsLabels {
  buttonIdle:    string;
  buttonLoading: string;
  errorPrefix:   string;
  popupBlocked:  string;
  bannerTitle:   string;
  bannerBody:    string;
  successToast:  string;
  refreshToast:  string;
}

export interface StripeConnectControlsProps {
  variant: StripeConnectButtonVariant;
  labels:  StripeConnectControlsLabels;
}

/**
 * Composes the action button, the "Stripe is open in a new tab" banner,
 * and the postMessage listener that drives both. Server components mount
 * this wherever the connect/continue affordance is needed.
 */
export function StripeConnectControls({ variant, labels }: StripeConnectControlsProps) {
  const [popupOpen, setPopupOpen] = useState(false);

  return (
    <>
      <StripeNewTabBanner
        visible={popupOpen}
        title={labels.bannerTitle}
        description={labels.bannerBody}
      />
      <StripeConnectButton
        variant={variant}
        labelIdle={labels.buttonIdle}
        labelLoading={labels.buttonLoading}
        popupBlockedMsg={labels.popupBlocked}
        errorPrefix={labels.errorPrefix}
        onPopupOpened={() => setPopupOpen(true)}
      />
      <StripeConnectListener
        successToast={labels.successToast}
        refreshToast={labels.refreshToast}
      />
    </>
  );
}
