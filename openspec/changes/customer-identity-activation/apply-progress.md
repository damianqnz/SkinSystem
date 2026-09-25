# Apply progress: customer-identity-activation — PR A (Data + schema)

Date: 2026-09-19. Mode: Standard. Strategy: SPLIT, stacked-to-main. Boundary: PR A only. Nothing committed, branched or pushed; all changes are uncommitted in the working tree.

## Tasks

| Task | State | Notes |
|---|---|---|
| A.1 audit | done | Read-only, production, 2026-09-19: duplicate `(organization_id, lower(email))` groups = 0 rows; `email <> lower(email)` = 0. Also 26 customers total, 0 null emails. Must be re-run right before applying (A.9.1). |
| A.2 inventory | done | See "A.2 inventory" below. |
| A.3 schema | done | `authUserId` + `idx_customers_auth_user_id` + design 1.1 comments (no RLS warning, pointer to the expression index). |
| A.4 migration | done (authored, NOT applied) | `apps/web/supabase/migrations/20260919_customers_auth_identity.sql`, statements in the exact required order, header with audit queries, SET NULL rationale, NULLS DISTINCT rationale, manual rollback. |
| A.5 lower-case guest email | done | Same PR as the index. |
| A.6 staff create/update/import | done | Lower-case on write, case-insensitive CSV dedupe, 23505 mapped to `{ data, error }`. |
| A.7 booking 23505 race | done | Catch on guest INSERT, re-select by `(organization_id, lower(email))`, blocked check applied to the converged row. |
| A.8 gates | done | See "Gate results". |
| A.9 apply migration | OPEN | Waiting on human authorization H.5. Not applied. No `apply_migration` call, no write SQL against production. |
| A.10 manual QA | OPEN | Post-deploy. |
| A.11 HB | OPEN (partial) | HEARTBEAT.md updated with everything true today (migration authored not applied, audit results, index name, D7 pending, Req 10 deferral). The "migration applied (date)" fact cannot be recorded until A.9 runs, so the task stays unchecked. |
| A.12 rollback boundary | done | Recorded in the migration header and here: `DROP INDEX uq_customers_org_email; DROP INDEX idx_customers_auth_user_id; ALTER TABLE customers DROP CONSTRAINT customers_auth_user_id_fkey; ALTER TABLE customers DROP COLUMN auth_user_id;` plus revert the PR. Column drop is only safe before PR B activates any row. |

### A.2 inventory (`rg "insert\(customers\)|update\(customers\)|from\(customers\)" apps/web/src`)

Writers of `customers.email`:
- `book/actions.ts` (guest upsert): covered by A.5/A.7.
- `dashboard/customers/actions/create-customer.ts`, `update-customer.ts`, `import-customers.ts`: covered by A.6.
- **NOT covered by any PR A task**: `dashboard/calendar/actions/create-customer.ts` (insert, raw email), `dashboard/calendar/actions.ts` `quickCreateCustomerAction` (insert, raw email), `domains/booking/seed.ts` (dev seed, emails already lower-case). The two calendar paths already wrap the insert in a generic `try/catch`, so a duplicate becomes a generic error (not a 500), but they can still store a mixed-case email.

Non-email writers / readers (no email normalization needed): `service-me.ts` (update profile; `eq(customers.email, email)` lookup at line ~69 is PR B territory), `toggle-block-customer.ts`, `upload-avatar.ts`, `service.ts`, `full-history.ts`, `resolve-public-session.ts`, `login/actions.ts` (reads).

## Files changed (working tree; tracked diff 135 additions + 62 deletions, plus 143 new lines)

| File | Change | ~Lines |
|---|---|---|
| `apps/web/supabase/migrations/20260919_customers_auth_identity.sql` | new | 56 |
| `apps/web/src/infrastructure/db/schema/customers.ts` | column, index, comments | +19 |
| `apps/web/src/infrastructure/db/unique-violation.ts` | new pure helper | 45 |
| `apps/web/src/infrastructure/db/unique-violation.test.ts` | new, 7 tests | 42 |
| `apps/web/src/app/(tenant)/[tenant]/book/actions.ts` | A.5 + A.7 | +33 / -22 |
| `.../customers/actions/create-customer.ts` | A.6 | +26 / -14 |
| `.../customers/actions/update-customer.ts` | A.6 | +25 / -16 |
| `.../customers/actions/import-customers.ts` | A.6 | +26 / -7 |
| `apps/web/src/messages/{pt,es,en}.json` | `dashboard.customers.actions.duplicateEmail` | +2 / -1 each |

**Changed lines: ~340** (additions + deletions, code and tests, new files included). Under the 400 budget; no `size:exception` needed. Not counted: `tasks.md`, this file (SDD artifacts) and `HEARTBEAT.md` (gitignored, local only, so it is not in any diff).

## Gate results (observed, run with `--force`, no turbo cache)

- `pnpm check-types --force`: exit 0, 2/2 tasks successful.
- `pnpm lint --force`: exit 0 (`--max-warnings 0`), 2/2.
- `pnpm exec turbo run test --force`: 12 files, 76/76 tests passed (was 69; +7 new), includes `messages.test.ts` key parity. Note `pnpm test --force` itself errors because pnpm rejects the `--force` flag on its own `test` command; plain `pnpm test` also passed earlier (76/76).
- `pnpm build --force`: exit 0, Next.js build succeeded.
- REQ8-CHK: `rg "from\('customers'\)|from\('appointments'\)" apps/web/src` returns 0 matches. All new customer access is Drizzle over `db`, explicit columns, `organization_id` predicate present (booking upsert + import dedupe; the create/update paths are unchanged in their org predicate).
- I18N-CHK: no `.tsx` touched; one new key in all three locales (parity test green); no `_i18n.ts` files (`fd` = 0); no literal locale fallbacks added; `git diff --stat` shows no `proxy.ts` or `i18n/request.ts` change.
- Migration verification is static only (no local Postgres; production DDL not allowed). Read-only precondition check on production: `auth_user_id` column, both indexes and the FK do not exist yet; `auth.users.id` is `uuid`.

