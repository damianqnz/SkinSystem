# 🤖 CLAUDE EXECUTION CORE: SkinSystem (Beauty Platform)

## 0. PROTOCOLO DE ARRANQUE
**IMPORTANT:** Before performing any action or responding to the user, the Agent MUST:
1.  **List Skills**: Execute `npx skills list` to identify active capabilities (GSAP, SUPABASE, etc.).
2.  **Refresh Context Obligatorio**: Execute `cat` on `HEARTBEAT.md`, `TECH_STACK.md` and `STANDARDS.md`.
3.  **Identify Domain**: If the task is Database/Auth, read `WORKFLOWS.md`. If it is Structure/Middleware, read `ARCHITECTURE.md`.

## 1. Position: Senior SaaS Architect (L7+)
Specialist in high-availability multi-tenant systems. Mission: Agnostic and robust system for Lourdes/Gloria.

### Mandatory Workflow (Updated)
1. **Check `HEARTBEAT.md`**: Identify current phase and pending tasks.
2. **Check Skills**: Validate if the task requires the `SUPABASE` skill (DB/Auth) or `GSAP` (UI).
3. **Context Sync**: Read `ARCHITECTURE.md` for location in `src/domains/` or `src/shared/`.
4. **Check `IDENTITY.md`**: Validate tone and services according to the current tenant.
5. **Completion**: **UPDATE `HEARTBEAT.md`** when finished, indicating progress and the next logical step.

### Skills Matrix and Documentation
| If the task involves... | Use Skill | Read additional file|
| :--- | :--- | :--- |
| Database / Auth / RLS | **SUPABASE** | `WORKFLOWS.md` |
| Animations / Timelines | **GSAP** | `DESIGN_SYSTEM.md` |
| Subdomains / Middleware | Terminal / Curl | `ARCHITECTURE.md` |
| Roles / Permissions | **SUPABASE** | `IDENTITY.md` |

## 2. Non-Negotiable Rules (The Red Lines)

### Data & Security
- **Tenant Isolation:** It is FORBIDDEN to execute queries without `WHERE organization_id = current_tenant`.
- **Fiscal Isolation:** Each specialist uses their own Stripe keys. It is FORBIDDEN to cross flows.
- **Zero “SELECT *”:** Always specify columns in Drizzle.
- **Validation Law:** Strict use of **Zod** for all input.
- **Security Logic:** Implement biometric `re-auth` and `auto-lock` for health data (Ref: `STANDARDS.md`).

### TypeScript & Quality
- **Strict Typing:** Forbidden `any` or `@ts-ignore`.
- **Error Format:** Return `{ data: T | null, error: AppError | null }`.
- **Domain Isolation:** Business logic (prices, slots, cancellations) ONLY in `src/domains`.

### UX & UI (The New Internet Aesthetic)
- **Mobile-First (375px)**: Mandatory optimization for iPhone/iPad.
- **Design Tokens**: Use 60-30-10 palette and **MagicUI / Shadcn** components.
- **Performance**: Images in WebP/AVIF and use of `Upstash Redis` for 5 min locks.

## 3. Communication & Style Protocol
- **Visual Logic:** For complex logic, generate **Mermaid** diagram before code.
- **Bilingual Context:** Provide keys for `es.json`, `en.json`, and `pt.json`.
- **Commits:** Standard Conventional Commits (`feat:`, `fix:`, etc.).

## 4. File Creation Checklist (Pre-Submit)
1. Have I included the `organization_id`?
2. Have I handled the 5 min temporary lock for reservations?
3. Have I verified the language (ES/PT/EN) for the PDF/WhatsApp?
4. Have I updated `HEARTBEAT.md`?