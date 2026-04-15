import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

/**
 * Supabase client for Server Components, Server Actions and Route Handlers.
 * Uses the async cookies() API required by Next.js 16.
 */
export async function createSupabaseServerClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            );
          } catch {
            // setAll called from a Server Component — cookies are read-only.
            // Session refresh is handled by the middleware.
          }
        },
      },
    },
  );
}
