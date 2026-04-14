# STANDARDS.md: El Manual de Calidad (SkinSystem)

This document is the SkinSystem Technical Charter. Its purpose is to coordinate the tools defined in `TECH_STACK.md` within the framework of `ARCHITECTURE.md`, ensuring compliance with the processes outlined in `WORKFLOWS.md`.

---

## 1. Naming Jurisdictions
*Note: See `ARCHITECTURE.md` for the location of each file type.*
- **PascalCase**: React Components (`ServiceCard.tsx`), TypeScript Interfaces and Types.
- **camelCase**: Functions (`getBooking`), variables, hooks, and properties of JavaScript objects.
- **snake_case**: Database (PostgreSQL/Drizzle). Tables (`beauty_services`) and columns (`organization_id`).
- **kebab-case**: File system and URLs. Folders and slugs.

## 2. Coding Rules
- **Modularity**: Functions < 50 lines.
- **Thin Controllers**: API and Server Actions routes only validate and delegate. The business logic resides exclusively in the domains defined in `ARCHITECTURE.md`.
- **Hooks**: Reusable UI logic in `src/shared/hooks`.

## 3. Error Prevention and Status Codes
*Reference: See `WORKFLOWS.md` to define business conflict states.*
- **Format**: Always return `{ data: T | null; error: AppError | null }`.
- **409 Conflict**: Mandatory when a rule in `WORKFLOWS.md` is breached (e.g. appointment overlap).
- **Zod First**: Mandatory validation using the libraries in `TECH_STACK.md`.

## 4. Documentation Standards
- **JSDoc**: Mandatory for domain functions.
- **Mermaid**: Complex workflows from `WORKFLOWS.md` (e.g. Payment and Booking) must be visually documented in the code.

## 5. "Screaming" Architecture
*Reference: See detailed folder map in `ARCHITECTURE.md`.*
- `src/domains/booking`: Booking engine.
- `src/domains/catalog`: Independent data islands (Lourdes/Gloria).
- `src/domains/customers`: CRM and technical sheets.
- `src/domains/billing`: Fiscal management and Stripe integration.

## 6. Security and Database (Drizzle Policy)
*Reference: See Supabase/Drizzle configuration in `TECH_STACK.md`.*
- **Row Level Security (RLS)**: No query bypasses the `organization_id` filter.
- **Zero SELECT ***: Explicitly define columns to avoid data leaks between tenants.
- **Audit Logs**: Mandatory logging of Super Admin actions (See `IDENTITY.md` for access levels).

## 7. Modern APIs Implementation (Next.js 15)
*Reference: See framework versions in `TECH_STACK.md`.*
- **Async APIs**: Mandatory use for `cookies()`, `headers()`, and `params`.
- **Streaming**: Use of `Suspense` and Skeletons to maintain the editorial aesthetic of `DESIGN_SYSTEM.md`.

## 8. Asset and Multimedia Management
*Reference: See storage limits in `TECH_STACK.md`.*
- **Design**: `.webp` or `.avif`.
- **Tracking (Specialists)**: PNG/JPG/JPEG accepted; automatic optimization to `.webp`.
- **Privacy**: Signed URLs (60 min) to protect client photos.

## 9. i18n Rigor (ES, PT, EN)
*Reference: See locale context in `IDENTITY.md`.*
- **Internationalization**: All visible text must use translation keys.
- **Formats**: Use of `Intl API` for currency and dates according to the tenant.
- **Timezones**: Store in UTC, display in the timezone defined in the specialist's profile.

## 10. Cross-Platform Sync (Mac/Windows)
- **Git**: Configuration `autocrlf input` (LF).
- **Sync**: Initial `git pull` and final `git push` in each session (Mac M4 / Asus TUF).
- **Env**: Manual synchronization of `.env.local`.

## 11. Performance & Accessibility Targets

### 1. Core Web Vitals (Elite Level)
- **LCP (Largest Contentful Paint)**: < 1.2s.
- **CLS (Cumulative Layout Shift)**: < 0.05.
- **TBT (Total Blocking Time)**: < 100ms.

### 2. Inclusivity (WCAG 3.0)
- **Level**: Target "Silver" (Plata) as baseline.
- **Touch Targets**: Minimum 44x44px for all interactive elements.
- **Contrast**: Minimum 4.5:1 for body text (16px+).
- **Keyboard**: 100% of workflows must be executable via keyboard (Tab/Focus management).

## 12. Seguridad y Privacidad de Datos (GDPR-Ready)

### Encriptación de Datos Sensibles
- **At-Rest**: The fields of "Medical Notes" or "Allergies" must be encrypted in the DB using AES-256.
- **In-Transit**: Mandatory TLS 1.3 for all communication with the API.

### Aislamiento de Integraciones
- The API Keys of Meta, Google and Mailchimp of Lourdes **never** must be accessible from the context of Gloria. They are stored securely in the `organization_configs` table.

### Derecho al Olvido (Cleanup)
- The system must allow the total deletion of a client's record (including assets in Supabase Storage) without affecting the integrity of the organization's financial reports.

## 13. Clinical Data Integrity and No-Show Policy
- **Auto-Lock**: Medical record views (`/customers/[id]`) expire after 10 minutes of inactivity.
- **Re-Auth**: Access to photos and sensitive notes requires re-authentication (Biometrics via WebAuthn or quick PIN).
- **No-Show Policy**: If a client does not attend, they are marked as `status: NO_SHOW`. The system must alert the specialist in future bookings of this client.

## 14. Multilingual Logic (PDF & WhatsApp)
- **WhatsApp**: The language is strictly based on the `locale` selected by the client when booking (ES/PT/EN).
- **Clinical PDF**: 
  - Automatic pre-selection according to the client's `locale`.
  - **Specialist Control**: Interface with 3 buttons (ES | PT | EN) so Lourdes/Gloria can force the document language before generating it.

## 15. Refund and Commission Policy
- **Refund Logic**: Refunds are processed as `Appointment_Value - Stripe_Commission`. 
- **Transparency**: The system must show a clear breakdown before confirming the refund: "[X]€ will be returned (Non-refundable bank commission of [Y]€)".

## 16. Automatic Appointment Lifecycle
- **Confirmed ➔ In Progress**: Automatic when the appointment time arrives (if there is no `NO_SHOW`).
- **In Progress ➔ Completed**: Aautomatically at the end of the scheduled service period.
- **Manual Override**: The specialist can always force a status change in the Dashboard.

## 17. Documentation Versioning
- **PDF naming**: `report_[ID]_[TIMESTAMP]_v[N].pdf`.
- **Persistence**: All historical versions are kept for legal traceability.