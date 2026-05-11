import { getRequestConfig } from 'next-intl/server';
import { headers } from 'next/headers';

const SUPPORTED_LOCALES = ['pt', 'es', 'en'] as const;
type SupportedLocale = typeof SUPPORTED_LOCALES[number];

function resolveLocale(raw: string | null): SupportedLocale {
  const candidate = raw ?? 'pt';
  return (SUPPORTED_LOCALES as readonly string[]).includes(candidate)
    ? (candidate as SupportedLocale)
    : 'pt';
}

export default getRequestConfig(async () => {
  const hdrs = await headers();
  const locale = resolveLocale(hdrs.get('x-locale'));
  const messages = (await import(`../messages/${locale}.json`)).default;
  return { locale, messages };
});
