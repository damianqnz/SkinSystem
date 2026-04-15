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
- [DONE] Phase 2 migration applied → see below.

### 🗓️ 2026-04-14: Database Schema — Phase 2 (Booking Engine)
- [DONE] Migration `phase_2_booking_engine` applied to Supabase.
- [DONE] ENUMs: `appointment_status`, `discount_type`, `payment_status`.
- [DONE] Table: `customers` — guest support, RLS por org.
- [DONE] Table: `coupons` — percent/fixed, max_uses, validity window, unique code per org.
- [DONE] Table: `booking_settings` — one row per org (UNIQUE), public read.
- [DONE] Table: `appointments` — full booking with status, coupon, price breakdown, policy acceptance.
- [DONE] Table: `temporary_slots` — race condition lock with expires_at TTL.
- [DONE] Table: `coupon_redemptions` — audit trail, unique per coupon+appointment.
- [DONE] Table: `payments` — Stripe payment intent tracking, owner-only RLS.
- [DONE] Table: `organization_reviews` — rating 1-5, public read for visible reviews.
- [DONE] ALTER organizations: added `address`, `logo_url`, `thank_you_url`.
- [DONE] ALTER catalog_services: added `cover_image_url`, `deposit_percent`.
- [DONE] Phase 3 migration applied → see below.

### 🗓️ 2026-04-14: Database Schema — Phase 3 (Calendar & Onboarding)
- [DONE] Migration `phase_3_calendar_and_onboarding` applied to Supabase.
- [DONE] ENUMs: `invitation_status`, `calendar_provider`.
- [DONE] Table: `organization_invitations` — dual flow (new org onboarding + staff invite), token con TTL 72h, metadata JSONB para datos de org pendiente.
- [DONE] Table: `calendar_integrations` — OAuth tokens por (profile, provider), UNIQUE (profile_id, provider).
- [DONE] Table: `external_calendar_events` — eventos externos visibles con título, is_blocking para bloquear disponibilidad.
- [DONE] RLS: staff ve solo sus eventos, owner ve toda la org.
- [DONE] Phase 3b migration applied → see below.

### 🗓️ 2026-04-14: Database Schema — Phase 3b (Services)
- [DONE] Migration `phase_3b_services_staff` applied to Supabase.
- [DONE] ALTER catalog_services: added `color` (hex, para diferenciar servicios en calendario).
- [DONE] Table: `service_staff` — relación M:M entre servicios y profesionales, la clienta elige con quién quiere la cita.
- [DONE] RLS: lectura pública (necesaria en el booking), escritura solo owner/staff.
- [NOTE] `buffer_before/after_minutes` ya cubren "tiempo de reserva". `cover_image_url` ya cubre imagen del servicio. Localización omitida intencionalmente (futuro: cursos online).
- [DONE] Phase 3 clinical tracking migration applied → see below.

### 🗓️ 2026-04-14: Database Schema — Phase 3 (Clinical Tracking)
- [DONE] Migration `phase_3_clinical_tracking` applied to Supabase.
- [DONE] 10 ENUMs: invasiveness_level, document_type, skin_type, hydration_level, skin_texture, severity_level, cycle_status, session_photo_type, adherence_status, prescription_period.
- [DONE] ALTER catalog_services: added invasiveness_level (default 'low').
- [DONE] BLOQUE A — document_templates (versionado inmutable), signed_documents (firma dual, soporte invalidación).
- [DONE] BLOQUE B — customer_onboarding (datos médicos cifrados), skin_conditions, customer_skin_profile (Fitzpatrick 1-6), customer_skin_conditions, facial_zone_annotations (mapa base + por sesión).
- [DONE] BLOQUE C — treatment_cycles, clinical_sessions (1:1 con appointment), session_photos (before/after/progress).
- [DONE] BLOQUE D — equipment_catalog (params_schema JSONB), session_equipment_log.
- [DONE] BLOQUE E — product_catalog (soft-delete), session_products_used.
- [DONE] BLOQUE F — body_measurements (timeline independiente).
- [DONE] BLOQUE G — prescriptions (adherencia), prescription_steps (morning/night/both).
- [DONE] Total acumulado: 33 tablas, todas con RLS activo.
- [DONE] Phase 4 payments config migration applied → see below.

