# Project Heartbeat

## Current Status
- [x] Initial Monorepo setup.
- [/] In Progress: Drizzle Schema with i18n JSONB.
- [ ] Pending: Stripe Connect Express onboarding.
- [ ] Pending Integration: Google Calendar OAuth.

## Special Configurations
- **Subdomain Local Dev:** Use `lvh.me:3000` for testing subdomains.

### 🗓️ 2026-04-14: Logic Definition Phase
- [DONE] Definition of Reservation and Cancellation Workflows.
- [DONE] Protection logic against double booking (Race conditions).
- [DONE] Biometric security standards for iPad.

### 🗓️ 2026-04-14: Database Schema — Phase 1 (Foundation)
- [DONE] Migration `phase_1_foundation` applied to Supabase (project: oyjkbkjnyytrgabjeffw, region: eu-west-1).
- [DONE] Table: `organizations` — multi-tenant core, RLS enabled.
- [DONE] Table: `profiles` — extends auth.users, ENUM user_role (super_admin | owner | staff), RLS enabled.
- [DONE] Table: `catalog_categories` — i18n JSONB, RLS enabled.
- [DONE] Table: `catalog_services` — duration, price_cents, buffers, i18n JSONB, RLS enabled.
- [DONE] Trigger `set_updated_at()` on all 4 tables.
- [NEXT] Phase 2 — Booking Engine: `customers`, `appointments`, `temporary_slots`.