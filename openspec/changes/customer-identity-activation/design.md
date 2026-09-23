# Design: customer-identity-activation

Implements the 10 locked requirements in `spec.md`. Resolves the three shapes `spec.md` deferred here (D1–D3 below), plus four decisions the spec did not anticipate but which the live code forces (D4–D7).

## Decision index

| # | Decision | Spec ref |
|---|---|---|
| D1 | Already-activated-by-a-different-identity → `identity_conflict`, no write, generic user-facing outcome | Req 2 |
| D2 | Blocked customer → `blocked`, **no link written at all**, reuses today's sign-out + `no_account` | Req 2 |
| D3 | No matching guest row → `no_account`, **does not create a row** | Req 2 |
| D4 | Uniqueness is enforced on `(organization_id, lower(email))`, not raw `email` | Req 1 |
| D5 | `/auth/callback` + a new `/auth/confirm` become the single post-auth funnel; `loginAction` and both routes share one resolver | Req 3, 4 |
| D6 | Self-serve in-product CTA lives on the **booking-confirmation** surface, not a `/me` banner | Req 4 |
| D7 | Step2Auth removal is gated on a **named production query**, recorded in HEARTBEAT — not a feature flag | Req 6 |

---

## 1. Schema migration

### 1.1 Drizzle declaration — `apps/web/src/infrastructure/db/schema/customers.ts`

```ts
export const customers = pgTable('customers', {
  // ...
  /**
   * Supabase `auth.users.id` of the activated customer. NULL = guest (never
   * activated). Declared WITHOUT `.references()` — `auth.users` lives in
   * Supabase's own `auth` schema, which drizzle-kit does not manage; the FK
   * is created by raw SQL (see 1.2).
   *
   * WARNING: this column grants NO RLS access. `customers`' only policy is
   * `customers_org_all`, keyed on `profiles.id = auth.uid()` (staff only) —
   * a signed-in customer's `auth.uid()` still resolves to ZERO rows. Every
   * customer-path read/write must stay server-side over `db`. See Req 8.
   */
  authUserId: uuid('auth_user_id'),
  // ...
}, (t) => [
  index('idx_customers_org_id').on(t.organizationId),
  index('idx_customers_auth_user_id').on(t.authUserId),
]);
```

The `(organizationId, email)` uniqueness is **not** declared via Drizzle's `unique()` helper, because D4 makes it an expression index that `unique()` cannot express. It lives only in SQL; the Drizzle file carries a comment pointing at the migration so the constraint is not invisible to a schema reader.

### 1.2 Raw SQL migration — `apps/web/supabase/migrations/<YYYYMMDD>_customers_auth_identity.sql`

`drizzle.config.ts` states it explicitly: *"Migrations are managed via Supabase MCP — drizzle-kit is used for type generation and studio only. Do NOT run drizzle-kit push/migrate."* So this is a hand-authored file applied with `mcp__supabase__apply_migration`, following the existing `YYYYMMDD_name.sql` convention in `apps/web/supabase/migrations/`. It is the only way the `auth.users` FK can be created at all — drizzle-kit would either refuse the cross-schema reference or try to take ownership of `auth.users`.

Contents, in order:

1. `ALTER TABLE customers ADD COLUMN IF NOT EXISTS auth_user_id uuid;`
2. `ALTER TABLE customers ADD CONSTRAINT customers_auth_user_id_fkey FOREIGN KEY (auth_user_id) REFERENCES auth.users(id) ON DELETE SET NULL;`
3. `CREATE UNIQUE INDEX IF NOT EXISTS uq_customers_org_email ON customers (organization_id, lower(email));`
4. `CREATE INDEX IF NOT EXISTS idx_customers_auth_user_id ON customers (auth_user_id);`

**`ON DELETE SET NULL`, not `CASCADE`.** Deleting a Supabase auth user must orphan the identity link, never delete the clinical customer record — appointments, skin profile and onboarding all cascade off `customers.id`. `CASCADE` here would let an auth-side deletion silently destroy health data. `RESTRICT` was rejected because it would make auth-user deletion fail with a foreign-key error from a schema the app does not own.

**Nullability and backfill.** The column is nullable and no backfill runs (Req 1). Every pre-existing row stays `NULL` and self-heals on first sign-in (Req 3).

**Null-email semantics.** A unique index uses Postgres' default `NULLS DISTINCT`, so any number of null-email rows may coexist per organization (phone-only intake). This is deliberate, not incidental — `NULLS NOT DISTINCT` is available in PG15+ and is explicitly **not** used.

### D4 — uniqueness on `lower(email)`, not raw `email`

Verified in live code: `book/actions.ts` writes `input.guestEmail` straight from a Zod `.email()` parse (line 287), which does not lower-case. `loginAction` looks up with `eq(customers.email, user.email?.toLowerCase())` (line 123–128). So today a guest row stored as `Ana@example.com` is **already invisible to login** — a latent bug independent of this change.

