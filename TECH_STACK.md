# 🛠️ TECH_STACK.md: The Toolbelt (SkinSystem)

This file defines the technologies, libraries, and design resources approved for SkinSystem. No external dependency should be added without updating this document.

---

## 1. Core Stack (The Engine)
- **Framework**: Next.js 16.x (App Router, PPR, Server Actions).
- **Runtime**: Node.js 25.x LTS.
- **Language**: TypeScript 5.x (Strict Mode).
- **Package Manager**: pnpm.

## 2. Persistence & Backend
- **Database**: PostgreSQL via **Supabase**.
- **Isolation**: Row Level Security (RLS) enforced via `organization_id`.
- **ORM**: **Drizzle ORM** (SQL-first approach).
- **Auth**: Supabase Auth (PKCE Flow).
- **Caching**: **Upstash Redis** (Global latency optimization & 5-min session locks).

## 3. UI & Styling (The 90/10 Boundary Rule)
- **Tailwind CSS v4**: Primary tool for Layout, Spacing, Typography, and Responsive design (**90% of the app**).
- **Stitches**: Exclusive for **Complex Atomic Components** with state-driven variants (e.g., Slot Selectors, Clinical Charts) (**10% of the app**).
- **Base Components**: **Shadcn/ui** (Customized for luxury aesthetics).
- **Animations**: **MagicUI** + **Framer Motion** + **GSAP 3** (For high-end timelines).
- **I18n**: `next-intl` for static UI translations via JSON.

## 4. Design & Inspiration Resources
The AI must follow the design patterns of these galleries to maintain the premium standard:
- **Hero/Layout**: [SupaHero](https://supahero.io), [Bento Grids](https://bentogrids.com).
- **Typography/CTA**: H1 Gallery & CTA Gallery.
- **Error States**: 404s.design.

## 5. Media & Performance
- **Image Optimization**: Next.js `next/image` + **Sharp**.
- **Formats**: WebP/AVIF mandatory.
- **Fonts**: Self-hosted via `@fontsource` to prevent Layout Shift (CLS).

## 6. Communications & Automation
- **WhatsApp Engine**: **Evolution API** (Self-hosted v1.8+). 
  - *Strategy*: Full automation via WhatsApp Web instances (No cost per message).
- **Email Service**: **Resend** (Transactional emails).
- **Task Scheduling**: **Vercel Cron Jobs**. Execution every 5 min for automated status management (`CONFIRMED` -> `IN_PROGRESS`).
- **Analytics**: GA4, GTM, and Meta Pixel (CAPI).

## 7. Payments & Billing
- **Infrastructure**: **Stripe Connect (Standard)**.
- **Model**: Direct connection. Each Specialist (Lourdes/Gloria) links their own account. The system acts as an orchestrator without fund retention.

## 8. Development & Testing
- **Environment**: macOS Tahoe (Mac mini M4) & Windows 11 Pro (Asus TUF).
- **Testing**: **Playwright** (Visual regression testing for cross-platform consistency).

## 9. Specific Libraries
- **PDF Generation**: `react-pdf`.
- **Security**: **WebAuthn API** (Biometric re-authentication for iPad/iPhone).
- **Validation**: **Zod** (Mandatory for all data schemas and Server Actions).
- **State**: **React Context API** (For `TenantProvider` and `AuthProvider`).