## Deviations from tasks/design (with reasons)

1. **New helper file `infrastructure/db/unique-violation.ts` (+ test)**, not named in the tasks. A.6 and A.7 need the same 23505 detection in four files; drizzle-orm 0.45 wraps the postgres.js error in `DrizzleQueryError.cause`, so a naive `error.code` check would silently never match. One tested helper beats four copies.
2. **Translation key is `dashboard.customers.actions.duplicateEmail`**, not the suggested `dashboard.customers.errors.duplicateEmail`. The task said "e.g."; the three staff actions already resolve their translator with namespace `dashboard.customers.actions`, so this reuses it without a second translator.
3. **Booking SELECT uses `lower(customers.email) = $guestEmail`** instead of `eq(customers.email, guestEmail)`. It uses the lower-cased `guestEmail` as the task requires, but matches the unique index expression exactly and also finds a legacy/mixed-case row written by the un-normalized calendar paths, instead of missing it and hitting `23505`.
4. **A.7 blocked check moved after the upsert** so it also covers the row a concurrent request created (a blocked customer cannot slip through the race path). Behaviour for the pre-existing-row case is unchanged.
5. **`import-customers.ts`** existing-email lookup now uses `inArray(lower(email), batch)`; previously it compared against raw-case stored values. Skipped count now includes in-file duplicates (first occurrence wins).
6. A.11 left unchecked and A.12 checked, as explained in the table.

## Work-unit commit split (proposed, NOT executed)

1. `feat(customers): add auth_user_id identity link and case-insensitive email uniqueness` — schema column, migration SQL, `unique-violation.ts` + test. Rollback boundary: revert removes the column declaration, the SQL file and the helper (DB rollback per A.12 if already applied).
2. `fix(booking): normalize guest email and converge concurrent double-submit on one customer` — `book/actions.ts`. Must ship back-to-back with the migration.
3. `fix(customers): lower-case staff-written emails and translate duplicate-email errors` — create/update/import actions + the three `messages/*.json`. Tests/keys ride with the behaviour.

(Commit 1 lands the `unique-violation.ts` helper first, so commits 2 and 3 each compile and pass on their own.)

## Open items for the orchestrator/human

- H.5 authorization, then A.9 in this order: re-run A.1 queries, apply migration (`customers_auth_identity`), verify (A.9.5), `get_advisors`, then merge/deploy PR A immediately.
- Decision: extend PR A to also normalize `calendar/actions/create-customer.ts` and `calendar/actions.ts` `quickCreateCustomerAction` (recommended: one-line `.toLowerCase()` each plus optional 23505 mapping), or open a follow-up ticket. Out of PR A's named files, so not touched.
- Req 10 remains deferred (Free plan); advisor `auth_leaked_password_protection` re-confirmed open on 2026-09-19.
- Unrelated pre-existing advisor findings observed, not touched: `public.update_customer_statuses()` is a SECURITY DEFINER function executable by `anon` and `authenticated` via `/rest/v1/rpc/`, and two functions have a mutable `search_path`.

## Addendum 2026-09-19 (orchestrator, human-approved): calendar quick-create paths

Decision by the human: include the two calendar customer-creation paths in PR A (coverage gap found during A.2). Implemented directly by the orchestrator, two one-line changes: lower-case the email on write in calendar/actions.ts (quickCreateCustomerAction) and calendar/actions/create-customer.ts. Verified: forced `turbo run check-types lint` passes (4/4 tasks). PR A changed lines now about 344. No new tests: both paths sit behind server actions with no test harness (design section 9); covered by manual QA A.10 (create a customer from the calendar with a mixed-case email and confirm the stored value is lower-case).

---

# Apply progress: customer-identity-activation — PR B-1 (activation primitive, unwired)

Date: 2026-09-19. Mode: Standard. Strategy: SPLIT, stacked-to-main. Boundary: PR B-1 = tasks B.1, B.2, B.3 only. Branch `feat/customer-identity-activation-b1-primitive`. Nothing committed, pushed or opened as PR; all changes are uncommitted in the working tree. The slice is additive and UNWIRED: nothing imports the new modules (confirmed with `rg` over `apps/web/src`, only the modules and their own test reference each other), so production behaviour is unchanged. No write to the production database was made.

## Tasks

| Task | State | Notes |
|---|---|---|
| B.1 policy | done | `activation-policy.ts`: `ActivationCandidateRow`, `ActivationDecision`, `resolveActivationDecision`. No `server-only`, no `@/infrastructure/db`. Order: null, blocked, unlinked, same id, other id. |
| B.2 policy tests | done | 9 tests. Order proof executed: temporarily swapped branches 2 and 3, 2 tests failed (blocked+unlinked; table-driven kinds), reverted (byte-identical to the backup), 9/9 green again. |
| B.3 DB wrapper | done (verified statically + by type-check/lint/build; NOT run against a DB, no harness exists per design section 9) | `activation.ts` (`server-only`). |
| B.0 | OPEN | Not in this slice; blocks B.6/B.9 (already decided by the human, applied in B-3). |

## Files changed (all new, uncommitted)

| File | Lines |
|---|---|
| `apps/web/src/domains/customers/activation-policy.ts` | 53 |
| `apps/web/src/domains/customers/activation-policy.test.ts` | 98 |
| `apps/web/src/domains/customers/activation.ts` | 162 |

**Changed lines: 313** (all additions; no tracked file modified other than the three checkboxes in `tasks.md`). Under the 400 budget. Not counted: SDD artifacts and `HEARTBEAT.md` (gitignored).

## Wrapper design as implemented