A raw-column unique constraint would permit `Ana@example.com` and `ana@example.com` as two rows for one person, which is exactly the ambiguity Req 1 exists to remove, and would leave `authUserId`'s target undefined again. The expression index closes it at the database, regardless of which write path inserts the row.

Two consequences the tasks phase must carry:

- **Pre-flight, before authoring the migration**, re-run the duplicate audit case-insensitively — `spec.md`'s verification used an exact-match `GROUP BY email`, which would not have caught a case variant:
  `SELECT organization_id, lower(email), count(*) FROM customers WHERE email IS NOT NULL GROUP BY 1, 2 HAVING count(*) > 1;`
  Zero rows → the index applies cleanly and `spec.md` Req 1 scenario 2 holds unchanged. Non-zero rows → this becomes the dedup case `spec.md` assumed away, and is a blocking escalation, not an implementation-time improvisation.
- **Normalize on write**: `book/actions.ts`'s guest upsert lower-cases `guestEmail` on both the `SELECT` and the `INSERT`, and the activation primitive lower-cases before lookup. Without this the app would hit index violations it could have avoided.

---

## 2. The activation primitive

Two modules, split on the testing seam (§9).

### 2.1 `apps/web/src/domains/customers/activation-policy.ts` — pure, no DB

Deliberately free of the `server-only` guard and of any `@/infrastructure/db` import — exactly the precedent set by `shared/lib/stripe-policy.ts`, whose header comment names this reason. Importing the Drizzle schema would drag a live Postgres connection into Vitest; the candidate row is therefore a local structural type, not `typeof customers.$inferSelect`.

```ts
export type ActivationCandidateRow = {
  id:         string;
  authUserId: string | null;
  isBlocked:  boolean;
};

export type ActivationDecision =
  | { kind: 'activate';          customerId: string }
  | { kind: 'already_linked';    customerId: string }
  | { kind: 'identity_conflict'; customerId: string }
  | { kind: 'blocked';           customerId: string }
  | { kind: 'no_account' };

export function resolveActivationDecision(
  row: ActivationCandidateRow | null,
  authUserId: string,
): ActivationDecision;
```

**Branch order is load-bearing and must be asserted by tests:**

| Order | Condition | Decision | Why this position |
|---|---|---|---|
| 1 | `row === null` | `no_account` | D3 |
| 2 | `row.isBlocked` | `blocked` | **Before** any link consideration, so a blocked row is never written (D2) |
| 3 | `row.authUserId === null` | `activate` | The Req 2 happy path |
| 4 | `row.authUserId === authUserId` | `already_linked` | Idempotent re-entry |
| 5 | otherwise | `identity_conflict` | D1 |

Order 2 before 3 satisfies Req 2's blocked scenario literally ("no `authUserId` link is created"). Order 2 before 4 means a blocked customer who was already activated is still denied — matching `loginAction`'s current behaviour (lines 132–135), which this change must not loosen.

### 2.2 `apps/web/src/domains/customers/activation.ts` — `server-only`, thin DB wrapper

Sits beside `service-me.ts`, per CLAUDE.md's domain-isolation rule. Returns the repo's canonical `Result<T>` shape.

```ts
export async function activateCustomerIdentity(input: {
  organizationId: string;   // from the request's resolved tenant — NEVER from the auth user
  authUserId:     string;   // auth.users.id of a VERIFIED identity
  verifiedEmail:  string;   // caller lower-cases
}): Promise<Result<ActivationDecision>>;
```

`error` is reserved for genuine infrastructure failure (DB unreachable). `no_account` / `blocked` / `identity_conflict` are *decisions*, not errors, and travel in `data` — the caller must branch on them, and a discriminated union makes forgetting a branch a type error.

Steps:

1. `SELECT id, auth_user_id, is_blocked FROM customers WHERE organization_id = $org AND lower(email) = $verifiedEmail LIMIT 1` — via Drizzle, columns named explicitly (no `SELECT *`). **The `organizationId` predicate is unconditional and is the entire mechanism of Req 7**: there is no code path in this module that queries by email alone.
2. `resolveActivationDecision(row ?? null, authUserId)`.
3. On `activate` only, one guarded UPDATE:
   `UPDATE customers SET auth_user_id = $auth, is_guest = false WHERE id = $id AND organization_id = $org AND auth_user_id IS NULL RETURNING id`.
   The `auth_user_id IS NULL` predicate is a compare-and-set: two concurrent activations for the same row cannot both win. A zero-row result means another request linked the row in between — re-read once and return `already_linked` or `identity_conflict` from the fresh row rather than reporting success.
4. Every other decision performs **no write whatsoever**.

