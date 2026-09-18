-- Adds organizations.stripe_payouts_enabled — sourced from Stripe `account.updated`
-- webhook (`account.payouts_enabled`). Flipped to false on Soft Disconnect.
-- Mirrors stripe_charges_enabled (20260430) so capability status is tracked
-- granularly instead of collapsing charges+payouts into a single "onboarded" flag.
ALTER TABLE organizations
  ADD COLUMN IF NOT EXISTS stripe_payouts_enabled boolean NOT NULL DEFAULT false;
