/**
 * @file intl-tag.ts
 * @description Maps a supported locale onto the BCP-47 tag that `Intl` and
 *              `toLocaleString` actually need.
 *
 * The app stores locales as bare language codes ('pt' | 'es' | 'en') because
 * that is what the proxy resolves and what the message bundles are keyed by.
 * `Intl` formatters, however, pick region-specific conventions — currency
 * placement, date order, decimal separator — so a bare 'pt' would silently
 * resolve to whatever region the runtime prefers. Pinning the region here is
 * what keeps prices and dates identical between server and client renders.
 */

import { DEFAULT_LOCALE, type SupportedLocale } from './config';

type IntlTag = 'es-ES' | 'pt-PT' | 'en-GB';

const INTL_TAGS: Record<SupportedLocale, IntlTag> = {
  pt: 'pt-PT',
  es: 'es-ES',
  en: 'en-GB',
};

/**
 * Returns the BCP-47 tag for the given locale.
 * Anything outside `SUPPORTED_LOCALES` resolves through `DEFAULT_LOCALE`,
 * so the fallback tracks the project default instead of a hardcoded region.
 */
export function toIntlTag(locale: SupportedLocale): IntlTag {
  return INTL_TAGS[locale] ?? INTL_TAGS[DEFAULT_LOCALE];
}
