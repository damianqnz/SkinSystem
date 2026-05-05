# SkinSystem — Beauty Platform

> Multi-tenant SaaS for aesthetic and beauty specialists. Each specialist runs on their own subdomain with fully isolated data, branding, and billing.

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](./LICENSE)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue?logo=typescript)](https://www.typescriptlang.org/)
[![Next.js](https://img.shields.io/badge/Next.js-16-black?logo=next.js)](https://nextjs.org/)
[![Turborepo](https://img.shields.io/badge/Turborepo-2.x-EF4444?logo=turborepo)](https://turborepo.com/)
[![pnpm](https://img.shields.io/badge/pnpm-9.x-orange?logo=pnpm)](https://pnpm.io/)

---

## Overview

SkinSystem is a production-grade, multi-tenant appointment and business management platform for independent beauty specialists (facial aesthetics, colorists, makeup artists, etc.). Each specialist operates under their own subdomain (`specialist.skinsystem.pt`) with complete isolation: separate catalog, agenda, clients, billing, and branding — while sharing the same infrastructure.

**Key capabilities:**

- Subdomain-based multi-tenancy with automatic tenant resolution via middleware
- Public booking funnel with slot locking (no double-booking)
- Specialist dashboard with RBAC (owner / staff)
- Consumer portal (`/me`) for appointment history and profile management
- Stripe Connect for independent billing per specialist
- Full internationalization: 🇧🇷 PT · 🇪🇸 ES · 🇬🇧 EN
- WhatsApp automation via Evolution API
- Clinical records with versioned PDF generation

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16 (App Router, PPR, Server Actions) |
| Language | TypeScript 5.x (strict mode) |
| Monorepo | Turborepo 2.x + pnpm workspaces |
| Database | PostgreSQL via Supabase (RLS enforced) |
| ORM | Drizzle ORM |
| Auth | Supabase Auth (PKCE flow) |
| Cache / Locks | Upstash Redis (5-min slot locking) |
| Payments | Stripe Connect (Standard) |
| Styling | Tailwind CSS v4 (90%) + Stitches (10%) |
| Components | Shadcn/ui + MagicUI |
| Animations | Framer Motion + GSAP 3 |
| I18n | next-intl |
| Email | Resend |
| WhatsApp | Evolution API (self-hosted) |
| PDF | react-pdf |
| Validation | Zod |
| Testing | Playwright |

---

## Monorepo Structure

```
SkinSystem/
├── apps/
│   └── web/              # Main Next.js application
├── packages/
│   ├── ui/               # Shared React component library
│   ├── eslint-config/    # Shared ESLint configuration
│   └── typescript-config/ # Shared tsconfig.json bases
├── turbo.json
├── pnpm-workspace.yaml
└── package.json
```

### Inside `apps/web/src`

```
src/
├── app/
│   ├── (auth)/           # Unified login gateway
│   ├── (dashboard)/      # Specialist admin shell (RBAC-gated)
│   ├── (public)/         # Landing page, booking funnel, /me portal
│   └── api/              # Stripe webhooks & cron jobs
├── domains/              # Business logic (booking, catalog, customers, billing)
├── shared/               # Providers, hooks, lib clients, utils
└── messages/             # i18n JSON files (es.json, pt.json, en.json)
```

---

## Architecture Highlights

### Multi-tenancy

Tenant identity is resolved by the incoming subdomain in `middleware.ts`. The slug is injected as a request header (`x-tenant-slug`) and consumed by every Server Component and Server Action — no client-side manipulation. Each tenant gets isolated data enforced at the database level via Postgres RLS on `organization_id`.

### Booking & Slot Locking

When a user starts checkout, a Redis lock (TTL: 5 min) is created for the selected slot. Concurrent requests cannot select or display that slot while the lock is active. On Stripe webhook confirmation the lock promotes to a permanent appointment; on expiry or failure it is released automatically.

### RBAC

- `profiles` table = staff (owner / staff roles). Dashboard access requires an active `profiles` row scoped to the current tenant.
- `customers` table = external clients (email-keyed). Consumer portal access requires a matching `customers` row in the current tenant.
- The two audiences share a single `/login` gateway with automatic routing post-authentication.

### Data Flow

```
UI Component → Server Action (Zod validation) → Domain Service → Drizzle ORM → PostgreSQL (RLS)
```

---

## Getting Started

### Prerequisites

- Node.js `>=18`
- pnpm `9.x` — `npm install -g pnpm`
- A [Supabase](https://supabase.com) project
- A [Stripe](https://stripe.com) account with Connect enabled
- An [Upstash Redis](https://upstash.com) database

### Install

```sh
git clone https://github.com/damianqnz/SkinSystem.git
cd SkinSystem
pnpm install
```

### Environment Variables

Create `apps/web/.env.local` based on the following template:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# Stripe
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=

# Upstash Redis
UPSTASH_REDIS_REST_URL=
UPSTASH_REDIS_REST_TOKEN=

# Resend (email)
RESEND_API_KEY=

# Evolution API (WhatsApp)
EVOLUTION_API_URL=
EVOLUTION_API_KEY=

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### Local Development

For subdomain-based multi-tenancy to work locally, map tenant slugs to `localhost` in `/etc/hosts`:

```
127.0.0.1  tenant-a.lvh.me
127.0.0.1  tenant-b.lvh.me
```

Then start the dev server:

```sh
pnpm dev
```

Access the platform at `http://tenant-a.lvh.me:3000`.

### Build

```sh
pnpm build
```

Build a specific app:

```sh
pnpm turbo build --filter=web
```

### Type Check

```sh
pnpm check-types
```

---

## Database

The schema is managed with Drizzle ORM. Migrations are applied via the Supabase CLI or the MCP integration.

Key tables: `organizations`, `profiles`, `customers`, `services`, `appointments`, `medical_records`, `coupons`, `surcharges`.

Every table that holds tenant-specific data includes an `organization_id` column with a corresponding RLS policy.

---

## Deployment

The platform is designed for deployment on [Vercel](https://vercel.com) with wildcard subdomain support (`*.skinsystem.pt`). Cron jobs for automated appointment status transitions run every 5 minutes via Vercel Cron.

---

## License

[MIT](./LICENSE) © 2026 damianqnz
