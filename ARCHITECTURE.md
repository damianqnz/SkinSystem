# ARCHITECTURE.md: El Mapa del Sistema (SkinSystem)

This document defines the physical and logical structure of SkinSystem. It is based on the principles of **Screaming Architecture** and **Logical Multi-tenancy**, ensuring a "blind" system between specialists and optimized for **Next.js 16.x**.

---

## 1. Design Principles
*Reference: See `STANDARDS.md` for coding and naming rules.*

1.  **Screaming Design**: The folder structure must describe the aesthetics and health business, not the framework.
2.  **Logical Isolation (Option A)**: Shared data in physical tables but isolated by **Row Level Security (RLS)** via `organization_id`.
3.  **Unidirectional Data Flow**: UI ➔ Server Action (Zod) ➔ Domain Service ➔ Drizzle ORM ➔ DB.
4.  **Next.js 16 Standards**: Native use of Server Components, Partial Prerendering (PPR) and asynchronous Actions.

---

## 2. The Folder Tree (The Screaming Tree)
*Reference: See `TECH_STACK.md` for specific versions of the mentioned libraries.*

```bash
src/
├── app/                  # NEXT.JS 16 ROUTING
│   ├── (auth)/           # Centralized Login (auth.skinsystem.pt)
│   ├── (dashboard)/      # Specialist/Admin views (/admin)
│   ├── (public)/         # Client-facing booking and landing pages
│   └── api/              # Stripe Webhooks & Cron Jobs
├── domains/              # THE CORE: Domain-Driven Business Logic
│   ├── booking/          # Slot validation, locks, and scheduling
│   ├── catalog/          # Service management & "Data Islands"
│   ├── customers/        # CRM, clinical records, and asset tracking
│   └── billing/          # Fiscal logic (VAT/NIF) & Stripe Connect
├── shared/               # REUSABLE RESOURCES
│   ├── components/       # Atomic UI (Tailwind v4 / Stitches)
│   ├── providers/        # TenantProvider, AuthProvider, I18nProvider
│   ├── hooks/            # useTenantContext, useAppTheme
│   ├── lib/              # Drizzle, Supabase, Redis clients
│   └── utils/            # Intl formatters & common validators
├── messages/             # I18n Static JSON (ES/PT/EN)
├── proxy.ts              # Subdomain detection & tenant_id injection
└── instrumentation.ts    # Observability (Mac M4 / Asus TUF telemetry)
```

## 3. Multi-tenant Implementation (Island Strategy)
*Reference: See WORKFLOWS.md for identity validation flow.*

## 3. Multi-tenant Implementation (Island Strategy)
*Reference: See WORKFLOWS.md for the identity and booking validation process.*

### 3.1 Detection & Context (Middleware)
- **Subdomain Resolution**: The `proxy.ts` extracts the `tenant_id` from the incoming hostname (e.g., `lourdes.skinsystem.pt`).
- **Header Injection**: It injects the `organization_id` into the request headers to be consumed by Server Components and Actions without client-side manipulation.
- **Validation**: The middleware performs a pre-flight check against the `organizations` table to ensure the tenant exists before allowing the request to proceed.

### 3.2 State Persistence (TenantProvider)
- **Single Source of Truth**: The Subdomain always overrides any local state.
- **Client-Side Hydration**: A `TenantProvider` (React Context) wraps the application. It hydrates once with the organization's settings (Logo, Colors, Branding Name) fetched from the DB via the header-injected ID.
- **Dynamic Theming**: UI components consume this context to apply specialist-specific branding tokens.

---

## 4. Themed Shared UI (Hybrid Strategy)
*Reference: See DESIGN_SYSTEM.md for color tokens and premium typography.*

To scale without duplicating code, the interface uses a 90/10 CSS Boundary:

1.  **CSS Variables**: The root Layout injects tokens (e.g., `--accent-spa`, `--brand-gold`, `--font-heading`) into the `:root` DOM element based on the Tenant data.
2.  **Tailwind CSS v4 (90%)**: Components use utility classes that reference these CSS variables, instantly changing the "look & feel" from Lourdes to Gloria.
3.  **Stitches (10%)**: Used EXCLUSIVELY for **Complex Atomic Components** with multiple logic-driven variants (e.g., "Slot Selector" states: `available`, `locked`, `occupied`, `selected`).

---

## 5. Security & Data Isolation (RLS)
*Reference: See Section 17 of STANDARDS.md for database rigor.*

1.  **Strict Isolation**: Every key table (appointments, medical_records, services) includes an `organization_id` column.
2.  **Postgres RLS**: Row Level Security policies are applied at the database level (Supabase) to ensure that a specialist NEVER sees another's data, even if the application layer fails.
3.  **App Guardrail**: As defined in `CLAUDE.md`, all Drizzle queries must explicitly include the `tenant_id` filter.

---

## 6. Race Condition Protection (Slot Locking)
*Reference: See TECH_STACK.md for Upstash Redis configuration.*

1.  **Temporary Lock**: When starting a checkout, the system creates a lock in `Upstash Redis` with a TTL of **5 minutes**.
2.  **Validation**: No other client can see or select this specific slot while the lock is active.
3.  **Resolution**: 
    - **Success**: If the Stripe webhook confirms payment, the lock is promoted to a permanent `appointment`.
    - **Failure/Expiry**: If the timer hits zero without confirmation, the slot is automatically released.

---

## 7. Environment & Development Sync
*Reference: See Section 13 of STANDARDS.md for Git and Sync rules.*

- **Observability**: `instrumentation.ts` is configured to track performance metrics across different hardware environments.
- **Secrets Management**: Strict use of `.env.local` to manage Supabase and Stripe keys independently for each developer machine.