# Design: test-ci-workflow-and-env-guard (TEST-02 + TEST-03)

## 1. `.github/workflows/ci.yml`

```yaml
name: CI

on:
  pull_request:
    branches: [main]
  push:
    branches: [main]

concurrency:
  group: ci-${{ github.workflow }}-${{ github.ref }}
  cancel-in-progress: true

jobs:
  checks:
    name: Lint, typecheck, and test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: pnpm/action-setup@v4
        # Reads `packageManager: "pnpm@9.0.0"` from root package.json — no version pin needed here.

      - uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: pnpm

      - name: Install dependencies
        run: pnpm install --frozen-lockfile

      - name: Type check
        run: pnpm check-types

      - name: Test
        run: pnpm test
```

**Amended during implementation**: `pnpm lint` from the repo root fails today on 74 pre-existing warnings (39 `no-unused-vars`, 19 `turbo/no-undeclared-env-vars`, and a long tail of other rules — none introduced by this change, confirmed via `git diff`/prior tickets' own disclosures). Discovered only by actually running the exact command the workflow would run, not by trusting the earlier per-file `eslint` checks from prior tickets (which never invoked the `turbo` plugin's env-var rule). Asked the user; chosen path: ship the gate with `check-types` + `test` only, omit `lint` entirely for now, and open a dedicated lint-debt ticket rather than silently absorbing an unrelated ~15-20-file cleanup into this change or shipping a CI check that's red from day one.

- `node-version: 22` — current Node LTS at time of writing; Next 16 requires 20.9+, 22 is comfortably supported and matches what `actions/setup-node`'s cache keying expects for a stable pin (root `engines.node: ">=18"` is looser/stale, not used as the CI pin).
- `concurrency` cancels a stale run when new commits land on the same PR/branch — avoids wasted runner minutes, standard practice, zero behavioral risk.
- Single job, 3 sequential steps after install — `lint`/`check-types`/`test` are each fast (`turbo` caches per-package) and none depends on DB/network access, so no service containers or secrets needed.
- `build` deliberately omitted (user's scope decision) — adding it later is a 4-line diff to this same file plus configuring `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `NEXT_PUBLIC_BASE_DOMAIN`, and any Stripe publishable key as GitHub Actions repo secrets — a manual step for the user, not part of this change.

## 2. `apps/web/src/infrastructure/tenant/host-env-guard.test.ts`

```ts
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

describe('host.ts — NEXT_PUBLIC_BASE_DOMAIN required at import time', () => {
  const ORIGINAL = process.env.NEXT_PUBLIC_BASE_DOMAIN;

  beforeEach(() => {
    vi.resetModules();
  });

  afterEach(() => {
    process.env.NEXT_PUBLIC_BASE_DOMAIN = ORIGINAL;
  });

  it('rejects with the exact configured message when the env var is absent', async () => {
    delete process.env.NEXT_PUBLIC_BASE_DOMAIN;
    await expect(import('./host')).rejects.toThrow(
      'NEXT_PUBLIC_BASE_DOMAIN is required and has no safe default.',
    );
  });

  it('resolves normally when the env var is present', async () => {
    process.env.NEXT_PUBLIC_BASE_DOMAIN = 'skinsystem.test';
    const { BASE_DOMAIN } = await import('./host');
    expect(BASE_DOMAIN).toBe('skinsystem.test');
  });
});
```

- `vi.resetModules()` forces a fresh module evaluation on the next `import()` — required because ESM caches by specifier, and `vitest.config.ts`'s global `env` block would otherwise mean `host.ts` was already evaluated (successfully) before this test file ever runs.
- `import('./host')` triggers `requireBaseDomain()` at the top-level `const BASE_DOMAIN = requireBaseDomain();` — a synchronous throw during module evaluation surfaces as a rejected dynamic-import Promise, which `.rejects.toThrow(...)` asserts directly against the exact message `host.ts` already throws (no new error message invented for the test).
- `afterEach` restores the original value so no other test file sharing this worker is affected — `ORIGINAL` is read once at `describe`-body eval time, when `vitest.config.ts`'s global env is already in effect.

## Validation gate

`pnpm check-types`, `pnpm test` (new test file + full suite), `eslint`. The workflow YAML itself is validated by GitHub Actions' own schema on push (no local linter for it in this repo) — traced by hand against the documented syntax before committing.