**Caller contract, stated because it cannot be enforced from inside:** `activateCustomerIdentity` trusts that `authUserId` belongs to a verified identity. Callers must gate on `user.email_confirmed_at != null` before invoking it. Without that gate, a password sign-in against an unconfirmed email could activate — reintroducing the exact possession-of-inbox hole this change exists to close. This gate lives in the shared resolver (§3.1), so there is one place to audit.

### D1 — already activated by a different auth identity

**Decision: no write; return `identity_conflict`; the user-facing outcome is the existing generic `no_account`; the server logs a structured warning.**

Reasoning. `research.md` §1 establishes that Supabase auto-links identities by verified email, so two *different* `auth.users` rows cannot normally hold the same verified email. Reaching this branch therefore means something anomalous has happened — most plausibly a staff member edited `customers.email` to an address already owned by another activated row's auth user, or an auth user was deleted and recreated. Three options were weighed:

- *Overwrite `X` with `Y`* — silently reassigns one person's entire clinical history to a different auth account. Rejected outright; Req 2 names this as the harm.
- *Tell the user "this record belongs to another account"* — leaks that a customer record exists for this email in this tenant, contradicting the enumeration posture that Req 5 and `proposal.md` both require.
- *Deny with the generic outcome, log loudly* — chosen. It is indistinguishable from `no_account` to the caller, costs no new user-facing string, and the structured log (organization id, customer id, both auth user ids, never the email) gives staff something to triage. An anomaly that needs a human should reach a human through logs, not through an error message that doubles as an oracle.

### D2 — blocked customer

**Decision: no link written, session signed out, existing `no_account` returned.**

Writing `authUserId` "but denying access" was rejected: the row would then read as activated, and a later unblock would grant `/me` access with no fresh possession-of-inbox proof. Req 2 also states the write must not happen. Emitting a distinct "your account is blocked" message was rejected for the same enumeration reason as D1 — and today's `loginAction` already returns `no_account` for a blocked customer (lines 132–135), so this decision is *preservation of shipped behaviour*, not a new posture. The caller signs the Supabase session out so no stray session survives, exactly as step 8 does today.

### D3 — no matching guest row in this organization

**Decision: return `no_account`. Do not create a `customers` row.**

Four reasons, in order of weight:

1. **It would make `/login` a customer-record creation endpoint for any tenant.** Anyone with any email could manufacture a `customers` row in Lourdes' or Gloria's table by signing in on their subdomain. Staff customer lists would fill with strangers, and the pollution would be indistinguishable from real intake.
2. **There is nothing trustworthy to write.** `customers.fullName` is `NOT NULL`. OAuth supplies `full_name`, but OTP supplies nothing but an email — the row would have to be named from the email local-part or a placeholder, producing records staff would have to clean up.
3. **It preserves shipped behaviour exactly.** `loginAction` step 8 already signs out and returns `no_account`, and `LoginForm` already renders a `/book` CTA on precisely that error (`showBookCta`). The product answer — *"you have no account here; book your first appointment"* — already exists and is correct. `/book` is the sanctioned row-creation path and always has been.
4. **It keeps the primitive's write surface to exactly one UPDATE**, which makes Req 7's isolation invariant auditable by reading one statement.

Accepted cost, stated explicitly: OTP is requested with `shouldCreateUser: true` (§4), so a person with no customer row in this tenant may still cause an `auth.users` row to be created before being denied. Those rows carry no tenant data and no `customers` link. The alternative — `shouldCreateUser: false` — is strictly worse: it would fail for every genuine guest (who has a `customers` row but no `auth.users` row yet), breaking the primary activation path, and its failure mode would itself leak whether an auth user exists.

---

## 3. `loginAction` changes

### 3.1 Extracted shared modules

Three pieces move out of `apps/web/src/app/(auth)/login/actions.ts` so that `loginAction` and the two callback routes cannot drift apart:

| New module | Contents | Why here |
|---|---|---|
| `apps/web/src/infrastructure/auth/resolve-redirect-url.ts` | the existing private `resolveRedirectUrl()` (actions.ts lines 155–181), unchanged in behaviour | Today it is a private helper, so an OAuth/OTP callback would bypass the open-redirect guard entirely. Sibling of the existing `build-login-url.ts`; pure, so it finally gets a unit test. |
| `apps/web/src/infrastructure/auth/resolve-post-auth-destination.ts` | tenant resolution → staff `profiles` branch → `DASHBOARD_LOCALE` cookie hydration → customer branch → activation | Routing infrastructure ("which surface does this session belong to"), with a sibling already in place. The *business* rules (which row, blocked, conflict) stay in `domains/customers/activation*.ts`, so CLAUDE.md's domain-isolation rule is respected. |
| `apps/web/src/infrastructure/auth/oauth-providers.ts` | `resolveEnabledOAuthProviders(env)` (§7) | Read by `/login`, `Step2Auth`, and its own test. |

