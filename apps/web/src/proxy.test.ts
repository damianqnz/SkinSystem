/**
 * @file proxy.test.ts
 * @description Header-forgery regression suite for `proxy()`. Proves the
 *              PR #7 fix holds: attacker-supplied `x-tenant-slug`/`x-locale`
 *              request headers never survive into the forwarded request.
 *              `apps/web/src/proxy.ts` itself is UNCHANGED — the seam is a
 *              `vi.mock` on the Supabase middleware client (design D1), not
 *              an extraction, per the red line in `CLAUDE.md`.
 */
import type { NextResponse } from 'next/server';
import { NextRequest } from 'next/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { proxy } from './proxy';

const { getUser } = vi.hoisted(() => ({
  getUser: vi.fn<() => Promise<{ data: { user: { id: string } | null } }>>(),
}));

vi.mock('@/infrastructure/supabase/middleware-client', () => ({
  createSupabaseMiddlewareClient: () => ({ auth: { getUser } }),
}));

beforeEach(() => {
  getUser.mockReset();
  getUser.mockResolvedValue({ data: { user: null } });
});

function buildRequest(
  host: string,
  init: { xTenantSlug?: string; xLocale?: string; acceptLanguage?: string } = {},
): NextRequest {
  const headers = new Headers({ host });
  if (init.xTenantSlug) headers.set('x-tenant-slug', init.xTenantSlug);
  if (init.xLocale) headers.set('x-locale', init.xLocale);
  if (init.acceptLanguage) headers.set('accept-language', init.acceptLanguage);
  return new NextRequest(`https://${host}/`, { headers });
}

/** Reads back a forwarded REQUEST header Next.js encodes onto the response. */
function forwarded(res: NextResponse, name: string): string | null {
  return res.headers.get(`x-middleware-request-${name}`);
}

describe('proxy() header-forgery regression', () => {
  it('discards a forged x-tenant-slug on the apex host (no host-derived tenant)', async () => {
    const res = await proxy(buildRequest('skinsystem.test', { xTenantSlug: 'victim' }));
    expect(forwarded(res, 'x-tenant-slug')).toBeNull();
    expect(res.headers.get('x-middleware-override-headers')).not.toBeNull();
  });

  it('overrides a forged x-tenant-slug with the host-derived tenant', async () => {
    const res = await proxy(
      buildRequest('lourdes.skinsystem.test', { xTenantSlug: 'victim' }),
    );
    expect(forwarded(res, 'x-tenant-slug')).toBe('lourdes');
    expect(res.headers.get('x-middleware-override-headers')).not.toBeNull();
  });

  it('overrides a forged x-locale with the resolved locale from Accept-Language', async () => {
    const res = await proxy(
      buildRequest('skinsystem.test', { xLocale: 'en', acceptLanguage: 'pt-BR' }),
    );
    expect(forwarded(res, 'x-locale')).toBe('pt');
    expect(res.headers.get('x-middleware-override-headers')).not.toBeNull();
  });

  it('guard: x-middleware-override-headers is present so a forwarding-mechanism change fails loudly', async () => {
    // Tenant host so both x-tenant-slug and x-locale are set (case 1's apex
    // host never sets x-tenant-slug at all — that absence is itself correct).
    const res = await proxy(buildRequest('lourdes.skinsystem.test'));
    const overridden = res.headers.get('x-middleware-override-headers');
    expect(overridden).not.toBeNull();
    expect(overridden).toContain('x-tenant-slug');
    expect(overridden).toContain('x-locale');
  });
});
