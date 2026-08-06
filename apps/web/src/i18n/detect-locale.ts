/**
 * @file detect-locale.ts
 * @description Request → locale resolution for the proxy layer.
 *              Public and dashboard segments resolve through separate cookies
 *              so a staff preference never leaks into the consumer-facing site.
 */

import type { NextRequest } from 'next/server';
import { DEFAULT_LOCALE, SUPPORTED_LOCALES, type SupportedLocale } from './config';

export function isSupportedLocale(value: string | undefined): value is SupportedLocale {
  return !!value && SUPPORTED_LOCALES.includes(value as SupportedLocale);
}

/**
 * Maps a raw browser language tag to one of the supported locales.
 *
 * Rules:
 *  - Any Spanish variant (`es`, `es-AR`, `es-MX`, …) → `'es'`
 *  - Any Portuguese variant (`pt`, `pt-BR`, `pt-PT`, …) → `'pt'`
 *  - Anything else (English, French, German, …) → `'en'`
 *  - Empty/invalid input → `null` (caller decides the fallback)
 */
function mapBrowserLangToLocale(raw: string): SupportedLocale | null {
  const tag = raw.trim().toLowerCase();
  if (!tag) return null;
  const primary = tag.split('-')[0];
  if (primary === 'es') return 'es';
  if (primary === 'pt') return 'pt';
  return 'en';
}

/**
 * Resolves the locale for the public segment.
 * Priority: NEXT_LOCALE cookie (manual choice) → Accept-Language → DEFAULT_LOCALE.
 */
export function detectLocale(request: NextRequest): SupportedLocale {
  const fromCookie = request.cookies.get('NEXT_LOCALE')?.value;
  if (isSupportedLocale(fromCookie)) return fromCookie;

  const firstTag = (request.headers.get('accept-language') ?? '').split(',')[0] ?? '';
  return mapBrowserLangToLocale(firstTag) ?? DEFAULT_LOCALE;
}

/**
 * Resolves the locale for the dashboard segment.
 * Priority: DASHBOARD_LOCALE cookie (per-staff mirror of `profiles.locale`)
 * → the public chain above.
 *
 * Kept separate from NEXT_LOCALE so two staff sharing a browser do NOT inherit
 * each other's preference, and the public site language stays untouched.
 */
export function detectDashboardLocale(request: NextRequest): SupportedLocale {
  const fromCookie = request.cookies.get('DASHBOARD_LOCALE')?.value;
  if (isSupportedLocale(fromCookie)) return fromCookie;
  return detectLocale(request);
}
