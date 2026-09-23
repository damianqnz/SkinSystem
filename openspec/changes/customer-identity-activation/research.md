# Research: Supabase Auth identity linking across OTP / OAuth (Google) / password

## Scope

Single question carried over from `explore.md` §3: does Supabase Auth unify OTP, Google OAuth, and email+password sign-ins for the same verified email into **one** `auth.users` row automatically, or does each method create a separate row unless something is explicitly configured? This determines whether the design's `customers.authUserId -> auth.users.id` FK can safely assume "one person = one `auth.users.id`, forever" with zero extra code, or needs application-layer reconciliation.

Sources are Supabase's own official docs, fetched live via `/browse` on 2026-09-18. All quotes below are verbatim from the fetched pages.

## 1. Is linking automatic-by-verified-email, or does it require an explicit `linkIdentity()` call?

**Both mechanisms exist, for different situations — and the one relevant to this design is the automatic one.**

Source: https://supabase.com/docs/guides/auth/auth-identity-linking ("Identity Linking")

> "Currently, Supabase Auth supports 2 strategies to link an identity to a user: Automatic Linking, Manual Linking"

> "**Automatic linking#** Supabase Auth automatically links identities with the same email address to a single user. This helps to improve the user experience when multiple OAuth sign-in options are presented since the user does not need to remember which OAuth account they used to sign up with. When a new user signs in with OAuth, Supabase Auth will attempt to look for an existing user that uses the same email address. If a match is found, the new identity is linked to the user."

> "**Manual linking (beta)#** Supabase Auth allows a user to initiate identity linking with a different email address when they are signed in. To link an OAuth identity to the user, call `linkIdentity()`... You can enable manual linking from your project's authentication configuration options or by setting the environment variable `GOTRUE_SECURITY_MANUAL_LINKING_ENABLED: true` when self-hosting."

So: automatic linking is the always-on, no-call-required mechanism that fires on OAuth sign-in and matches by email. `linkIdentity()` (manual linking) is a distinct, opt-in feature for a *different* use case — an already-authenticated user explicitly attaching an identity that may have a **different** email address than the one they're signed in with. It requires the project setting/env var to even be usable, and is not what triggers for same-email OAuth/OTP/password convergence.

## 2. Project-level setting and its default

Source: same page as above.

- The relevant toggle is "manual linking" ("Enable manual linking" in Dashboard → Authentication → Providers config, or `GOTRUE_SECURITY_MANUAL_LINKING_ENABLED` self-hosted env var). It governs whether `linkIdentity()`/`unlinkIdentity()` can be called at all.
- The doc's phrasing — "You can **enable** manual linking..." — and the "(beta)" label both indicate this is **off by default**; it's an opt-in feature you turn on, not something you turn off.
- **Automatic linking has no corresponding disable flag documented anywhere on this page or the adjacent Identities/Users pages.** It is presented as unconditional default behavior of Supabase Auth, not a toggle. This matters directly for the design: nothing needs to be configured for automatic linking to apply.

## 3. Does behavior differ across OAuth/OTP/password pairings?

Source: https://supabase.com/docs/guides/auth/users ("Users") and https://supabase.com/docs/guides/auth/identities ("Identities")

Key fact that resolves this sub-question: **OTP/magic-link and password are not two different "identities" in Supabase's model — they are two different sign-in *methods* against the same "email" identity.**

> Identities page: "An identity is an authentication method associated with a user. Supabase Auth supports the following types of identity: Email, Phone, OAuth, SAML."

> Users page: "A user with an email or phone identity will be able to sign in with either a password or passwordless method (e.g. use a one-time password (OTP) or magic link)."

Consequence for the three pairings in the design:

