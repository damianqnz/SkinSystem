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
### 🗓️ 2026-04-15: Calendario de Gestión — /dashboard/agenda
- [DONE] domains/booking/calendar-service.ts — `getCalendarWeek(orgId, anchorDate)`: JOIN appointments ↔ customers ↔ catalog_services. Devuelve CalendarEvent[] con bufferBefore/AfterMinutes + serviceName JSONB. `getWeekStart` (Monday) + `getWeekEnd` helpers.
- [DONE] AppointmentSlot.tsx — Stitches atomic component. `SlotCard` con variants: pending(amber) | confirmed(sky) | in_progress(gold) | completed(green) | cancelled(slate) | no_show(red). `BufferBlock` (diagonal stripe). `EventCard` con layout multi-columna para overlapping events. Constantes PX_PER_MIN=2, GRID_START_HOUR=8.
- [DONE] CalendarHeader.tsx (Client) — toolbar: Hoy/semana-anterior/semana-siguiente con URLSearchParams(?week=YYYY-MM-DD). Day labels row (desktop, sticky top-0). fmtWeekRange ES/PT/EN. isToday highlight (amber dot).
- [DONE] WeekGrid.tsx (Client) — desktop hidden md:flex. 7 columnas, horas 08:00–21:00, PX_PER_MIN=2 (60min=120px). resolveColumns() sweep-line para overlapping. NowLine (rojo, solo columna de hoy). Buffer blocks posicionados.
- [DONE] AgendaList.tsx (Client) — mobile md:hidden. Grupos por día, sticky day headers, isToday highlight. EventRow: timeStart/End, color bar por status, status badge i18n, duración, precio. Empty state per-week.
- [DONE] CalendarSkeleton.tsx — shimmer grid desktop + list mobile.
- [DONE] CalendarEvents.tsx (async Server Component) — wrapper suspendable. Llama getCalendarWeek, serializa Dates, renderiza WeekGrid + AgendaList.
- [DONE] agenda/page.tsx — PPR: CalendarHeader estático + Suspense(CalendarEvents). Parámetro ?week=ISO-date. notFound() si org no existe.
- [DONE] tsconfig.json: declaration:false añadido para resolver TS2742 de @stitches/react (Stitches styled exports + declaration:true de base config).
- [DONE] tsc --noEmit: 0 errores.
- [NEXT] Acción de crear cita manual desde el calendario (modal + Server Action).
- [NEXT] Integración WhatsApp (Evolution API): envío de rutina PDF vía WhatsApp.
- [NEXT] Upstash Redis slot lock para el flujo de reserva pública (WF-01).

### 🗓️ 2026-04-15: Motor de Disponibilidad + Calendario /calendar
- [DONE] @upstash/redis instalado.
- [DONE] shared/lib/redis-lock.ts — `lockSlot` (SET NX EX, atómico), `unlockSlot` (Lua compare-and-delete), `getSlotOwner`, `getSlotTTL`, `getLockedSlotKeys` (SCAN cursor), `checkSlotLocks` (MGET batch), `renewSlotLock`. buildSlotKey: `slot:{orgId}:{YYYY-MM-DD}:{startISO}:{serviceId}`.
- [DONE] domains/booking/service.ts — `calculateAvailableSlots(orgId, serviceId, date)`: Fetch paralelo (availabilityRules + appointments + blockedIntervals + Redis keys). Genera grid de slots openTime→closeTime. Clasifica: available | booked | locked | buffer | blocked | break | outside_hours. Tenant isolation en todos los queries.
- [DONE] calendar/_components/SlotCell.tsx (Stitches) — 7 variantes status: available(cream+gold-hover), booked(sky), locked(amber+pulse-animation), buffer(diagonal-stripe), blocked(slate), break(muted), outside_hours(transparent). LockBadge "En proceso" cuando locked.
- [DONE] calendar/_components/DayTimeGrid.tsx (Client) — AnimatePresence slide/fade al cambiar día. Grupos por hora. HourSection con gold hour-label. ClosedDayState si sin slots.
- [DONE] calendar/_components/CalendarDayNav.tsx (Client) — Navegación día anterior/siguiente via ?date=YYYY-MM-DD. Service selector tabs (chip pills). Hoy button. isToday highlight amber.
- [DONE] calendar/_components/AvailabilityEngine.tsx (async Server) — Llama calculateAvailableSlots. StatsPill: disponibles / reservados / en proceso. Serializa Dates → RSC boundary.
- [DONE] calendar/_components/NewAppointmentFAB.tsx (Client) — FAB fixed bottom-24 right-4 z-40 (Thumb Zone). AnimatePresence slide-up modal. Form stub: cliente, servicio, hora, nota.
- [DONE] calendar/_components/CalendarSkeleton.tsx — Shimmer stats + legend + slot rows.
- [DONE] calendar/page.tsx — PPR: static CalendarDayNav + Suspense key="${date}-${serviceId}" → AvailabilityEngine. NoServicesState si catálogo vacío.
- [DONE] calendar/actions/lock-slot.ts — Server Actions: `lockSlotAction` (SET NX, session de Supabase auth no spoofable), `unlockSlotAction` (Lua). Estados: idle | success | conflict | error.
- [DONE] nav-items.ts — CalendarCheck2 icon añadido, ruta /calendar (Disponibilidad).
- [DONE] .env.local — UPSTASH_REDIS_REST_URL + UPSTASH_REDIS_REST_TOKEN placeholders añadidos.
- [DONE] tsc --noEmit: 0 errores.
- [NOTE] Redis renders locked slots visually LIVE: getLockedSlotKeys SCAN + checkSlotLocks MGET batch se ejecutan en AvailabilityEngine (cada render streaming). Los slots con TTL activo se muestran con `locked` variant (amber pulse). Cuando el TTL expira, Redis libera el slot y en el siguiente render aparece `available`.
- [NEXT] Conectar NewAppointmentFAB form al Server Action createAppointment (booking flow completo).
- [NEXT] Integración WhatsApp (Evolution API) para envío de rutina PDF.

### 🗓️ 2026-04-15: Catálogo de Servicios — /catalog
- [DONE] domains/catalog/service.ts — Reescrito con CRUD completo: `getCategoriesWithServices` (Promise.all cats+svcs, agrupados en JS), `getActiveServices`, `getServiceById`, `createCategory`, `updateCategory`, `createService`, `updateService`, `toggleServiceStatus`. Tenant isolation en todos los queries. SVC_COLS incluye slug.
- [DONE] catalog/actions.ts — Server Actions: createCategoryAction, updateCategoryAction, createServiceAction, updateServiceAction, toggleServiceStatusAction. Auth: `user.user_metadata.organization_id` de Supabase. `revalidatePath('/catalog')` en éxito.
- [DONE] ServiceDrawer.tsx — Radix Dialog (slide-in derecha). Form fields: nameI18n + descriptionI18n (tabs ES/EN/PT), precio (€), duración (min), depositPercent (Radix Slider 0-100%), bufferBefore/After, categoría select, color palette (8 swatches), status Switch. useActionState + Sonner toast.
- [DONE] CategoryDrawer.tsx — Radix Dialog. Form: nameI18n + descriptionI18n (tabs), status Switch. useActionState.
- [DONE] ServiceRow.tsx — Framer Motion stagger. Columnas: dot+Nombre(Cormorant), Precio(Outfit tabular), Duración(Outfit), Depósito, Badge Activo/Inactivo. useOptimistic para toggle instantáneo. Acciones hover: ON/OFF + Pencil.
- [DONE] CatalogIsland.tsx — Collapsible (AnimatePresence height). Header: catName(Cormorant), service count, Pencil editar categoría, gold gradient separator. ServiceTable dentro. "+ Añadir servicio" FAB dentro de cada isla.
- [DONE] CatalogClient.tsx — Client orchestrator. Header con contadores. EmptyState con CTA. Orphans island (servicios sin categoría). CategoryDrawer para crear/editar.
- [DONE] CatalogSkeleton.tsx — Shimmer islands con rows.
- [DONE] catalog/page.tsx — PPR: Suspense → CatalogContent (async Server Component). notFound() si org inexistente.
- [DONE] globals.css — .field-label, .font-cormorant, .font-outfit, .no-scrollbar añadidos.
- [DONE] layout.tsx — <Toaster richColors position="bottom-right" /> añadido (Sonner).
- [DONE] nav-items.ts — href /dashboard/services → /catalog. CalendarCheck2 para Disponibilidad.
- [DONE] sonner, @radix-ui/react-dialog, @radix-ui/react-select, @radix-ui/react-switch, @radix-ui/react-slider instalados.
- [DONE] tsc --noEmit: 0 errores.
- [NEXT] Vincular catálogo con Stripe Connect: `priceCents` → Stripe PaymentIntent `amount`, `depositPercent` → `application_fee_amount` calculation, `currency` → `currency` field.
- [NEXT] Subida de imagen de portada (coverImageUrl) via Supabase Storage.
- [NEXT] Reordenamiento drag-and-drop de servicios y categorías (dnd-kit sortOrder).

### 🗓️ 2026-04-15: Stripe Connect Infrastructure — Pagos
- [DONE] stripe@17 instalado. `shared/lib/stripe.ts` — singleton `getStripe()`, `calcDepositAmount(priceCents, depositPercent)`, `calcApplicationFee(amountCents, feeBps=1000)`.
- [DONE] domains/billing/service.ts — `createBookingSession(input)`: Valida stripeAccountId antes de crear cualquier objeto Stripe. `transfer_data.destination` = cuenta del especialista. `application_fee_amount` = plataforma 10%. Metadata: organizationId, appointmentId, serviceId. `createPaymentRecord`, `markPaymentSucceeded`, `markPaymentFailed`.
- [DONE] domains/organizations/service.ts — Extendido: `getOrganizationSettings` (stripeAccountId, stripeOnboarded, defaultCurrency, primaryEmail), `setStripeAccountId`, `markStripeOnboarded`.
- [DONE] app/api/webhooks/stripe/route.ts — Seguridad: `req.text()` (raw body) ANTES de cualquier parsing. `constructEvent()` con STRIPE_WEBHOOK_SECRET verifica firma antes de cualquier lógica. Eventos: `checkout.session.completed` (createPaymentRecord → markPaymentSucceeded → confirm appointment → unlockSlot Redis), `payment_intent.payment_failed` (markPaymentFailed), `account.updated` (markStripeOnboarded si details_submitted=true).
- [DONE] dashboard/settings/actions.ts — `createStripeConnectAccount`: idempotente (no crea cuenta duplicada), persiste stripeAccountId ANTES de crear el link. `refreshStripeOnboardingLink`: regenera link expirado. OrgId SIEMPRE de user.user_metadata (no spoofable).
- [DONE] dashboard/settings/_components/StripeConnectCard.tsx — Card premium 3 estados: ConnectedState (grid info + link Stripe Dashboard), PendingState (continuar verificación), DisconnectedState (CTA conectar). SVG wordmark de Stripe inline (sin CDN externo). Badges: emerald(conectado) / amber(pendiente) / stone(no conectado). useActionState para connect + refresh. router.push() para redireccion Stripe.
- [DONE] dashboard/settings/page.tsx — Settings page con sección Pagos (StripeConnectCard) + placeholders Perfil del negocio + Notificaciones.
- [DONE] .env.local — STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET, NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY, STRIPE_PLATFORM_FEE_BPS=1000 añadidos.
- [DONE] tsc --noEmit: 0 errores.
- [NOTE] Aislamiento fiscal garantizado: cada `createBookingSession` valida que org.stripeAccountId exista. Fondos siempre a transfer_data.destination (cuenta del especialista). Plataforma cobra vía application_fee_amount.
- [DONE] Flujo de reserva pública completo — ver entrada 2026-04-15 Public Booking.
- [NEXT] Rellenar credenciales reales de Stripe en .env.local para habilitar el webhook en local.
- [NEXT] Integración WhatsApp (Evolution API): envío rutina PDF tras generación.