- Zod input: `organizationId` uuid, `authUserId` uuid, `verifiedEmail` trimmed, lower-cased, then `.email()`. Invalid input returns `{ data: null, error: { code: 'INVALID_INPUT' } }` without echoing values.
- Step 1: SELECT `id, auth_user_id, is_blocked` WHERE `organization_id = $org AND lower(email) = $email` LIMIT 1, explicit columns. The organization predicate is unconditional; no path queries by email alone.
- Step 2: `resolveActivationDecision`.
- Step 3, only on `activate`: one guarded UPDATE `SET auth_user_id, is_guest = false WHERE id AND organization_id AND auth_user_id IS NULL AND is_blocked = false RETURNING id`. Zero rows: re-read once and decide from the fresh row (`already_linked`, `identity_conflict`, `blocked` or `no_account`).
- No other decision writes.
- `identity_conflict` emits `console.warn` with truncated (8-char) ids: organization, customer, existing auth user, attempted auth user. Never the email. The catch block logs only the error class name and SQLSTATE, never the error message (Drizzle embeds query parameters, including the email, in it).
- Caller contract (gate on `email_confirmed_at != null`, organization from the resolved tenant) is stated in the file header.

## Gate results (observed)

- `pnpm check-types --force`: 2/2 tasks successful.
- `pnpm lint --force`: 2/2 successful (`--max-warnings 0`).
- `pnpm test`: 13 files, 85/85 passed (was 76; +9 new).
- `pnpm build --force`: exit 0, Next.js build succeeded.
- REQ8-CHK: `rg -n "from\('customers'\)|from\('appointments'\)" apps/web/src` returns 0 matches.
- No `proxy.ts` / `i18n/request.ts` touched; no `.tsx` touched; no user-facing strings added (the `Result` messages are internal technical strings mapped to `generic` by the caller, never rendered).

## Deviations from tasks/design (with reasons)

1. **UPDATE predicate adds `AND is_blocked = false`** (task lists `id`, `organization_id`, `auth_user_id IS NULL`). It closes a SELECT-to-UPDATE window in which staff blocks the customer: without it a row blocked in between would still be linked, violating the decided invariant that a blocked customer is NEVER linked (D2). A zero-row result flows into the existing re-read, which then returns `blocked`.
2. **`verifiedEmail` is trimmed and lower-cased inside the Zod schema** in addition to the caller lower-casing. Idempotent; prevents a silent `no_account` if a caller forgets.
3. **Extra `error` code `ACTIVATION_RACE`**: if the guarded UPDATE matches nothing and the re-read still says `activate` (row unlinked and unblocked yet not updated, an inconsistent state), the wrapper returns an error instead of claiming success. Callers map any `error` to `generic`.
4. **Logged ids are truncated to 8 characters**, per the run brief; the design text says "ids".
5. `unique-violation.ts` from PR A was not reused: this wrapper never inserts, so there is no 23505 to handle.

## Work-unit commit split (proposed, NOT executed)

A single work unit is cohesive and stands alone (additive, unwired):

1. `feat(customers): add pure activation policy and server-only activation wrapper` containing `activation-policy.ts`, `activation-policy.test.ts`, `activation.ts`. Rollback boundary: delete those three files; nothing imports them.

Optional finer split if the reviewer prefers, each compiling and green on its own: (1) `feat(customers): add pure activation decision policy` = policy + test; (2) `feat(customers): add server-only activation wrapper` = `activation.ts`.

## Open items for the orchestrator/human