### 🗓️ 2026-04-14: Database Schema — Phase 4 (Payments Config)
- [DONE] Migration `phase_4_payments_config` applied to Supabase.
- [DONE] ALTER booking_settings: added online_payment_enabled, advance_payment_required.
- [DONE] ALTER appointments: added surcharges_cents (CHECK >= 0). Ecuación: total = price - discount + surcharges.
- [DONE] Table: payment_surcharges — tasas/reducciones por org, value_type (percent/fixed), is_reduction flag, lectura pública para checkout.
- [NOTE] Historial de pagos y export .xls son capa de aplicación (query sobre payments + appointments + customers + profiles + catalog_services).
- [DONE] Phase 4b integrations migration applied → see below.

### 🗓️ 2026-04-14: Database Schema — Phase 4b (Integrations)
- [DONE] Migration `phase_4b_integrations` applied to Supabase.
- [DONE] ENUMs: integration_provider (9 valores), integration_status.
- [DONE] Table: org_integrations — tabla genérica UNIQUE(org, provider). OAuth tokens + config JSONB por proveedor. RLS: owner escribe, staff solo lee estado.
- [NOTE] calendar_integrations (Fase 3) cubre Google/Microsoft/Apple calendar. Stripe base en organizations. Esta tabla cubre el resto.
- [DONE] Phase 5 settings migration applied → see below.

### 🗓️ 2026-04-14: Database Schema — Phase 5 (Settings)
- [DONE] Migration `phase_5_settings` applied to Supabase.
- [DONE] ENUM: custom_field_type (text|textarea|select|checkbox|date|phone).
- [DONE] ALTER organizations: banner_url, industry, about, city, state, postal_code, country, default_currency, primary_email, social_links JSONB.
- [DONE] ALTER booking_settings: 8 toggles de agenda + 4 toggles de campos de formulario.
- [DONE] Table: organization_phones — múltiples teléfonos por org, is_primary flag.
- [DONE] Table: organization_gallery — galería de imágenes de la marca.
- [DONE] Table: availability_rules — horarios por org y/o por staff, índices únicos parciales para NULL profile_id.
- [DONE] Table: booking_custom_fields — campos personalizados del formulario de reserva.
- [DONE] Total acumulado: 39 tablas, todas con RLS activo.
- [DONE] Phase 5b blocked intervals migration applied → see below.

### 🗓️ 2026-04-14: Database Schema — Phase 5b (Perfil + Blocked Intervals)
- [DONE] Migration `phase_5b_blocked_intervals` applied to Supabase.
- [DONE] ENUMs: block_reason (vacation|illness|training|other), recurrence_type (none|daily|weekdays|weekly|monthly|yearly|custom).
- [DONE] Table: blocked_intervals — bloqueo de fechas por profesional. recurrence_config JSONB para reglas personalizadas. RLS: lectura pública, self-write por profesional, owner gestiona todos.
- [NOTE] Resto del perfil cubierto: profiles (datos), calendar_integrations (calendarios), service_staff (servicios), availability_rules (horarios + pausas por día).
- [DONE] Total acumulado: 40 tablas, todas con RLS activo.
- [DONE] Phase 6 notifications migration applied → see below.

### 🗓️ 2026-04-15: Database Schema — Phase 6 (Notifications)
- [DONE] Migration `phase_6_notifications` applied to Supabase.
- [DONE] ENUMs: notification_target, notification_channel, reminder_unit.
- [DONE] Table: notification_settings — UNIQUE(org), 6 toggles de eventos, sender_name, email_signature.
- [DONE] Table: notification_reminders — 1:N por org, timing_value + timing_unit, target + channel.
- [DONE] Total acumulado: 42 tablas, todas con RLS activo.
- [DONE] Phase 6b google reviews migration applied → see below.

### 🗓️ 2026-04-15: Database Schema — Phase 6b (Google Reviews)
- [DONE] Migration `phase_6b_google_reviews` applied to Supabase.
- [DONE] Table: google_reviews — caché local de Google Maps. UNIQUE(org, google_review_id). Campos: reviewer, rating, reply_text, is_highlighted, last_synced_at.
- [NOTE] Integración OAuth via org_integrations(provider='google_reviews'). config: { account_id, location_id, place_id }.
- [NOTE] Requiere Google Business Profile API con scope business.manage. El negocio debe tener Google Business Profile verificado.
- [DONE] Total acumulado: 43 tablas, todas con RLS activo.
- [DONE] Phase 6c review request migration applied.
- [DONE] ALTER appointments: review_request_sent_at (NULL=no enviado, NOT NULL=enviado).
- [DONE] ALTER notification_settings: review_request_enabled, review_request_delay_value (default 4), review_request_delay_unit (default 'hours').
- [NOTE] Cron diario. Link generado desde org_integrations.config.place_id → writereview URL de Google Maps.
- [DONE] Drizzle ORM schema generado.

