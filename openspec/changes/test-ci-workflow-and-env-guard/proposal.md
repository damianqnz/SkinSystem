# Proposal: test-ci-workflow-and-env-guard (TEST-02 + TEST-03)

## Intent

Close both remaining testing-infrastructure follow-ups from TEST-01: no automated PR gate exists (TEST-02), and the `NEXT_PUBLIC_BASE_DOMAIN`-absent scenario has only an incidental, indirect test signal (TEST-03).

## Scope

1. **`.github/workflows/ci.yml`** (new): runs `pnpm lint`, `pnpm check-types`, `pnpm test` on every PR targeting `main` and every push to `main`. Scope explicitly excludes `build` — chosen by the user to avoid requiring GitHub Secrets for Supabase/Stripe/`NEXT_PUBLIC_BASE_DOMAIN` as part of this change.
2. **`apps/web/src/infrastructure/tenant/host-env-guard.test.ts`** (new): dedicated, persisted test asserting `import('./host')` rejects with the exact configured error message when `NEXT_PUBLIC_BASE_DOMAIN` is absent, and resolves normally when it's present — exactly the scenario TEST-01's apply phase proved manually once but never captured as a repeatable test.

## Non-goals

- No `build` step in CI (see scope decision above) — the user configuring GitHub Secrets and adding it later is a natural follow-up, not blocked by anything in this change.
- No GitHub branch-protection rule change (marking the new CI check "required" for merge) — a repo-settings action, not a file in this repository; flagged for the user to do manually.
- No change to `host.ts`, `vitest.config.ts`, or any existing test file.

## Risk / size

Trivial risk — a new CI config file and one new self-contained test file, no production code touched. Single PR, well under budget.
