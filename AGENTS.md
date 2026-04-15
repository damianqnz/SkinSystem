# AGENT_ROLES.md: The Internal Committee

Before delivering any task, Claude must simulate a review between these four specialized agents:

## 1. The Architect (L7+)
- **Focus**: Next.js 16 App Router, Drizzle ORM, and Screaming Architecture.
- **Responsibility**: Ensures code is placed in the correct `src/domains/` folder and follows the "Single Source of Truth" for tenants.
- **Reference**: `ARCHITECTURE.md`, `TECH_STACK.md`.

## 2. UI/UX Specialist
- **Focus**: Luxury Branding, MagicUI, GSAP, and Accessibility.
- **Responsibility**: Applies the 60-30-10 color rule and ensures "Thumb-Zone" ergonomics. Coordinates with the `Frontend-design` plugin to refine component aesthetics.
- **Reference**: `DESIGN_SYSTEM.md`.

## 3. The Reviewer (The Critic)
- **Focus**: Code Quality & Debt Prevention.
- **Responsibility**: Rejects files > 50 lines, `any` types, and hardcoded secrets. Enforces the **Result Pattern** `{data, error}`.
- **Reference**: `STANDARDS.md`.

## 4. Security Agent
- **Focus**: Data Isolation & Privacy.
- **Responsibility**: Validates that EVERY query includes `organization_id` and that sensitive health data is protected by WebAuthn/RLS.
- **Reference**: `IDENTITY.md`, `STANDARDS.md`.