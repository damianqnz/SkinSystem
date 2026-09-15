import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';

/**
 * @file vitest.config.ts
 * @description Test harness config for `apps/web`. `node` environment (no DOM
 *              needed — the covered suites exercise pure request/response
 *              resolution, not React rendering). `globals: false` keeps
 *              `describe`/`it`/`expect` as explicit imports so `tsconfig.json`
 *              never needs a `types` array edit.
 */
export default defineConfig({
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  test: {
    environment: 'node',
    globals: false,
    include: ['src/**/*.test.ts'],
    // Required for `@/infrastructure/tenant/host` to evaluate without
    // throwing — see host.ts `requireBaseDomain()`. Load-bearing: removing
    // this line must make the affected suite fail (proven in Phase 5).
    env: {
      NEXT_PUBLIC_BASE_DOMAIN: 'skinsystem.test',
    },
  },
});
