'use client';

import { createContext, useContext, type ReactNode } from 'react';
import type { UserRole } from '@/shared/lib/resolve-tenant-org-id';

// ── Types ─────────────────────────────────────────────────────

interface TenantContextValue {
  /** Slug extracted from the subdomain (e.g. "lourdes", "gloria"). */
  tenantSlug: string;
  /** Active locale for this session. */
  locale: string;
  /** Authenticated staff user's ID in this tenant (null on public routes). */
  userId: string | null;
  /** Resolved role for this tenant (null on public routes). */
  role: UserRole | null;
}

// ── Context ───────────────────────────────────────────────────

const TenantContext = createContext<TenantContextValue | null>(null);

// ── Provider ──────────────────────────────────────────────────

/**
 * TenantProvider (Client Component).
 *
 * Hydrated once by the Server Component layout that reads the
 * `x-tenant-slug` and `x-locale` headers injected by proxy.ts and the
 * staff identity resolved via `resolveTenantOrgId()`.
 *
 * Client Components consume `useTenantContext()` — never the URL — and
 * may use `role` for fine-grained RBAC (owner-only buttons, etc.) without
 * a round-trip to the server.
 */
export function TenantProvider({
  tenantSlug,
  locale,
  userId  = null,
  role    = null,
  children,
}: Partial<TenantContextValue> &
   Pick<TenantContextValue, 'tenantSlug' | 'locale'> &
   { children: ReactNode }) {
  return (
    <TenantContext.Provider value={{ tenantSlug, locale, userId, role }}>
      {children}
    </TenantContext.Provider>
  );
}

// ── Hook ──────────────────────────────────────────────────────

export function useTenantContext(): TenantContextValue {
  const ctx = useContext(TenantContext);
  if (!ctx) {
    throw new Error('useTenantContext must be used within <TenantProvider>');
  }
  return ctx;
}
