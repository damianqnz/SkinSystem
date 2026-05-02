-- Adds organizations.stripe_charges_enabled — sourced from Stripe `account.updated`
-- webhook (`account.charges_enabled`). Flipped to false on Soft Disconnect.
ALTER TABLE organizations
  ADD COLUMN IF NOT EXISTS stripe_charges_enabled boolean NOT NULL DEFAULT false;