### 🗓️ 2026-04-15: Drizzle ORM Setup
- [DONE] Installed: postgres (driver), drizzle-kit (dev).
- [DONE] drizzle.config.ts — apunta a src/infrastructure/db/schema/index.ts.
- [DONE] src/infrastructure/db/index.ts — singleton client con prepare:false (Supabase pooler).
- [DONE] Schema dividido en 9 archivos de dominio: enums, organizations, catalog, customers, booking, clinical, calendar, notifications, settings.
- [DONE] 24 ENUMs, 43 tablas, tipos inferidos ($inferSelect/$inferInsert) en cada dominio.
- [DONE] tsc --noEmit: 0 errores.
- [DONE] apps/web/tsconfig.json: added `paths` → `@/*: ./src/*` (resolves @/infrastructure/... aliases).

### 🗓️ 2026-04-15: Option A — Infrastructure & Seed
- [DONE] createSupabaseServerClient() — async cookies(), server components, server actions.
- [DONE] createSupabaseClient() — browser client for Client Components.
- [DONE] createSupabaseMiddlewareClient() — writes cookies to both request and response.
- [DONE] middleware.ts — tenant extraction, session refresh (getUser), dashboard guard → auth.skinsystem.pt, i18n detection, URL rewrite to /[tenant]/[locale]/...
- [DONE] Seed data applied to Supabase (oyjkbkjnyytrgabjeffw):
  - organizations: lourdes (pt/Lisbon), gloria (es/Madrid) — fixed UUIDs a100...0001 / a200...0002
  - booking_settings: 2 rows (defaults: 60-day window, 48h cancellation notice)
  - notification_settings: 2 rows (all alerts on, review_request off)
  - availability_rules: 14 rows — Lourdes Lun-Sáb activo, Dom cerrado | Gloria Lun-Vie activo, Sáb-Dom cerrado
- [NOTE] closed-day rows use is_active=false with placeholder valid times (DB CHECK: close_time > open_time always applies)
- [DONE] Auth portal live: auth.lvh.me:3000/login → HTTP 200, formulario funcional.

### 🗓️ 2026-04-15: Auth UI & Flow — Portal de Acceso Centralizado
- [DONE] globals.css: design tokens actualizados, shimmer animation, input-editorial class.
- [DONE] (auth)/layout.tsx: root layout independiente con next/font/google (Cormorant Garamond + Outfit, zero CLS).
- [DONE] (auth)/login/page.tsx: Server Component — detecta locale (Accept-Language), pasa `next` param.
- [DONE] (auth)/login/_components/LoginForm.tsx: Client Component — useActionState (React 19), error display tipado, ShinyButton CSS, LoadingDots.
- [DONE] (auth)/login/actions.ts: Server Action — Zod v4, signInWithPassword, DB join profiles+organizations, open-redirect guard, cross-subdomain redirect.
- [DONE] shared/lib/i18n/auth.ts: Traducciones ES/PT/EN (email, password, submit, errors).
- [DONE] Flujo completo: lourdes.lvh.me:3000/dashboard → proxy guard → 307 auth.skinsystem.pt/login?next=... → login → redirect lourdes.lvh.me:3000/dashboard.
- [DONE] Tailwind v4 fix: `@import "tailwindcss"` + `postcss.config.mjs` + `@tailwindcss/postcss`. CSS: 0 bytes → 12.5 KB.
- [DONE] Instalados: clsx, tailwind-merge, lucide-react, @tailwindcss/postcss.
- [DONE] globals.css: @theme con font-sans/font-serif, design tokens, shimmer animation, .input-editorial.
- [DONE] src/shared/lib/utils.ts: función `cn()` (clsx + tailwind-merge).
- [DONE] src/shared/components/ui/magic-card.tsx: MagicCard con radial gradient mouse-tracking (framer-motion).
- [DONE] Login page rediseñada: panel editorial oscuro (desktop) + dot-grid pattern + heading tipográfico en Cormorant Garamond + inputs bottom-border + ShinyButton con shimmer + eye toggle contraseña + AnimatePresence para errores + MagicCard wrapping el form.
- [NEXT] Dashboard layout: sidebar + header + tenant context (Server Component leyendo x-tenant-slug header).

