/**
 * @file detect-locale.test.ts
 * @description Unit coverage for request → locale resolution, including
 *              cookie precedence and Accept-Language mapping. `mapBrowserLangToLocale`
 *              is not exported, so Accept-Language coverage goes through the
 *              public `detectLocale` entry point using a real `NextRequest`.
 */
import { NextRequest } from 'next/server';
import { describe, expect, it } from 'vitest';
import { DEFAULT_LOCALE } from './config';
import {
  detectDashboardLocale,
  detectLocale,
  isSupportedLocale,
  localeFromHeader,
} from './detect-locale';

function requestStub(init: { cookie?: string; acceptLanguage?: string }): NextRequest {
  const headers = new Headers();
  if (init.cookie) headers.set('cookie', init.cookie);
  if (init.acceptLanguage) headers.set('accept-language', init.acceptLanguage);
  return new NextRequest('https://acme.skinsystem.test/', { headers });
}

describe('isSupportedLocale', () => {
  it('accepts a supported locale', () => {
    expect(isSupportedLocale('es')).toBe(true);
  });

  it('rejects an unsupported value, including undefined', () => {
    expect(isSupportedLocale('fr')).toBe(false);
    expect(isSupportedLocale(undefined)).toBe(false);
  });
});

describe('localeFromHeader', () => {
  it('returns each supported locale unchanged — pt/es/en, the exact values (dashboard)/layout.tsx and (auth)/layout.tsx set on <html lang>', () => {
    expect(localeFromHeader('pt')).toBe('pt');
    expect(localeFromHeader('es')).toBe('es');
    expect(localeFromHeader('en')).toBe('en');
  });

  it('falls back to DEFAULT_LOCALE when the header is missing or unsupported', () => {
    expect(localeFromHeader(null)).toBe(DEFAULT_LOCALE);
    expect(localeFromHeader('fr')).toBe(DEFAULT_LOCALE);
  });
});

describe('locale precedence: DASHBOARD_LOCALE > NEXT_LOCALE > Accept-Language > DEFAULT_LOCALE', () => {
  it('detectDashboardLocale resolves DASHBOARD_LOCALE first', () => {
    const request = requestStub({
      cookie: 'DASHBOARD_LOCALE=en; NEXT_LOCALE=es',
      acceptLanguage: 'pt-BR',
    });
    expect(detectDashboardLocale(request)).toBe('en');
  });

  it('detectLocale (public) resolves NEXT_LOCALE over Accept-Language', () => {
    const request = requestStub({ cookie: 'NEXT_LOCALE=es', acceptLanguage: 'pt-BR' });
    expect(detectLocale(request)).toBe('es');
  });

  it('detectDashboardLocale falls back to the public chain without DASHBOARD_LOCALE', () => {
    const request = requestStub({ cookie: 'NEXT_LOCALE=es', acceptLanguage: 'pt-BR' });
    expect(detectDashboardLocale(request)).toBe('es');
  });

  it('resolves Accept-Language when no locale cookie is present', () => {
    const request = requestStub({ acceptLanguage: 'pt-BR,en;q=0.9' });
    expect(detectLocale(request)).toBe('pt');
  });

  it('falls back to DEFAULT_LOCALE when nothing maps to a supported locale', () => {
    const request = requestStub({});
    expect(detectLocale(request)).toBe(DEFAULT_LOCALE);
  });
});
