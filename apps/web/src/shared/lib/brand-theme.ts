/**
 * @file shared/lib/brand-theme.ts
 * @description Resolves a tenant's appearance tokens for the consumer-facing
 *              root layouts.
 *
 * Both `(tenant)` and `(account)` render under the same subdomain and must
 * paint the same brand, so the lookup lives here instead of being duplicated
 * in each root layout.
 */

import { eq }            from 'drizzle-orm';
import { db }            from '@/infrastructure/db';
import { organizations } from '@/infrastructure/db/schema/organizations';

export type BrandColorScheme = 'system' | 'light' | 'dark';

export interface BrandTheme {
  brandColor: string;
  btnRadius:  string;
  scheme:     BrandColorScheme;
}

const BTN_RADIUS: Record<string, string> = {
  pill:      '9999px',
  rounded:   '12px',
  rectangle: '4px',
};

/**
 * Both values are interpolated into an inline `<style>` block in the document
 * head, so neither may ever carry raw tenant input. `btnRadius` is a lookup
 * into the table above; `brandColor` is checked against this pattern. Anything
 * that fails falls back to the default instead of reaching the DOM.
 */
const HEX_COLOR = /^#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/;

const DEFAULTS: BrandTheme = {
  brandColor: '#D4AF37',
  btnRadius:  '12px',
  scheme:     'system',
};

/**
 * Tenant-isolation note: this is the org lookup itself, keyed on the slug the
 * proxy already validated. There is no `organization_id` to scope by — the row
 * this returns is what defines it — and it reads appearance tokens only, never
 * tenant-owned business data.
 */
export async function getBrandTheme(slug: string): Promise<BrandTheme> {
  if (!slug) return DEFAULTS;

  const rows = await db
    .select({ themeConfig: organizations.themeConfig })
    .from(organizations)
    .where(eq(organizations.slug, slug))
    .limit(1);

  const cfg = (rows[0]?.themeConfig ?? {}) as Record<string, string>;

  return {
    brandColor: cfg.brandColor && HEX_COLOR.test(cfg.brandColor)
      ? cfg.brandColor
      : DEFAULTS.brandColor,
    btnRadius:  (cfg.buttonShape && BTN_RADIUS[cfg.buttonShape]) ?? DEFAULTS.btnRadius,
    scheme:     isColorScheme(cfg.theme) ? cfg.theme : DEFAULTS.scheme,
  };
}

function isColorScheme(value: string | undefined): value is BrandColorScheme {
  return value === 'system' || value === 'light' || value === 'dark';
}