### 🗓️ 2026-04-15: Architecture Refactor — Subdomain-based Routing
- [DONE] ELIMINADO: src/app/[tenant]/[locale]/ (rutas dinámicas por URL).
- [DONE] ELIMINADO: src/proxy.ts (reemplazado por middleware.ts estándar Next.js).
- [DONE] CREADO: src/middleware.ts — extrae subdominio, inyecta `x-tenant-slug` + `x-locale` headers, protege /dashboard y /admin sin reescritura de URL.
- [DONE] CREADO: src/app/(public)/layout.tsx — layout raíz para páginas de cliente (Cormorant + Outfit).
- [DONE] CREADO: src/app/(public)/page.tsx — landing pública, lee tenant/locale desde headers del servidor.
- [DONE] CREADO: src/app/(dashboard)/layout.tsx — shell de dashboard, lee x-tenant-slug sin params de URL.
- [DONE] CREADO: src/shared/providers/TenantProvider.tsx — Client Component Context; hidratado por el Server Layout con datos del header.
- [NOTE] tsc --noEmit: 0 errores tras la refactorización.
- [NEXT] Conectar TenantProvider al (dashboard)/layout.tsx e implementar sidebar real.

### 🗓️ 2026-04-15: proxy.ts Restore + Domain Schemas (Persistence Layer)
- [DONE] CORREGIDO: middleware.ts → proxy.ts (Next.js 16.2 usa `export function proxy()` en Node.js runtime, no Edge).
- [DONE] ÍNDICES: Añadidos index() en organization_id en infrastructure/db/schema/customers.ts, catalog.ts, booking.ts (appointments + payments).
- [DONE] src/domains/customers/schema.ts — re-exports customers/customerOnboarding/customerSkinProfile + Zod: createCustomerSchema, updateCustomerSchema.
- [DONE] src/domains/catalog/schema.ts — re-exports catalogCategories/catalogServices/serviceStaff + Zod: createCategorySchema, createServiceSchema, updateServiceSchema. Tipo I18nField para JSONB.
- [DONE] src/domains/booking/schema.ts — re-exports appointments/temporarySlots/bookingSettings/coupons + ENUM APPOINTMENT_STATUS + Zod: createAppointmentSchema (con refine startAt < endAt), updateAppointmentStatusSchema, lockSlotSchema.
- [DONE] src/domains/billing/schema.ts — payments re-exportado como Invoice (mismo registro DB). Zod: createInvoiceSchema, updateInvoiceStatusSchema. Aislamiento fiscal: un Stripe account por org.
- [NOTE] Los schemas de dominio son capas de re-exportación. La SSOT sigue siendo infrastructure/db/schema/. drizzle.config.ts no cambia.
- [NOTE] tsc --noEmit: 0 errores.
- [NEXT] Implementar domain services (repository pattern) en src/domains/*/service.ts.

### 🗓️ 2026-04-15: Domain Services — Persistence Layer
- [DONE] src/shared/types/result.ts — AppError + Result<T> (discriminated union). Todos los servicios retornan este patrón.
- [DONE] src/domains/customers/service.ts (50 líneas) — getCustomersList + getCustomerById. Doble filtro: organizationId + customerId. Columnas explícitas (LIST / DETAIL).
- [DONE] src/domains/booking/service.ts (50 líneas) — getUpcomingAppointments (status in [pending, confirmed], startAt >= now) + getSlotsByDate (between UTC day bounds).
- [DONE] src/domains/catalog/service.ts (43 líneas) — getActiveServices (isActive=true, ordenado por sortOrder).
- [SECURITY] PROHIBIDO SELECT sin filtro organizationId — aplicado vía eq()+and() en todos los where.
- [SECURITY] 'server-only' importado en cada servicio — no ejecutables en Client Components.
- [NOTE] tsc --noEmit: 0 errores. Todos los archivos ≤ 50 líneas.
- [NEXT] Dashboard layout: (dashboard)/layout.tsx con TenantProvider + sidebar + header.

### 🗓️ 2026-04-15: Dashboard Shell — Layout Base
- [DONE] next.config.js: experimental.ppr = true habilitado.
- [DONE] src/shared/components/dashboard/nav-items.ts — 6 items (Overview, Agenda, Clientes, Catálogo, Facturación, Ajustes). BOTTOM_NAV_ITEMS = slice(0,5) para mobile.
- [DONE] Sidebar.tsx (48L) — Client Component. Desktop fixed 240px. Cormorant para brand name, active state con bg-stone. Gold dot en footer.
- [DONE] BottomBar.tsx (49L) — Client Component. Mobile bottom bar glassmorphism. Thumb Zone ≥44px touch targets. Icono activo en #D4AF37.
- [DONE] DashboardHeader.tsx (36L) — Server Component. Glassmorphism backdrop-blur-md. Recibe tenantName como prop (no llama headers()). <UserMenu> en Suspense.
- [DONE] UserMenu.tsx (42L) — Async Server Component. Lee sesión Supabase, genera iniciales. Skeleton animado para fallback.
- [DONE] (dashboard)/layout.tsx (43L) — PPR shell: Sidebar/Header estáticos, children en <Suspense>. TenantProvider hidratado desde x-tenant-slug.
- [DONE] TenantProvider.tsx (47L) — Context actualizado, wrapper limpio.
- [NOTE] tsc --noEmit: 0 errores. Todos los archivos ≤ 50 líneas.

### 🗓️ 2026-04-15: Dashboard Overview Page
- [DONE] src/domains/organizations/service.ts — `getOrganizationBySlug(slug)` resuelve subdomain slug → OrgSummary (id, name, slug, locale).
- [DONE] src/app/(dashboard)/_components/StatsCard.tsx — Client Component. framer-motion `whileHover scale(0.98)`. Glassmorphism + gold icon transition.
- [DONE] src/app/(dashboard)/_components/AppointmentsSkeleton.tsx — Shimmer skeleton, brand-gold tint via `.skeleton-shimmer` CSS class.
- [DONE] src/app/(dashboard)/_components/EmptyState.tsx — Editorial: Cormorant heading + gold dot + shimmer CTA → /settings/calendar.
- [DONE] src/app/(dashboard)/_components/AppointmentsList.tsx — async Server Component. Promise.all(upcoming + customers + services). Cross-reference IDs, i18n service names, per-locale status badges, EmptyState fallback.
- [DONE] src/app/(dashboard)/page.tsx — Server Component. Reads x-tenant-slug + x-locale from headers. Promise.all stats (today slots, customers, services). <Suspense> wraps AppointmentsList. Cormorant headings + Outfit tabular-nums.
- [DONE] globals.css: .skeleton-shimmer + @keyframes skeleton-sweep.
- [DONE] tsc --noEmit: 0 errores.
- [DONE] next.config.js: ppr:true → cacheComponents:true (nivel raíz, Next.js 16.2.0 API).
- [DONE] Resuelto conflicto de rutas: (dashboard)/page.tsx movido a (dashboard)/dashboard/page.tsx → URL /dashboard.
- [DONE] _components/ movido a dashboard/_components/ (imports relativos intactos).
- [DONE] tsc --noEmit: 0 errores. Servidor corriendo en localhost:3000 sin warnings.
- [DONE] Gestión de Clientes (CRM) — ver entrada 2026-04-15 CRM Customers.

### 🗓️ 2026-04-15: CRM — Módulo de Clientes
- [DONE] domains/customers/service.ts: añadido `getCustomersWithStats` — LEFT JOIN appointments (completed|confirmed), MAX(start_at) lastVisitAt, COUNT(id)::int visitCount. Tenant isolation: eq(appointments.organizationId, customers.organizationId).
- [DONE] CustomersTable.tsx (Client) — grid editorial 4-col (md). Avatar con hash de nombre → 6 paletas. fmtDate helper (hoy/Nd/día mes). Badge Nuevo (amber) | Recurrente (emerald). Glassmorphism hover: bg-white/80 backdrop-blur-sm.
- [DONE] CustomerEmptyState.tsx — dos variantes: !isFiltered (con CTA "Añadir Primer Cliente") | isFiltered (sin resultados).
- [DONE] AddCustomerModal.tsx (Client) — overlay glassmorphism, form stub (Name/Email/Phone), ESC+backdrop para cerrar, focus trap al abrir.
- [DONE] CustomerSearch.tsx (Client) — useState query + useMemo filter (nombre|email|teléfono). FAB fixed bottom-20 right-4 z-40 en mobile (Thumb Zone). Botón desktop en toolbar. Re-exporta CustomersTableSkeleton.
- [DONE] CustomersTableSkeleton.tsx — shimmer 6 filas + fake search bar usando .skeleton-shimmer.
- [DONE] customers/page.tsx — Server Component. Suspense wrapper. Serialize Date→ISO. getOrganizationBySlug + getCustomersWithStats.
- [DONE] tsc --noEmit: 0 errores. GET /dashboard/customers → 200.
- [NOTE] Warning "Route '/'" por (public)/page.tsx llamando headers() fuera de Suspense — pre-existente, no introducido por este módulo.
- [DONE] Ficha Clínica Detallada — ver entrada 2026-04-15 Clinical Record.

### 🗓️ 2026-04-15: Clinical Record — Ficha Clínica Detallada
- [DONE] domains/customers/full-history.ts — `getCustomerFullHistory(id, orgId)`: Promise.all(customer+onboarding, appointments+sessions+serviceName). Fotos en query separada por sessionIds. Tenant isolation en todos los JOINs.
- [DONE] PatientHeader.tsx (Server) — Avatar hash, contacto, fecha de alta. RevealField para alergias/medicación/condiciones (variant=danger). Sección protegida con label "Datos de Salud Protegidos".
- [DONE] RevealField.tsx (Client) — Click-to-reveal. Auto-re-lock a los 60s. Placeholder •••••••••. Variants: default / danger (rojo).
- [DONE] AutoLockOverlay.tsx (Client) — 10min inactivity blur (GDPR/STANDARDS §11). Triggers: visibilitychange + mousemove + keydown + touchstart. Overlay con ícono Lock + Cormorant heading. Click para desbloquear.
- [DONE] TreatmentTimeline.tsx (Client) — Framer Motion staggered (container/item variants, EASE typed [n,n,n,n]). Timeline vertical con dot coloreado por status. RevealField para notas clínicas dentro de cada card.
- [DONE] PhotoGallery.tsx (Client) — BeforeAfterSlider (clip-path + draggable handle). Grid 3/4 aspect-ratio para CLS < 0.05. Signed URLs (60min) pasadas como props desde Server. Fallback ImageOff si URL null.
- [DONE] PatientSkeleton.tsx — Shimmer 3-block (header + timeline + gallery).
- [DONE] page.tsx — Async params (Next.js 16). generateSignedUrls(appointments) → Supabase Storage signed URLs. Single Suspense fallback → PatientSkeleton. notFound() si org o cliente no existen.
- [DONE] tsc --noEmit: 0 errores. GET /dashboard/customers/[id] → 200, 1083ms.
- [DONE] Generación de Rutina Home Care en PDF — ver entrada 2026-04-15 HomeCare PDF.

### 🗓️ 2026-04-15: HomeCare PDF Generator
- [DONE] infrastructure/db/schema/routines.ts — tabla `customer_routines`: JSONB steps (morning/afternoon/night), locale, specialist_notes, pdf_storage_path, RLS 3 políticas.
- [DONE] Migration `phase_7_home_care_routines` aplicada a Supabase (oyjkbkjnyytrgabjeffw). 44 tablas totales, RLS activo.
- [DONE] domains/customers/service-routines.ts — `saveCustomerRoutine` (INSERT + RETURNING id), `getCustomerRoutines` (ORDER BY created_at DESC, límite 20). Zod: routineStepSchema + saveRoutineSchema.
- [DONE] routine/actions.ts — Server Action `saveRoutineAction(prev, raw)`. Auth: `supabase.auth.getUser()` server-side (no spoofable). Zod validation pre-DB.
- [DONE] public/fonts/ — CormorantGaramond-Regular.woff2, CormorantGaramond-Light.woff2, Outfit-Regular.woff2 (copiados de @fontsource).
- [DONE] domains/customers/components/pdf/RoutinePDFTemplate.tsx — react-pdf Document. Tokens: Cream #FAFAF9, Stone #1C1917, Gold #D4AF37. Font.register WOFF2. Secciones Morning/Afternoon/Night. Footer fijo. I18n ES/PT/EN.
- [DONE] domains/customers/components/HomeCareGenerator.tsx (Client) — Form: 3 périodos × max 8 pasos. LangSelector Thumb Zone (60px botones + flag). PDFDownloadLink (dynamic, ssr:false). Sticky action bar bottom:4 en mobile. useActionState para Server Action.
- [DONE] customers/[id]/routine/page.tsx — Server Component. Reads org + customer. Specialist name from auth session metadata.
- [DONE] tsc --noEmit: 0 errores. GET /dashboard/customers/[id]/routine → 200.
- [NEXT] Integración WhatsApp (Evolution API): envío de rutina PDF a la clienta vía WhatsApp tras generación.
- [NEXT] Crear página /dashboard (Overview) con datos reales: citas de hoy, próximas, resumen de ingresos usando los domain services.