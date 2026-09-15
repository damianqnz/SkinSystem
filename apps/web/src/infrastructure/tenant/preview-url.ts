/**
 * @file preview-url.ts
 * @description Tenant slug → live-preview URL. Pure decision extracted from
 *              `settings/layout.tsx` so the fail-closed branch (missing slug)
 *              is unit-testable without a Server Component render.
 */

/**
 * Discriminated result: an absent/empty slug never carries a `previewUrl`
 * the caller could accidentally render — the caller must narrow on `ok`
 * before either field is accessible.
 */
export type PreviewUrlResolution =
  | { ok: true; previewUrl: string; tenantSlug: string }
  | { ok: false };

/**
 * Builds the tenant live-preview URL for a given slug and base URL.
 * Returns `{ ok: false }` when `slug` is empty — the caller is expected to
 * call `notFound()` in that case rather than fall back to a literal slug.
 *
 * @example
 * resolvePreviewUrl('acme', 'http://lvh.me:3000')
 *   → { ok: true, previewUrl: 'http://acme.lvh.me:3000/', tenantSlug: 'acme' }
 * resolvePreviewUrl('', 'http://lvh.me:3000') → { ok: false }
 */
export function resolvePreviewUrl(slug: string, baseUrl: string): PreviewUrlResolution {
  if (!slug) return { ok: false };

  const previewUrl = baseUrl.includes('lvh.me')
    ? `http://${slug}.lvh.me:3000/`
    : `https://${slug}.${baseUrl.replace(/^https?:\/\//, '')}/`;

  return { ok: true, previewUrl, tenantSlug: slug };
}
