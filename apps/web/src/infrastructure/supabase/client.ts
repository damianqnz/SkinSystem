'use client';

import { createBrowserClient } from '@supabase/ssr';

/**
 * Supabase client for Client Components.
 * Instantiate once per render — do not store in module scope.
 */
export function createSupabaseClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
  );
}
