# Proposal: customer-identity-activation (guest → activated customer account, org-scoped)

## Intent

Today a customer who books at `/book` exists only as a guest `customers` row (`isGuest: true`), created by an email-matched upsert in `book/actions.ts`. There is no link at all between that row and Supabase Auth: `customers` has no `authUserId` column, and nothing anywhere writes `user.id` onto a customer. Consequently:

- The only way into `/me` is `signInWithPassword` against an account the customer has no sanctioned way to create.
- Customer identity is a lower-cased **email string match** scoped by `organizationId`, over a table that has **no unique constraint on `(organizationId, email)`** — so two concurrent guest bookings for one person can already produce two rows, and nothing says which one "is" that person.
- `/login` is password-only, staff-flavoured (`SkinSystem — Acceso`), has a dead `href="#"` forgot-password link, and offers no activation entry point.
- A live account-takeover-shaped pattern already ships: `Step2Auth.tsx` calls bare `supabase.auth.signUp({ email, password })` inside the `/book` funnel — "type someone's email, set a password" with no possession-of-inbox proof first.

This change gives a guest customer a real, secure, **org-scoped** way to activate self-service login into `/me`, makes the customer↔auth link a real foreign key instead of a string match, and removes the bare-`signUp` pattern from the codebase.

## Locked inputs (already decided — not reopened by this proposal)

Resolved by the orchestrator with the human, plus `explore.md` and `research.md`:

- **Auth methods, in priority order**: OTP/magic-link (`signInWithOtp`) and Google OAuth (`signInWithOAuth`, already live in this Supabase project and in `Step2Auth.tsx`) are **co-primary, passwordless-first**. Email+password is **secondary and optional**, and may only ever be set via `updateUser({ password })` from an already-authenticated (OTP or OAuth) session. Apple OAuth is **in scope and code-ready**, shipped inert until the human completes the external Apple Developer configuration.
- **`Step2Auth.tsx` is migrated, not tolerated**: the bare `signUp()` path is removed, not deprecated-later and not kept alongside.
- **Org isolation is application-layer**: activating on one organization's subdomain must never grant login on another's, even when a same-email guest row exists there. Supabase Auth identities are global by email (`research.md` §1: automatic linking by verified email is unconditional default behaviour); isolation is derived from the `customers.authUserId` + `organizationId` pairing, never from Supabase and never from RLS.
- **Identity-linking mechanism needs no work**: `research.md` concludes with confidence that OTP + Google OAuth + password for one email converge on **one** `auth.users` row by Supabase's documented default — OTP and password share a single `email`-type identity, and OAuth auto-links by verified email. No `linkIdentity()` call, no project setting.
- **Both activation triggers ship**: self-serve (customer-initiated) **and** staff-triggered invite from the dashboard customer detail view.
- **Out of scope**: TICKET CUST-01 (`/me/citas` professional attribution, HEARTBEAT `2026-09-18 #10`).

## Scope (in)

1. **`customers.authUserId`** — new nullable `uuid` column, FK to `auth.users.id`, becoming the canonical customer-identity link. Nullable because guest rows legitimately have no auth user; the column's presence is what "activated" means.
2. **Unique constraint on `customers(organizationId, email)`** — the latent duplicate-row race flagged in `explore.md` §4, closed here because it directly determines which row `authUserId` may point to. Requires a **dedup step before the constraint can be added** (see Risks).
3. **A single activation primitive** shared by every entry point: prove control of the email (OTP or OAuth), then link the resulting `auth.users.id` to the one `customers` row for `(organizationId, email)` in the **current tenant only**, and clear `isGuest`.
4. **`/login` redesign** — OTP and Google (and Apple, when available) as the primary actions; password demoted to a secondary, de-emphasised option; branding reworked to read correctly for both a customer arriving from a tenant subdomain and a staff member. The dead forgot-password link is resolved as part of this (OTP subsumes password recovery; if a password-specific reset remains, it is stated explicitly rather than left as `href="#"`).
5. **Self-serve activation surface** — a customer can activate at any time. The primary path is `/login` itself: once OTP/OAuth are primary, a guest simply signs in and the flow performs the activation, with no separate "activate" screen. A secondary in-product entry point (post-booking confirmation and/or `/me`) is in scope as the discoverability hook.
6. **Staff-triggered activation invite** — an action on `(dashboard)/dashboard/customers/[id]` that sends an activation email to that guest customer. Converges on the same primitive as (3); it is a delivery trigger, not a second mechanism. RBAC posture for it is stated in the spec (expected: Owner and Staff both, per `IDENTITY.md` §5).
7. **`Step2Auth.tsx` migration** — `handleRegister` and its bare `signUp()` are removed. The booking funnel offers OTP, Google, Apple (when available), and "continue as guest"; password sign-in for an already-activated customer may remain, but no account *creation* by password.
8. **Apple OAuth, gated** — the `signInWithOAuth({ provider: 'apple' })` code path is written and shipped, hidden behind a configuration-presence gate rather than commented-out JSX, so it becomes live when the human completes the Apple Developer + Supabase dashboard setup, with no further code change.
9. **Enable Supabase "Leaked Password Protection"** — the live security advisory from `explore.md` §2, bundled here because it hardens exactly the password-as-secondary surface this change keeps.
10. **i18n** — every new user-facing string lands in `apps/web/src/messages/{pt,es,en}.json` with key parity, per CLAUDE.md. No `_i18n.ts` files, no literal locale fallbacks.