- Optionally run the cso skill on `activation.ts` before B-3 wires it (identity-linking, tenant isolation, health-data adjacent).
- Next slice B-2 (B.4, B.5), then B-3 (B.6-B.9, the only behaviour-changing slice, needs B.0's confirmed rule which is already recorded in tasks.md).
- Still open from PR A: the unrelated pre-existing advisor findings noted above, Req 10 deferral.

---

# Apply progress: customer-identity-activation — PR B-3 (resolver, loginAction, /auth/confirm, /auth/callback)

Date: 2026-09-19. Mode: Standard. Strategy: SPLIT, stacked-to-main. Boundary: PR B-3 = tasks B.6, B.7, B.8, B.9. Branch `feat/customer-identity-activation-b3-resolver`. Nothing committed, pushed or opened as PR; everything is in the working tree. This is the only slice that changes production behaviour. B.10 (manual QA) is NOT done and stays open.

## Tasks

| Task | State | Notes |
|---|---|---|
| Pure helpers (extra, per B.0/B.4) | done, unit-tested | `parseRelativeNext`, `isBookingFunnelPath`, and the `http:`/`https:` protocol guard in `resolveRedirectUrl` (closes the B-2 finding). |
| B.6 resolver | done (static verification only, no DB harness, design section 9) | `infrastructure/auth/resolve-post-auth-destination.ts`. |
| B.7 loginAction | done (static only) | 181 -> 71 lines; password-only signature, `LoginState`, `loginSchema` unchanged; no new error codes. |
| B.8 /auth/confirm | done (static only) | `verifyOtp`, `type` allow-list `email | magiclink | signup`. |
| B.9 /auth/callback | done (static only) | Routed through the resolver; `/book?auth_error=1` failure path kept. |
| B.10 manual QA | OPEN | Not part of this slice. |
| B.0 | rule implemented here | Checkbox left as is (gate task, decided by the human before this slice). |

## Files (all uncommitted)

| File | Change | Authored lines (add/del) |
|---|---|---|
| `apps/web/src/infrastructure/auth/resolve-redirect-url.ts` | + `parseRelativeNext`, `isBookingFunnelPath`, protocol guard | +46 / -1 |
| `apps/web/src/infrastructure/auth/resolve-redirect-url.test.ts` | + 36 tests (protocol, parser, funnel) | +80 / -1 |
| `apps/web/src/infrastructure/auth/resolve-post-auth-destination.ts` | new (B.6) | 187 |
| `apps/web/src/infrastructure/auth/post-auth-response.ts` | new, shared route response mapping (not in tasks) | 34 |
| `apps/web/src/infrastructure/auth/post-auth-response.test.ts` | new, 4 tests | 34 |
| `apps/web/src/app/(auth)/login/actions.ts` | rewrite (B.7) | +24 / -99 |
| `apps/web/src/app/auth/confirm/route.ts` | new (B.8) | 49 |
| `apps/web/src/app/auth/callback/route.ts` | rewrite (B.9) | +30 / -10 |

**Changed lines: ~595** (additions 484 incl. new files + deletions 111). OVER the 400 budget by ~195. Not counted: SDD artifacts and `HEARTBEAT.md`. No code, comment or test was removed to fit. Where it comes from: `loginAction` alone is 123 changed lines (99 are deletions that are unavoidable moves out of the action), the resolver is 187 lines (about 45 are the header contract plus the moved staff-locale block), tests are 148.

Possible re-cut if the human wants each PR <= 400 (no code compression needed), in order of least coupling:
1. Move the pure helpers + their tests out (`resolve-redirect-url.ts` and test, ~128 lines) into a "B-3a" PR. They are additive and unwired until B-3 lands, exactly like B-1/B-2. Remaining ~467, still over on its own, hence the 3-way split below.
2. Clean 3-way split, each under 400: B-3a helpers + tests (128), B-3b resolver + `loginAction` (187 + 123 = 310), B-3c `post-auth-response` + test + both routes (34 + 34 + 49 + 40 = 157). Caveat: between B-3b and B-3c `/auth/callback` is untouched (the live Google booking flow keeps its old behaviour, which is the safest interim) but the "Google booker never activates" hole stays open until B-3c.
Otherwise: `size:exception` (logic, not generated output; the orchestrator/human decides).

## Gate results (observed)

- `pnpm test`: 16 files, 147/147 passed (baseline 105/105).
- `pnpm check-types --force`: 2/2 tasks successful.
- `pnpm lint --force`: 2/2 successful (`--max-warnings 0`).
- `pnpm build --force`: exit 0, Next.js build succeeded; `/auth/confirm` and `/auth/callback` appear in the route table.
- REQ8-CHK: `rg -n "from\('customers'\)|from\('appointments'\)" apps/web/src` returns 0 matches (exit 1).
- `git diff --stat main` / `git status --short`: no change to `proxy.ts` or `i18n/request.ts`.
- Mutation proof on the pure helpers (each reverted, file byte-identical to backup afterwards, 50/50 green again): (M1) removing the protocol check fails the `javascript:`/`data:`/`ftp:` test; (M2) dropping the `[/?#]|$` boundary from the funnel regex fails `/booking-x`, `/bookmark`, `/books`; (M3) removing BOTH the `//`-`/\` prefix rule and the origin check fails 4 tests (backslash, `/\/`, tab and newline variants); (M4) returning the raw path instead of the normalized one fails the 3 dot-segment tests. Honest caveat: the prefix rule and the origin check overlap on purpose (defense in depth), so removing only one of them is not caught by the tests; M3 removed both.
- The resolver, both routes and `loginAction` were NOT run against a database or Supabase Auth (no harness exists, design section 9). Their verification is type-check, lint, build and code reading; real coverage is B.10.

## Tenant / host findings

- `proxy.ts` (read-only) sets `x-tenant-slug` on EVERY request whose host resolves to a tenant, /auth/* included: `/auth` is in `UNREWRITTEN_PREFIXES`, which only skips the rewrite, not the header assignment, and inbound copies of the header are deleted first. So both routes read `request.headers.get('x-tenant-slug')`; no host derivation was needed and `proxy.ts` is untouched.
- Failure redirects (`/login?error=…`) go to the SAME host the user arrived on (request origin), not to `buildLoginUrl`. Reason: in production `buildLoginUrl` targets `auth.<base domain>`, a reserved subdomain with NO tenant slug, and `loginAction` returns `generic` when `x-tenant-slug` is missing, so a login page there cannot resolve a tenant. The tenant host serves `/login` unrewritten with the header set. (Pre-existing: the proxy guard's redirect to the auth portal cannot complete `loginAction` for the same reason; out of scope, not touched.) Success redirects come from the resolver via `buildTenantOrigin(slug)`, like every `loginAction` redirect before.
- If a request has no tenant slug: `/auth/confirm` redirects to `/login?error=link_invalid` BEFORE `verifyOtp` (a single-use token is not burned on a host that cannot route the user); `/auth/callback` takes the existing `/book?auth_error=1` path without exchanging the code.

## Deviations from tasks/design (with reasons)

1. **`post-auth-response.ts` (+ test) added**, not in tasks. Both routes map `redirect | no_account | error` and the link failure to the same `/login?error=<code>` redirects; one file owns the codes instead of two copies.
2. **Resolver catches thrown errors and returns `{kind:'error'}`** (log: error class name only). Steps 1-6 previously threw out of `loginAction` (500). The routes must not 500 the live booking funnel, and design section 3.1's union has an error arm. `loginAction` maps it to `generic`.
3. **`error` outcome signs the user out** (activation failure outside the booking funnel). The design pseudo-code returned `generic` without sign-out; a verified session left dangling on a tenant where activation could not run is the wrong default, and re-signing-in retries. The pre-existing "org not found" `error` does not sign out (unchanged behaviour).
4. **Booking-funnel deferral also covers an activation infrastructure error** (`activation.error`): B.0 says activation is best-effort; the session is legitimate and the link is retried at the next sign-in. Strictly only the `no_account` decision was named in B.0; `blocked`, `identity_conflict`, an unverified email, and a blocked already-linked row still sign out even in the funnel.
5. **B.0 relaxation applies only to the `path` next form (routes).** `loginAction`'s absolute `next` keeps the strict behaviour (Req 3 scenario 3, shipped behaviour). The proxy never produces a `/book` next for login.
6. **Callback default `next` is `/book`** (existing behaviour) when `next` is absent or not a safe relative path; `/auth/confirm` passes `null` and lets the resolver default by role (`/dashboard` staff, `/me` customer). A linked/activated customer is redirected to `next` (e.g. `/book`), not forced to `/me`, which is what makes the Google booking funnel keep working; staff also honour a relative `next`.
7. **`parseRelativeNext` returns the URL-normalized path** (dot segments collapsed, `//`-after-normalization rejected) and the resolver re-parses `path` defensively. Stricter than the B.0 text (single slash, no `//`, no `/\`), never looser.
8. Routes use `data.user` from `verifyOtp` / `exchangeCodeForSession` (the Auth server's own response) instead of an extra `getUser()`; `loginAction` still calls `getUser()` as before.

## Work-unit commit split (proposed, NOT executed)

1. `feat(auth): validate relative next and require web protocols in the redirect guard` = `resolve-redirect-url.ts` + test (additive).
2. `feat(auth): add the shared post-auth destination resolver and route loginAction through it` = resolver + `actions.ts`.
3. `feat(auth): add /auth/confirm and route /auth/callback through the resolver` = `post-auth-response.ts` + test + both routes.
Rollback boundary: reverting commits 2 and 3 restores the email-only `loginAction` and the original callback with no data loss; `auth_user_id` values already written are harmless.

## Open items / for the orchestrator to double-check

- B.10 manual QA (especially (g): Google booking, returning guest AND brand-new booker, must land on /book with a session).
- `/login` does not read `?error=` yet (PR C): `no_account` / `generic` / `link_invalid` currently render a plain login form.
- H.2 template change must follow this deploy; `signup` type is already accepted.
- PR C.7 must not emit `?next=/me` links that staff can use to land on `/me` instead of `/dashboard` (staff branch honours a relative `next`).
- Pre-existing, not touched: `/me` is guarded by session only in the proxy and `getMyCustomer` looks up by email.

## Addendum 2026-09-23 — B-3 committed, split, and re-verified (B.11–B.13 closed)

The B-3 section above described a single uncommitted branch `feat/customer-identity-activation-b3-resolver` at ~595 changed lines, over the 400 budget, and proposed a 3-way re-cut. Final outcome in git: B-3 was committed and split into two stacked slices on top of `main` (4aa7de0), which keeps each reviewable:
- `49af407` relative-`next` validation + web-protocol guard (also closes the B-2 finding).
- `aa43078` shared post-auth destination resolver (B.6) — branch `feat/customer-identity-activation-b3a-resolver`, pushed to origin (history includes 49af407).
- `b0d0e4c` route password login + `/auth/confirm` + `/auth/callback` through the resolver (B.7–B.9) — branch `feat/customer-identity-activation-b3b-wiring`, NOT pushed yet.

Closing re-verification on 2026-09-23 (branch `b3b-wiring`, 3 commits over main), delegated to `gentle-ai-verify`, read-only, working tree untouched: `pnpm check-types` exit 0, `pnpm lint` exit 0 (`--max-warnings 0`), `pnpm test` 147/147 (cold via `--force`), `pnpm build` exit 0 with `/auth/confirm` and `/auth/callback` in the route table, REQ8-CHK 0 matches, `git status --short` shows only the pre-existing untracked `openspec/` and `.pi/`. Environment note: turbo is not installed locally (global 2.10.13 used); check-types/lint/build were turbo cache hits, only test was forced cold.

Still OPEN for PR B: B.10 manual QA (needs H.4 identities + a deploy; no DB harness, design §9), then push `b3b-wiring` and open its PR stacked on `b3a-resolver`. B.11/B.12/B.13 are done. Next plan slice: PR C.

---

# Apply progress: customer-identity-activation — PR F (Staff-triggered invite)

Date: 2026-09-25. Mode: Standard (`sdd-apply`). Strategy: `ask-on-risk`, already confirmed by the human (see the "Decisions confirmed by the human" block in `tasks.md`). Boundary: tasks F.1-F.7 only. Branch `feat/customer-identity-activation-f-invite`, created off `main` (PR B already merged; PR F's only dependency). Nothing pushed, no PR opened, nothing merged — those are the human's decision per the run brief.

## Tasks

| Task | State | Notes |
|---|---|---|
| F.1 action shell + eligibility rules | done | See "Deviation" below: eligibility rules moved into `domains/customers/service.ts` (`inviteCustomerActivation`), Server Action is a thin shell. |
| F.2 fresh cookie-less OTP client | done | Lives inside `inviteCustomerActivation()` (moved with F.1). `emailRedirectTo` built from the inviting staff's own `x-tenant-slug` via `buildTenantOrigin`. |
| F.3 UI menu item | done | `CustomerActionsMenu.tsx` new `DropdownMenu.Item`, disabled with a `title` tooltip; `isActivated` derived in `service.ts`, threaded through `page.tsx` → `CustomerProfileClient`. |
| F.4 manual QA | OPEN, deliberately deferred | Human-only; needs a deployed env + a real test inbox (design §9, no harness). Left unchecked in `tasks.md` with a note, not attempted or faked. |
| F.5 gates + REQ8-CHK | done | See "Gate results" below. |
| F.6 HB | done | `HEARTBEAT.md` entry `2026-09-25 #1`. |
| F.7 rollback boundary | done | See "Rollback boundary" below. |

## Files changed

| File | Change | ~Lines (insert/delete) |
|---|---|---|
| `apps/web/src/app/(dashboard)/dashboard/customers/actions/invite-customer-activation.ts` | new — thin Server Action shell | +91 |
| `apps/web/src/domains/customers/service.ts` | + `inviteCustomerActivation()` domain function; + `isActivated` derived field on `CustomerWithStats` / `getCustomerProfile` | +78 / -0 |
| `apps/web/src/app/(dashboard)/dashboard/customers/[id]/_components/CustomerActionsMenu.tsx` | + invite menu item, `email`/`isActivated` props | +36 / -3 |
| `apps/web/src/app/(dashboard)/dashboard/customers/[id]/_components/CustomerProfileClient.tsx` | + `isActivated` prop, threaded to menu | +6 / -2 |
| `apps/web/src/app/(dashboard)/dashboard/customers/[id]/page.tsx` | + `isActivated` prop passed from loader | +1 |
| `apps/web/src/messages/en.json` | + 7 `dashboard.customers.actions.invite*` / `toastInviteSent` keys | +9 / -1 |
| `apps/web/src/messages/es.json` | same 7 keys, ES copy | +9 / -1 |
| `apps/web/src/messages/pt.json` | same 7 keys, PT copy | +9 / -1 |

**Total diff vs `main`: 228 insertions + 11 deletions across 8 files = 239 changed lines** (`git diff --stat main...HEAD`), under the 400-line budget (forecast was ~195, range 160-240). Not counted: `openspec/` doc updates and `HEARTBEAT.md` (gitignored), committed separately per instructions.

## Work-unit commits

1. `c96b851` `feat(customers): add staff-triggered activation invite action (F.1-F.2)` — action shell + `inviteCustomerActivation()` domain function + the 7 i18n keys (tests are N/A — no harness for Server Actions per design §9).
2. `c14bb73` `feat(customers): surface an invite-to-activate menu item on the profile (F.3)` — `isActivated` derivation + UI wiring.

## Gate results (observed, cold where the pnpm wrapper allows `--force`)

- `pnpm check-types`: exit 0, 2/2 tasks successful.
- `pnpm lint --force`: exit 0 (`--max-warnings 0`), 2/2.
- `pnpm exec turbo run test --force`: 16 files, **148/148** passed (baseline before this PR: 148 — no new automated tests added; F.1-F.3 land in a Server Action and dashboard UI, neither has a test harness per design §9, consistent with the PR's own ~195-line forecast basis). `pnpm test --force` itself errors because pnpm rejects the `--force` flag on its own `test` script; `pnpm exec turbo run test --force` was used instead, matching the precedent recorded in the PR B-3 addendum above.
- `pnpm build --force`: exit 0, Next.js build succeeded; no new routes (server-action-only surface).
- REQ8-CHK: `rg -n "from\('customers'\)|from\('appointments'\)" apps/web/src` → 0 matches (exit 1). All new `customers` access is Drizzle over the server-only `db`, explicit columns, `organization_id` predicate unconditional in `inviteCustomerActivation()`.
- I18N-CHK: no literal strings in the touched `.tsx` files; 7 keys added to `pt.json`/`es.json`/`en.json` in the same commit as the behaviour that consumes them (parity enforced by `messages.test.ts`, part of the 148/148); ICU named arg (`{name}`) on `toastInviteSent`; no `_i18n.ts` files created; `git diff --stat main...HEAD -- apps/web/src/proxy.ts apps/web/src/i18n/request.ts` is empty (untouched).

## Deviations from the run brief (recorded, not silent)

1. **F.1's eligibility rules + OTP send moved from the Server Action into a new `inviteCustomerActivation()` function in `domains/customers/service.ts`**, instead of living inline in `invite-customer-activation.ts` as a literal mirror of `toggle-block-customer.ts` would produce. Cause: the repo's local `gga` pre-commit AI review gate (Architect lens, `CLAUDE.md` domain-isolation rule — "business logic only in `src/domains`") failed the commit twice: first on the eligibility/OTP-send logic living in the action, second (after the first fix) on that same logic's `db.select()` call running unguarded — every other function in `service.ts` wraps its DB access in `try { … } catch { return dbErr(...) }`, this one didn't. Both fixed: `inviteCustomerActivation(organizationId, customerId, emailRedirectTo)` now owns the org-scoped SELECT, the four typed refusals, the fresh cookie-less OTP client, and a try/catch → `dbErr('DB_ERROR')` fallback for infrastructure failures. `invite-customer-activation.ts` (the Server Action) keeps exactly the staff-auth + org-resolution boilerplate that mirrors `toggle-block-customer.ts` — that part of the mirror instruction is preserved — then delegates and maps the typed error code to a translated message via a small `ERROR_KEY` lookup table. Net effect: identical behaviour and identical security invariant (fresh, cookie-less, discarded Supabase client — never the cookie-bound SSR client), better factoring, gate now passes clean.
2. **Two non-blocking notes from the same automated reviewer**, left as-is, out of this PR's scope: (a) `domains/customers/service.ts` is now 267 lines, past the codebase's informal ~150-line soft guideline for component files — not split here because every function in the file is still a single customer-domain query/mutation, and STANDARDS.md's own rule is "split on responsibility, not line count"; (b) the raw `@supabase/supabase-js` client is instantiated inline in `inviteCustomerActivation()` rather than through an `infrastructure/auth` factory like `buildTenantOrigin` — functionally correct (anon key, `persistSession: false`, no RLS bypass), a factory extraction is a fair follow-up for testability but not required by F.1-F.7.
3. **Commit-splitting mechanics** (not a design deviation, recorded for process transparency): both work-unit commits were assembled by staging a partial version of `service.ts` while keeping the on-disk working copy at its full, internally-consistent state, so that the repo's pre-commit hook (which type-checks the actual filesystem, not just the git-tree diff) never saw a broken intermediate. No production behaviour or reviewed content differs from what a single un-split commit would have contained; git history is two clean, independently-buildable commits.

## Rollback boundary (F.7)

Remove `apps/web/src/app/(dashboard)/dashboard/customers/actions/invite-customer-activation.ts`; remove `inviteCustomerActivation()` from `domains/customers/service.ts`; revert the `DropdownMenu.Item` + `email`/`isActivated` prop threading in `CustomerActionsMenu.tsx` / `CustomerProfileClient.tsx` / `page.tsx`; remove the `isActivated` field/select from `service.ts`'s `CustomerWithStats` / `getCustomerProfile`; remove the 7 `dashboard.customers.actions.invite*` / `toastInviteSent` keys from `pt.json`/`es.json`/`en.json`. **No schema or data effect** — this PR performs zero writes to `customers` (confirmed by REQ8-CHK and by code inspection: `inviteCustomerActivation()` only SELECTs and calls `signInWithOtp` on a client discarded at function return).

## Open items for the orchestrator/human

- F.4 manual QA (Owner + Staff invite flow, staff-cookie-unchanged check, DB-row-unlinked-until-click check, disabled states, cross-tenant `NOT_FOUND`) — needs a deployed environment and a real test inbox.
- Push `feat/customer-identity-activation-f-invite` and open its PR when the human decides to — not done here, per the run brief ("Do NOT push, open a PR, or merge").
- PRs C, D, E, G remain not started (out of this slice's scope). PR B's own open items (B.10 manual QA, pushing `b3b-wiring`) are unchanged by this work and remain as recorded in the PR B-3 section above.

---

# Apply progress: customer-identity-activation -- PR D (In-product entry point + set-password)

Date: 2026-09-25. Mode: sdd-apply (standard, no strict TDD declared). Strategy: stacked-to-main, ask-on-risk (confirmed by the parent orchestrator). Boundary: PR D only, tasks D.1-D.6. Branch `feat/customer-identity-activation-d-entrypoint`, created off a clean `main` (which already contains PR A, B, C). Nothing pushed, no PR opened -- the human decides that. PR E and F are untouched; PR E is still correctly blocked on the GATE.6 `HEARTBEAT.md` entry, which this slice does not touch.

## Tasks

| Task | State | Notes |
|---|---|---|
| D.1 booking CTA | done | `book/success/page.tsx`: `createSupabaseServerClient()` + `getUser()` (mirrors `me/perfil/page.tsx`), CTA card rendered only when `!user`. Link `href="/login?next=/me"`. No identity logic added. |
| D.2 SetPasswordForm | done | New `SetPasswordForm.tsx` (client component), mounted from `me/perfil/page.tsx` after `<ProfileForm>`. Calls `supabase.auth.updateUser({ password })` on the BROWSER client (`createSupabaseClient()`), from the already-authenticated session. Validation extracted into a pure, unit-tested Zod schema. |
| D.3 manual QA | OPEN (human-deferral) | No harness exists for a real Supabase Auth session / real OTP email delivery in this environment (design section 9). Needs a deployed preview/production and H.4-style identities. Left unchecked. |
| D.4 gates + REQ8-CHK | done | See "Gate results" below. |
| D.5 HB | done | `HEARTBEAT.md` entry added (counts only, no customer emails). |
| D.6 rollback boundary | done | Pure UI revert, no schema/data effect -- see below. |

## Design decisions made while implementing

1. **Password minimum length = 6, not 8.** `spec.md` Req 5 / design section 4.3 do not state a number. The task brief allowed "a sensible minimum such as 8" if unspecified, but the codebase already has a load-bearing precedent: `loginSchema` in `(auth)/login/actions.ts` uses `z.string().min(6)` for password sign-in, which is Supabase Auth's own default minimum. Using 8 client-side would create a gap where the client accepts an 8-char requirement that is stricter than what `loginSchema` (and Supabase itself) actually enforces, with no corresponding server-side tightening. Aligned `SetPasswordForm` to 6 and documented the reasoning in `set-password-schema.ts`'s header comment, per the task's own "align with the Supabase Auth setting" instruction.
2. **Pure seam extracted and tested**, per the TDD-mode instruction ("add a Vitest unit test only for a genuinely pure/testable seam"): `apps/web/src/domains/customers/set-password-schema.ts` (Zod schema + refine for confirmation match, no `server-only`, no DB import) with `set-password-schema.test.ts` (4 cases: exact-minimum accepted, below-minimum rejected, mismatched confirmation rejected with `path: ['confirmPassword']`, missing confirmation rejected). `SetPasswordForm.tsx` itself is a Client Component and, per design section 9, has no RTL/jsdom harness -- not faked.
3. **Error mapping surface**: `error.code === 'weak_password'` and `error.code === 'reauthentication_needed'` read off Supabase's `AuthError.code` (verified against the installed `@supabase/auth-js@2.103.0` `ErrorCode` union, which includes both). `weak_password` is inert until PR G enables Leaked Password Protection (still Free-plan-deferred, per the human's 2026-09-19 decision); the mapping is in place so it activates with zero further code change.
4. **CTA placement and copy**: a bordered secondary card (not the solid primary "back home" button) placed above `backHome`, using `--accent-spa` for a small key icon, `font-cormorant` for the title and `font-outfit` for body/CTA text -- consistent with the existing card treatment already on that page (the appointment-details block) and DESIGN_SYSTEM.md's 60-30-10 / luxury typography rules. No skeleton/async fetch was added, so there is no CLS risk.
5. **`account.me.perfil.password` keys placed as a sibling of the existing `errors` key** inside `perfil`, not nested under it, since these are form-level strings (labels, CTA, toasts) rather than the profile-form's own error catalogue.

## Files changed

| File | Change | Lines |
|---|---|---|
| `apps/web/src/app/(tenant)/[tenant]/book/success/page.tsx` | +session check, +CTA card | +33 / -1 |
| `apps/web/src/app/(account)/me/perfil/page.tsx` | +import, +mount | +7 / -1 |
| `apps/web/src/app/(account)/me/_components/SetPasswordForm.tsx` | new | 121 |
| `apps/web/src/domains/customers/set-password-schema.ts` | new | 33 |
| `apps/web/src/domains/customers/set-password-schema.test.ts` | new, 4 tests | 32 |
| `apps/web/src/messages/{pt,es,en}.json` | `booking.success.activate*` (3 keys) + `account.me.perfil.password.*` (9-ish keys incl. nested `errors`), x3 locales | +23 each |

**Total changed lines: 323** (321 insertions + 2 deletions, per `git diff --stat main -- apps/web`, final state after the pre-commit review fix round below). Well under the 400-line budget; no `size:exception` needed. Not counted: `tasks.md`, this file, `HEARTBEAT.md` (SDD/doc artifacts, committed separately per the run brief).

## Gate results (observed, 2026-09-25, on branch `feat/customer-identity-activation-d-entrypoint`)

- `pnpm check-types`: exit 0, 2/2 tasks successful (turbo cache hit on `@repo/ui`, miss+pass on `web`).
- `pnpm lint`: exit 0 (`--max-warnings 0`), 2/2 tasks successful.
- `pnpm exec turbo run test --force`: 17 files, **153/153 tests passed** (cold, no cache), includes the 5 new `set-password-schema.test.ts` cases (one added during the review fix round, below) and the existing `messages.test.ts` tri-locale parity check.
- `pnpm build`: exit 0, Next.js 16.3.5 (Turbopack) build succeeded; `/[tenant]/book/success` and `/me/perfil` both present in the route table.
- **REQ8-CHK**: `rg -n "from\('customers'\)|from\('appointments'\)" apps/web/src` -- **0 matches** (exit 1, ripgrep's "no match" convention). `SetPasswordForm` calls only `supabase.auth.updateUser`, no Drizzle/customers import; the success-page session check calls only `supabase.auth.getUser()`.
- **I18N-CHK**: all six new keys (3 `booking.success.activate*` + `account.me.perfil.password.*` tree) present in `pt.json`, `es.json`, `en.json` at identical paths (verified via line-number parity and confirmed by the passing `messages.test.ts` parity suite); no literal strings landed in the two edited `.tsx` files; no `_i18n.ts` files added; ICU ellipsis used correctly for "Saving..."/"Guardando..."/"A guardar..." (no raw string concatenation).
- `git diff --stat main -- apps/web/src/proxy.ts apps/web/src/i18n/request.ts`: **empty** -- neither file touched.

## Work-unit commits (executed, Conventional Commits)

1. `e08c30d` -- `feat(booking): show a session-gated CTA to activate an account after booking` -- `book/success/page.tsx` + the `booking.success.activate*` hunk in all three `messages/*.json` (staged via `git add -p`, selecting only that hunk). 4 files, 41 insertions(+), 1 deletion(-).
2. `49af551` -- `feat(account): add residual set-password affordance to /me/perfil` -- `SetPasswordForm.tsx`, `set-password-schema.ts` + test, `me/perfil/page.tsx`, + the `account.me.perfil.password.*` hunk in all three `messages/*.json`. 7 files, 280 insertions(+), 1 deletion(-) (final, after the fix round below; SHA amended twice).

Both commits are on `feat/customer-identity-activation-d-entrypoint`, stacked on `main`, NOT pushed and NOT opened as a PR (human decision per the run brief).

### Pre-commit review fix round (commit 2 only)

The repo's pre-commit `Gentleman Guardian Angel` AI review gate caught two real defects across two rounds on commit 2, both fixed before the commit was allowed to land (amended in place, not a separate commit, since the bug never existed on `main` or in any pushed history):

1. **Validation-error misclassification**: the first draft distinguished "mismatch" from "too short" by `issue.path[0] === 'confirmPassword'`, but a too-short `confirmPassword` field ALSO produces an issue at that same path (Zod still runs `.refine()` even when a sibling field-level check already failed), so two matching-but-short passwords would have shown "Passwords don't match" instead of the correct "must be at least 6 characters" message. Fixed by discriminating on `issue.code === 'custom'` instead (only the `.refine()` mismatch check produces a `custom` issue; `.min()` produces `too_small`). Locked in with a new schema test: `reports a too_small (not custom) issue when both fields are equal but too short`.
2. **Missing label/input association**: neither `<label>` had `htmlFor` pointing at its `<input>`'s `id` (WCAG AA). Fixed by adding `id="set-password-new"` / `id="set-password-confirm"` and matching `htmlFor` on both fields.

Both rounds re-ran the full gate suite (check-types, lint, test, build) before the commit was finalized; the numbers in "Gate results" above are the final, post-fix state.

## Rollback boundary (D.6)

`git revert 49af551 e08c30d` (or delete the branch pre-merge) removes the CTA link/card, `SetPasswordForm`, and the schema file, and restores `book/success/page.tsx` and `me/perfil/page.tsx` to their PR-C state. **Pure UI revert**: no migration, no write to `customers` or `auth.users`, no `HEARTBEAT.md`-recorded data dependency in either direction. A customer who already set a password via `updateUser` keeps that password in `auth.users` after the revert (Supabase Auth is untouched by reverting application code) -- harmless, matching the B.13 precedent that already-written auth state is safe to leave behind a UI revert.

## Deviations from tasks/design

None beyond the two documented decisions above (password minimum = 6, pure-seam extraction). No task text was reinterpreted; D.3 is left unchecked exactly as instructed rather than attempted or faked.

## Open items for the orchestrator/human

- D.3 manual QA (needs a deployed environment).
- PR C's own D.3-equivalent tasks (C.10-C.12) are still open per `tasks.md` and were NOT touched by this slice (out of boundary).
- PR E remains correctly blocked on GATE.6; this slice does not affect that gate.
- Req 10 / Leaked Password Protection remains deferred (Free plan); the `weak_password` mapping added here is inert until PR G lands.