`resolvePostAuthDestination` returns a discriminated result — `{ kind: 'redirect'; url } | { kind: 'no_account' }` — and never calls `redirect()` itself, so it stays callable from both a Server Action (which throws the redirect) and a Route Handler (which returns a `NextResponse.redirect`).

### 3.2 Before / after

**Before** (actions.ts §7, lines 122–144):

```
userEmail = user.email?.toLowerCase()
row = SELECT id, isBlocked FROM customers WHERE org = X AND email = userEmail
if row:
    if row.isBlocked: signOut(); return no_account
    redirect(resolveRedirectUrl(next, slug, '/me'))
signOut(); return no_account
```

**After** (inside `resolvePostAuthDestination`, called by `loginAction` and both routes):

```
# 7a — identity-first, no email comparison (Req 3 scenario 1)
row = SELECT id, isBlocked FROM customers WHERE org = X AND auth_user_id = user.id
if row:
    if row.isBlocked: signOut(); return no_account
    return redirect(resolveRedirectUrl(next, slug, '/me'))

# 7b — email fallback IS the activation trigger (Req 3 scenario 2)
if not user.email or not user.email_confirmed_at: signOut(); return no_account
decision = activateCustomerIdentity({ organizationId: X, authUserId: user.id,
                                      verifiedEmail: user.email.toLowerCase() })
if decision.error: return generic
switch decision.data.kind:
    'activate' | 'already_linked'                  -> return redirect(... '/me')
    'no_account' | 'blocked' | 'identity_conflict'  -> signOut(); return no_account
```

Notes:

- Steps 1–6 (validation, tenant resolution, staff `profiles` branch, `DASHBOARD_LOCALE` hydration) are structurally unchanged, as `proposal.md` requires. The staff flow is untouched (Req 5, non-goals).
- `already_linked` reaching 7b rather than 7a means the row's `authUserId` matches but 7a missed it — only possible if the row was linked concurrently. Routing it to `/me` is correct.
- The `email_confirmed_at` gate is the one place the verified-identity contract from §2.2 is enforced.
- `loginAction` itself keeps its current password-only signature and `LoginState`. It gains no new error codes: every denial still surfaces as `no_account` (D1, D2, D3).

---

## 4. Self-serve trigger surfaces

### 4.1 `/auth/confirm` — new route (magic-link / OTP landing)

`apps/web/src/app/auth/confirm/route.ts`, sibling to the existing `auth/callback/route.ts`.

The existing callback exchanges a PKCE `?code=` via `exchangeCodeForSession` — that is the **OAuth** shape. Email OTP links arrive with `?token_hash=...&type=...` and are consumed with `verifyOtp({ type, token_hash })`. They are two different handlers; one route cannot serve both cleanly.

Both routes then converge: resolve the tenant from the request host, call `resolvePostAuthDestination`, and redirect. On `no_account`, redirect to `/login?error=no_account` so the customer sees the existing copy and the `/book` CTA rather than a bare failure.

**No `proxy.ts` edit is needed.** Verified: `UNREWRITTEN_PREFIXES` already contains `/auth` (proxy.ts line 55) and `AUTH_REQUIRED_PREFIXES` is `['/dashboard', '/admin', '/me']` (line 45) — so `/auth/confirm` is already reachable unauthenticated and already exempt from the tenant rewrite. The CLAUDE.md middleware red line is satisfied by placement, not by an exception.

### D5 — the callback routes become the single post-auth funnel

A hole exists in the code today and must be closed here, or Req 4 is only half true: `Step2Auth`'s Google sign-in redirects to `/auth/callback?next=/book`, which **never runs `loginAction`**. A Google-authenticated booker therefore holds a session, gets a `customers` row from the booking upsert, and can reach `/me` (the proxy only checks for a session) while `authUserId` stays `NULL` forever.

Routing both `/auth/callback` and `/auth/confirm` through `resolvePostAuthDestination` closes it: every verified arrival activates, regardless of `next`. This is what makes "one primitive, several doors" literal rather than aspirational — and it means `Step2Auth`'s existing Google button starts activating correctly with no change to `Step2Auth` itself.

### 4.2 `/login` (Req 5)

`LoginForm.tsx` is restructured into three visual tiers:

1. **Primary — passwordless.** An email field + "Send me a link" calling a new Server Action `requestOtpAction`, plus Google and (config-gated) Apple buttons calling `signInWithOAuth` client-side, `redirectTo = ${window.location.origin}/auth/callback?next=/me`.
2. **Secondary — password.** Collapsed behind a de-emphasised "Sign in with a password instead" disclosure, posting to the unchanged `loginAction`. Sign-in only; no account creation affordance exists on this page.
3. **No forgot-password link.** The dead `href="#"` (line 137) is **removed**, not repointed. OTP *is* the recovery path, and `proposal.md` rejected building a separate reset flow. The adjacent copy explains that signing in with a link works without a password, so the affordance is replaced by an explanation rather than deleted silently.

