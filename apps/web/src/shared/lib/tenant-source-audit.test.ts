/**
 * @file tenant-source-audit.test.ts
 * @description Regression guard for SEC-03: the tenant must come from the
 *              caller's membership (`resolveTenantOrgId`), never from
 *              `user_metadata`. Any signed-in user can rewrite their own
 *              `user_metadata` through the Auth API (`updateUser({ data })`),
 *              so reading `organization_id` from it let any account — including
 *              a self-registered customer — act on any tenant.
 *
 * Scope: every `.ts`/`.tsx` file under `src/`. Display fields such as
 * `user_metadata.full_name` stay allowed; only tenant/role identity is banned.
 */
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const SRC = new URL('../..', import.meta.url).pathname;
const SELF = 'tenant-source-audit.test.ts';

function walk(dir: string): string[] {
  const out: string[] = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) out.push(...walk(full));
    else if (entry.isFile() && /\.tsx?$/.test(entry.name) && entry.name !== SELF) out.push(full);
  }
  return out;
}

const IDENTITY_FROM_USER_METADATA = /user_metadata\??\.(organization_id|organizationId|role)\b/;

describe('tenant identity source', () => {
  it('never reads organization or role from user_metadata', () => {
    const offenders = walk(SRC).filter((file) => IDENTITY_FROM_USER_METADATA.test(readFileSync(file, 'utf8')));
    expect(offenders.map((f) => f.slice(SRC.length))).toEqual([]);
  });
});
