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
├── app/                  # NEXT.JS 16 ROUTING (App Router)
│   ├── [tenant]/         # Rutas dinámicas por subdominio (lourdes/gloria)
│   │   ├── (public)/     # Landing, catálogo y reserva para clientas
│   │   └── (dashboard)/  # Panel de gestión unificado (estilo Setmore)
│   └── api/              # Webhooks de Stripe y tareas programadas
├── domains/              # EL CORAZÓN: Lógica de Negocio (Domain-Driven)
│   ├── booking/          # Motor de citas, validación de tiempos y solapamientos
│   ├── catalog/          # Gestión de servicios e "Islas de Datos" de categorías
│   ├── customers/        # CRM, fichas técnicas y seguimiento de fotos (Assets)
│   └── billing/          # Lógica fiscal (NIF/VAT), facturación y Stripe
├── shared/               # RECURSOS REUTILIZABLES (Themed)
│   ├── components/       # UI de lujo (Theme-able) que cambia por CSS Variables
│   ├── hooks/            # useTenantContext, useAppTheme, etc.
│   ├── lib/              # Inicialización de Drizzle, Supabase y Redis
│   └── utils/            # Formateadores (Intl API) y validadores comunes
├── middleware.ts         # Detección de subdominio y protección de rutas
└── instrumentation.ts    # Observabilidad y telemetría (Mac M4 / Asus TUF)
```

## 3. Multi-tenant Implementation (Island Strategy)
*Reference: Ver WORKFLOWS.md para el proceso de validación de identidad y reserva.*

### Detection and Context
- **The middleware.ts:** resolves the tenant from the hostname.

- The existence is validated in the organizations table.

- **The organization_id:** is propagated through the asynchronous context of Next.js 16.

### Data Security (RLS)

- **Strict Isolation:** All key tables include organization_id.

- **Enforcement:** Postgres policies are applied to ensure that a specialist NEVER sees another's data, even if there is a failure in the application layer.

## 4. Themed Shared UI
*Reference: See DESIGN_SYSTEM.md for colour tokens and premium typography.*

To scale without duplicating code, the interface is dynamic:

1. **Theme Injection:** The root Layout reads the visual configuration of the Specialist from the DB.

2. **CSS Variables:** Inject tokens like --accent-spa or --font-heading into the DOM.

3. **Reactive Components:** Components in src/shared/components use Tailwind classes that point to these variables, instantly changing the "look & feel" from Lourdes to Gloria.

## 5. Data Flow and Rigor Layers
**Reference:** See Section 2 of STANDARDS.md for the Result pattern.

To ensure system rigidity, each request follows this flow:

1. **UI (Presentation):** Captures the user's action.

2. **Server Action (Customs):** Strict validation with Zod.

3. **Service (Domain):** Execution of business rules (e.g., Does this client have a pending follow-up session?).

- **Drizzle (Persistence):** Atomic transaction in the single-schema database.

## 6. Environment Synchronization (Mac/Windows)
**Reference:** See Section 13 of STANDARDS.md for Git and Sync rules.

## 7. Race Condition Protection (Slot Locking)
To avoid double booking during the payment process:
- **Temporary Lock**: When starting the checkout, the system creates a lock in `temporary_slots` (Redis/DB) with a TTL of **5 minutes**.
- **Validation**: No other client can see or select this slot while the lock is active.
- **Resolution**: If the Stripe webhook confirms success, the lock becomes an `appointment`. If it expires, the slot is automatically released.