## Approach

**One primitive, several doors.** Every activation path converges on the same server-side operation: *verified auth identity + current tenant → the single `customers` row for that `(organizationId, email)` → write `authUserId`, clear `isGuest`*. Self-serve `/login`, the in-product CTA, and the staff invite differ only in who triggers the email and where the user lands afterwards. This is what makes "both triggers" cheap: the second door is UI and a server action, not a second identity model.

**Identity resolution moves from string to key, with a transition window.** `loginAction`'s current chain (resolve tenant → `profiles` exact-org match → else `customers` by lower-cased email in that org → else sign out + `no_account`) is structurally preserved. The customer branch changes to prefer `authUserId = auth.uid()` and fall back to the email match for rows not yet activated — that fallback *is* the activation trigger on first passwordless sign-in. Backfilling `authUserId` for pre-existing rows is not required up front; rows self-heal on first sign-in.

**Org isolation is an explicit lookup constraint, never an inference.** One `auth.users` row may legitimately be linked to several `customers` rows across orgs — that is correct and expected for a person who is a client of both Lourdes and Gloria. What must never happen is a link being created in org B as a side effect of activating in org A. The activation primitive therefore takes `organizationId` from the request's resolved tenant and writes exactly one row, in that org. `explore.md` §4 confirms the surrounding reality this rests on: RLS today grants a signed-in customer **zero** rows on `customers`/`appointments` (both policies key off `profiles.id = auth.uid()`, i.e. staff only), so all customer-path isolation is already enforced by hand-written `organizationId` filters over a direct Drizzle connection that bypasses RLS. This change does not fix that gap and must not assume it away.

**Password never creates an account.** The only sanctioned way to get a password is `updateUser({ password })` from an authenticated session — the API `research.md` §4 documents for exactly this. That makes "set a password" a `/me`-side profile affordance, not an auth-surface affordance, and removes the pattern from `/login` and `/book` entirely.

