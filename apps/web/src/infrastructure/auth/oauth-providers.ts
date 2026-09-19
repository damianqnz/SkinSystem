/**
 * @file oauth-providers.ts
 * @description Which OAuth providers the auth UI offers. Google is always on;
 *              Apple ships config-gated because it needs external setup
 *              (Apple Developer Program → Services ID, key, redirect URIs →
 *              Supabase Auth provider settings) that this app cannot verify.
 *
 * Pure — takes the env value as an argument instead of reading `process.env`
 * (same trade as `shared/lib/stripe-policy.ts`), so it is unit-testable with
 * no environment. The gate is an explicit boolean, not a sniffed Apple client
 * ID: the client ID and secret live in Supabase's dashboard, and this app must
 * not carry a config value it never uses.
 */

export type OAuthProvider = 'google' | 'apple';

/**
 * Google is always first; Apple is appended only when `appleEnabled` is
 * exactly the string `'true'` (no case-folding, no truthy coercion).
 */
export function resolveEnabledOAuthProviders(env: {
  appleEnabled: string | undefined;
}): readonly OAuthProvider[] {
  return env.appleEnabled === 'true' ? ['google', 'apple'] : ['google'];
}
