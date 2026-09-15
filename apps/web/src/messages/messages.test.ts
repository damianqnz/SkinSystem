/**
 * @file messages.test.ts
 * @description Regression guard for the PR3 defect class: a key present in
 *              one locale file but absent from another compiles clean under
 *              `IntlMessages = typeof en` and renders the raw key at runtime.
 *              Flattens `pt.json` / `es.json` / `en.json` into dot-path key
 *              sets and asserts they carry an identical set of keys.
 *
 * Deviation from design D4: the schema additionally accepts `string[]`
 * leaves (not only `string`). `dashboard.calendar.header.months` and two
 * sibling keys are legitimate pre-existing translated arrays in all three
 * locale files; rejecting arrays outright would make `load()` throw on real
 * production content and fail the happy-path scenario. Migrating those keys
 * to named objects is a content change out of this test-infra change's
 * scope. The schema still rejects any other non-string leaf (numbers,
 * booleans, nested arrays), so it keeps catching genuinely malformed content.
 */
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { z } from 'zod';
import { SUPPORTED_LOCALES, type SupportedLocale } from '@/i18n/config';

type MessageTree = string | readonly string[] | { [key: string]: MessageTree };

const MessageTree: z.ZodType<MessageTree> = z.lazy(() =>
  z.union([z.string(), z.array(z.string()), z.record(z.string(), MessageTree)]),
);

function load(locale: SupportedLocale): MessageTree {
  const raw = readFileSync(new URL(`./${locale}.json`, import.meta.url), 'utf8');
  return MessageTree.parse(JSON.parse(raw));
}

/** Dot-path leaf keys. A string/array value is a leaf; only plain objects recurse. */
function flatten(tree: MessageTree, prefix = ''): Set<string> {
  if (typeof tree === 'string' || Array.isArray(tree)) {
    return new Set(prefix ? [prefix] : []);
  }
  const keys = new Set<string>();
  for (const [key, value] of Object.entries(tree)) {
    const path = prefix ? `${prefix}.${key}` : key;
    for (const leaf of flatten(value, path)) keys.add(leaf);
  }
  return keys;
}

function diff(
  reference: ReadonlySet<string>,
  actual: ReadonlySet<string>,
): { missing: string[]; extra: string[] } {
  return {
    missing: [...reference].filter((k) => !actual.has(k)).sort(),
    extra: [...actual].filter((k) => !reference.has(k)).sort(),
  };
}

describe('i18n key parity (real locale files)', () => {
  const trees: Record<SupportedLocale, Set<string>> = Object.fromEntries(
    SUPPORTED_LOCALES.map((locale) => [locale, flatten(load(locale))]),
  ) as Record<SupportedLocale, Set<string>>;

  // Union of all three sets — no single locale is privileged as "the" reference.
  const reference = new Set<string>(SUPPORTED_LOCALES.flatMap((locale) => [...trees[locale]]));

  it.each(SUPPORTED_LOCALES)('locale "%s" has no missing or extra keys', (locale) => {
    const { missing, extra } = diff(reference, trees[locale]);
    expect(
      { missing, extra },
      `locale "${locale}" — missing: ${missing.join(', ') || 'none'}; extra: ${extra.join(', ') || 'none'}`,
    ).toEqual({ missing: [], extra: [] });
  });
});

describe('flatten/diff regression guards (fixture-driven, real files untouched)', () => {
  it('names the missing key and its locale when a key is absent from one locale', () => {
    const localeTrees = {
      en: flatten({ dashboard: { foo: { bar: 'value' } } }),
      pt: flatten({ dashboard: {} }),
    };
    const reference = new Set([...localeTrees.en, ...localeTrees.pt]);
    const { missing } = diff(reference, localeTrees.pt);

    expect(missing).toEqual(['dashboard.foo.bar']);
    expect(`locale "pt" is missing: ${missing.join(', ')}`).toBe(
      'locale "pt" is missing: dashboard.foo.bar',
    );
  });

  it('names the extra key and its locale when a key is present only in one locale', () => {
    const localeTrees = {
      es: flatten({ dashboard: { foo: 'value', extraneous: 'value' } }),
      en: flatten({ dashboard: { foo: 'value' } }),
      pt: flatten({ dashboard: { foo: 'value' } }),
    };
    const reference = new Set([...localeTrees.en, ...localeTrees.pt]);
    const { extra } = diff(reference, localeTrees.es);

    expect(extra).toEqual(['dashboard.extraneous']);
    expect(`locale "es" has extra key(s): ${extra.join(', ')}`).toBe(
      'locale "es" has extra key(s): dashboard.extraneous',
    );
  });
});
