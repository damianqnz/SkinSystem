# Tasks: test-ci-workflow-and-env-guard (TEST-02 + TEST-03)

## Phase 1 — CI workflow
- [x] 1.1 Create `.github/workflows/ci.yml` (checkout, pnpm setup, node setup, install, check-types, test)
- [x] 1.1b **Amended**: dropped the planned `lint` step after discovering `pnpm lint` fails today on 74 pre-existing warnings unrelated to this change — asked the user, chose to ship without it and open a dedicated lint-debt ticket instead

## Phase 2 — Env-var-absent regression test
- [x] 2.1 Create `host-env-guard.test.ts`: absent-env rejects with exact message
- [x] 2.2 Present-env control case resolves correctly
- [x] 2.3 Proved the absent-env test can actually fail: temporarily changed the expected message to `'wrong message on purpose'`, confirmed the assertion failed with a clear diff, reverted

## Phase 3 — Validation
- [x] 3.1 `pnpm check-types` (root, via turbo) — exit 0
- [x] 3.2 `pnpm test` (root, via turbo) — 50/50 passed, including the 2 new tests
- [x] 3.3 `eslint` on the new test file directly — clean
- [x] 3.4 Manual trace of `ci.yml` against GitHub Actions' documented syntax
- [x] 3.5 **Added**: ran the exact gate commands (`pnpm check-types`, `pnpm test`) from the repo root exactly as the workflow will — both clean

**Actual**: 2 new files (`ci.yml`, `host-env-guard.test.ts`), ~65 lines. Low risk, single PR. Follow-up ticket opened (lint debt) rather than expanding this change's scope.