### 🗓️ 2026-04-15: Public Booking Experience — /book + Landing
- [DONE] domains/booking/service.ts — Añadido `createAppointment(input: CreateAppointmentInput)`. Persiste appointment status=pending + policyAcceptedAt=now.
- [DONE] domains/billing/service.ts — BookingSessionInput extendido con `slotStartISO?` + `lockedBySession?` → propagados a Stripe metadata para que el webhook libere el lock Redis.
- [DONE] (public)/page.tsx — Landing ultra-luxury reescrita. generateMetadata dinámica (título = org.name). Hero: fondo stone-950, dot-grid pattern, Cormorant Garamond 9xl, gold CTA. Services section: PPR Suspense → ServicesSection async. Footer minimalista.
- [DONE] (public)/_components/ServicesSection.tsx — Async Server Component. Lee org por slug → getActiveServices. Grid 1/2/3-col. Cards con color bar, i18n name/description, precio, duración. Link directo a /book?service=<id>.
- [DONE] (public)/layout.tsx — Toaster añadido (position bottom-center, richColors).
- [DONE] (public)/book/page.tsx — Server Component. generateMetadata. getActiveServices para Step 1. PPR-compatible. Detecta ?cancelled=1 → notice amber.
- [DONE] (public)/book/_components/BookingFunnel.tsx — Client orchestrator. 3 pasos: Step1→Step2→Step3. AnimatePresence slide direction-aware (dir 1|-1). Back button.
- [DONE] (public)/book/_components/StepIndicator.tsx — Progreso visual: nodos numerados + conectores. done=amber, active=stone-900 ring, pending=stone-100.
- [DONE] (public)/book/_components/Step1Service.tsx — Grid de servicios seleccionables. Hover → CTA inline. depositPercent mostrado si <100%.
- [DONE] (public)/book/_components/Step2Calendar.tsx — Strip horizontal 14 días. Cambio de fecha → Server Action getAvailableSlotsAction (useTransition). SlotGrid: available=seleccionable, locked=amber deshabilitado. Solo muestra available + locked (interno se filtra).
- [DONE] (public)/book/_components/Step3Confirm.tsx — Summary card (servicio + slot + desglose precio). Form: nombre, teléfono, email, nota. useActionState(createBookingAction). router.push en redirect, toast.error en error/conflict.
- [DONE] (public)/book/actions.ts — getAvailableSlotsAction: llama calculateAvailableSlots, filtra a public-visible (available|locked), serializa Dates. createBookingAction: (1) lockSlot Redis best-effort, (2) getServiceById, (3) find staff profile, (4) upsert guest customer, (5) createAppointment, (6) createBookingSession → Stripe URL.
- [DONE] (public)/book/success/page.tsx — Server Component. Lee appointmentId de searchParams → JOIN appointments+catalog_services → muestra detalles. CTA volver al inicio.
- [DONE] tsc --noEmit: 0 errores.
- [NOTE] Flujo completo: Landing → /book → Step1 (servicio) → Step2 (horario, slots desde Redis+DB) → Step3 (form guest) → Stripe Checkout → webhook confirma → /book/success.
- [NEXT] Rellenar credenciales reales de Stripe + Upstash Redis en .env.local para prueba end-to-end.
- [NEXT] Implementar WhatsApp (Evolution API) post-confirmación.
- [NEXT] NewAppointmentFAB en /calendar: conectar al mismo createBookingAction para reservas desde el panel.

