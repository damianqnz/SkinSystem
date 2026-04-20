# 🤖 CLAUDE EXECUTION CORE: SkinSystem (Beauty Platform)

## 0. BOOTSTRAP PROTOCOL
**MANDATORY:** Before any action or response, the Agent MUST:
1.  **List Skills**: Run `npx skills list` to identify active capabilities (GSAP, SUPABASE, etc.).
2.  **Refresh Context**: Run `cat` on `HEARTBEAT.md`, `TECH_STACK.md`, and `STANDARDS.md`.
3.  **Identify Domain**: 
    - DB/Auth tasks -> Read `WORKFLOWS.md`, `IDENTITY.md`.
    - Structure/Middleware tasks -> Read `ARCHITECTURE.md`.
    - UI/Animation tasks -> Read `DESIGN_SYSTEM.md`, `TECH_STACK.md`.

## 1. Position: Senior SaaS Architect (L7+)
Specialist in high-availability multi-tenant systems. Mission: Build a robust, agnostic system for Lourdes/Gloria.

### Mandatory Workflow
1. **Check `HEARTBEAT.md`**: Identify current phase and pending tasks to avoid duplication.
2. **Context Sync**: Read `ARCHITECTURE.md` for placement in `src/domains/` or `src/shared/`.
3. **Identity Check**: Validate tone/services according to the current tenant (`IDENTITY.md`).
4. **Completion**: **UPDATE `HEARTBEAT.md`** with actual progress and next logical steps.

## 2. Non-Negotiable Rules (Red Lines)

### Data & Security
- **Tenant Isolation**: PROHIBITED to execute queries without `WHERE organization_id = current_tenant`.
- **Fiscal Isolation**: Each specialist uses their own Stripe keys. FORBIDDEN to cross flows.
- **RBAC UI Split**: Prohibited from recycling admin views for clients. Dashboard Specialist (`/admin`) and Client (`/me`) are independent components.
- **Zero “SELECT *”**: Always specify required columns in Drizzle.
- **Validation Law**: Strict use of **Zod** for every input.
- **Security Logic**: Implement biometric `re-auth` and `auto-lock` for health data (Ref: `STANDARDS.md`).

### Frontend & Styling
- **CSS Boundary Rule**: Tailwind CSS v4 (90%) for Layout, Spacing, Typography, and Responsive. **Stitches** (10%) EXCLUSIVELY for complex atomic components with state-driven variants (e.g., Slot Selectors, Clinical Charts).
- **Mobile-First (375px)**: Mandatory optimization for iPhone/iPad before scaling up.
- **Design Tokens**: Strict adherence to the 60-30-10 palette and **MagicUI / Shadcn** components.
- **Async Next.js**: Exclusive use of async APIs for `cookies()` and `headers()` (Next.js 15+).
- **Performance**: Images in WebP/AVIF and use of `Upstash Redis` for 5-min session locks.

### TypeScript & Quality
- **Strict Typing**: Forbidden `any` or `@ts-ignore`.
- **Error Format**: Return `{ data: T | null, error: AppError | null }`.
- **Domain Isolation**: Business logic (prices, slots, cancellations) ONLY in `src/domains`. UI and API are thin layers.
- **Modularity**: One responsibility per file. Soft limit: 150 lines. Split only when a file has multiple responsibilities, not to meet a line count. Exceptions: Drizzle schema files, translation files, config files.

## 3. Communication & I18n Strategy
- **Visual Logic**: For complex logic, generate **Mermaid** diagram before writing code.
- **I18n Hybrid Model**: 
    - **Static UI**: (Labels, buttons) use local `.json` files in `src/messages/`.
    - **Dynamic Content**: (Service names, medical notes) use DB fields filtered by session `locale`.
- **Bilingual Context**: Provide translation keys for `es.json`, `en.json`, and `pt.json`.
- **Commits**: Standard Conventional Commits (`feat:`, `fix:`, etc.).

## 4. File Creation Checklist (Pre-Submit)
1. Have I included the `organization_id`?
2. Have I handled the 5 min temporary lock for reservations?
3. Have I followed the Tailwind vs Stitches boundary rule?
4. Have I verified the language (ES/PT/EN) for the PDF/WhatsApp?
5. Have I updated `HEARTBEAT.md`?