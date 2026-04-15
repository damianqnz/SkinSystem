'use client';

import {
  createContext,
  useContext,
  type ReactNode,
} from 'react';

// ── Types ─────────────────────────────────────────────────────

interface TenantContextValue {
  /** Slug extracted from the subdomain (e.g. "lourdes", "gloria"). */
  tenantSlug: string;
  /** Active locale for this session. */
  locale: string;
}

// ── Context ───────────────────────────────────────────────────

const TenantContext = createContext<TenantContextValue | null>(null);

// ── Provider ──────────────────────────────────────────────────

/**
 * TenantProvider (Client Component).
 *
 * Hydrated once by the Server Component layout that reads the
 * `x-tenant-slug` and `x-locale` headers injected by middleware.ts.
 * Client Components consume `useTenantContext()` — never the URL.
 */
export function TenantProvider({
  tenantSlug,
  locale,
  children,
}: TenantContextValue & { children: ReactNode }) {
  return (
    <TenantContext.Provider value={{ tenantSlug, locale }}>
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