`requestOtpAction` (`apps/web/src/app/(auth)/login/actions.ts`):

```ts
export async function requestOtpAction(prev, formData): Promise<OtpState>;
```

- `signInWithOtp({ email, options: { emailRedirectTo: <tenant origin>/auth/confirm?next=/me, shouldCreateUser: true } })`.
- **Returns the identical "check your inbox" state in every case** — whether or not a `customers` row exists for that email in this tenant, and whether or not Supabase reports an error other than a rate limit. This is the enumeration posture `proposal.md` requires, mirroring Supabase's own obfuscated duplicate-signup response (`research.md` §4). The row check does not happen here at all; it happens after verification, inside the primitive.
- Rate-limit errors surface as a distinct, non-enumerating "try again shortly" message.

`emailRedirectTo` must be built from the request's own tenant host so the link returns to the organization the customer started on — cross-tenant leakage would otherwise be one copy-pasted link away.

### 4.3 In-product self-serve entry point

### D6 — the CTA belongs on the booking-confirmation surface, not `/me`

`proposal.md` scoped this as "post-booking confirmation and/or `/me`". Only the first is real. `/me` sits behind `AUTH_REQUIRED_PREFIXES`, so every `/me` visitor already holds a session, and after D5 every session that reached `/me` already went through `resolvePostAuthDestination` and is therefore already activated. An "activate your account" banner on `/me` would be unreachable by construction.

The genuine unactivated moment is the booking confirmation: a guest who chose "continue as guest" in `Step2Auth` has a `customers` row, no session, and has just proved they care about this business. The CTA therefore lives on the booking-success surface and is a link to `/login?next=/me`, with copy explaining that signing in with a link turns the booking into an account. It introduces **no new identity logic** — it is a link, and the activation happens through §4.1's funnel (Req 4 scenario 2).

The residual `/me`-side affordance is different in kind and is the `proposal.md` step-3 item: **set a password** in `/me/perfil`, via `updateUser({ password })` from the already-authenticated session — the only sanctioned way to acquire a password (`research.md` §4). It is a profile affordance, not an auth affordance.

---

## 5. Staff-triggered invite surface

### 5.1 Server Action — `apps/web/src/app/(dashboard)/dashboard/customers/actions/invite-customer-activation.ts`

```ts
export async function inviteCustomerActivationAction(
  customerId: string,
): Promise<Result<{ sent: true }>>;
```

Structurally mirrors the shipped `toggle-block-customer.ts`: resolve the staff session, derive `orgId` from `user.user_metadata.organization_id` with a `profiles` fallback, then scope every query by `orgId`.

Sequence:

1. Staff auth check → `UNAUTHORIZED` on failure.
2. Resolve `orgId`. **RBAC: Owner and Staff both**, per `IDENTITY.md` §5 and `proposal.md` item 6 — enforced by the same "has a `profiles` row in this org" check `toggle-block-customer` uses. No new role gate is introduced, and none is warranted: a staff member who can already block, edit and delete a customer is not meaningfully escalated by being able to email them a sign-in link.
3. `SELECT id, email, is_blocked, auth_user_id FROM customers WHERE id = $customerId AND organization_id = $orgId`. The `organization_id` predicate is what satisfies Req 4 scenario 2 — a forged `customerId` from another tenant returns `NOT_FOUND`.
4. Refuse with a typed error when `email IS NULL`, `is_blocked`, or `auth_user_id IS NOT NULL` (already activated). These are staff-facing, so they are *not* subject to the enumeration posture — a staff member is entitled to know why the invite was not sent about their own customer.
5. Send the link and return.

### 5.2 The mechanism that makes "does not authenticate anyone" true

This is the requirement most easily satisfied in words and broken in code. Req 4 scenario 3 demands the staff action create no session, and the concrete risk is that `signInWithOtp` called on the **cookie-bound SSR client** could write auth cookies into the *staff member's own browser*.

So: the invite uses a **fresh, cookie-less Supabase client** — `createClient(NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY, { auth: { persistSession: false, autoRefreshToken: false } })` — constructed inside this action and discarded. It shares no cookie jar with the staff session.

It also writes **nothing** to `customers`: no `authUserId`, no `isGuest`. The action's entire effect is an outbound email. The `authUserId` write happens later, when the customer clicks the link and lands on `/auth/confirm`, at which point §2's primitive performs it — which is exactly what Req 4 scenario 3 specifies.

`emailRedirectTo` is `https://{orgSlug}.{NEXT_PUBLIC_BASE_DOMAIN}/auth/confirm?next=/me`, built from the org's own slug so the invite can only land on the inviting organization's subdomain.

Rate limiting relies on Supabase Auth's built-in OTP email limits; no Upstash layer is added, and no per-staff throttle is built. A staff member repeatedly inviting one customer is bounded by Supabase and is a UX annoyance, not a security event.

### 5.3 UI

