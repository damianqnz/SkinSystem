/**
 * @file preview-url.test.ts
 * @description Unit coverage for the pure slug → preview-URL helper.
 */
import { describe, expect, it } from 'vitest';
import { resolvePreviewUrl } from './preview-url';

describe('resolvePreviewUrl', () => {
  it('resolves a valid slug against a local lvh.me base URL', () => {
    expect(resolvePreviewUrl('acme', 'http://lvh.me:3000')).toEqual({
      ok: true,
      previewUrl: 'http://acme.lvh.me:3000/',
      tenantSlug: 'acme',
    });
  });

  it('resolves a valid slug against a production base URL', () => {
    const result = resolvePreviewUrl('acme', 'https://skinsystem.pt');
    expect(result).toEqual({
      ok: true,
      previewUrl: 'https://acme.skinsystem.pt/',
      tenantSlug: 'acme',
    });
  });

  it('signals not-found for an empty slug', () => {
    expect(resolvePreviewUrl('', 'http://lvh.me:3000')).toEqual({ ok: false });
  });
});
