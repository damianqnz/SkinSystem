/**
 * @file host.test.ts
 * @description Unit coverage for the pure hostname → tenant identity helpers.
 */
import { describe, expect, it } from 'vitest';
import { extractTenantSlug, isLocalHost, normalizeHost } from './host';

describe('normalizeHost', () => {
  it('lowercases the host and strips the port', () => {
    expect(normalizeHost('Acme.SkinSystem.test:3000')).toBe('acme.skinsystem.test');
  });

  it('returns an empty string for a null host', () => {
    expect(normalizeHost(null)).toBe('');
  });
});

describe('isLocalHost', () => {
  it('recognizes localhost with a port', () => {
    expect(isLocalHost('localhost:3000')).toBe(true);
  });

  it('recognizes the lvh.me local apex, including a tenant subdomain', () => {
    expect(isLocalHost('acme.lvh.me')).toBe(true);
  });

  it('rejects a production host', () => {
    expect(isLocalHost('skinsystem.test')).toBe(false);
  });
});

describe('extractTenantSlug', () => {
  it('extracts the slug from a valid tenant subdomain', () => {
    expect(extractTenantSlug('acme.skinsystem.test')).toBe('acme');
  });

  it('returns null for the apex host (no tenant segment)', () => {
    expect(extractTenantSlug('skinsystem.test')).toBeNull();
  });

  it('returns null for a reserved subdomain', () => {
    expect(extractTenantSlug('admin.skinsystem.test')).toBeNull();
  });

  it('returns null for a nested subdomain', () => {
    expect(extractTenantSlug('a.b.skinsystem.test')).toBeNull();
  });

  it('returns null for a malformed label', () => {
    expect(extractTenantSlug('-bad-.skinsystem.test')).toBeNull();
  });

  it('extracts the slug from the lvh.me local apex', () => {
    expect(extractTenantSlug('acme.lvh.me')).toBe('acme');
  });

  it('returns null when the host carries no known apex', () => {
    expect(extractTenantSlug('acme.unknown-domain.example')).toBeNull();
  });
});
