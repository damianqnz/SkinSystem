import { getRequestConfig } from 'next-intl/server';
import { headers } from 'next/headers';
import { DEFAULT_LOCALE, SUPPORTED_LOCALES, type SupportedLocale } from '@/i18n/config';

function resolveLocale(raw: string | null): SupportedLocale {
  const candidate = raw ?? DEFAULT_LOCALE;
  return (SUPPORTED_LOCALES as readonly string[]).includes(candidate)
    ? (candidate as SupportedLocale)
    : DEFAULT_LOCALE;
}

export default getRequestConfig(async () => {
  const hdrs = await headers();
  const locale = resolveLocale(hdrs.get('x-locale'));
  const messages = (await import(`../messages/${locale}.json`)).default;
  return { locale, messages };
});
