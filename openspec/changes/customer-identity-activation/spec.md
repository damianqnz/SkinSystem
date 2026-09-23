# Spec: customer-identity-activation (guest → activated customer account, org-scoped)

## Requirement 1: `customers` gains a real auth identity link and a uniqueness guarantee

### Scenario: `authUserId` column exists and is nullable
- **Given** the `customers` table
- **When** its schema is inspected after this change
- **Then** it has an `authUserId` column, nullable `uuid`, with a foreign key to `auth.users.id`, and every pre-existing row has `authUserId IS NULL` (no backfill is performed as part of this change).

### Scenario: Unique constraint applies directly, no dedup step required
- **Given** the live production `customers` table has zero rows violating `(organizationId, email)` uniqueness (verified: `SELECT organization_id, email, COUNT(*) FROM customers WHERE email IS NOT NULL GROUP BY organization_id, email HAVING COUNT(*) > 1` returns zero rows)
- **When** the unique constraint on `customers(organizationId, email)` is added
- **Then** the migration applies cleanly with no preceding dedup/merge step, and no `customers` row with a non-null `email` shares its `(organizationId, email)` pair with another row.

### Scenario: Constraint scope excludes null emails
- **Given** a `customers` row may have a null `email` (e.g. phone-only intake)
- **When** the unique constraint is evaluated
- **Then** rows with a null `email` are not compared against each other for uniqueness (standard SQL null semantics), and this is a stated, not incidental, property of the constraint.

## Requirement 2: A single activation primitive links a verified auth identity to the current tenant's customer row

### Scenario: Happy path — first-time activation
- **Given** a `customers` row exists in organization A for `email = "ana@example.com"`, with `isGuest = true` and `authUserId = NULL`
- **When** the activation primitive runs with a verified auth identity (OTP-confirmed or OAuth-confirmed) for `ana@example.com`, scoped to organization A
- **Then** it writes `auth.users.id` into that row's `authUserId`, sets `isGuest = false`, and touches no other `customers` row.

### Scenario: No matching guest row yet in this organization
- **Given** no `customers` row exists for `(organizationId = A, email = "new@example.com")`
- **When** the activation primitive runs with a verified auth identity for `new@example.com` scoped to organization A
- **Then** it does not silently fail and does not activate a row in a different organization; the design phase determines whether it creates a new `customers` row in organization A or returns a "no account in this organization" outcome, but in no case does it write `authUserId` against any row outside organization A.

### Scenario: Row is already activated (idempotent re-entry)
- **Given** a `customers` row in organization A already has `authUserId` set to the requesting auth user's own `auth.users.id`
- **When** the activation primitive runs again for that same person and organization (e.g. a second OTP sign-in)
- **Then** it is a no-op with respect to the link (the existing `authUserId` and `isGuest = false` are left unchanged) and does not error.