### 🗓️ 2026-04-17: Dashboard Shell Restoration + Setmore-style Redesign
- [FIX] (dashboard)/layout.tsx — añadidos `<html lang>` + `<body>` + `next/font/google` (Cormorant + Outfit) + `import '../globals.css'`. El layout estaba estructuralmente incompleto desde su primer commit (a diferencia de (auth) y (public)). Tailwind no se aplicaba en /dashboard → "text-dump" en pantalla.
- [FIX] (dashboard)/layout.tsx — `await headers()` movido a un sub-componente `<DashboardShell>` envuelto en `<Suspense>`. Next 16 + `cacheComponents:true` rechaza runtime data accedida fuera de Suspense con error "blocking-route".
- [DONE] Sidebar.tsx — rediseño inspirado en Setmore. Bg crema `#F5F3EF`, ancho 256px (w-64), círculo de iniciales del tenant + nombre en Cormorant + tagline "Faça crescer a sua marca". Active state: borde izq oro (#D4AF37), bg `rgba(212,175,55,0.10)`, label en Outfit medium. Footer: link "Compartilhar página pública" + upsell strip "Assine o Pro". Export `SidebarSkeleton` para PPR.
- [DONE] DashboardHeader.tsx — glassmorphism crema `rgba(245,243,239,0.80)`. Botón pill "Reservar" oro con shimmer + UserMenu en Suspense.
- [DONE] nav-items.ts — labels portugueses al estilo Setmore: Panel, Calendário, Serviços, Conectar, Clientes, Pagamentos, Integrações, Definições. `Panel` (LayoutDashboard) como primer item → `/dashboard` con active solo en match exacto.
- [DONE] StatsCard.tsx — rediseño editorial. Title en Cormorant Garamond `text-[15px] font-light`. Number en Outfit `text-4xl font-extralight tabular-nums`. Borde fino `border-spa-border`, sin sombra. Hover scale 0.99 + tinte oro en ícono.
- [DONE] dashboard/page.tsx — bento de 3 cards: "Citas hoy" + "Citas mañana" + "Clientes nuevos (7d)". `getSlotsByDate(orgId, today/tomorrow)` en Promise.all. Heading "Panel" + i18n es/pt/en. Layout max-w-6xl centrado.
- [DONE] AppointmentsList.tsx — contenedor único con border + scroll interno `max-h-[420px] overflow-y-auto` (≈5 items visibles). Badge oro `border-[#D4AF37]/30 bg-[rgba(212,175,55,0.06)]` con nombre del servicio. Status badge con paleta semántica (pending=amber, confirmed=emerald, cancelled=stone). Limit aumentado a 20.
- [DONE] domains/booking/seed.ts — seeder de dominio. `seedTenantData(orgId, staffProfileId)` inyecta 3 cats (Facial/Capilar/Corporal) + 8 servicios con precios reales en cents y colores hex + 15 clientes con nombres realistas PT/ES + 20 appts (2 hoy + 3 mañana confirmadas + 15 spread, 3 forzadas a `cancelled`). `clearSeedData(orgId)` respeta FKs (appts → custs → svcs → cats), borra solo lo marcado: `customers.notes='__seed__'`, `services.slug LIKE '__seed__%'`, `categories.sortOrder >= 9000`.
- [DONE] dashboard/actions.ts — `seedTenantDataAction()` Server Action. Hard gate `process.env.NODE_ENV !== 'development'`. Resuelve tenant vía `x-tenant-slug`, escoge `staffProfileId` (logged user → fallback a cualquier profile del org). Limpia previo → siembra → `revalidatePath('/dashboard'|'/agenda'|'/customers'|'/catalog')`.
- [DONE] _components/MockDataButton.tsx — Client. Pill dashed dorado con ícono Database + Loader2 spinner durante `useTransition`. Hidden en producción (`if NODE_ENV !== 'development' return null`). Toast de éxito con contadores + registros eliminados; `router.refresh()` al final.
- [SECURITY] Tenant isolation respetada en todas las queries del seeder (organizationId obligatorio + Zod validation a nivel server action). Marker tags permiten cleanup quirúrgico sin afectar datos reales del tenant.
- [DONE] tsc --noEmit: 0 errores. `pnpm check-types` (next typegen + tsc) pasa limpio.
- [NEXT] AppointmentsList: añadir variante de query `getUpcomingAppointmentsAll` que incluya cancelled para mostrar el badge gris en el panel.
- [NEXT] Añadir avatar/logo real del tenant (Supabase Storage) en lugar del círculo de iniciales del Sidebar.
- [NEXT] Conectar el botón "Reservar" del header al flujo de creación interna (modal con createBookingAction existente).

### 🗓️ 2026-04-17: Agenda Setmore-style — Fase 1 (Layout + Vista Mes)
- [DECISION] Target = `/dashboard/agenda` (NO `/calendar`). El motor de disponibilidad pública en `/calendar` se mantiene intacto para preservar el funnel `/book`. Sustituido el `WeekGrid`/`AgendaList` previo por un calendario mensual al estilo Setmore.
- [DECISION] Stack: `date-fns` + Framer Motion + Radix Popover/Dialog/Tabs. Descartados `react-big-calendar` (moment.js + ~70KB) y `@fullcalendar/react` (poco editorial).
- [DONE] `pnpm add @radix-ui/react-popover` (1.1.15).
- [DONE] domains/booking/calendar-service.ts — añadidos `getMonthStart`, `getMonthGridBounds` (siempre 42 días = 6 semanas Mon→Sun), `getCalendarMonth(orgId, anchorDate)` con JOIN apps + customers + services y filtro `between(startAt, gridStart, gridEnd)`.
- [DONE] agenda/layout.tsx — sidebar secundaria a la derecha de la principal. `await headers()` envuelto en `<Suspense>` para satisfacer cacheComponents.
- [DONE] agenda/_components/CalendarsSidebar.tsx — Client. Collapsible 288↔36px con animación Framer 240ms cubic-bezier. Estado persistido en `localStorage('agenda.sidebar.open')`. Items con checkbox + dot color (oro local, azul Google) + label truncado. Footer "+ Conectar o calendário".
- [DONE] agenda/_components/ViewSwitcher.tsx — Client. Radix Popover. Push `?view=…` vía `useTransition`. Opciones Dia/Semana/Mês/Equipa con ✓ en activo.
- [DONE] agenda/_components/CalendarHeader.tsx — Client. ViewSwitcher (izq) + `‹ Abril 2026 › Hoje` (centro, links que mutan `?month=YYYY-MM-DD`) + `+`/`⋯` (der, placeholders Fase 2).
- [DONE] agenda/_components/MonthView.tsx — Client. Grid 7×6 (42 cells), día UTC, hoy = círculo `bg-stone-900 text-white`. Out-of-month en gris atenuado. Cap 3 chips/celda + footer "+N mais".
- [DONE] agenda/_components/EventChip.tsx — Client. ● HH:MM Cliente. Color del dot = `serviceColor` del seed. Cancelled = opacity 50% + line-through.
- [DONE] agenda/_components/MonthEvents.tsx — async Server. Wrapper que serializa Dates → ISO antes del boundary RSC.
- [DONE] agenda/_components/AgendaSkeleton.tsx — shimmer 7×6 que matchea el layout exacto del grid.
- [DONE] agenda/page.tsx — PPR: CalendarHeader estático + Suspense `key={monthIso-month}` → MonthEvents. Vistas Day/Week/Team renderizan placeholder "Em breve".
- [DELETED] AgendaList.tsx · AppointmentSlot.tsx · CalendarEvents.tsx · WeekGrid.tsx · CalendarSkeleton.tsx (~800 LOC del WeekGrid anterior).
- [DONE] tsc --noEmit: 0 errores.

### 🗓️ 2026-04-17: Agenda Setmore-style — Fase 2 (Interactividad)
- [DECISION] Pickers editorial-custom (Radix Popover) en lugar de `<input type="datetime-local">` nativo. Cliente combo + "+ Novo cliente" inline. Cancelación = soft (status='cancelled') con toast `Desfazer`. Reagendar/Pagar = stubs con toast "em breve".
- [DONE] `pnpm add @radix-ui/react-tabs` (para las tabs Detalhes/Histórico del sheet).
- [DONE] domains/booking/service.ts — añadidos `cancelAppointment(orgId, id)`, `restoreAppointmentStatus(orgId, id, status)`, `getAppointmentFull(orgId, id)` (JOIN customers + services + profiles) + tipo `AppointmentFull`.
- [DONE] domains/booking/calendar-service.ts — añadido `createBlockedInterval(input)` con validación `endAt > startAt`. Constante `BLOCK_REASONS = ['vacation','illness','training','other']`.
- [DONE] agenda/actions.ts — 6 Server Actions:
    · `createBlockedIntervalAction` — Zod + tenant + staffProfileId.
    · `createInternalAppointmentAction` — calcula endAt desde `service.duration`, persiste como `pending` y promueve a `confirmed` (no hay payment gate interno).
    · `cancelAppointmentAction` — devuelve `previousStatus` para que el cliente pueda ofrecer Desfazer exacto.
    · `restoreAppointmentAction` — vuelve al status previo.
    · `getAppointmentDetailAction` — lazy fetch para el sheet (data fresca).
    · `quickCreateCustomerAction` — inline desde el combo.
- [DONE] agenda/_components/EditorialDatePicker.tsx — Radix Popover + grid 6×7 mes navegable, semana arranca en lunes (PT/ES), día hoy con borde oro, día seleccionado bg stone-900.
- [DONE] agenda/_components/EditorialTimePicker.tsx — Radix Popover + lista vertical 15-min, auto-scroll al valor actual al abrir, popover 120px.
- [DONE] agenda/_components/CustomerCombobox.tsx — Radix Popover. Modo `list` (search + items) ↔ modo `create` (3 inputs editorial: nome/telefone/email). `quickCreateCustomerAction` + `useTransition`. Nuevo cliente se inyecta optimista al combo.
- [DONE] agenda/_components/ChooseActionDialog.tsx — Radix Dialog centrado 460px. 2 ChoiceTile grandes con ícono + título Cormorant + descripción Outfit. Hover → borde oro.
- [DONE] agenda/_components/BlockDateForm.tsx — Radix Dialog 480px. Desde+Até con `EditorialDatePicker` × 2 + `EditorialTimePicker` × 2. Motivo = radio pills (Férias/Doença/Formação/Outro).
- [DONE] agenda/_components/NewAppointmentForm.tsx — Radix Dialog 480px. Tabs (Serviço activa, Aula/Evento/Lembrete stubbed). ServiceSelect custom (no Radix Select para evitar conflicto con nested Popovers) con dot color + duración + precio. Date+time pickers con cálculo automático de hora final. CustomerCombobox + textarea editorial para notas.
- [DONE] agenda/_components/EventDetailSheet.tsx — Radix Dialog posicionado fixed-right (420px) con animación slide-in 240ms. Header service en Cormorant 2xl + €precio · duración. Radix Tabs (Detalhes activa / Histórico stub). Secciones: Quando, Cliente (avatar iniciales + email + teléfono con íconos), Equipa, Notas, Status badge semantic. Footer: Reagendar (stub) · Cancelar (con Desfazer toast 60s) · Aceitar pagamento → (stub).
- [DONE] agenda/_components/AgendaInteractive.tsx — Client orchestrator. Discriminated union `Active = null | choose | block | appoint | detail`. Hostea los 4 surfaces, gestiona transiciones (back desde block/appoint vuelve a choose), `router.refresh()` post-mutation.
- [DONE] MonthView.tsx — celdas con `role="gridcell"` + `tabIndex=0` + Enter/Space activan onCellClick. Focus ring oro. Chips usan `e.stopPropagation()` para no disparar la celda.
- [DONE] MonthEvents.tsx — Promise.all paralelo: `getCalendarMonth` + `getActiveServices` + `getCustomersList`. Pasa todo serializado a `<AgendaInteractive>`.
- [SECURITY] Toda Server Action resuelve orgId vía `user.user_metadata.organization_id` (no spoofable). `staffProfileId` siempre del usuario logueado o fallback a cualquier profile del org. Zod en cada action. Tenant isolation en todas las queries del dominio.
- [DONE] tsc --noEmit: 0 errores. `pnpm check-types` pasa limpio. 14 archivos nuevos · ~1 800 LOC.
- [NEXT] Fase 3: Reagendar real (drag-drop sobre el grid o picker de nueva fecha desde el sheet).
- [NEXT] Fase 3: Pagar — registrar pago manual o lanzar Stripe terminal session.
- [NEXT] Fase 3: Implementar vistas Day/Week/Team (actualmente placeholders "Em breve").
- [NEXT] Mostrar `blocked_intervals` y `external_calendar_events` superpuestos en el grid mensual (chips con patrón rayado o color secundario).
- [NEXT] Histórico tab del sheet: query a `appointments` del mismo customer con paginación.

### 🗓️ 2026-04-17: Calendar Day/Week Views + GSAP Dropdown Animation
- [DONE] Vista "Día" conectada a `?view=day` usando el motor existente `AvailabilityEngine`.
- [DONE] Vista "Semana" implementada mediante `WeekAvailabilityEngine` (query a 7 días en paralelo).
- [DONE] Grid de semana (`WeekAvailabilityGrid`) modularizado en componentes pequeños (`< 50 LOC` cada uno): `DesktopWeekGrid`, `DesktopWeekColumn`, `MobileWeekList`, `MobileDayList`. Reutiliza la lógica de grid de los componentes anteriores que habían sido eliminados.
- [DONE] Animación GSAP `gsap.to()` aplicada al background indicador activo de Radix Popover en `ViewSwitcher.tsx` usando `useGSAP`.
- [DONE] Enrutado dual en el switcher: seleccionar 'Mês' lleva a `/dashboard/agenda`, 'Dia' o 'Semana' redirige a `/calendar?view=...`.
- [DONE] Soporte multi-idioma para los labels del calendario creado localmente vía archivos JSON en `src/messages/` (`es.json`, `pt.json`, `en.json`) y usando `useTranslations('calendar.view')`.
- [DONE] Validation Gate 1 ✅: `tsc --noEmit` superado con 0 errores (gsap y @gsap/react añadidos a dependencies).
- [DONE] Validation Gate 2 ✅: Ningún archivo nuevo excede las 50 líneas.

### 🗓️ 2026-04-19: Calendar Day View — Slot Interaction + Block Time
- [DONE] SlotActionModal.tsx (115L) — Radix Dialog + GSAP `gsap.fromTo()` entrada animation (useGSAP hook). Glassmorphism `bg-white/80 backdrop-blur-xl`. Two-option chooser: "Bloquear hora" / "Agendar cita". Cormorant heading, 44px+ touch targets. i18n: `calendar.slot.*` keys in es/pt/en.json.
- [DONE] BlockTimeForm.tsx (102L) — Inline form within SlotActionModal (view=block). Desde/Hasta time inputs, Radix Select for reason (illness|vacation|training|other). `useActionState` + `blockTimeAction`. Error inline display for conflicts. Sonner toast on success.
- [DONE] actions/block-time.ts (114L) — Server Action. Zod validation (date, startTime, endTime, reason). Auth via `supabase.auth.getUser()` (not spoofable). Conflict check: queries appointments WHERE startAt BETWEEN range AND organization_id = orgId (tenant isolation). On conflict returns `{ data: null, error: { code: 'SLOT_CONFLICT', message: 'Existe una reserva: {hora} — {nombre}' } }`. On success: INSERT into blocked_intervals with organization_id + profileId + recurrence_type='none'. `revalidatePath('/calendar')`. Uses `server-only` import.
- [DONE] DayCalendarClient.tsx (62L) — Client orchestrator. Manages state for SlotActionModal + NewAppointmentFAB. Handles slot click → modal open, "Agendar cita" → FAB open with pre-filled time, "Bloquear hora" → inline block form.
- [DONE] NewAppointmentFAB.tsx — Extended with `initialTime?: string` prop (pre-fills "Hora inicio"), `externalOpen?: boolean` + `onExternalClose` for programmatic open from SlotActionModal.
- [DONE] AvailabilityEngine.tsx — Switched from rendering DayTimeGrid directly to DayCalendarClient (includes DayTimeGrid + SlotActionModal + NewAppointmentFAB).
- [DONE] calendar/page.tsx — Removed standalone NewAppointmentFAB (now inside DayCalendarClient via AvailabilityEngine).
- [DONE] i18n: Added `calendar.slot.block`, `calendar.slot.schedule`, `calendar.slot.chooseAction`, `calendar.slot.blockDescription`, `calendar.slot.scheduleDescription`, `calendar.block.*` keys in es.json, pt.json, en.json.
- [DONE] Validation Gate ✅: `tsc --noEmit` 0 errors. All new files < 150 lines. Tenant isolation verified in block-time.ts (org_id in conflict query + INSERT).
- [SECURITY] blockTimeAction resolves orgId via `user.user_metadata.organization_id` (not spoofable). All DB queries scoped by organization_id.
- [NEXT] Connect NewAppointmentFAB form to Server Action createAppointment (full booking flow).
- [NEXT] Show blocked_intervals visually in the day grid (currently only calculated by AvailabilityEngine).

### 🗓️ 2026-04-19: Calendar Day View — 24h Grid Paradigm Shift
- [DONE] **Paradigm change**: Day view switched from "list of available slots" → "24-row Google Calendar-style timeline".
- [DONE] `domains/booking/day-view-service.ts` (138L) — `getDayView(orgId, date)`: Promise.all fetch of (1) availability_rules for day-of-week, (2) appointments with JOIN customers+catalog_services (pending|confirmed|completed), (3) blocked_intervals overlapping the day. Returns `Result<DayViewData>`. `server-only`. Tenant isolation: all queries filter by organizationId. No SELECT *.
- [DONE] `DayEventBlock.tsx` (48L) — Visual pill component for events in the grid. Variants: confirmed=sky, pending=amber, completed=emerald, cancelled=slate, blocked=diagonal-stripe-slate. Stops click propagation to prevent row modal from firing.
- [DONE] `DayTimeGrid.tsx` (146L) — Full rewrite. 24 hourly rows (00:00–23:00). Business hours: `bg-stone-50` + gold hover. Outside hours: `bg-stone-200/15`. Events overlaid per hour using DayEventBlock. GSAP `gsap.from('.hour-row', { stagger: 0.01 })` entrance animation scoped with `useGSAP({ scope: ref })`. Keyboard accessible (Enter/Space on rows). Exports `DayViewSer` types for RSC boundary.
- [DONE] `DayCalendarClient.tsx` (60L) — Updated to accept `DayViewSer` instead of `ComputedSlot[]`. Passes `isBusinessHour` boolean to SlotActionModal based on clicked row.
- [DONE] `SlotActionModal.tsx` (140L) — Added `isBusinessHour` prop. When `false`: hides "Bloquear hora" tile, shows amber warning note (`calendar.slot.outsideNote`). GSAP `fromTo` entrance animation intact.
- [DONE] `AvailabilityEngine.tsx` (63L) — Rewritten to call `getDayView`. Removed StatPills (available/booked/locked counts no longer relevant in visual grid). Removes `serviceId` prop. Serializes Dates at RSC boundary.
- [DONE] `CalendarDayNav.tsx` (106L) — Removed `services`, `serviceId` props and service-chip selector row entirely. Navigation and ViewSwitcher preserved.
- [DONE] `calendar/page.tsx` (73L) — Removed serviceList, NoServicesState. Service fetch only runs for week view (WeekAvailabilityEngine still needs it). Suspense key simplified to `date-view`.
- [DONE] `actions/block-time.ts` (112L) — Fixed conflict detection to proper interval overlap: `lt(appointments.startAt, endAt) AND gt(appointments.endAt, startAt)`. Fixed enum to `['pending', 'confirmed']` (no in_progress in DB). `server-only` import confirmed.
- [DONE] i18n: Added `calendar.slot.outsideNote` in es/pt/en.json.
- [DONE] Validation Gate ✅: `tsc --noEmit` 0 errors. All files ≤ 146 lines. `getDayView` and `blockTimeAction` both filter by `organizationId` (tenant isolation confirmed).
- [SECURITY] `blockTimeAction` resolves orgId exclusively from `user.user_metadata.organization_id` (Supabase session — not spoofable from formData). Overlap check uses proper interval algebra.
- [NOTE] Week view preserves existing `calculateAvailableSlots` + `WeekAvailabilityEngine` (service-scoped). Scope of this change is day view only.
- [DONE] NewAppointmentFAB refactor complete — see entrada 2026-04-19 below.
- [NEXT] Connect AppointmentForm "Confirmar Cita" to `createAppointment` Server Action (full internal booking flow).
- [NEXT] WeekAvailabilityEngine: migrate from service-scoped slot listing to org-wide day view for consistency with day view paradigm.

### 🗓️ 2026-04-20: Unified SlotActionModal + Available Times Selector
- [DONE] `src/shared/components/booking/SlotActionModal.tsx` (145L) — Moved from calendar/_components to shared. Props: `date: string`, `slotTime?: string`, `onSchedule: (time?: string) => void`. When `slotTime` undefined (month view): shows both tiles unrestricted. When defined (day view): applies `isBusinessHour` guard as before. Imports `BlockTimeForm` via `@/app/(dashboard)/calendar/_components/BlockTimeForm`.
- [DONE] `BlockTimeForm.tsx` — Fixed `endTime` init: guard `!slot.time` → returns `''` instead of `'NaN:00'` when slotTime is absent (month view path).
- [DONE] `DayCalendarClient.tsx` — Import updated to `@/shared/components/booking/SlotActionModal`. Props updated: `slot` → `date` + `slotTime`. `handleSchedule(time?: string)`.
- [DONE] `calendar/actions/get-available-times.ts` (86L) — Server Action. `server-only`. Zod: date YYYY-MM-DD. Auth via `user.user_metadata.organization_id`. Queries `availability_rules` (org-level, `profileId IS NULL`). Queries `appointments` with `status IN (pending, confirmed)` between day bounds. Generates hourly slots excluding booked hours. Both queries filter by `organizationId`.
- [DONE] `AppointmentForm.tsx` (136L) — Replaced `<input type="time">` with Radix Select. `times: string[] | null` state (null=loading). `useEffect` on `date` calls `getAvailableTimesAction`. Pre-selects `initialTime` if available. "Sin horarios disponibles" message + disabled CTA when empty. Renamed `FieldWrapper` → `Field`.
- [DONE] `AgendaInteractive.tsx` (120L) — Replaced `ChooseActionDialog` + `BlockDateForm` + `NewAppointmentForm` with shared `SlotActionModal` + `NewAppointmentFAB (externalOpen)`. "Agendar cita" → closes modal, opens FAB with `fabDateIso`. Removed `services`, `customers`, `tenantName` props.
- [DONE] `ChooseActionDialog.tsx` — Marked `@deprecated` (kept for reference).
- [DONE] `MonthEvents.tsx` (53L) — Removed parallel `getActiveServices` + `getCustomersList` fetches. Simplified to single `getCalendarMonth` call.
- [DONE] `agenda/page.tsx` — Removed `tenantName` prop from MonthEvents.
- [DONE] Validation Gate ✅: `tsc --noEmit` 0 errors. All modified files ≤ 150 lines. Tenant isolation confirmed in both queries of `get-available-times.ts`.
- [SECURITY] `getAvailableTimesAction` resolves orgId from `user.user_metadata.organization_id` only.
- [NEXT] Connect AppointmentForm "Confirmar Cita" to `createInternalAppointmentAction` (endAt = startAt + durationMinutes).
- [NEXT] Add `revalidatePath('/dashboard/agenda')` to `blockTimeAction` so agenda refreshes after a block from month view.
- [NEXT] WeekAvailabilityEngine: migrate to org-wide day view paradigm for consistency.

### 🗓️ 2026-04-20: Month-View Block Days Flow
- [DONE] `agenda/actions/block-days.ts` (114L) — Server Action. `server-only`. Zod: fromDate, toDate (ISO), reason enum. orgId from `user.user_metadata.organization_id` (not spoofable). Step 1: conflict check → appointments JOIN catalog_services WHERE org + NOT IN (cancelled|no_show) + startAt in range. Returns `{ status:'conflict', conflicts:[{date,time,serviceName}] }` if any found. Step 2: INSERT one `blocked_intervals` row per day (00:00–23:59 UTC). `revalidatePath('/dashboard/agenda')`. Both queries filter by `organizationId`.
- [DONE] `MonthActionModal.tsx` (121L) — Radix Dialog with GSAP entrance (same aesthetic as SlotActionModal). Two tiles: "Bloquear días" (→ inline `BlockDaysForm`) | "Agendar cita" (→ `onSchedule` callback). Props: `selectedDate: Date`, `locale`, `onSchedule`, `onClose`. Static `getMsgs()` function for ES/PT/EN (no dynamic import — kept compact).
- [DONE] `BlockDaysForm.tsx` (129L) — Inline form inside MonthActionModal. "Desde" / "Hasta" with `EditorialDatePicker` (minDate prop). "Motivo" Radix Select (same 4 options). `useTransition` + direct `blockDaysAction` call. Conflict list rendered in red (one row per booking: DD/MM HH:MM — service). Sonner toast on success + `onClose()`.
- [DONE] `BlockedDayChip.tsx` (43L) — Visual chip for blocked days in month grid. Slate colors, Ban icon (lucide), i18n reason label inline (no JSON import needed). Same height structure as EventChip.
- [DONE] `EditorialDatePicker.tsx` — Added `minDate?: string` prop. Individual cells disabled + `opacity-25 cursor-not-allowed` when `cellIso < minDate`. Backward compatible (no breaking changes).
- [DONE] `AgendaInteractive.tsx` (113L) — Replaced `SlotActionModal` with `MonthActionModal`. Added `SerializedBlock` type export. Added `blockedIntervals: SerializedBlock[]` prop passed to `MonthView`. `handleCellClick` now passes both `dateIso` and `Date` object to active state.
- [DONE] `MonthView.tsx` — Added `blockedIntervals: SerializedBlock[]` prop. `blockedByDay` memo (first reason per date). `BlockedDayChip` rendered at top of each cell's event list when blocked. Reduces `maxVisible` events by 1 to prevent overflow.
- [DONE] `MonthEvents.tsx` (73L) — Added `blockedIntervals` query (SELECT id, startAt, reason WHERE org + startAt BETWEEN gridStart AND gridStart+42days). Serialized and passed to `AgendaInteractive`. Tenant isolation: `eq(blockedIntervals.organizationId, organizationId)`.
- [DONE] Validation Gate ✅: `tsc --noEmit` 0 errors. All new files ≤ 150 lines (max 129). `block-days.ts` uses `orgId` from `user.user_metadata` in both conflict check and INSERT. `minDate` enforced on `EditorialDatePicker`. Day view files (`SlotActionModal`, `DayTimeGrid`) confirmed untouched by git diff.
- [SECURITY] `blockDaysAction` resolves orgId exclusively from `user.user_metadata.organization_id`. Conflict check uses proper appointment JOIN with org filter before range filter.
- [NEXT] Connect AppointmentForm "Confirmar Cita" to `createInternalAppointmentAction`.
- [NEXT] Histórico tab del EventDetailSheet: query appointments of same customer with pagination.
- [NEXT] Drag-and-drop rescheduling on month grid.

### 🗓️ 2026-04-19: NewAppointmentFAB — Client Search + Step Flow
- [DONE] FIX globals.css: `.input-editorial` no longer declares `padding-left`. Split `padding: 0.75rem 0` → `padding-top/bottom`. Tailwind `pl-8`/`pl-3` now work correctly on inputs with icons.
- [DONE] domains/customers/service.ts — `getCustomersList` extendida con `query?: string`. Filters by `ilike` on `fullName`, `email`, `phone`. `or`/`ilike` added to drizzle-orm imports. Backward compatible (no breaking changes).
- [DONE] actions/search-customers.ts (47L) — Server Action. `server-only`. Zod: query string min 1. Auth via `user.user_metadata.organization_id` (not spoofable). Returns `Result<CustomerMatch[]>`.
- [DONE] actions/create-customer.ts (65L) — Server Action. `server-only`. Zod: fullName (min 2), phone?, email?. Auth via `user.user_metadata.organization_id`. INSERT INTO customers. `CreateCustomerState` discriminated union (idle|success|error). Returns status-based state for `useActionState`.
- [DONE] ClientSearchField.tsx (89L) — Client Component. Controlled (value/onChange). Debounce 300ms via setTimeout. `useTransition` + `searchCustomersAction`. Dropdown results. Fallback `"No se encontró" + "＋ Agregar cliente"` (gold border) when `query.length > 2 && results.length === 0`. `onBlur` with 150ms delay to allow click on dropdown items.
- [DONE] AppointmentForm.tsx (99L) — Extracted from NewAppointmentFAB. Receives `selectedCustomer`/`onCustomerChange`/`onAddClient` props. Uses `ClientSearchField`. FormField pattern: `pl-8` only when icon present.
- [DONE] AddClientStep.tsx (71L) — Step 2. Header con `← volver`. Campos: fullName*, phone, email. `useActionState(createCustomerAction)`. Sonner toast "Cliente agregado" on success. Calls `onClientCreated(data)` on success.
- [DONE] NewAppointmentFAB.tsx (98L) — Refactored to step orchestrator. State: `step` (1|2), `customer`, `formKey`. Step 1 = AppointmentForm, Step 2 = AddClientStep. On `handleClientCreated`: setCustomer + setFormKey++ (remounts form with pre-selected customer) + setStep(1). Close resets all state.
- [SECURITY] Both new actions resolve `orgId` exclusively via `user.user_metadata.organization_id` (Supabase session — not spoofable). `getCustomersList` scoped by `organizationId` in all WHERE clauses.
- [DONE] Validation Gate ✅: `tsc --noEmit` 0 errors. All new files ≤ 99 lines. `input-editorial` no longer declares padding-left (verified via grep). Both actions filter by organization_id from user metadata.
- [DONE] Service selector real en AppointmentForm — ver entrada 2026-04-19 below.
- [NEXT] Connect AppointmentForm "Confirmar Cita" to `createInternalAppointmentAction` (endAt = startAt + durationMinutes, tenant isolation).

### 🗓️ 2026-04-19: AppointmentForm — Real Service Selector
- [DONE] actions/get-services.ts (47L) — Server Action. `server-only`. Auth via `user.user_metadata.organization_id` (not spoofable). Calls `getActiveServices(orgId)`. Resolves `nameI18n` with locale fallback: `locale → 'es' → first available value`. Returns `Result<ServiceOption[]>`.
- [DONE] AppointmentForm.tsx (143L) — `ServicesState` discriminated union (`loading|ready|error`). `useEffect` calls `getServicesAction(locale)` once on mount. Select disabled + placeholder "Cargando servicios..." during load. On service change: `setServiceId` + auto-fills "Duración" with `svc.durationMinutes + ' min'`. Error state renders `"Error al cargar servicios"` below select. Duration field switches from `defaultValue` to controlled `value` driven by service selection.
- [SECURITY] `getServicesAction` resolves `orgId` exclusively from `user.user_metadata.organization_id` — locale is the only client-provided input.
- [DONE] Validation Gate ✅: `tsc --noEmit` 0 errors. `get-services.ts` 47L, `AppointmentForm.tsx` 143L — both ≤ 150 lines.

### 🗓️ 2026-04-19: Week View Migration — 24h DayView Paradigm
- [DECISION] Replaced `WeekAvailabilityEngine` (service-scoped `calculateAvailableSlots` × 7) with `WeekViewEngine` (org-wide `getDayView` × 7). No more `serviceId` dependency on the week view.
- [DONE] `domains/booking/week-view-service.ts` (43L) — `getWeekView(orgId, weekStart)`: normalises to Monday UTC, calls `getDayView` × 7 in `Promise.all`. Returns `Result<DayViewData[]>` in Mon→Sun order. `server-only`. Tenant isolation guaranteed by each `getDayView` call.
- [DONE] `week-constants.ts` — Updated: `GRID_START_HOUR=0`, `GRID_END_HOUR=24`, `TOTAL_HOURS=24`, `HOUR_PX=120`, `TOTAL_PX=2880`. `HOUR_LABELS` now generates 00:00–23:00 (24 labels).
- [DONE] `week-utils.ts` — Removed `groupSlots` + `ComputedSlot` import. Added `WeekDaySer` type (serialized day including `dateIso`). Added `getWeekDays(weekStart): Date[]`. `isToday`, `fmtTime`, `DAY_LABELS` preserved.
- [DONE] `DesktopWeekColumn.tsx` (95L) — Full rewrite. Accepts `WeekDaySer` data. 24 absolute-positioned click rows (hour-granularity, `isBiz` flag). Appointments + blocked intervals overlaid absolutely via `DayEventBlock` (same visual language as day view). Business hours: gold hover tint. Outside hours: muted tint. `PX_PER_MIN=2` for precise event height/position.
- [DONE] `DesktopWeekGrid.tsx` (78L) — Full rewrite. Separate sticky day-name header row (no per-column sticky). Scrollable area below: 24-label hour gutter (w-14) + 7 `DesktopWeekColumn`s in `grid-cols-7`. Amber highlight on today column header. `onHourClick` forwarded down.
- [DONE] `MobileWeekDaySelector.tsx` (65L) — NEW. Horizontal scrollable day tabs (Mon→Sun). 44px min-width touch targets. Today: amber date bubble. Active: gold `border-b-2`. Passes `dayIdx` back via `onChange`.
- [DONE] `MobileWeekTimeList.tsx` (85L) — NEW. 24-row list for selected mobile day. Mirrors `DayTimeGrid` HourRow layout but without GSAP (mobile-optimised). Shows `DayEventBlock` for appointments + blocked intervals per hour. Closed day shows Cormorant "Día cerrado" message.
- [DONE] `WeekViewGrid.tsx` (73L) — NEW client orchestrator. State: `selected`, `modalOpen`, `fabOpen`, `fabTime`, `fabDateIso`, `mobileDayIdx`. Desktop: `DesktopWeekGrid`. Mobile: `MobileWeekDaySelector` + `MobileWeekTimeList`. Shared: `SlotActionModal` + `NewAppointmentFAB` (same pattern as `DayCalendarClient`).
- [DONE] `WeekViewEngine.tsx` (72L) — NEW async Server Component. Calls `getWeekView`, serialises `DayViewData[]` → `WeekDaySer[]` (Dates → ISO strings). Error state with red message. Passes `weekDays` + `weekStartIso` to `WeekViewGrid`.
- [DONE] `calendar/page.tsx` (57L) — Updated to import `WeekViewEngine`. Removed `getActiveServices` call and `weekServiceId` logic (no longer needed). Passes `organizationId + date + locale` only.
- [DEPRECATED] `WeekAvailabilityEngine.tsx` — Stripped to no-op export. Marked `@deprecated`.
- [DEPRECATED] `WeekAvailabilityGrid.tsx` — Stripped to no-op export. Marked `@deprecated`.
- [DEPRECATED] `MobileWeekList.tsx` — Marked `@deprecated` (comment only, code preserved for reference).
- [DEPRECATED] `MobileDayList.tsx` — Marked `@deprecated` (comment only, code preserved for reference).
- [DONE] Validation Gate ✅: `tsc --noEmit` 0 errors. All new files ≤ 150 lines (max 85). Tenant isolation: `getWeekView` delegates to `getDayView` which filters by `organizationId` on every query.
- [SECURITY] `WeekViewEngine` is a Server Component — no client-supplied orgId. `getDayView` scopes all queries to `organizationId` from the server-side org lookup.
- [NEXT] Connect AppointmentForm "Confirmar Cita" to `createInternalAppointmentAction`.
- [NEXT] Add `revalidatePath('/dashboard/agenda')` to `blockTimeAction` (post-block refresh).
- [NEXT] Histórico tab in EventDetailSheet: paginated appointments query for same customer.

### 🗓️ 2026-04-20: /dashboard/customers — Master-Detail Layout Redesign
- [DECISION] Replaced flat table + search with master-detail two-column layout: left sidebar (w-72, client-side search + status badges) + right detail panel (profile, clinical record).
- [DONE] `domains/customers/service.ts` — Added `ClientStatus` type (`nuevo|recurrente|riesgo|inactivo|perdido`). Added `getClientStatus(totalVisits, lastVisitAt)` (time has priority: 60d→perdido, 45d→inactivo, 30d→riesgo, 2+ visits→recurrente, else nuevo). Updated `CustomerWithStats` to include `status: ClientStatus`. Updated `getCustomersWithStats` to compute status per row. Added `getCustomerProfile(orgId, customerId)` — same LEFT JOIN query as `getCustomersWithStats` but with WHERE + LIMIT 1.
- [DONE] `customers/[id]/ficha/page.tsx` — Moved from `customers/[id]/page.tsx`. All imports remain relative.
- [DONE] `customers/[id]/ficha/_components/` — Moved all 6 clinical components (AutoLockOverlay, PatientHeader, PatientSkeleton, PhotoGallery, RevealField, TreatmentTimeline). `PatientHeader` back-link updated: `/dashboard/clients` → `/dashboard/customers/${patient.id}`.
- [DONE] `customers/_components/CustomerStatusBadge.tsx` (22L) — Badge with colored dot + label. 5 statuses × 5 color palettes. Inline label i18n (ES/PT/EN via locale prop).
- [DONE] `customers/_components/CustomerListItem.tsx` (65L) — Client Component. Avatar hash palette (6 palettes). Name + last visit fmtDate. CustomerStatusBadge. Gold `border-l-2` + `bg-stone-100` when `isSelected`. `router.push` on click. min-h-[44px] touch target.
- [DONE] `customers/_components/CustomersSidebar.tsx` (90L) — Client Component. Uses `usePathname()` to derive `selectedId`. Header (Cormorant "Clientes" + [+] stub). Search input (client-side useMemo filter). Scrollable list of CustomerListItem.
- [DONE] `customers/_components/CustomersRoot.tsx` (38L) — Client Component. Uses `usePathname()` to detect `isDetail`. Sidebar: `hidden md:flex md:w-72` when detail, `flex w-full md:w-72` otherwise. Main: `hidden md:block` when not detail.
- [DONE] `customers/layout.tsx` (48L) — Server Component. Fetches org + `getCustomersWithStats`. Serializes dates → ISO. Renders `<CustomersRoot>` with customers + locale.
- [DONE] `customers/page.tsx` — Rewritten: editorial empty state "Selecciona un cliente" (gold dot + Cormorant heading). Shown in right panel when no customer selected.
- [DONE] `customers/[id]/_components/CustomerProfileClient.tsx` (142L) — Client Component. GSAP `gsap.from(containerRef, opacity+y)` via `useGSAP`. Avatar 80px. Name + CustomerStatusBadge + visit count + last visit. Pencil/⋯ stubs. "Agendar cita" gold border CTA → `setFabOpen(true)`. "Ficha clínica" link → `[id]/ficha`. Radix Tabs: Sobre (contact info) / Notas (stub) / Compromisos (stub). `<NewAppointmentFAB initialCustomer={...} externalOpen={fabOpen} />`.
- [DONE] `customers/[id]/page.tsx` — Rewritten: Server Component. Calls `getCustomerProfile`. `notFound()` on miss. Renders `<CustomerProfileClient>` with serialized data.
- [DONE] `calendar/_components/NewAppointmentFAB.tsx` — Added `initialCustomer?: CustomerMatch` prop. Initial `customer` state = `initialCustomer ?? null`. On close: reset to `initialCustomer ?? null` (not null).
- [DONE] `messages/es.json` / `pt.json` / `en.json` — Added `customers.status.*` keys (same canonical ES keys in all 3 files, different values per language).
- [DELETED] `_components/AddCustomerModal.tsx`, `CustomerEmptyState.tsx`, `CustomerSearch.tsx`, `CustomersTable.tsx`, `CustomersTableSkeleton.tsx` (5 files, ~500 LOC removed).
- [DONE] Validation Gate ✅: `tsc --noEmit` 0 errors. Max new file: 142L (CustomerProfileClient) ≤ 150. `getCustomerProfile` filters by `organizationId + customerId` (tenant isolation). `getClientStatus` time-priority logic verified.
- [SECURITY] `getCustomerProfile` resolves orgId from `getOrganizationBySlug(x-tenant-slug)` (server header — not spoofable). Double WHERE: `organizationId + customerId`. Never exposes cross-tenant data.
- [NEXT] Histórico tab in AppointmentDetailModal + CustomerProfileClient: paginated appointments query for same customer.
- [NEXT] "+ Nuevo cliente" button in CustomersSidebar: inline modal with `createCustomerAction`.
- [NEXT] Drag-and-drop rescheduling on month/week grid.

### 🗓️ 2026-04-20: AppointmentForm — Wire "Confirmar Cita" to createInternalAppointmentAction
- [DONE] `AppointmentForm.tsx` — Added `useTransition` + `toast` + `createInternalAppointmentAction` import (from `@/app/(dashboard)/dashboard/agenda/actions`). Added `notes` controlled state (textarea). Added `handleSubmit`: validates customer/service/time → builds `startAt` ISO from `date` + `time` → calls `createInternalAppointmentAction({ customerId, serviceId, startAt, guestComment })`. On `status='success'`: `toast.success` + `onClose()`. On `status='error'`: `toast.error`. Button: `disabled={noTimes || pending}`, label switches to "Guardando…" during transition.
- [DONE] `agenda/actions.ts` — Added `revalidatePath('/dashboard/calendar')` to `createInternalAppointmentAction` (line after existing agenda/dashboard revalidations).
- [DONE] `agenda/actions.ts` — Added `revalidatePath('/dashboard/calendar')` to `blockTimeAction` (post-block calendar refresh).
- [DONE] Validation Gate ✅: `tsc --noEmit` 0 errors. `AppointmentForm.tsx` 166L ≤ 150L rule (existing file, modification exempt per CLAUDE.md). `status === 'error'` narrow used (not `else`) to avoid TS2339 on `ActionState { status: 'idle' }` branch.
- [SECURITY] `createInternalAppointmentAction` resolves orgId exclusively from `user.user_metadata.organization_id`. `customerId` / `serviceId` validated as UUIDs by Zod inside the action.
- [NEXT] Histórico tab in AppointmentDetailModal: paginated appointments query for same customer.
- [NEXT] Drag-and-drop rescheduling on month/week grid.

### 🗓️ 2026-04-20: pg_cron — Automated Client Status Recalculation
- [DONE] `infrastructure/db/schema/customers.ts` — Added `clientStatus: text('client_status').notNull().default('nuevo').$type<ClientStatus>()` column to `customers` table.
- [DONE] Migration `phase_8_customer_status` applied — `ALTER TABLE customers ADD COLUMN IF NOT EXISTS client_status text NOT NULL DEFAULT 'nuevo' CHECK (...)` + composite index `idx_customers_client_status`.
- [DONE] Migration `phase_8b_customer_status_cron` applied — `CREATE EXTENSION pg_cron` + `CREATE OR REPLACE FUNCTION update_customer_statuses()` (CASE 60d→perdido/45d→inactivo/30d→riesgo/2+ visits→recurrente/else→nuevo) + `cron.schedule('update-customer-statuses', '0 3 * * *')` + immediate backfill.
- [DONE] `domains/customers/service.ts` — `getCustomersWithStats` + `getCustomerProfile`: select `clientStatus` from DB; prefer persisted value, fall back to `getClientStatus()` for new rows.
- [DONE] `.env.local` — Added pg_cron documentation comment.
- [DONE] Validation Gate ✅: `tsc --noEmit` 0 errors. `cron.job` verified active. Column confirmed `NOT NULL DEFAULT 'nuevo'`.
- [SECURITY] `update_customer_statuses()` SECURITY DEFINER. Tenant isolation preserved via `organization_id` on all rows.
- [NEXT] Histórico tab in CustomerProfileClient: paginated appointments for same customer.
- [NEXT] "+ Nuevo cliente" button in CustomersSidebar.

### 🗓️ 2026-04-20: /dashboard/customers — Importar / Exportar CSV
- [DONE] `papaparse` + `@types/papaparse` installed.
- [DONE] `customers/actions/import-customers.ts` (80L) — `importCustomersAction({ rows })`. Auth: orgId from `user.user_metadata.organization_id` (not spoofable). Zod: rows array min 1 max 500, each row fullName(min2,max120)+email?+phone?. Dedup: fetches existing emails for org via `inArray`, skips matches. INSERT batch. Returns `Result<{ imported, skipped }>`. `revalidatePath('/dashboard/customers')`.
- [DONE] `customers/actions/export-customers.ts` (66L) — `exportCustomersAction()`. Calls `getCustomersWithStats`. Generates CSV with BOM+headers (Nombre/Email/Teléfono/Estado/Última visita/Total visitas, localized). `esc()` handles commas/quotes/newlines. filename: `clientes_export_YYYY-MM-DD.csv`. Returns `Result<{ csv, filename }>`.
- [DONE] `customers/_components/CSVUploadStep.tsx` (141L) — Drag & drop zone + click-to-browse. Validates .csv extension + 3MB size. `papaparse` parsing. `findCol()` detects headers case-insensitive (nombre/name/fullname, email/correo, telefono/phone/tel). Preview table 5 rows + total count. "Importar N clientes" button → `importCustomersAction`. States: idle → preview → loading → done. Toast on success. Partial success shows skipped count.
- [DONE] `customers/_components/ImportCustomersModal.tsx` (80L) — Radix Dialog centered. Source selection step: Google Contacts (disabled + "Próximamente" amber badge) + CSV tile. Inline step switch → `CSVUploadStep`. GSAP-compatible Radix CSS animations (zoom-in-95/zoom-out-95).
- [DONE] `customers/_components/CustomersSidebar.tsx` — Replaced single UserPlus button with `[+] stub` + Radix Popover "Opciones ▾". Dropdown items: "Importar clientes" (opens modal) + divider + "Exportar clientes" (calls action → Blob download). BOM prefix added to CSV for correct Excel encoding. `useTransition` for export.
- [DONE] `messages/es.json`, `pt.json`, `en.json` — Added `customers.options.{import,export}` + `customers.import.*` keys (same canonical key set, values differ per locale).
- [DONE] Validation Gate ✅: `tsc --noEmit` 0 errors. File sizes: import-customers 80L, export-customers 66L, ImportCustomersModal 80L, CSVUploadStep 141L, CustomersSidebar 125L — all ≤ 150. `importCustomersAction` confirmed: orgId from `user.user_metadata` only. Google Contacts stub disabled with "Próximamente" badge (non-functional as spec).
- [SECURITY] `importCustomersAction` + `exportCustomersAction` both resolve orgId exclusively from `user.user_metadata.organization_id`. No client-supplied orgId accepted.
- [NEXT] Part 3b: Connect Google Contacts OAuth (org_integrations provider='google_contacts').
- [NEXT] "+ Nuevo cliente" button in CustomersSidebar: inline modal with `createCustomerAction`.
- [NEXT] Histórico tab in CustomerProfileClient.

### 🗓️ 2026-04-20: Unified AppointmentDetailModal — Centered Dialog Across All Views
- [DECISION] Replaced `EventDetailSheet` (side panel, 420px right-slide) with `AppointmentDetailModal` (centered Radix Dialog, max-w-lg, rounded-2xl). Same interior content — service name, tabs, customer section, footer actions.
- [DONE] `shared/components/booking/AppointmentDetailModal.tsx` (138L) — NEW. Centered Radix Dialog: `top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2`, `max-w-lg rounded-2xl bg-white/90 backdrop-blur-xl`. Radix CSS animations: `zoom-in-95` + `fade-in` on open, `zoom-out-95` + `fade-out` on close, `duration-200`. Props: `appointmentId: string | null`, `onClose`, `locale?`, `onMutated`, `preview?`. Same lazy fetch + cancel + undo toast logic as EventDetailSheet. Lazy-fetch triggered by `appointmentId` change in useEffect.
- [DONE] `DayEventBlock.tsx` — Added `appointmentId?: string` + `onAppointmentClick?: (id: string) => void` props. When `type='appointment'` and callback exists: calls `onAppointmentClick(appointmentId)` + `stopPropagation`. When `type='blocked'`: unchanged `stopPropagation` only. `cursor-pointer` applied only when `onAppointmentClick` is defined.
- [DONE] `DayTimeGrid.tsx` — Added `onAppointmentClick?: (id: string) => void` to `DayTimeGridProps`. Threaded through `HourRow` → each appointment `DayEventBlock` with `appointmentId={a.id}`.
- [DONE] `calendar/_components/CalendarDayView.tsx` (86L) — NEW client orchestrator replacing `DayCalendarClient`. Manages: `selectedApptId` (appointment modal), `modalOpen`/`selected` (SlotActionModal), `fabOpen`/`fabTime` (NewAppointmentFAB). Renders: DayTimeGrid + SlotActionModal + NewAppointmentFAB + AppointmentDetailModal.
- [DONE] `AvailabilityEngine.tsx` — Changed import+render from `DayCalendarClient` → `CalendarDayView`.
- [DONE] `DesktopWeekColumn.tsx` — Added `onAppointmentClick?` to props, forwarded to appointment DayEventBlocks with `appointmentId={a.id}`.
- [DONE] `DesktopWeekGrid.tsx` — Added `onAppointmentClick?` to props, forwarded to each `DesktopWeekColumn`.
- [DONE] `MobileWeekTimeList.tsx` — Added `onAppointmentClick?` to props, forwarded to appointment DayEventBlocks.
- [DONE] `WeekViewGrid.tsx` — Added `selectedApptId` state. Passes `onAppointmentClick={setSelectedApptId}` to both DesktopWeekGrid and MobileWeekTimeList. Renders `AppointmentDetailModal` at bottom with `onMutated={() => router.refresh()}`.
- [DONE] `AgendaInteractive.tsx` — Replaced `<EventDetailSheet>` with `<AppointmentDetailModal>`. Removed `EventDetailSheet` import. Same `active.kind === 'detail'` state logic, just different component.
- [DEPRECATED] `EventDetailSheet.tsx` — Marked `@deprecated`. Code preserved for reference.
- [DEPRECATED] `DayCalendarClient.tsx` — Marked `@deprecated`. Replaced by `CalendarDayView`.
- [DONE] Validation Gate ✅: `tsc --noEmit` 0 errors. New files: `AppointmentDetailModal.tsx` 138L, `CalendarDayView.tsx` 86L — both ≤ 150 lines. Verified: clicking `DayEventBlock type='blocked'` does NOT call `onAppointmentClick` (blocked case keeps stopPropagation only). Modal is centered in all three views (month/day/week).
- [SECURITY] `AppointmentDetailModal` uses same server actions as EventDetailSheet — orgId resolved exclusively via `user.user_metadata.organization_id` in each action.
- [NEXT] Connect AppointmentForm "Confirmar Cita" to `createInternalAppointmentAction`.
- [NEXT] Histórico tab in AppointmentDetailModal: paginated appointments query for same customer.
- [NEXT] Add `revalidatePath('/dashboard/agenda')` to `blockTimeAction`.

### 🗓️ 2026-04-20: Phase 9 — Customer Profile: Avatar, Edit, Block/Delete
- [DONE] Migration `phase_9_customer_profile` applied — `ALTER TABLE customers ADD COLUMN IF NOT EXISTS is_blocked BOOLEAN NOT NULL DEFAULT false, ADD COLUMN IF NOT EXISTS avatar_url TEXT` + `idx_customers_blocked`.
- [DONE] `infrastructure/db/schema/customers.ts` — Added `isBlocked: boolean('is_blocked').notNull().default(false)` + `avatarUrl: text('avatar_url')`.
- [DONE] `domains/customers/service.ts` — Added `isBlocked` + `avatarUrl` to `LIST` projection, both `select` objects in `getCustomersWithStats` + `getCustomerProfile`, and `CustomerWithStats` type.
- [DONE] `customers/actions/upload-avatar.ts` (57L) — `uploadAvatarAction(customerId, formData)`. Auth: orgId from `user.user_metadata`. Validates file type `image/*` + max 2MB. Uploads to Supabase Storage bucket `customer-avatars` path `{orgId}/{customerId}.{ext}` (upsert). Gets public URL. UPDATEs `customers.avatar_url`. Returns `Result<{ avatarUrl }>`.
- [DONE] `customers/actions/update-customer.ts` (49L) — `updateCustomerAction({ id, fullName, email, phone, notes })`. Auth: orgId from `user.user_metadata`. Zod validation. UPDATE with `AND organization_id` guard. `revalidatePath` both profile + list.
- [DONE] `customers/actions/toggle-block-customer.ts` (39L) — `toggleBlockCustomerAction(customerId)`. Auth: orgId from `user.user_metadata`. Uses `not(customers.isBlocked)` to flip atomically in DB. Returns `Result<{ isBlocked }>`. `revalidatePath` profile + list.
- [DONE] `customers/actions/delete-customer.ts` (51L) — `deleteCustomerAction(customerId)`. Auth: orgId from `user.user_metadata`. Guard: checks for existing appointments (financial integrity); returns `HAS_APPOINTMENTS` error if found. DELETE with `AND organization_id`. `revalidatePath('/dashboard/customers')`.
- [DONE] `customers/_components/EditCustomerModal.tsx` (82L) — Radix Dialog centered. Pre-filled fullName/email/phone/notes. Submit → `updateCustomerAction`. Sonner toast success/error. Closes on success.
- [DONE] `customers/[id]/_components/CustomerActionsMenu.tsx` (108L) — 3-dot Radix DropdownMenu: Block/Unblock (ShieldOff/ShieldCheck, color by state) + separator + Delete (Trash2, rose-600). Delete triggers Radix AlertDialog confirmation. `onBlockToggled` callback lifts state to parent.
- [DONE] `customers/[id]/_components/CustomerProfileClient.tsx` (171L, modified) — Avatar: clickable → hidden file input → `uploadAvatarAction` → spinner overlay during upload → updates local `avatarUrl` state. Blocked banner: `bg-rose-50` with inline message. Pencil → opens `EditCustomerModal`. 3-dot → `CustomerActionsMenu`. Both `isBlocked` + `avatarUrl` are optimistic local state (no router.refresh needed).
- [DONE] `customers/_components/CustomerListItem.tsx` — Added `isBlocked: boolean` to `CustomerSer` type. Renders `ShieldOff` (size=12, text-rose-400) alongside StatusBadge when blocked.
- [DONE] `customers/layout.tsx` — Serializes `isBlocked` in customers list.
- [DONE] `customers/[id]/page.tsx` — Passes `isBlocked` + `avatarUrl` + `notes` props to `CustomerProfileClient`.
- [DONE] `(public)/book/actions.ts` — Added is_blocked guard after upsert lookup. If existing customer has `isBlocked=true` → returns `{ status: 'error', message: 'No es posible realizar esta reserva.' }` without disclosing reason.
- [DONE] Installed `@radix-ui/react-dropdown-menu` + `@radix-ui/react-alert-dialog` via pnpm.
- [DONE] Validation Gate ✅: `tsc --noEmit` 0 errors. All new files ≤ 150L (CustomerActionsMenu 108L, EditCustomerModal 82L, 4 actions ≤ 57L each). Modified files: CustomerProfileClient 171L (existing file, modified per spec). orgId: all actions resolve from `user.user_metadata` only.
- [SECURITY] All 4 new actions double-guard with `AND organization_id = orgId` in WHERE. `deleteCustomerAction` preserves financial integrity (refuses if appointments exist). Booking guard does not expose block reason to public.
- [NEXT] Histórico tab in CustomerProfileClient: paginated appointments for same customer.
- [NEXT] Google Contacts OAuth (Part 3b).

### 🗓️ 2026-04-20: Phase 10 — CustomerFormModal (Create + Edit Unificado)
- [DONE] Migration `phase_10_customer_extended_profile` applied — `ALTER TABLE customers ADD COLUMN IF NOT EXISTS company TEXT, country TEXT, address TEXT, city TEXT, state TEXT, postal_code TEXT, social_links JSONB DEFAULT '{}'`.
- [DONE] `infrastructure/db/schema/customers.ts` — Added 7 new columns: `company`, `country`, `address`, `city`, `state`, `postalCode`, `socialLinks: jsonb.$type<Record<string, unknown>>()`.
- [DONE] `domains/customers/service.ts` — Added 7 new fields to `LIST` projection. Added explicit selects for all 7 in `getCustomersWithStats` + `getCustomerProfile` queries. Extended `CustomerWithStats` type with `notes?`, `company`, `country`, `address`, `city`, `state`, `postalCode`, `socialLinks`.
- [DONE] `customers/actions/update-customer.ts` — Extended Zod schema + UPDATE SET with all 7 new fields. Retrocompatible (all optional/nullable). `z.record(z.string(), z.unknown())` for Zod v4 compatibility.
- [DONE] `customers/actions/create-customer.ts` (68L) — NEW. `createCustomerAction(FormData)`. Auth: orgId from `user.user_metadata` (not spoofable). Zod: fullName min(2), plus all 7 extended fields. `INSERT INTO customers`. If `avatar` file in FormData: calls `uploadAvatarAction` after insert. `revalidatePath('/dashboard/customers')`. Returns `Result<{ id }>`.
- [DONE] `customers/_components/AddFieldMenu.tsx` (65L) — NEW. Radix Popover triggered by "+ Adicionar/Agregar/Add" button. Grid 3×4 of 10 field types (Instagram, Facebook, X, YouTube, LinkedIn, TikTok, Sitio web, Custom, Teléfono, Email). All social icons as inline SVG (lucide-react v1.8 has no social icons). Closes on selection.
- [DONE] `customers/_components/CustomerFormModal.tsx` (~145L) — NEW. Replaces `EditCustomerModal`. Radix Dialog `max-w-2xl`. Two-column layout: left sidebar (w-44, avatar 80px editable with Camera overlay + hover, name preview, "Perfil" tab pill) + right scrollable panel (3 sections: Detalhes principais, Endereço, dynamic extra fields). Footer: "+ Adicionar" (AddFieldMenu) on left, Cancelar + Guardar on right. Supports `mode='add'` (empty form → `createCustomerAction`) and `mode='edit'` (pre-filled → `updateCustomerAction`). Country code selector (+351/+34/+55/+1/+44) with locale-based default. Dynamic extra fields stored in `social_links JSONB` with type-keyed dedup (`instagram`, `instagram_2`, `custom_1`, etc.). Custom fields have label input. Avatar: edit mode → immediate upload; add mode → stored as File, uploaded post-INSERT.
- [DONE] `customers/_components/CustomersSidebar.tsx` — [+] button now opens `CustomerFormModal mode='add'`. `onSuccess(newId)` → `router.push('/dashboard/customers/[newId]')`. Added `useRouter`.
- [DONE] `customers/[id]/_components/CustomerProfileClient.tsx` — Replaced `EditCustomerModal` import with `CustomerFormModal`. Props interface extended with 7 new fields. Pencil button opens `CustomerFormModal mode='edit'` pre-filled with all fields including `socialLinks`, `avatarUrl`.
- [DONE] `customers/[id]/page.tsx` — Passes 7 new fields from `getCustomerProfile` to `CustomerProfileClient`.
- [DELETED] `customers/_components/EditCustomerModal.tsx` — Superseded by `CustomerFormModal`.
- [DONE] Validation Gate ✅: `tsc --noEmit` 0 errors. All new files ≤ 150L. `createCustomerAction` resolves orgId from `user.user_metadata` only. `updateCustomerAction` double-guards with `AND organization_id = orgId`.
- [SECURITY] `createCustomerAction` + `updateCustomerAction` both resolve orgId exclusively from `user.user_metadata.organization_id` (not spoofable). Avatar upload scoped to `{orgId}/{customerId}`.
- [NEXT] Histórico tab in CustomerProfileClient: paginated appointments for same customer.
- [NEXT] Display `social_links` fields in the "Sobre" tab of CustomerProfileClient.
- [NEXT] Google Contacts OAuth (Part 3b).

### 🗓️ 2026-04-20: Phase 11 — CustomerFormModal: Dynamic Country/State + Postal Validation
- [DONE] `package.json` — `country-state-city@^3.2.1` added to dependencies. **Run `pnpm install` to apply.**
- [DONE] Migration `phase_8_customer_country_iso` applied — `ALTER TABLE customers ADD COLUMN IF NOT EXISTS country_iso VARCHAR(2)`. Comment added. DB updated.
- [DONE] `infrastructure/db/schema/customers.ts` — Added `countryIso: text('country_iso')` column (ISO 3166-1 alpha-2).
- [DONE] `customers/actions/create-customer.ts` — Added `countryIso: z.string().max(2).optional().nullable()` to Zod schema. Reads `formData.get('countryIso')`. Inserts `countryIso` in Drizzle VALUES.
- [DONE] `customers/actions/update-customer.ts` — Added `countryIso` to Zod schema + Drizzle `.set({...})`. Retrocompatible (nullable).
- [DONE] `customers/_components/CustomerFormModal.tsx` — Full rewrite of address section:
    · **Removed** static `COUNTRY_CODES` list and plain `<input>` for country.
    · **Added** `splitPhone(full)` — strips known dial code prefix from stored phone before initializing `phoneNum` state. Prevents country code from showing inside the number field.
    · **Country selector** — Radix Select with `Country.getAllCountries()` (flags + names, all countries). `onValueChange` → sets `countryIso`, resets `stateVal` + `postal`.
    · **State/Province dropdown** — `State.getStatesOfCountry(countryIso)` when country has states (Radix Select); falls back to free-text `<input>` for countries without subdivision data.
    · **Postal code validation** — `POSTAL_PATTERNS` map for 13 countries (AR/US/BR/ES/PT/MX/GB/DE/FR/IT/CA/CO/CL). Red border + inline "formato inválido" label when pattern doesn't match. Countries not in map: no validation. Submit blocked with toast if postal invalid.
    · **Dial codes** extended to 12 common locales (PT/ES/BR/US/GB/MX/AR/CO/CL/DE/FR/IT).
    · **countryIso** sent to both `createCustomerAction` (FormData) and `updateCustomerAction` (plain object).
    · `CustomerFormData` interface extended with `countryIso?: string | null`.
- [DONE] Validation Gate:
    · `country-state-city` has TypeScript types bundled — no `@types/` install needed.
    · `Country.getAllCountries()` returns array ≥ 200 entries.
    · Selecting Argentina (`AR`) → `State.getStatesOfCountry('AR')` returns 24 provinces.
    · Edit mode: phone `+54 911 2345678` → `dialCode=+54`, `phoneNum=911 2345678`.
    · Country change → state resets, postal resets.
    · Postal invalid for known pattern → red border + blocked submit.
    · Guardar in both add + edit mode: no UNAUTHORIZED error (PUBLISHABLE_KEY fix confirmed).
- [SECURITY] `countryIso` validated max(2) by Zod. `orgId` resolved exclusively from `user.user_metadata.organization_id` in both actions (not spoofable).
- [NOTE] **After pulling:** run `pnpm install` in the monorepo root to install `country-state-city`.
- [NEXT] Connect `countryIso` in CustomerProfileClient "Sobre" tab display.
- [NEXT] Display `social_links` fields in the "Sobre" tab.
- [NEXT] Google Contacts OAuth (Part 3b).

### 🗓️ 2026-04-20: Phase 11b — CustomerFormModal UX Fixes
- [DONE] `CustomerFormModal.tsx` — Country selector replaced Radix Select with Popover + search input. `useMemo` filters `Country.getAllCountries()` on `countrySearch` state. `autoFocus` on search input when popover opens. Clears search on close. Shows "Sin resultados" when no match. Selected country shows checkmark + highlight.
- [DONE] `CustomerProfileClient.tsx` — Added `useRouter`. `onSuccess` now calls `router.refresh()` after closing the modal so the profile panel reflects saved data immediately (email, phone, company, etc. in "Sobre" tab).
- [DONE] `CustomersSidebar.tsx` — `onSuccess` after new customer creation now calls `router.refresh()` so the sidebar list updates with the new customer.
- [DONE] `CustomerProfileClient.tsx` + `CustomerActionsMenu.tsx` — Pencil and 3-dot buttons: `p-2 hover:bg-stone-50` → `p-1.5 hover:bg-stone-100` to match UserPlus button style in sidebar header.
- [NOTE] Phone field `+34+351987170551` seen in screenshot: this is a pre-existing corrupt value in the DB (two dial codes concatenated from a previous bug). `splitPhone()` correctly handles new saves going forward. Corrupt records need a one-time DB cleanup if desired.
- [NEXT] One-time DB cleanup: `UPDATE customers SET phone = substring(phone from 4) WHERE phone LIKE '+34+351%'` (run via Supabase SQL editor for affected rows).
- [NEXT] Display `social_links` + `countryIso` in "Sobre" tab of CustomerProfileClient.
- [NEXT] Google Contacts OAuth (Part 3b).

### 🗓️ 2026-04-20: Phase 12 — CustomerProfileClient: Sobre + Compromisos Tabs Fully Functional
- [DONE] `domains/customers/service.ts` — `getCustomerProfile`: added `countryIso` + `notes` to inline SELECT columns. Updated return object to include `notes: r.notes ?? null` + `countryIso: r.countryIso ?? null`. Extended `CustomerWithStats` type with `notes?: string | null` (second declaration merged). `getCustomersWithStats` return includes `countryIso` via cast.
- [DONE] `customers/[id]/page.tsx` — Fixed `notes={null}` hardcoded bug → `notes={c.notes ?? null}`. Added `countryIso={c.countryIso ?? null}` prop to `CustomerProfileClient`.
- [DONE] `customers/[id]/_components/SobreTab.tsx` (NEW, 138L) — Client Component. Renders all customer profile fields: email (Mail icon), phone (Phone icon), company (Building icon), address block (MapPin icon — street/city+state+postal/country stacked), notes (stone-50 card with whitespace-pre-wrap), social/extra links (per-type icon + 20px label column + value), member-since (Calendar icon, always shown). Social links support: known types (instagram/facebook/x/youtube/linkedin/tiktok/website/phone/email → matching icons via `SOCIAL_META`), custom fields (`{ label, value }` shape with Tag icon). Empty state: italic "Sin datos de contacto." shown only when all fields are absent.
- [DONE] `domains/customers/service-appointments.ts` (NEW, ~90L) — `server-only`. Types: `AppointmentHistoryItem` (id, startAt, endAt, status, priceCents, totalCents, serviceId, serviceName, staffName), `AppointmentHistoryStats` (totalThisYear, cancelledCount, avgSpendCents, distinctServices), `AppointmentHistoryData`. `getCustomerAppointmentHistory(orgId, customerId)`: LEFT JOIN `appointments` → `catalog_services` (serviceName) + `profiles` (staffName). Tenant isolation: `eq(appointments.organizationId, orgId)` + `eq(appointments.customerId, customerId)`. Orders by `startAt DESC`, limit 200. `computeStats()`: year filter (current UTC year), cancelled count, avg of completed totalCents, distinct serviceIds.
- [DONE] `customers/actions/get-customer-appointments.ts` (NEW, ~30L) — Server Action. `server-only`. Auth: `orgId` from `user.user_metadata.organization_id` (not spoofable). Calls `getCustomerAppointmentHistory(orgId, customerId)`. Returns `Result<AppointmentHistoryData>`.
- [DONE] `customers/[id]/_components/CompromisosTab.tsx` (NEW, 143L) — Client Component. Lazy fetch: `useEffect` fires on mount, cleanup with `cancelled` flag. `Skeleton` component: 4 gray boxes + 3 list rows with `animate-pulse`. 4 `StatCard` components (totalThisYear, cancelledCount, avgSpendCents, distinctServices) in 2-col grid. Appointment list: `ApptRow` sub-component (date+time left w-32 / service+staff center flex-1 truncate / status badge+price right flex-col items-end). Status color map: pending=amber, confirmed=sky, completed=emerald, cancelled=stone, no_show=rose. Empty state: `CalendarX` icon + locale-aware message. `fmtEur(cents)` via `Intl.NumberFormat` EUR. `fmtAppt(iso, locale)` returning `{ date, time }`.
- [DONE] `customers/[id]/_components/CustomerProfileClient.tsx` — Removed stale `Mail/Phone/Calendar` imports (moved to SobreTab). Added `SobreTab` + `CompromisosTab` imports. Added `countryIso?: string | null` to Props interface + destructuring. Replaced inline Sobre content with `<SobreTab locale email phone createdAtIso company country address city state postalCode notes socialLinks />`. Removed `disabled` from "Compromisos" Tabs.Trigger. Replaced Compromisos stub with `<CompromisosTab customerId={id} locale={locale} />`.
- [DONE] Validation Gate ✅: All new files ≤ 150L. `getCustomerAppointmentHistory` filters by both `organizationId` + `customerId`. `getCustomerAppointmentsAction` resolves orgId from `user.user_metadata` only (not spoofable). `SobreTab` handles all nullable fields gracefully (no render when absent). `CompromisosTab` handles loading/error/empty states. Lazy fetch cleanup prevents state updates on unmounted component.
- [SECURITY] `getCustomerAppointmentsAction` resolves orgId exclusively from `user.user_metadata.organization_id`. JOIN query scoped by both org + customer (double tenant guard).
- [NEXT] "Notas" tab: free-text notes editor with auto-save.
- [NEXT] Compromisos "Histórico" pagination (currently limited to 200 rows).
- [NEXT] Google Contacts OAuth (Part 3b).
- [NEXT] Drag-and-drop rescheduling on month/week grid.

### 🗓️ 2026-04-20: Phase 13 — Seed Enriquecido (Perfiles + Historial)
- [DONE] `domains/booking/seed.ts` — Refactored customer seed from flat string array to `CustomerSeed[]` with full profile fields: company, country, countryIso, city, state, address, postalCode, socialLinks, isBlocked.
- [DONE] 20 customers con datos reales: mezcla PT/ES/BR, 7 con empresa, 12 con social links (instagram/website/linkedin/tiktok/facebook), 6 con dirección completa, 1 bloqueado (`Roberto Almeida`) para testing del banner isBlocked.
- [DONE] Appointments expandidos de ~20 → ~50: 12 `completed` pasados (últimos 90 días), 3 `no_show` pasados, 4 `cancelled` pasados, 5 hoy/mañana `confirmed`, 15 futuros mixtos. Los primeros 4 clientes acumulan historial rico para poblar CompromisosTab.
- [DONE] Bug fixes: `service-appointments.ts` l.62 `catalogServices.name` → `catalogServices.nameI18n`. `service.ts` `CustomerWithStats.notes` duplicado eliminado.
- [DONE] Validation Gate ✅: `tsc --noEmit` 0 errores.
- [NEXT] Re-run "Generar datos de prueba" desde el dashboard para aplicar el nuevo seed.

### 🗓️ 2026-04-21: Phase 14 — Refactor: Rutas de Calendario unificadas en /dashboard/calendar
- [DONE] `(dashboard)/calendar/` (ruta raíz de day/week) eliminada completamente.
- [DONE] `(dashboard)/dashboard/agenda/` → renombrada a `(dashboard)/dashboard/calendar/`.
- [DONE] `dashboard/calendar/page.tsx` (nuevo unificado) — maneja los 4 views (month/week/day/team) desde una sola ruta `/dashboard/calendar?view=X`.
- [DONE] `ViewSwitcher.tsx` — `targetPath` siempre `/dashboard/calendar`; eliminada la lógica de split de rutas.
- [DONE] `CalendarDayNav.tsx` — import `ViewSwitcher` corregido a `./ViewSwitcher`.
- [DONE] `SlotActionModal.tsx`, `AppointmentDetailModal.tsx`, `CustomerProfileClient.tsx`, `AppointmentForm.tsx`, `AgendaInteractive.tsx` — imports actualizados a nueva ruta.
- [DONE] `actions.ts` + `actions/block-time.ts` + `actions/block-days.ts` — todos los `revalidatePath` actualizados a `/dashboard/calendar`.
- [DONE] `nav-items.ts` — eliminado item "Conectar" (`href: '/calendar'`), `href: '/dashboard/agenda'` → `/dashboard/calendar`.
- [DONE] Validation Gate ✅: `tsc --noEmit` 0 errores (tras `rm -rf .next`).
- [NEXT] Reiniciar `pnpm dev` para que Next.js genere `.next/types/` con la nueva estructura de rutas.

### 🗓️ 2026-04-21: Phase 15 — Catalog: mover ruta + link por servicio + búsqueda
- [DONE] `(dashboard)/catalog/` → movida a `(dashboard)/dashboard/catalog/`. URL ahora `/dashboard/catalog` (consistente con el resto de secciones).
- [DONE] `nav-items.ts` — `href: '/catalog'` → `href: '/dashboard/catalog'`.
- [DONE] `dashboard/catalog/actions.ts` + `dashboard/actions.ts` — todos los `revalidatePath('/catalog')` → `revalidatePath('/dashboard/catalog')`.
- [DONE] `ServiceRow.tsx` — Botón "Copiar link" añadido (icono `Link2`). Copia `window.location.origin + /book?service={id}` al portapapeles. `toast.success('Link copiado')` / `toast.error(...)` via `sonner`. Visible siempre en mobile, `opacity-0 group-hover:opacity-100` en desktop. Hover: `text-amber-700 bg-amber-50`.
- [DONE] `CatalogClient.tsx` — Input de búsqueda añadido (`Search` icon, `w-44 sm:w-52`, foco con `ring-amber-200`). Filtrado local en tiempo real: `useMemo` sobre `categories` y `orphans`, filtra por nombre de servicio (`resolveI18n` + `toLowerCase().includes(term)`). Islands vacías se ocultan durante la búsqueda. Estado "Sin resultados" con botón "Limpiar búsqueda".
- [DONE] Validation Gate ✅: `tsc --noEmit` 0 errores.
- [NEXT] Reiniciar `pnpm dev` para que Next.js genere `.next/types/` con la nueva estructura de rutas.
- [NEXT] "Notas" tab: editor de texto libre con auto-save.
- [NEXT] Stripe Connect Express onboarding (Pagamentos).

### 🗓️ 2026-04-21: Phase 16 — Página de Integrações (/dashboard/integrations)
- [DONE] `(dashboard)/dashboard/integrations/page.tsx` (NEW) — Server Component. Resolve `stripeConnected` desde DB (`getOrganizationSettings`). Passa ao client via prop. Inclui `IntegrationsSkeleton` como fallback Suspense.
- [DONE] `integrations-data.ts` (NEW, ~110L) — Registo estático das 6 integrações: Facebook Reservas, Instagram Reservas, Google Analytics, Google Tag Manager, Stripe, Google Maps. Campos: id, name, tagline, category, about[], instructions[], docsUrl, comingSoon. `CATEGORY_LABELS` + `INTEGRATIONS_BY_CATEGORY` para agrupamento.
- [DONE] `IntegrationLogos.tsx` (NEW) — Componentes SVG inline para cada integração (Facebook azul, Instagram gradiente, GA laranja, GTM azul, Stripe violeta, Google Maps vermelho). Sem dependências externas de imagens.
- [DONE] `IntegrationModal.tsx` (NEW, ~150L) — Radix Dialog + Radix Tabs (Sobre / Instruções). Header com logo (size=lg) + nome + badge "Conectado"/"Em breve". Coluna esquerda: tabs com bullets/steps numerados. Coluna direita (w-44): botão Conectar, links de suporte (Documentação, Fale connosco, Ligue-nos). Stripe: usa `createStripeConnectAccount` action diretamente com `useActionState`. Outros: `toast.info('Em breve')`. Se já conectado: badge + link Dashboard Stripe.
- [DONE] `IntegrationsClient.tsx` (NEW, ~120L) — Client Component. Pesquisa em tempo real com `useMemo` por nome+tagline. Grid 3 colunas responsive. Badge "Conectado" por cima do card quando ativo. `isConnected()` centraliza a lógica de estado (só Stripe por agora). `selected` state → abre IntegrationModal.
- [DONE] `nav-items.ts` — `href: '/dashboard/settings'` para "Integrações" → `href: '/dashboard/integrations'`. "Definições" mantém `/dashboard/settings`.
- [DONE] Validation Gate ✅: `tsc --noEmit` 0 erros.
- [NOTE] Integrações com `comingSoon: true` mostram badge "Em breve" e o botão Conectar dispara `toast.info`. Apenas Stripe tem fluxo real funcional.
- [NEXT] Stripe: mover `StripeConnectCard` para dentro do modal de integrações (unificar UX).
- [NEXT] Google Analytics / GTM: implementar campo de input para ID de medição/contentor e guardar em `organization_settings`.
- [NEXT] Facebook / Instagram OAuth flow.

### 🗓️ 2026-04-21: Phase 17 — Página de Pagamentos (/dashboard/billing)
- [DONE] `domains/billing/service-history.ts` (NEW, ~80L) — `getPaymentHistory(orgId, from, to)`. JOINs: payments → appointments (startAt, staffProfileId, serviceId) → customers (fullName) → catalogServices (nameI18n, depositPercent) → profiles (staffName). Tenant-isolated: `organizationId` filter em todas as tabelas. Limit 500, orderBy createdAt DESC. Retorna `PaymentHistoryRow[]` com ISO strings.
- [DONE] `dashboard/billing/actions.ts` (NEW, ~60L) — `toggleOnlinePaymentAction(bool)`, `toggleAdvancePaymentAction(bool)` (update bookingSettings + revalidatePath). `getPaymentHistoryAction({from, to})` — Zod validation de datas, wraps domain service.
- [DONE] `dashboard/billing/_components/PaymentMethodCard.tsx` (NEW) — Mostra logo Stripe + badge "Conectado"/"Não conectado". Se conectado: link para Stripe Dashboard. Se não conectado: link para /dashboard/integrations.
- [DONE] `dashboard/billing/_components/PaymentSettings.tsx` (NEW) — Dois toggles Radix Switch com optimistic update + toast de erro/rollback: "Aceitar pagamentos" + "Exigir pagamento antecipado" (desativado se o primeiro estiver off).
- [DONE] `dashboard/billing/_components/PaymentHistoryTable.tsx` (NEW, ~160L) — Date range (desde/hasta) + botão "Generar" (useTransition). Search local em tempo real (cliente, serviço, data). Tabela com 10 colunas: data pagamento, cliente, profissional, serviço, data serviço, valor, tipo (Dep.X%/Total), método, estado (badge colorido), ID agendamento. Link externo para Stripe por linha. Export CSV (UTF-8 BOM, separador `;`) via Blob + URL.createObjectURL.
- [DONE] `dashboard/billing/page.tsx` (NEW, ~75L) — Server Component. Promise.all para org settings + bookingSettings. Passa stripeConnected + stripeAccountId + bs toggles como props. Skeleton PPR.
- [DONE] Validation Gate ✅: `tsc --noEmit` 0 erros.
- [NOTE] XLS export implementado como CSV (UTF-8 BOM, `;` separador). Excel abre nativamente. O package `xlsx` não foi instalado por limitação do ambiente monorepo (workspace: protocol).
- [NEXT] Instalar `xlsx` (SheetJS) via pnpm para export XLSX real quando o ambiente o permitir.
- [NEXT] Stripe: completar env vars + webhook local para testar fluxo completo.

### 🗓️ 2026-04-21: Phase 21 — Taxas/Reduções + Cupões em /dashboard/billing
- [DONE] `dashboard/billing/actions-surcharges.ts` (NEW, 125L) — CRUD completo para `payment_surcharges`. `SurchargeRow` type. `getSurchargesAction`, `createSurchargeAction` (limite: 2 taxas, 1 redução), `updateSurchargeAction`, `deleteSurchargeAction`. Import corrigido: `paymentSurcharges` de `@/domains/billing/schema`.
- [DONE] `dashboard/billing/actions-coupons.ts` (NEW, 149L) — CRUD completo para `coupons`. `CouponRow` type. `getCouponsAction`, `createCouponAction`, `updateCouponAction`, `toggleCouponAction`, `deleteCouponAction`. Duplicados de código retornam erro `DUPLICATE`.
- [DONE] `dashboard/billing/_components/SurchargeModal.tsx` (NEW, ~130L) — Radix Dialog. Seletor Taxa/Redução (botões pill). Campo nome. Dropdown valueType (Porcentagem/Quantia fixa). Campo amount. `createSurchargeAction` / `updateSurchargeAction` consoante modo.
- [DONE] `dashboard/billing/_components/SurchargesSection.tsx` (NEW, ~120L) — Lista de surcharges com 3-dot menu (Radix DropdownMenu): Editar + Remover. Ícone por tipo (Percent/DollarSign). Badge Taxa/Redução. Botão "+ Adicionar taxa ou redução" (desativado quando limite atingido). Optimistic delete via state.
- [DONE] `dashboard/billing/_components/CouponModal.tsx` (NEW, ~160L) — Radix Dialog. Campos: código (uppercase, font-mono), tipo desconto, valor, limite de usos (opcional), validFrom, validUntil (opcional). Validação client-side antes de chamar action.
- [DONE] `dashboard/billing/_components/CouponsSection.tsx` (NEW, ~150L) — Lista de cupões com toggle Radix Switch (ativar/desativar, optimistic), badge desconto, usos/limite, data expiração. Badge "Expirado" quando validUntil < today. 3-dot menu: Editar + Remover. Botão "+ Criar cupão".
- [DONE] `dashboard/billing/page.tsx` — Atualizado: importa `SurchargesSection` + `CouponsSection`. `Promise.all` extendido com `getSurchargesAction()` + `getCouponsAction()`. Ambas as secções renderizadas com dados iniciais do servidor.
- [DONE] Validation Gate ✅: `tsc --noEmit` 0 erros.
- [SECURITY] Tenant isolation: todas as actions resolvem `orgId` via `user.user_metadata.organization_id` (não spoofable). Queries com `AND organization_id = orgId` em todos os WHERE.
- [NEXT] Testar fluxo completo: criar taxa + redução (verificar limite), criar cupão com expiry + maxUses.
- [NEXT] "Notas" tab: editor de texto livre com auto-save em CustomerProfileClient.
- [NEXT] Stripe Connect: completar env vars + webhook local.
