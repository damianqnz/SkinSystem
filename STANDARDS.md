# 📏 STANDARDS.md: Technical Charter & Quality Manual

This document is the SkinSystem Technical Charter. It coordinates the tools in `TECH_STACK.md` within the `ARCHITECTURE.md` framework, ensuring compliance with `WORKFLOWS.md`.

---

## 1. Naming Jurisdictions
- **PascalCase**: React Components (`ServiceCard.tsx`), TypeScript Interfaces, and Types.
- **camelCase**: Functions (`getBooking`), variables, hooks, and object properties.
- **snake_case**: Database (PostgreSQL/Drizzle). Tables (`beauty_services`) and columns (`organization_id`).
- **kebab-case**: File system folders and URL slugs.

## 2. Coding Rules & Validation
- **Modularity**: Functions must be < 50 lines.
- **Thin Controllers**: Server Actions and API routes only validate and delegate. Business logic stays in `src/domains/`.
- **Result Pattern**: All functions MUST return `{ data: T | null; error: AppError | null }`.
- **Zod Law**: Mandatory validation for all data inputs and Server Action payloads.

## 3. UI & Styling (The 90/10 Boundary Rule)
- **Tailwind CSS v4 (90%)**: Used for Layout, Spacing, Typography, and Responsive utilities.
- **Stitches (10%)**: Reserved EXCLUSIVELY for **Complex Atomic Components** with state-driven variants (e.g., Slot Selectors, Clinical Charts).
- **Thumb-Zone**: Critical interactive elements must be in the lower 30% of the mobile screen.
- **Feedback**: Every server action must trigger a `Sonner` toast notification.

## 4. Internationalization (I18n Hybrid Model)
- **Static Labels**: Managed via `next-intl` in `src/messages/*.json` (Buttons, headers, errors).
- **Dynamic Content**: Service names and medical notes are stored in the DB (e.g., `name_pt`, `name_es`).
- **Locale Derivation**: Derived from `TenantProvider` or URL subdomain.

## 5. Tenant State & Persistence
- **Authority**: The `middleware.ts` is the source of truth, injecting `organization_id` into headers.
- **Client Side**: `TenantProvider` (Context) is mandatory to persist brand tokens (colors, logos) across the session.

## 6. Security & Database Rigor
- **RLS (Row Level Security)**: No query bypasses the `organization_id` filter.
- **Zero SELECT ***: Explicitly define columns in Drizzle to prevent data leaks.
- **Audit Logs**: Mandatory logging for Super Admin actions.

## 7. Modern APIs (Next.js 16)
- **Async APIs**: Mandatory for `cookies()`, `headers()`, and `params`.
- **Streaming**: Use `Suspense` and Skeletons to maintain the editorial aesthetic.

## 8. Asset & Multimedia Management
- **Formats**: `.webp` or `.avif` mandatory.
- **Privacy**: Signed URLs (60 min) for client photos.

## 9. Performance & Accessibility (Elite Level)
- **Vitals**: LCP < 1.2s, CLS < 0.05.
- **Inclusivity**: WCAG 3.0 "Silver" target. Touch targets min 44x44px.

## 10. GDPR & Data Privacy
- **At-Rest Encryption**: Medical notes and allergies encrypted via AES-256.
- **In-Transit**: Mandatory TLS 1.3.
- **Right to be Forgotten**: System must allow full client deletion without breaking financial integrity.

## 11. Clinical Data & No-Show Policy
- **Auto-Lock**: Medical views expire after 10 minutes of inactivity.
- **Re-Auth**: Accessing sensitive photos requires WebAuthn (FaceID/Biometrics).
- **No-Show**: Flag clients marked as `status: NO_SHOW` in future booking attempts.

## 12. Multilingual Logic (PDF & WhatsApp)
- **WhatsApp**: Based strictly on the client's booking `locale`.
- **Clinical PDF**: Specialist has manual override (ES | PT | EN) before generation.

## 13. Financial Policies
- **Refund Logic**: `Appointment_Value - Stripe_Commission`.
- **Transparency**: UI must show the breakdown of non-refundable fees before processing.

## 14. Automatic Appointment Lifecycle
- **Transitions**: `Confirmed` ➔ `In Progress` ➔ `Completed` happens automatically via Cron jobs.
- **Manual Override**: Specialists can force status changes from the Dashboard.

## 15. Documentation & Sync
- **PDF Naming**: `report_[ID]_[TIMESTAMP]_v[N].pdf`.
- **Cross-Platform**: Git `autocrlf input`. Manual `.env.local` sync between Mac M4 and Asus TUF.