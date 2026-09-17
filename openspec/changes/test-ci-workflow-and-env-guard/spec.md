# Spec: test-ci-workflow-and-env-guard (TEST-02 + TEST-03)

## Requirement 1: Every PR and push to `main` runs lint, types, and tests automatically

### Scenario: Pull request opened against `main`
- **Given** a PR targeting `main`
- **When** the workflow runs
- **Then** `pnpm lint`, `pnpm check-types`, and `pnpm test` all execute, and the PR shows a failing check if any of them exits non-zero

### Scenario: Direct push to `main`
- **Given** a commit pushed directly to `main`
- **When** the workflow runs
- **Then** the same 3 checks execute (visibility into whether `main` is green, even without branch protection enforcing it)

## Requirement 2: The `NEXT_PUBLIC_BASE_DOMAIN`-absent scenario has a dedicated, persisted, repeatable test

### Scenario: Env var absent
- **Given** `process.env.NEXT_PUBLIC_BASE_DOMAIN` is deleted
- **When** `./host` is dynamically imported
- **Then** the import rejects with exactly `"NEXT_PUBLIC_BASE_DOMAIN is required and has no safe default."`

### Scenario: Env var present (control case, proves the test isn't vacuously passing)
- **Given** `process.env.NEXT_PUBLIC_BASE_DOMAIN` is set to a valid value
- **When** `./host` is dynamically imported
- **Then** the import resolves and `BASE_DOMAIN` equals that value

## Verification

1. New CI workflow: verified by actually pushing/opening a PR and observing the check run (can't be verified purely from the local filesystem — the local proxy is `act` or a manual trace of the YAML against GitHub Actions' documented syntax, since no local GitHub Actions runner exists in this repo).
2. `host-env-guard.test.ts`: runs under the existing `pnpm test`, no new harness needed. Both scenarios (absent → rejects, present → resolves) must pass, and the "absent" scenario must be proven capable of failing (temporarily corrupt the expected message during development, confirm the test catches it, then revert) — same verification discipline as PERF-01's audit test this session.
