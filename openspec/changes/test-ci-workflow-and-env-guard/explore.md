# Exploration: test-ci-workflow-and-env-guard (TEST-02 + TEST-03)

## TEST-02 — CI workflow

- No `.github/` directory exists at all — confirmed via `fd`. Zero CI today; `pnpm test`/`turbo run test` only ever runs locally.
- Root `package.json` already defines `lint`, `check-types`, `test`, `build` as `turbo run <task>` scripts; `turbo.json` already declares all 4 as tasks with correct `dependsOn` graphs. CI just needs to invoke the existing scripts — no new task wiring needed.
- `packageManager: "pnpm@9.0.0"` pinned in root `package.json` — `pnpm/action-setup` can read this directly, no version needs hardcoding in the workflow.
- `pnpm-lock.yaml` present — `--frozen-lockfile` install is safe.
- **Scope decision (asked the user)**: gate runs `lint` + `check-types` + `test`, not `build`. `next build` needs real Supabase/Stripe/`NEXT_PUBLIC_BASE_DOMAIN` values as GitHub Secrets — a manual repo-configuration step outside this change's authority. None of the 3 chosen checks execute application code that touches those env vars: `eslint`/`tsc --noEmit` are static analysis (no module execution), and `vitest` already gets `NEXT_PUBLIC_BASE_DOMAIN` from `vitest.config.ts`'s `test.env` block. Zero new secrets needed for this scope.

## TEST-03 — dedicated env-var-absent test

- `apps/web/src/infrastructure/tenant/host.ts:29-35`: `requireBaseDomain()` runs at **module top level** (`export const BASE_DOMAIN = requireBaseDomain();`), so merely `import`-ing `host.ts` throws synchronously if `NEXT_PUBLIC_BASE_DOMAIN` is unset — no function call needed to trigger it.
- `apps/web/vitest.config.ts:25-27` sets `NEXT_PUBLIC_BASE_DOMAIN: 'skinsystem.test'` globally for every test file, with a comment already flagging this exact gap: *"Load-bearing: removing this line must make the affected suite fail... proven in Phase 5."* That's the "incidental tripwire" TEST-03's debt note refers to — an indirect signal (any test importing `host.ts` fails if the global config value disappears), not a dedicated, direct assertion of the failure message.
- Fix: a new test file that, within its own `beforeEach`/`afterEach`, deletes `process.env.NEXT_PUBLIC_BASE_DOMAIN`, calls `vi.resetModules()` (forces re-evaluation — ESM caches by default), and asserts `await import('./host')` rejects with the exact message `"NEXT_PUBLIC_BASE_DOMAIN is required and has no safe default."` — precisely what the debt note prescribed. Restores the env var afterward so no other test in the same file/run is affected.

## Non-goals

- No change to `host.ts` itself, `vitest.config.ts`, or any other test file.
- No `build`/deploy step in the new CI workflow (scope decision above).
- No branch-protection rule configuration (making the CI check "required" on GitHub) — that's a repo-settings action outside this change's file-based scope; flagged as a follow-up the user should do manually in GitHub settings.