A new `DropdownMenu.Item` in `(dashboard)/dashboard/customers/[id]/_components/CustomerActionsMenu.tsx`, above the block/unblock item, using the file's existing `useTransition` + `sonner` toast pattern. Disabled (with a reason tooltip) when the customer has no email, is blocked, or is already activated. Strings under `dashboard.customers.actions.*`, alongside the existing `blockLabel` / `toastBlocked` keys.

---

## 6. `Step2Auth.tsx` migration

### 6.1 Removals and additions

| Remove | Add | Keep |
|---|---|---|
| `handleRegister` (lines 82–99) — the bare `signUp()` | OTP: email field → `signInWithOtp`, `emailRedirectTo = /auth/confirm?next=/book` | `handleLogin` — password sign-in for an already-activated customer (Req 6 scenario 2) |
| the `'register'` view branch (lines 150–191) | Apple button, config-gated (§7) | Google OAuth, unchanged (it activates for free after D5) |
| the "Criar Perfil" button (lines 232–241) | | "continue as guest" (lines 249–264) |
| `AuthView` loses `'register'` | | |

Verification per `proposal.md`: `rg 'signUp\(' apps/web/src` returns no account-creating call site.

The `{/* Apple — pendiente de Apple Developer membership */}` comment at line 219 is replaced by a real, config-gated button (Req 9).

### D7 — the sequencing gate is a named production query, not a feature flag

Req 6 scenario 3 requires the new path be *proven live* before the old one is removed. "Proven" needs a mechanism.

A feature flag was rejected: the repo has no flag infrastructure, and a flag wrapping a *removal* creates a dead branch that itself needs a second deploy to delete — two deploys either way, plus a flag to forget. So: **two PRs, with an evidence gate between them, recorded where this repo already records invisible state.**

- **PR-B** ships §1–§4 (schema, primitive, `loginAction`, `/login`, `/auth/confirm`). `Step2Auth` is untouched and keeps working, including its `signUp` path.
- **Gate**, run against production after PR-B deploys, all three checked:
  1. `SELECT count(*) FROM customers WHERE auth_user_id IS NOT NULL;` returns **≥ 2**, produced by (a) one real OTP sign-in and (b) one real Google sign-in, on a tenant subdomain.
  2. Both `auth_user_id` values are real `auth.users` rows in different `customers` rows or the same row activated once and re-entered idempotently — i.e. the happy path and the `already_linked` path both observed.
  3. `/auth/confirm` observed returning a redirect to `/me` in production logs.
- **Record**: the query result, date, and the two methods exercised go into `HEARTBEAT.md` — the same durable-record mechanism Req 10 uses for the invisible Supabase dashboard toggle.
- **PR-D** (this section) merges only after that HEARTBEAT entry exists.

This also bounds the conversion risk `proposal.md` Risk 2 names: the funnel's auth step changes only once, after the replacement is demonstrably serving real sessions.

---

## 7. Google and Apple OAuth wiring

**Google** needs no new mechanism. It is already live in this Supabase project (`explore.md` §2, real `google` identities in `auth.identities`) and already called from `Step2Auth`. `/login` reuses the identical call shape, differing only in `redirectTo`'s `next` (`/me` rather than `/book`). After D5, both land in the same resolver.

**Apple** ships config-gated via one shared, pure module:

```ts
// apps/web/src/infrastructure/auth/oauth-providers.ts
export type OAuthProvider = 'google' | 'apple';

/** Pure — takes env values as arguments rather than reading process.env,
 *  mirroring stripe-policy.ts, so it is unit-testable with no environment. */
export function resolveEnabledOAuthProviders(env: {
  appleEnabled: string | undefined;
}): readonly OAuthProvider[];
```

Google is always present; Apple is appended only when `env.appleEnabled === 'true'`. The gate value is `NEXT_PUBLIC_SUPABASE_APPLE_ENABLED`, `NEXT_PUBLIC_` because both `/login`'s form and `Step2Auth` are Client Components.

**Why an explicit boolean rather than sniffing for an Apple client ID.** The Apple client ID and secret live in Supabase's dashboard; this application never needs them. Inventing an unused `NEXT_PUBLIC_APPLE_CLIENT_ID` purely to test its presence would put a value in the app's config that the app does not use — a lie a future reader would try to wire up. An explicit boolean states honestly what it is: a human's assertion that the external setup is done.

`.env.example` gains the variable with a comment naming the external prerequisite (Apple Developer Program membership → Services ID, key, redirect URIs → Supabase Auth provider settings). Once that is done and the variable is set to `true`, the button appears with no code change, and its handler is the Google branch with `provider: 'apple'` (Req 9).

---

## 8. i18n

### 8.1 New top-level namespace: `auth`

