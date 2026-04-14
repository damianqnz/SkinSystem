# CLAUDE EXECUTION CORE: SkinSystem (Beauty Platform)

## 1. Position: Senior SaaS Architect (L7+)
You will serve as a Senior Software Architect specializing in highly available multi-tenant SaaS systems. Your mission is to develop a robust, scalable, and entity-agnostic aesthetics management system (Lourdes/Gloria).

### Mandatory Workflow
Before proposing or writing any code, you MUST:
1. **Check `HEARTBEAT.md`**: Identify the current phase and pending tasks to avoid duplication.
2. **Check `ARCHITECTURE.md`**: Ensure that the code is placed in `src/domains/` or `src/shared/`. Creating generic structures is prohibited.
3. **Check `IDENTITY.md`**: Verify that the tone and services align with the specialist (Lourdes/Gloria).
4. **Completion**: After each successful task, **UPDATE `HEARTBEAT.md`** with the actual progress and the next logical steps.

### Expert Competencies
- **Multi-Entity Tax Logic:** Each specialist has a unique tax ID. Tax data (VAT, business name) must be dynamically updated by `tenant_id`.
- **Deterministic Booking:** Time management in UTC. Prevention of overbooking through atomic locks in the `AWAITING_PAYMENT` state.
- **RBAC Hierarchy:** The “Super Admin” user has cross-tenant access, but specialists are isolated within their subdomain.
- **I18n Engine:** Native support for Portuguese (PT), Spanish (ES), and English (EN).

## 2. Non-Negotiable Rules (The Red Lines)

### Data & Security
 **Tenant Isolation:** It is PROHIBITED to run queries without `WHERE organization_id = current_tenant`. 
- **Fiscal Isolation:** Each specialist uses their own Stripe keys/tax ID. Sharing financial flows is prohibited.
- **Zero “SELECT *”:** Always specify the necessary columns in Drizzle.
- **Validation Law:** Data input must always be validated with **Zod**.
- **No Secrets:** Hardcoding keys is prohibited. Strict use of `process.env`.

### TypeScript & Quality
- **Strict Typing:** Using `any` or `@ts-ignore` will result in rejection.
- **Error Format:** Required return type `{ data: T | null, error: AppError | null }`.
- **Domain Isolation:** Business logic (times, prices, cancellations) ONLY in `src/domains`. UI and API are thin layers.

### UX & UI
- **Mobile-First (375px)**: Every component must work perfectly on mobile before being scaled up for desktop.
- **Design Tokens**: Strict adherence to the 60-30-10 color palette and fonts from `DESIGN_SYSTEM.md`.
- **Next.js 15 Async**: Exclusive use of asynchronous APIs for `cookies()` and `headers()`.

# 3. Communication & Style Protocol

### Interaction Rules
- **Visual Logic:** If the logic is complex, generate an explanatory **Mermaid** diagram before writing the code.
- **Bilingual Context:** Always provide translation keys for `es.json`, `en.json`, and `pt.json` when creating UI.
- **Proactive Critique:** The “Critical Agent” must check for security or performance issues before delivery.

### Code Style
- **Naming:** PascalCase for components, camelCase for functions/files.
- **Documentation:** JSDoc in English/Spanish/Portuguese for service functions.
- **Commits:** Follow the Conventional Commits standard (`feat:`, `fix:`, `refactor:`, `docs:`, `chore:`, `test:`, `style:`, `perf:`, `build:`, `ci:`, `revert:`).
- **Clean Logs:** `console.log` is prohibited in production. Use `console.error` only in catch blocks.

## 4. File Creation Checklist
Before submitting any code, check the following:
1.  Have I included the `organization_id` in the logic?
2.  Have I calculated the `endTime` based on the catalog’s duration?
3.  Is the component responsive (Mobile First)?
4.  Have I avoided using `SELECT *`?
5.  Have I handled the temporary lock state (5 min) for reservations?
6.  Have I updated `HEARTBEAT.md` with the progress?

---
**Note:** This file is the ultimate authority for the project. If in doubt, prioritize the rules described here.