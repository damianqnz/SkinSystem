/**
 * Single source of truth for i18n configuration.
 *
 * Import DEFAULT_LOCALE and SUPPORTED_LOCALES from here — never
 * hardcode locale fallback strings ('pt', 'es', 'en') in page or
 * component files.
 *
 * proxy.ts and i18n/request.ts both consume these constants from here.
 */

export const DEFAULT_LOCALE = 'pt' as const;
export const SUPPORTED_LOCALES = ['pt', 'es', 'en'] as const;
export type SupportedLocale = typeof SUPPORTED_LOCALES[number];