### Scenario: Row is already activated by a different auth identity
- **Given** a `customers` row in organization A has `authUserId` set to auth user `X`
- **When** the activation primitive runs with a verified auth identity for a different auth user `Y` whose email matches that row's `email`
- **Then** it does not overwrite `authUserId` from `X` to `Y` (this would silently reassign an existing customer's history to a different auth account); this is treated as a conflict, not a normal activation, and the design phase specifies the exact error/response shape.

### Scenario: Blocked customer
- **Given** a `customers` row in organization A has `isBlocked = true`
- **When** the activation primitive runs with a verified auth identity matching that row's `(organizationId, email)`
- **Then** activation does not proceed to grant an authenticated `/me` session for that row (no `authUserId` link is created or used to authorize access) — a blocked customer gains no new access as a side effect of this change; the design phase specifies the exact user-facing outcome (e.g. generic error, no distinguishing detail per the enumeration posture in Requirement 5).

### Scenario: Wrong-tenant attempt — same email, different organization's guest row
- **Given** a `customers` row exists for `(organizationId = B, email = "ana@example.com")` but the activation request is scoped to organization A (resolved from the request's tenant subdomain), and no row exists for `(organizationId = A, email = "ana@example.com")`
- **When** the activation primitive runs
- **Then** it does not read, write, or link the organization B row under any circumstance — the primitive's row lookup is always filtered by the request's resolved `organizationId`, never by email alone across organizations.

## Requirement 3: `loginAction` prefers the auth-identity link and self-heals not-yet-activated rows

### Scenario: Activated customer signs in
- **Given** a `customers` row in the resolved tenant has `authUserId` set to the signed-in auth user's `auth.users.id`
- **When** `loginAction` resolves the customer branch (after the existing `profiles`/staff branch finds no match)
- **Then** it matches this row by `authUserId = auth.uid()` and routes to `/me`, without falling back to an email comparison.

### Scenario: Not-yet-activated guest's first passwordless sign-in triggers activation
- **Given** a `customers` row in the resolved tenant has `authUserId = NULL`, `isGuest = true`, and an `email` matching the signed-in auth user's verified email
- **When** `loginAction` resolves the customer branch and finds no `authUserId` match
- **Then** it falls back to the existing lower-cased email match within the resolved tenant, and this fallback match is exactly what invokes the Requirement 2 activation primitive (writing `authUserId`, clearing `isGuest`) before routing to `/me` — the fallback is the activation trigger, not a separate, later step.

### Scenario: No match by either path
- **Given** neither an `authUserId` match nor an email match exists for the signed-in auth user in the resolved tenant
- **When** `loginAction` resolves the customer branch
- **Then** existing behavior is preserved: the user is signed out and `loginAction` returns `no_account`.

## Requirement 4: Two activation trigger surfaces converge on the same primitive

### Scenario: Self-serve activation via `/login` itself
- **Given** a guest customer with no password set visits `/login` on their organization's subdomain
- **When** they complete OTP or OAuth sign-in
- **Then** no separate "activate your account" screen is required — sign-in itself, via the Requirement 3 fallback path, performs the activation and lands the customer on `/me`.

### Scenario: Self-serve activation via an in-product entry point
- **Given** a guest customer is on `/me` or a post-booking confirmation surface after already having a `customers` row
- **When** they use the in-product "activate account" CTA
- **Then** it initiates the same OTP/OAuth verification and converges on the identical activation primitive from Requirement 2 — no separate identity-linking logic is introduced for this entry point.

### Scenario: Staff-triggered invite sends an email but does not itself authenticate anyone
- **Given** a staff member (Owner or Staff role) is viewing a guest customer's detail page in `(dashboard)/dashboard/customers/[id]`
- **When** they trigger "Invite to activate account"
- **Then** the system sends an OTP/magic-link email to that customer's address on record; the staff action itself does NOT write `authUserId`, does NOT set `isGuest = false`, and does NOT create or modify any Supabase Auth session — the actual link-write only happens later, when the customer clicks the emailed link and completes verification, at which point it is the Requirement 2 primitive (not the staff action) that performs the write.

### Scenario: Staff invite is scoped to the staff member's own organization
- **Given** a staff member belongs to organization A
- **When** they trigger an activation invite for a customer
- **Then** the invite can only target a `customers` row in organization A (the customer detail page is itself tenant-scoped), and the resulting activation, when completed, links `authUserId` only within organization A.

## Requirement 5: `/login` presents passwordless methods first, with no dead links

### Scenario: OTP and OAuth are the primary, visually prioritized actions
- **Given** a visitor loads `/login` on a tenant subdomain
- **When** the page renders
- **Then** OTP/magic-link sign-in and Google OAuth are presented as the primary actions (Apple OAuth also primary when config-gated on, per Requirement 9), and email+password sign-in is presented as a secondary, visually de-emphasized option — password is available for sign-in only, never offered as an account-creation path from this page.

### Scenario: No dead "forgot password" link
- **Given** a visitor views `/login`
- **When** they look for password recovery
- **Then** there is no non-functional `href="#"` link; either the page has no separate forgot-password affordance (OTP subsumes recovery) or it links to a real, working destination — either outcome is acceptable, a silent dead link is not.

### Scenario: One `/login` page serves both staff and customers correctly
- **Given** `/login` is shared between staff (`profiles`) and customer (`customers`) sign-in
- **When** the page renders and when `loginAction` resolves a signed-in session
- **Then** the presentation reads correctly for both a customer arriving from a tenant subdomain and a staff member, and existing staff routing (`profiles` exact-org match → `/dashboard`, password-based) is unchanged by this requirement.

## Requirement 6: `Step2Auth.tsx` migrates off bare `signUp`, sequenced after the new path is proven

### Scenario: Bare `signUp()` account creation is removed
- **Given** `Step2Auth.tsx`'s `handleRegister`
- **When** this change is complete
- **Then** no code path in `Step2Auth.tsx` calls `supabase.auth.signUp({ email, password, ... })` to create an account from an unverified email — the booking funnel's auth step offers OTP, Google, Apple (when config-gated on), and "continue as guest," converging on the Requirement 2 activation primitive instead of an independent signup call.

### Scenario: Password sign-in for an already-activated customer may remain
- **Given** a customer mid-booking already has an activated account (password set via `/me`)
- **When** they reach `Step2Auth.tsx`
- **Then** signing in with that existing password is still permitted — only password-based account *creation* is removed, not password-based sign-in.

### Scenario: Deployment sequencing — new path proven before old path removed
- **Given** the activation primitive and `/login`'s OTP/OAuth flow (Requirements 2–5) are implemented
- **When** `Step2Auth.tsx`'s bare-`signUp` removal is deployed
- **Then** it is deployed only after the new activation path has been exercised live and confirmed working — this ordering is a requirement of this change, not an implementation-time convenience, specifically to avoid a customer mid-booking hitting a broken auth step if the removal ships ahead of a working replacement.

## Requirement 7: Org isolation is an explicit, testable invariant of the activation primitive

### Scenario: Activating in org A never touches org B, even with a matching-email guest row present in both
- **Given** a `customers` row exists for `(organizationId = A, email = "shared@example.com")` AND a separate `customers` row exists for `(organizationId = B, email = "shared@example.com")`, both with `authUserId = NULL`
- **When** the activation primitive runs with a verified auth identity for `shared@example.com`, scoped to organization A (resolved from the request's tenant)
- **Then** only the organization A row's `authUserId` is written; the organization B row's `authUserId` remains `NULL` and its `isGuest` flag is unchanged.

### Scenario: One `auth.users` row may legitimately link to multiple `customers` rows across organizations
- **Given** the same person separately activates in organization A and, on a later occasion, in organization B
- **When** both activations have completed
- **Then** the same `auth.users.id` appears as `authUserId` on both the organization A and organization B `customers` rows — this is correct, expected behavior (one person, client of two tenants), not a violation of isolation; isolation means no *automatic or side-effect* cross-org link, not that cross-org links can never exist.

### Scenario: Activating in org A grants no session access to org B
- **Given** a person has activated only in organization A
- **When** they visit organization B's subdomain and sign in with the same verified email
- **Then** `loginAction`'s org-scoped lookup (Requirement 3) finds no `authUserId` match and no email match in organization B's `customers` table (assuming no separate org B guest row exists), and they receive `no_account` for organization B — activation in A confers no access in B.

## Requirement 8: No new client-side customer-authenticated table access is introduced

### Scenario: All customer-path data access stays server-only
- **Given** this change adds `customers.authUserId` and new activation server actions/routes
- **When** the resulting code is inspected
- **Then** `getMyCustomer`, `getMyAppointments`, `updateMyProfile`, the activation primitive, and the booking guest upsert all continue to query `customers`/`appointments` via the server-only `db` (Drizzle) connection, exactly as before — no new code path uses a customer-session-scoped Supabase JS/REST client to read or write `customers` or `appointments` directly.
- **And** the existing RLS gap (both tables' policies grant access only through a `profiles` staff match; a signed-in customer's `auth.uid()` grants zero rows via RLS) is left exactly as-is — this change neither fixes it nor silently relies on it being fixed. Any future customer-self RLS policy is out of scope here.

## Requirement 9: Apple OAuth ships config-gated, not commented-out

### Scenario: Apple button is absent until Apple provider configuration is present
- **Given** the human has not yet completed the external Apple Developer + Supabase dashboard configuration for the Apple provider
- **When** `/login` and `Step2Auth.tsx` render
- **Then** no Apple sign-in button appears, driven by a runtime/config check (e.g. presence of an Apple client ID or a feature flag reflecting provider configuration) — not by a commented-out JSX block requiring a future code change to re-enable.

### Scenario: Apple button appears automatically once configuration is completed
- **Given** the Apple provider configuration is completed in the Supabase dashboard (and any corresponding app-side config value is set)
- **When** `/login` and `Step2Auth.tsx` render, with no further code change
- **Then** the Apple sign-in button appears and, when used, converges on the same `signInWithOAuth`-based activation primitive as the Google branch.

## Requirement 10: Leaked Password Protection is enabled

### Scenario: HaveIBeenPwned check is turned on for this Supabase project
- **Given** the live Supabase project currently has "Leaked Password Protection" disabled (confirmed via security advisors)
- **When** this change's delivery is complete
- **Then** the setting is enabled in the Supabase Auth dashboard for this project, and this completion is recorded durably (e.g. `HEARTBEAT.md`) since the change itself is invisible to code review and git history.

## Non-Goals (explicit, not testable requirements)

- **TICKET CUST-01** (`/me/citas` professional attribution) — untouched.
- **Fixing the customer-side RLS gap** — Requirement 8 states this stays open by design; no customer-self RLS policy is authored here.
- **Backfilling `authUserId` for historical rows** beyond the self-healing described in Requirement 3.
- **Cross-email identity linking** (`supabase.auth.linkIdentity()` or manual linking) — same-email activation only.
- **A dedicated password-reset UI flow** — OTP is the recovery path once primary; Requirement 5 only requires the dead link be removed or replaced, not that a new reset flow be built.
- **`proxy.ts` / `i18n/request.ts` edits** — untouched, per CLAUDE.md's middleware-scope rule.
- **The staff `/dashboard` password-based auth flow** — unchanged; only `/login`'s shared presentation changes (Requirement 5).
- **The two pre-existing, unrelated Supabase advisories** (`function_search_path_mutable`, the `SECURITY DEFINER` function callable by `anon`) — not in scope.

## Testability

- Requirements 1, 7, and 8 (schema, isolation invariant, no-new-client-side-access) are verifiable by direct inspection/query of the `customers` table and by `rg` over the codebase for Supabase client call sites against `customers`/`appointments`, matching this project's existing verification style (e.g. `rg 'signUp\('` for Requirement 6).
- Requirements 2, 3, and 4 (activation primitive, `loginAction`, trigger surfaces) are server-side logic with DB dependencies; per this project's established testing capability (Node-env Vitest, no jsdom/RTL), design should specify whether the primitive's row-resolution and link-write logic can be isolated and unit-tested against a test database or Drizzle mock, versus covered by integration/manual verification only.
- Requirement 5 (`/login` presentation) is verified by manual/QA review plus the tri-locale key-parity suite (`messages.test.ts`) for any new strings.
- Requirement 9 (Apple gating) is verifiable by toggling the config presence in a test environment and confirming the button's presence/absence with no code change.
- Requirement 10 (Leaked Password Protection) is verified via `mcp__supabase__get_advisors --type security` no longer reporting the finding, plus the `HEARTBEAT.md` record.