`es.json`'s top-level keys are `calendar, customers, booking, account, tenant, integrations, dashboard, marketing`. The convention is route group → top-level namespace: `(account)` → `account.me.*`, `(dashboard)` → `dashboard.*`. `(auth)` therefore takes **`auth`**, with `auth.login.*` and `auth.confirm.*` beneath it. `spec.md` flagged that CLAUDE.md documents only `(dashboard)` and `(public)` prefixes; this follows the *actual* shipped convention rather than inventing a fourth pattern.

| Namespace | Contents |
|---|---|
| `auth.login.*` | brand, tagline, heading, subtitle, otp (label/cta/sent), `providers.google`, `providers.apple`, `passwordDisclosure`, password fields, `errors.*`, `noAccountCta*` |
| `auth.confirm.*` | link-expired / link-invalid states on `/auth/confirm` |
| `booking.auth.*` (existing) | drop `headingRegister`, `subtitleRegister`, `createAccount`, `createProfile`, `noAccount`, `createNow`, `fullNameLabel`, `fullNamePlaceholder`, `passwordMinPlaceholder`; add `otp*`, `apple` |
| `dashboard.customers.actions.*` (existing) | `inviteLabel`, `toastInviteSent`, `inviteNoEmail`, `inviteBlocked`, `inviteAlreadyActive` |
| `account.me.perfil.*` (existing) | set-password form + errors |

### 8.2 Required migration: delete `shared/lib/i18n/auth.ts`

`apps/web/src/shared/lib/i18n/auth.ts` is a per-module translation map — the exact pattern CLAUDE.md prohibits ("No Local `_i18n.ts` Files … Delete any that exist; migrate all keys to `messages/*.json`"), differing from the banned name only in spelling. Its `detectAuthLocale()` also ends in `return 'es'`, a hardcoded literal locale fallback, which CLAUDE.md separately forbids.

The `/login` redesign touches every string in that file, so migrating it is unavoidable work, not opportunistic cleanup:

- All keys move to `auth.login.*` in `pt.json` / `es.json` / `en.json`.
- `detectAuthLocale` is deleted; `page.tsx` uses `localeFromHeader(hdrs.get('x-locale'))`, which `(auth)/layout.tsx` already calls, and which resolves through `DEFAULT_LOCALE` from `@/i18n/config`.
- `LoginForm`'s `t: AuthT` prop is removed in favour of `useTranslations('auth.login')`.
- The left decorative panel currently pins itself to Spanish (`const ES = authTranslations['es']`); it becomes locale-aware via the same namespace, removing a second hardcoded-locale site.

### 8.3 Blocker this exposes: `(auth)` has no `NextIntlClientProvider`

Verified: `NextIntlClientProvider` appears only in `ConsumerShell.tsx`, `(marketing)/layout.tsx` and `(dashboard)/layout.tsx`. `(auth)/layout.tsx` is an independent root layout with none — which is precisely *why* `auth.ts` exists. `LoginForm` is a Client Component, so `useTranslations` cannot work until this is fixed.

Design:

- `(auth)/layout.tsx` wraps its children in `NextIntlClientProvider` with `pickMessages(await getMessages(), AUTH_CLIENT_NAMESPACES)`, reusing the PERF-01 helper so the auth bundle ships one namespace rather than all eight.
- `apps/web/src/i18n/client-namespaces.ts` gains `export const AUTH_CLIENT_NAMESPACES = ['auth'] as const;`.
- `client-namespace-audit.test.ts`'s scan roots gain `app/(auth)` so the new group is guarded exactly like `(tenant)`, `(account)` and `(marketing)`.

`i18n/request.ts` is **not** edited — CLAUDE.md red line, and nothing here requires it.

### 8.4 ICU and key shape

Interpolation uses ICU named arguments: `auth.login.otp.sent` takes `{email}`, `dashboard.customers.actions.toastInviteSent` takes `{name}` (matching the existing `confirmDesc` usage). Provider labels are named keys (`auth.login.providers.google`, `.apple`), never an indexed array. `messages.test.ts` enforces tri-locale parity automatically once keys are added to all three files in the same PR.

---

## 9. Testability

Node-environment Vitest, `globals: false`, `include: ['src/**/*.test.ts']`, no jsdom and no RTL. The design therefore concentrates every decision that *can* be pure into modules with no DB, no `server-only`, and no Next runtime import.

| Seam | Module | Covers |
|---|---|---|
| Activation decision logic | `domains/customers/activation-policy.ts` → `resolveActivationDecision()` | All five Req-2 branches **and their order**: blocked-before-link (no write on a blocked row), conflict-never-overwrites, idempotent re-entry, null-row → `no_account` |
| Open-redirect guard | `infrastructure/auth/resolve-redirect-url.ts` | Same-subdomain `next` accepted; other-org, other-domain, and malformed `next` fall back to the default. Currently a private, untested helper. |
| Apple gating | `infrastructure/auth/oauth-providers.ts` → `resolveEnabledOAuthProviders()` | Req 9 verified by flipping an argument, with no code change and no environment — satisfying `spec.md`'s "toggling the config presence" requirement |
| i18n parity | `messages/messages.test.ts` (existing) | Every new key, in three locales, free |
| Namespace hygiene | `i18n/client-namespace-audit.test.ts` (extended to `app/(auth)`) | `/login` cannot read a namespace its provider does not ship |

