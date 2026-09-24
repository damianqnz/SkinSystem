/**
 * @file client-namespace-audit.test.ts
 * @description Regression guard for PERF-01: `ConsumerShell`/`(marketing)/layout.tsx`
 *              narrow the message bundle passed to `NextIntlClientProvider` to an
 *              explicit allow-list per route group. Narrowing is type-legal but not
 *              compile-time safe -- a Client Component reading a namespace outside
 *              the allow-list compiles clean and only fails at runtime (blank/raw-key
 *              text). This test statically scans every `'use client'` file under the
 *              consumer-facing route groups for `useTranslations(...)` namespace
 *              calls and asserts each one is covered by the corresponding allow-list.
 *
 * Scope: `app/(tenant)`, `app/(account)`, `app/(marketing)` (recursive), plus the
 * top-level files directly under `shared/components/` (`ConsumerShell.tsx`,
 * `LanguageSwitcher.tsx` -- both actually consumed by these route groups). Does NOT
 * recurse into `shared/components/dashboard/` or `shared/components/booking/`,
 * confirmed dashboard-only subtrees with zero imports from these route groups.
 */
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { AUTH_CLIENT_NAMESPACES, CONSUMER_CLIENT_NAMESPACES, MARKETING_CLIENT_NAMESPACES } from './client-namespaces';

const SRC = new URL('..', import.meta.url).pathname;

function walk(dir: string): string[] {
  const out: string[] = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) out.push(...walk(full));
    else if (entry.isFile() && entry.name.endsWith('.tsx')) out.push(full);
  }
  return out;
}

function topLevelTsxFiles(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true })
    .filter((e) => e.isFile() && e.name.endsWith('.tsx'))
    .map((e) => join(dir, e.name));
}

/** Every `useTranslations('<literal>')` namespace call in a file; throws on a dynamic call. */
function extractNamespaces(filePath: string, content: string): string[] {
  const namespaces: string[] = [];
  const callPattern = /useTranslations\(\s*([^)]*?)\s*\)/g;
  for (const match of content.matchAll(callPattern)) {
    const arg = match[1]!.trim();
    if (arg === '') continue; // useTranslations() with no namespace -- nothing to audit
    const literal = /^['"]([^'"]+)['"]$/.exec(arg);
    if (!literal) {
      throw new Error(
        `${filePath}: useTranslations(${arg}) is not a plain string literal -- ` +
        'this static audit cannot verify a dynamic namespace against the client allow-list. ' +
        'Use a literal namespace, or extend this test to handle the new pattern.',
      );
    }
    namespaces.push(literal[1]!.split('.')[0]!);
  }
  return namespaces;
}

function auditFiles(files: string[], allowList: readonly string[]): void {
  for (const file of files) {
    const content = readFileSync(file, 'utf8');
    if (!content.includes("'use client'")) continue;
    for (const ns of extractNamespaces(file, content)) {
      expect(allowList, `${file}: useTranslations('${ns}...') reads a namespace not in [${allowList.join(', ')}]`)
        .toContain(ns);
    }
  }
}

describe('client-namespace audit (PERF-01 regression guard)', () => {
  it('every (tenant)/(account) Client Component only reads an allow-listed namespace', () => {
    const files = [
      ...walk(join(SRC, 'app', '(tenant)')),
      ...walk(join(SRC, 'app', '(account)')),
      ...topLevelTsxFiles(join(SRC, 'shared', 'components')),
    ];
    expect(files.length).toBeGreaterThan(0);
    auditFiles(files, CONSUMER_CLIENT_NAMESPACES);
  });

  it('every (marketing) Client Component only reads an allow-listed namespace', () => {
    const files = walk(join(SRC, 'app', '(marketing)'));
    expect(files.length).toBeGreaterThan(0);
    auditFiles(files, MARKETING_CLIENT_NAMESPACES);
  });

  it('every (auth) Client Component only reads an allow-listed namespace', () => {
    const files = walk(join(SRC, 'app', '(auth)'));
    expect(files.length).toBeGreaterThan(0);
    auditFiles(files, AUTH_CLIENT_NAMESPACES);
  });
});
