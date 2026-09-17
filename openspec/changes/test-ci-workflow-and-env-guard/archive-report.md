# Archive report: test-ci-workflow-and-env-guard (TEST-02 + TEST-03)

**Status**: DONE (with amended, narrower CI scope than originally planned). Archived 2026-09-17.

## Summary

Closes both remaining TEST-01 follow-ups. `.github/workflows/ci.yml` now runs `check-types` + `test` on every PR against `main` and every push to `main` — the first automated gate this repository has ever had. `host-env-guard.test.ts` turns the `NEXT_PUBLIC_BASE_DOMAIN`-absent scenario from an incidental tripwire (any test breaks if `vitest.config.ts`'s global env value disappears) into a dedicated, direct assertion of the exact documented failure mode.

## Material finding during implementation: `lint` isn't safe to gate on yet

The original design planned `lint` + `check-types` + `test`. Actually running `pnpm lint` from the repo root — not just trusting prior tickets' narrower, per-file `eslint` invocations — surfaced 74 pre-existing warnings across the codebase, unrelated to this change: 39 `no-unused-vars`, 19 `turbo/no-undeclared-env-vars` (env vars read in code but never declared in `turbo.json`), and a tail of `react-hooks/exhaustive-deps`, `no-img-element`, `no-fallthrough`, and others. Asked the user rather than silently absorbing an unrelated ~15-20-file cleanup into a testing-infrastructure ticket, or shipping a CI check that fails from the moment it's merged. Chosen path: ship without `lint`, open a dedicated follow-up ticket for the lint debt.

**Follow-up ticket recommended**: **TEST-04** — clean up the 74 pre-existing `eslint` warnings (`turbo/no-undeclared-env-vars` fixable by declaring the ~8 missing env vars in `turbo.json`; the `no-unused-vars` majority needs per-file review), then add a `Lint` step to `ci.yml`.

## Scope

2 new files, ~65 lines total. No production code touched.

## Non-goals

- No `build` step in CI (prior scope decision, before the lint finding — build needs GitHub Secrets the user hasn't configured).
- No GitHub branch-protection rule marking the new check "required" — a repo-settings action for the user, not a file this change can make.
- `host.ts`, `vitest.config.ts` — untouched.

## Validation

`pnpm check-types` (root) exit 0, `pnpm test` (root) 50/50 (2 new, including an empirically-proven-capable-of-failing negative test), `eslint` on the new test file clean. CI workflow itself validated by hand against GitHub Actions' documented syntax (no local Actions runner in this repo).