**Domain isolation.** The activation logic (row resolution, org scoping, link write, guest flip) belongs in `src/domains/customers` alongside `service-me.ts`; route handlers, server actions and components stay thin, per CLAUDE.md §2. Any activation or OAuth redirect reuses the existing open-redirect guard (`resolveRedirectUrl()` validating `next` against the org's own subdomain) — the existing `/auth/callback` PKCE route is already generic and reusable with a different `next`.

**Proxy boundaries are respected, not edited.** `proxy.ts` is untouched (CLAUDE.md red line, no middleware ticket). New routes are placed deliberately relative to the existing prefix lists: activation/verification routes stay *outside* `AUTH_REQUIRED_PREFIXES` (they must be reachable unauthenticated), `/me/*` stays behind it.

**Enumeration posture.** Activation entry points must return a uniform response whether or not a guest `customers` row exists for the submitted email in this org. Supabase already does this for duplicate signup (`research.md` §4: obfuscated response, no email sent); our own surfaces must match rather than leak tenant customer lists.

## Alternatives considered

- **Keep `Step2Auth.tsx`'s `signUp()` alongside the new flow, deprecate later.** Rejected by decision: it is the exact pattern this change exists to eliminate, and leaving it means the vulnerability survives the change that was supposed to close it. `research.md` §4 notes Supabase blocks *row duplication* for an email with prior OAuth history — but that is a different concern from the missing possession-of-inbox proof, and does not make the path safe.
- **Rely on RLS for org isolation instead of the app layer.** Rejected on verified evidence: today's policies grant customers nothing, so there is no isolation to rely on, only isolation to invent. Adding a customer-self policy keyed on `authUserId = auth.uid()` becomes *possible* once the column exists and is worth considering as defence-in-depth — but as a design-phase question, not as the mechanism this change's correctness depends on.
- **Keep email-string matching and skip the FK.** Rejected: it is precisely what makes duplicates ambiguous and what makes an email change silently orphan a person's history.
- **Ship the unique constraint as a separate later change.** Rejected: which row `authUserId` points to is undefined without it, so it is a prerequisite of this change's own correctness, not an adjacent cleanup.
- **Block the whole change on Apple's external configuration.** Rejected: nothing in the OTP/Google/password design depends on Apple, and the Apple code path is a near-copy of the proven Google branch.
- **Build only one activation trigger first.** Rejected by the human: both ship, and the shared primitive makes the marginal cost of the second small.
- **Build a dedicated password-reset flow for the dead forgot-password link.** Rejected as unnecessary: OTP *is* the recovery path once it is primary; a customer who forgot a password signs in passwordlessly and may reset from `/me`.

## Explicit non-goals

- **TICKET CUST-01** (`/me/citas` professional attribution) — separately ticketed, untouched.
- **Fixing the customer-side RLS gap.** Stays staff-only. This change adds no new client-side, customer-authenticated Supabase call against `customers`/`appointments`; all access remains server-only over `db`, exactly as today.
- **Backfilling `authUserId` for historical rows** beyond self-healing on first sign-in.
- **Cross-email identity linking** (`linkIdentity()`, manual linking) — out of scope; this design is same-email only, which `research.md` shows needs nothing.
- **The two unrelated pre-existing Supabase advisories** (`function_search_path_mutable`, the `SECURITY DEFINER` function callable by `anon`) — noted in exploration, not in scope.
- **`proxy.ts` / `i18n/request.ts` edits.**
- **The staff `/dashboard` auth flow** — unchanged; `profiles`-based password login keeps working as-is. Only the shared `/login` page's presentation changes.

## Risks and tradeoffs

1. **The unique constraint may not apply cleanly.** If any duplicate `(organizationId, email)` pairs already exist in production, `ALTER TABLE ... ADD CONSTRAINT` fails. A dedup step must run first, and it needs a stated merge policy: which row survives, and what happens to `appointments` (and any other child rows) pointing at the losing one. This is a data migration with real consequences, not a schema one-liner — it should be measured against live data before the constraint is authored.
2. **`Step2Auth.tsx`'s migration is a genuine behaviour change mid-funnel.** A customer who is partway through `/book` when the deploy lands may see the auth step change under them. Deployment sequencing matters: the schema + activation primitive should land and be exercised *before* the `/book` surface flips, so the replacement path is proven live before the old one is removed. The `/book` change should also be watched as a booking-conversion risk, not only a security fix — removing a familiar "register" option from a funnel is a conversion-affecting edit.
3. **Apple ships as inert UI.** Gating on configuration presence (rather than a commented-out block) is what keeps this honest — but it means the code path will not have been exercised end-to-end until the human finishes the external setup. Accepted deliberately; the alternative is either blocking on an external dependency or silently dropping a requested method.
4. **The RLS gap stays open and is now easier to trip over.** Once `authUserId` exists, a future contributor may reasonably assume a customer-authenticated Supabase client is safe against `customers`. It is not, today. Whatever the design decides, the *assumption boundary* must be written down where someone will hit it.
5. **The one-`auth.users`-per-person premise is Supabase's default, not a contract we control.** `research.md` establishes it is unconditional and undisableable as documented — but it is their behaviour, not ours. The FK design is correct today; if Supabase ever makes automatic linking configurable, this premise needs re-checking. Recorded, not mitigated.
6. **Enabling Leaked Password Protection is a dashboard toggle, not a migration.** It is invisible to code review and to this repo's history. It must be recorded as a completed step somewhere durable (HEARTBEAT) or it will drift.
7. **Size.** Schema + migration + activation domain logic + `/login` redesign + two trigger surfaces + `Step2Auth` migration + tri-locale strings will comfortably exceed the 400-line review budget. This should be delivered as an ordered chain, not one PR.

## Success criteria

- A guest customer can activate and reach `/me` using OTP alone, and separately using Google alone, on their organization's subdomain.
- The same person's activation on org A grants no access on org B, verified with a same-email guest row present in both.
- `customers.authUserId` is populated for every activated customer and is a real FK; `(organizationId, email)` is unique.
- `rg 'signUp\('` over `apps/web/src` returns no account-creating call site.
- A password can only be set from an authenticated session; no surface offers password-based account creation.
- `/login` presents passwordless methods first and has no dead links.
- A staff member can trigger an activation invite from a customer's detail view, and it converges on the same activation primitive as the self-serve path.
- Apple's button appears when and only when the provider is configured.
- `pt.json` / `es.json` / `en.json` are at key parity; no `_i18n.ts` file is added; `proxy.ts` and `i18n/request.ts` are unchanged.

## Delivery

Ordered chain, not a single PR. Suggested sequencing (the design and tasks phases own the final cut):

1. **Data + schema**: duplicate audit and dedup, `(organizationId, email)` unique constraint, `customers.authUserId` column and FK.
2. **Activation primitive + `/login` redesign**: OTP and OAuth sign-in, the shared link-and-promote operation, redirect-guard reuse, tri-locale strings.
3. **In-product self-serve entry point**, and **password-as-secondary** via `updateUser` from `/me`.
4. **`Step2Auth.tsx` migration** — deliberately after (2) is live and proven.
5. **Staff-triggered invite** from the dashboard customer detail view.
6. **Leaked Password Protection** enabled in the Supabase dashboard, recorded in HEARTBEAT.

Steps 1 and 4 carry the deployment-sequencing risk described above; the rest are additive.
