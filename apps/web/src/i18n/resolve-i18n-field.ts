import { DEFAULT_LOCALE, type SupportedLocale } from './config';

/**
 * Read a localized value out of an i18n JSONB column
 * ({ pt, es, en }) with a deterministic fallback chain: the requested
 * locale, then DEFAULT_LOCALE, then whatever translation exists.
 */
export function resolveI18nField(obj: unknown, locale: string, fallback = ''): string {
  if (!obj || typeof obj !== 'object') return fallback;
  const values = obj as Partial<Record<SupportedLocale | string, string>>;
  return values[locale] || values[DEFAULT_LOCALE] || Object.values(values).find(Boolean) || fallback;
}