- **OTP ↔ password (same email)**: not really a "linking" event at all — both share the single `email`-type identity/row on `auth.users`. A person who verifies via OTP and later sets/uses a password against the same email is, by construction, already the same `auth.users` row. There is no separate identity to merge.
- **OAuth (Google) ↔ OTP, and OAuth (Google) ↔ password**: these ARE two distinct identity types (`oauth` vs `email`), so this is where "automatic linking" (§1) actually does work — Supabase Auth explicitly looks up an existing user by matching email when a new OAuth sign-in occurs, and links the new OAuth identity onto that existing user's row rather than creating a second `auth.users` row.
- The docs describe automatic linking specifically in terms of "when a new user signs in with OAuth" — i.e., the mechanism is triggered by the OAuth side, not symmetric between two email-based identities (which don't need it) or between two OAuth providers with no existing email match. This project only uses one OAuth provider (Google) today per `explore.md` §2, so OAuth-to-OAuth is not a live concern.

No separate/different-behavior branch is documented for "OAuth-to-password" vs. "OAuth-to-OTP" specifically — both are just "OAuth signs in, look up by email, link to whatever email-identity user already exists" from Supabase Auth's point of view, since OTP-created and password-created users are indistinguishable at the identity-type level (both are `email`).

## 4. Documented gotchas / pitfalls

Source: https://supabase.com/docs/guides/auth/auth-identity-linking, "Frequently asked questions" section, plus the automatic-linking paragraph above.

- **Unverified-email pre-account-takeover protection (directly documented, not inferred):**
  > "It would also be an insecure practice to automatically link an identity to a user with an unverified email address since that could lead to pre-account takeover attacks. To prevent this from happening, when a new identity can be linked to an existing user, Supabase Auth will remove any other unconfirmed identities linked to an existing user."

  Applied to this design's exact scenario ("what if a user signs up with password first using an unverified email, then later tries Google with the same email"): the stale **unconfirmed** password identity gets **removed**, and the new (verified, since OAuth emails are provider-verified) identity becomes the one true identity on that `auth.users` row. It does not create a second row, and it does not silently keep an attacker-plantable unverified identity around.

- **Duplicate signup is blocked, not silently duplicated:**
  > "Can you sign up with email if already using OAuth? If you try to create an email account after previously signing up with OAuth using the same email, you'll receive an obfuscated user response with no verification email sent. This prevents user enumeration attacks."

  This directly answers a variant of the design's "later tries password" case in the other order (OAuth first, password `signUp()` second): Supabase does not create a second `auth.users` row; `signUp()` returns an obfuscated non-error response and sends no confirmation email, so the second identity is never actually created. (Relevant to the `Step2Auth.tsx` bare `signUp()` flagged in `explore.md` §1 — this is the mechanism that already prevents that flow from creating duplicate accounts for an email that has prior OAuth history, though it does **not** by itself fix the "no OTP-first verification" account-takeover-shaped pattern flagged there, which is a distinct concern from row-duplication.)

- **The documented, correct way to *add* password to an OAuth-created user is not `signUp()`:**
  > "How to add email/password sign-in to an OAuth account? Call the `updateUser({ password: 'validpassword'})` to add email with password authentication to an account created with an OAuth provider (Google, GitHub, etc.)."

  This is the sanctioned API for "OAuth first, then add a password later" — from an authenticated session, not a fresh `signUp()`/`signInWithPassword()` call.

- **SAML/SSO is explicitly excluded** from both linking strategies ("Users that signed up with SAML SSO will not be considered as targets for identity linking (automatic or manual) for security reasons") — not applicable to this project (no SSO in scope) but worth knowing if enterprise SSO is ever added later, since it would NOT auto-link even if emails matched.

## 5. The exact, current, correct way to guarantee one `auth.users.id` per person across all three methods

**Answer: "do nothing, Supabase links by default" is correct for this specific combination (OTP + Google OAuth + password), with one caveat that is itself documented, not a gap.**

Reasoning, combining §1–§4:

1. OTP and password sign-ins against the same email are, by Supabase's own data model, never separate identities to begin with — they're the same `email`-type identity on the same `auth.users` row. There is nothing to link.
2. Google OAuth sign-in against an email that already has a confirmed `email`-type identity on some `auth.users` row triggers **automatic linking** (default behavior, no flag, no code): the OAuth identity is attached to that existing row rather than creating a new one.
3. The one documented edge case (unconfirmed prior identity + new linkable identity) resolves by **removing** the stale unconfirmed identity, not by creating a duplicate row or blocking the new sign-in — so it degrades toward "one row" too, just by discarding the never-verified prior attempt rather than merging it.
4. `linkIdentity()` / manual linking is not needed for this combination at all — it exists for the *different-email* linking case, which is out of scope for this design (the whole premise is "same email, three methods").

**Caveat worth carrying into the design/spec phase**, not a reason to distrust the "do nothing" answer: automatic linking's email-match lookup is keyed on Supabase's own confirmed-email bookkeeping inside `auth.users`/`auth.identities`, entirely internal to Supabase Auth. It has no interaction with this project's `customers` table or its `(organizationId, email)` matching logic (already flagged in `explore.md` §4 as unenforced by a unique constraint). The FK design's soundness for "one `auth.users.id` per person" is therefore something Supabase already guarantees; the *remaining* risk this research does not remove is entirely on this project's own side — i.e., whether the `customers` row a given `authUserId` gets attached to (at activation time) is chosen correctly when duplicate `customers` rows for one email already exist per-org. That is a `customers`-table concern, not an `auth.users` concern, and was already correctly scoped to the design phase in `explore.md` §4.

## Citations

- https://supabase.com/docs/guides/auth/auth-identity-linking — automatic vs. manual linking strategies, `GOTRUE_SECURITY_MANUAL_LINKING_ENABLED`, unconfirmed-identity removal, FAQ on OAuth+password interplay, SAML exclusion.
- https://supabase.com/docs/guides/auth/identities — identity type taxonomy (Email, Phone, OAuth, SAML) and the identity object shape.
- https://supabase.com/docs/guides/auth/users — user object model; "a user with an email or phone identity will be able to sign in with either a password or passwordless method" — the fact that OTP and password share one identity type.

## Conclusion

Confident answer: for this design's exact combination (OTP primary, Google OAuth primary, password secondary, same email), Supabase Auth's documented default behavior — automatic linking by verified email on OAuth sign-in, plus OTP/password inherently sharing one `email`-type identity — already guarantees one `auth.users.id` per person with no additional Supabase configuration or `linkIdentity()` call needed. The `customers.authUserId -> auth.users.id` FK premise holds against Supabase's own documented contract. The one caveat (stale unconfirmed identities get removed, not merged) is itself documented and resolves toward the same one-row outcome, not away from it.
