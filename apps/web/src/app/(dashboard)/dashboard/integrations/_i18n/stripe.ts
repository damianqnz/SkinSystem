/**
 * Typed loader for the integrations.stripe namespace.
 * Mirrors the keys defined in src/messages/{es,en,pt}.json so client and
 * server components share the same shape — no string-key drift.
 */

import esMessages from '@/messages/es.json';
import enMessages from '@/messages/en.json';
import ptMessages from '@/messages/pt.json';

export type StripeI18n = (typeof esMessages)['integrations']['stripe'];

const DICT: Record<'es' | 'en' | 'pt', StripeI18n> = {
  es: esMessages.integrations.stripe,
  en: enMessages.integrations.stripe,
  pt: ptMessages.integrations.stripe,
};

export function stripeT(locale: string): StripeI18n {
  if (locale === 'pt') return DICT.pt;
  if (locale === 'en') return DICT.en;
  return DICT.es;
}
