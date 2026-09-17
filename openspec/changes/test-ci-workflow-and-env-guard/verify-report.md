# Verify report: test-ci-workflow-and-env-guard (TEST-02 + TEST-03)

**Verdict: PASS** (0 critical, amended scope disclosed below)

## Requirement-by-requirement check

### Requirement 1: Every PR and push to `main` runs typecheck and tests automatically
- `.github/workflows/ci.yml` triggers on `pull_request` (branches: `[main]`) and `push` (branches: `[main]`), traced by hand against GitHub Actions' documented syntax (no local Actions runner available in this repo).
- **Amended from design**: the planned `lint` step was dropped after actually running `pnpm lint` from the repo root and finding 74 pre-existing warnings (unrelated to this change — none touch files this session modified). Asked the user; chose `check-types` + `test` only for this gate, with a new lint-debt ticket opened rather than silently expanding this change's scope to fix ~15-20 unrelated files, or shipping a CI check that's red from the moment it merges.
- Ran the exact final gate commands (`pnpm check-types`, `pnpm test`) from the repo root, exactly as the workflow will: both exit 0 (types cached/fresh, 50/50 tests).

### Requirement 2: `NEXT_PUBLIC_BASE_DOMAIN`-absent scenario has a dedicated, persisted test
- `host-env-guard.test.ts`: absent-env case asserts `import('./host')` rejects with the exact message `host.ts` already throws — confirmed via diff-literal read of both files, no message re-invented.
- Present-env control case confirms the test isn't vacuously passing (asserts `BASE_DOMAIN` actually resolves).
- **Empirically proved the test can fail**, not just reasoned about it: temporarily changed the expected message to `'wrong message on purpose'`, re-ran the single test file, got a clear assertion failure showing both expected and received values, then reverted and re-ran the full suite (50/50) to confirm the revert left no trace.

## Build-time / lint-time verification

- `pnpm check-types` (root, via turbo): exit 0.
- `pnpm test` (root, via turbo): 50/50 passed (2 new).
- `eslint` on `host-env-guard.test.ts` directly: clean, 0 warnings.
- The CI workflow YAML itself has no local validator in this repo; verified by hand against the documented `on`/`jobs`/`steps` schema and by confirming `pnpm/action-setup@v4` correctly reads `packageManager` from root `package.json` (documented behavior, not re-derived here).

## Scope discipline

- No change to `host.ts`, `vitest.config.ts`, or any existing test file — confirmed via `git status`.
- No `build` step in the workflow (user's earlier scope decision) — confirmed via the committed `ci.yml`.
- No GitHub branch-protection configuration attempted — outside this change's file-based authority; the user still needs to mark the new check "required" in repo settings if they want it to actually block merges (a repo-settings action, not a file).

## Files changed / size

2 new files: `.github/workflows/ci.yml` (~30 lines), `apps/web/src/infrastructure/tenant/host-env-guard.test.ts` (~35 lines). Well under the 400-line single-PR budget.
