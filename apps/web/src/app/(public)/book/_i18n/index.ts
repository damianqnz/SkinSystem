/**
 * @file _i18n/index.ts
 * @description Public entry point for the booking funnel i18n dictionary.
 *              Components consume this via `bookT(locale)`; later migration
 *              to `next-intl` is a mechanical replacement of this call.
 */

import { es } from './es';
import { pt } from './pt';
import { en } from './en';
import type { BookingLabels, BookingLocale } from './types';

export type { BookingLabels, BookingLocale } from './types';

// ── Locale → dictionary ───────────────────────────────────────

const DICTIONARIES: Record<BookingLocale, BookingLabels> = { es, pt, en };

/**
 * Returns the booking label dictionary for the given locale.
 * Falls back to Spanish for any unknown/unsupported locale so the
 * consumer never sees raw keys.
 */
export function bookT(locale: string): BookingLabels {
  if (locale === 'pt' || locale === 'en') return DICTIONARIES[locale];
  return DICTIONARIES.es;
}

/**
 * Minimal template interpolator: replaces `{key}` with the matching value.
 * No pluralisation — for that we'll move to `next-intl`'s ICU messages.
 */
export function format(
  template: string,
  vars: Record<string, string | number>,
): string {
  return template.replace(/\{(\w+)\}/g, (_, key) =>
    key in vars ? String(vars[key]) : `{${key}}`,
  );
}

/**
 * Builds a BCP-47 tag suitable for `Intl` / `toLocaleString` APIs.
 *   es → es-ES · pt → pt-PT · en → en-GB
 */
export function toIntlTag(locale: string): 'es-ES' | 'pt-PT' | 'en-GB' {
  if (locale === 'pt') return 'pt-PT';
  if (locale === 'en') return 'en-GB';
  return 'es-ES';
}
