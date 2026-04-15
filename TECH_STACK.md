# TECH_STACK.md: The Toolbelt (SkinSystem)

This file defines the technologies, libraries, and design resources approved for SkinSystem. No external dependency should be added without updating this document.

---

## 1. Core Stack (The Engine)
- **Framework:** Next.js 16.x (App Router, PPR, Server Actions).
- **Runtime:** Node.js 25.x LTS.
- **Language:** TypeScript 5.x (Strict Mode).
- **Package Manager:** pnpm.

## 2. Persistence & Backend
- **Database:** PostgreSQL via **Supabase**.
- **ORM:** **Drizzle ORM** (SQL-first approach).
- **Auth:** Supabase Auth (PKCE Flow).
- **Serverless:** Edge Runtime preferred for global latency.

## 3. UI & Styling (The Luxury Layer)
- **Base Components:** **Shadcn/ui** (Copied/Pasted for full control).
- **Animations:** **MagicUI** (MCP integrated) + **Framer Motion**.
- **Styling:** **Tailwind CSS** (Utility-first) + **Stitches** (Dynamic variants).
- **Icons:** **Icono.co** (Minimalist set).

## 4. Design & Inspiration Resources (The Visual Law)
The AI must follow the design patterns of the following galleries to maintain the premium standard:
- **Hero:** [SupaHero](https://supahero.io).
- **Navigation:** Navbar Gallery.
- **Grids:** [Bento Grids](https://bentogrids.com).
- **Typography:** H1 Gallery.
- **Call to Action:** CTA Gallery.
- **Footers:** Footer Design.
- **Error States:** 404s.design.

## 5. Media & Performance
- **Image Optimization:** Next.js `next/image` + **Sharp**.
- **Formats:** WebP/AVIF mandatory.
- **Fonts:** Self-hosted via `@fontsource` to prevent CLS.

## 6. Communications & Marketing
- **WhatsApp API**: Twilio (For critical notifications and reminders).
- **Email Service**: **Resend** (Transactional) + **Mailchimp SDK** (Marketing and Newsletters).
- **WhatsApp Engine**: **Evolution API** (Self-hosted v1.8+). 
 - *Nota*: Allows total automation at no cost per message through WhatsApp Web instance.
- **Task Scheduling**: **Vercel Cron Jobs** (o `node-cron`). Execution every 5 min for automatic status management.
- **Analytics & Tracking**:
  - Google Analytics 4 (GA4) & Google Tag Manager (GTM).
  - Meta Pixel & Conversions API (CAPI).

## 7. Payments & Billing
- **Infrastructure**: **Stripe Connect (Standard)**.
- **Model**: Direct connection. Cada Specialist (Lourdes/Gloria) vincula su propia cuenta bancaria. El sistema actúa como orquestador sin retención de fondos.

## 8. Development & Testing
- **Environment**: macOS Tahoe (Mac mini M4) & Windows 11 Pro (Asus TUF gaming F15).
- **Testing**: **Playwright** for visual regression testing (to ensure visual consistency across both systems).

## 9. Specific Libraries
- **PDF Generation**: `react-pdf` (Dynamic generation on server/client).
- **Security**: **WebAuthn API** (For biometric re-authentication on iPad/iPhone).
- **Locking**: **Upstash Redis** (For managing temporary 5-minute locks).