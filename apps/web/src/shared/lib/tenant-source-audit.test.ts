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
 * Covers dot access, bracket access and destructuring. It cannot follow an
 * alias (`const md = user.user_metadata; md.role`) — a static scan has no
 * data flow — so treat that shape as banned in review too.
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

const IDENTITY_KEY = String.raw`(?:organization\w*|org_?id|orgId|tenant\w*|role)`;

/** `user_metadata.role`, `user_metadata?.org_id`, `user_metadata['tenant_id']`. */
const MEMBER_ACCESS = new RegExp(
  String.raw`user_metadata\s*(?:\?\.\s*\[\s*['"\x60]|\?\.\s*|\.\s*|\[\s*['"\x60])${IDENTITY_KEY}\b`, 'i',
);

/** `const { organization_id } = user.user_metadata`. */
const DESTRUCTURING = new RegExp(
  String.raw`\{[^}]*\b${IDENTITY_KEY}\b[^}]*\}\s*=\s*[\w.?]*user_metadata`, 'i',
);

function readsIdentityFromUserMetadata(source: string): boolean {
  return MEMBER_ACCESS.test(source) || DESTRUCTURING.test(source);
}

describe('tenant identity source', () => {
  it('never reads organization, tenant or role from user_metadata', () => {
    const offenders = walk(SRC).filter((file) => readsIdentityFromUserMetadata(readFileSync(file, 'utf8')));
    expect(offenders.map((f) => f.slice(SRC.length))).toEqual([]);
  });

  it.each([
    'user.user_metadata?.organization_id',
    'user.user_metadata.role',
    "user.user_metadata['org_id']",
    'user?.user_metadata?.["tenant_id"]',
    'const { organization_id: orgId } = user.user_metadata;',
  ])('flags %s', (sample) => {
    expect(readsIdentityFromUserMetadata(sample)).toBe(true);
  });

  it.each([
    'user.user_metadata?.full_name',
    "user.user_metadata['avatar_url']",
    'const meta = (user.user_metadata ?? {}) as Record<string, unknown>;',
  ])('allows display field %s', (sample) => {
    expect(readsIdentityFromUserMetadata(sample)).toBe(false);
  });
});