The mechanism that makes the first seam work is the deliberate absence of two imports in `activation-policy.ts`: no `server-only` (which would make Vitest refuse the module) and no `@/infrastructure/db` (which would open a Postgres connection at import time). `ActivationCandidateRow` is a hand-written structural type for exactly this reason — the same trade `stripe-policy.ts` already makes, and its header comment already documents.

**Stated honestly as not unit-tested:** `activateCustomerIdentity`'s SELECT/UPDATE wrapper, `resolvePostAuthDestination`, `requestOtpAction`, `inviteCustomerActivationAction`, and the two route handlers all require a live database or a Supabase Auth session. No test database or Drizzle mock harness exists in this repo today, and building one is disproportionate to this change. They are covered by manual/QA verification plus D7's production evidence gate — which is a stronger signal than a mock would give, since it exercises the real Supabase identity-linking behaviour `research.md` documents but the repo does not control.

---

## 10. Non-regression: no new client-side table access (Req 8)

The design adds **zero** customer-session Supabase client calls against `customers` or `appointments`.

- Every new database touch is Drizzle over the server-only `db` connection: the primitive's SELECT and guarded UPDATE, and the staff action's SELECT. All are `server-only` modules, all name their columns explicitly (no `SELECT *`), all filter by `organizationId`.
- Every new Supabase client call is auth-surface only — `signInWithOtp`, `signInWithOAuth`, `verifyOtp`, `exchangeCodeForSession`, `updateUser` — touching `auth.*`, never `public.customers` or `public.appointments`.
- `getMyCustomer`, `getMyAppointments`, `updateMyProfile` and the `/book` guest upsert are unchanged in their access pattern.

**The RLS gap stays exactly as documented and is not silently assumed fixed.** `customers_org_all` and `appointments_org_all` still key off `profiles.id = auth.uid()`; a signed-in customer's `auth.uid()` still resolves to zero rows. No `CREATE POLICY` is authored here (`spec.md` non-goals).

`proposal.md` Risk 4 asks that the assumption boundary be written *where someone will hit it*. That place is the `authUserId` column declaration in `schema/customers.ts` — the first thing a contributor reads before assuming a customer-authenticated Supabase client is now safe. The warning comment in §1.1 is that placement, and it is a required part of this design, not documentation garnish.

Verification command for the tasks phase, matching `spec.md`'s `rg`-based style:
`rg -n "from\('customers'\)|from\('appointments'\)" apps/web/src` must return zero matches.

---

## 11. Delivery chain

Refines `proposal.md`'s suggested sequencing. Sizes are indicative; each stays inside the 400-line review budget.

| PR | Contents | Gate |
|---|---|---|
| **A** | Case-insensitive duplicate audit; SQL migration (column, FK, unique index, index); Drizzle declaration + RLS warning comment; email lower-casing at `book/actions.ts`'s upsert | Audit returns zero rows before the migration is authored |
| **B** | `activation-policy.ts` + tests; `activation.ts`; the three extracted `infrastructure/auth` modules + tests; `resolvePostAuthDestination`; `loginAction` rewrite; `/auth/confirm`; `/auth/callback` routed through the resolver | `pnpm test`, `pnpm check-types`, build |
| **C** | `/login` redesign; `auth` namespace in three locales; delete `shared/lib/i18n/auth.ts`; `NextIntlClientProvider` in `(auth)/layout.tsx`; `AUTH_CLIENT_NAMESPACES`; audit-test scan root | Parity suite; manual `/login` QA in three locales |
| **D** | Booking-confirmation CTA; `/me/perfil` set-password via `updateUser` | — |
| **E** | `Step2Auth` migration | **Blocked on D7's HEARTBEAT gate entry** |
| **F** | Staff invite action + `CustomerActionsMenu` item + strings | — |
| **G** | Enable Leaked Password Protection in the Supabase dashboard; record in HEARTBEAT (Req 10) | `get_advisors --type security` no longer reports it |

A and E are the sequencing-sensitive steps (`proposal.md` Risk 2). C–D, F and G are additive.

## Validation gate

`pnpm check-types`, `pnpm test` (new `activation-policy.test.ts`, `resolve-redirect-url.test.ts`, `oauth-providers.test.ts`, extended `client-namespace-audit.test.ts`, plus the full existing suite), `npm run build`, `eslint`. Plus `rg 'signUp\(' apps/web/src` → no account-creating call site, and `rg "from\('customers'\)|from\('appointments'\)" apps/web/src` → zero matches.
