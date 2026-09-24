// cacheComponents removed — incompatible with real-time multi-tenant data.
// Dynamic pages (those calling headers/cookies) are already opt-out of
// Next.js Full Route Cache without this flag.

import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts');

if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
  throw new Error(
    'NEXT_PUBLIC_SUPABASE_URL is not set. ' +
    'Add it to .env.local (dev) or your hosting provider env vars (prod/staging).'
  );
}

const supabaseHostname = new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).hostname;

// ── Security headers (prod-hardening base) ────────────────────────────────
// CSP ships as Report-Only first: it surfaces violations without breaking the
// app while a nonce-based enforced policy is designed later. Two allowances are
// load-bearing and must NOT be dropped:
//   • 'unsafe-inline' — ConsumerShell injects a dynamic inline <style> + a FOUC
//     guard <script>; enforcing without a nonce would blank the consumer site.
//   • frame-src maps.google.com/www.google.com — MapSection embeds a Google
//     Maps <iframe>.
const isProd = process.env.NODE_ENV === 'production';
const supabaseOrigin = `https://${supabaseHostname}`;
const supabaseWs     = `wss://${supabaseHostname}`;
const csp = [
  "default-src 'self'",
  "base-uri 'self'",
  "object-src 'none'",
  "frame-ancestors 'none'",
  "form-action 'self' https://checkout.stripe.com",
  `script-src 'self' 'unsafe-inline'${isProd ? '' : " 'unsafe-eval'"}`,
  "style-src 'self' 'unsafe-inline'",
  `img-src 'self' data: blob: ${supabaseOrigin} https://lh3.googleusercontent.com`,
  "font-src 'self' data:",
  `connect-src 'self' ${supabaseOrigin} ${supabaseWs}`,
  "frame-src https://maps.google.com https://www.google.com",
  ...(isProd ? ["upgrade-insecure-requests"] : []),
].join('; ');
const securityHeaders = [
  { key: 'Content-Security-Policy-Report-Only', value: csp },
  { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains' },
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(), browsing-topics=()' },
];

/** @type {import('next').NextConfig} */
const nextConfig = {
  poweredByHeader: false,
  // Turbopack puts @react-pdf/renderer on its default externals list, then fails
  // to assign it a ModuleId while building the app-ssr chunk graph:
  //   ModuleId not found for ident: [externals]/@react-pdf/renderer [external]
  // `serverExternalPackages` does NOT help — it asks for the state that is
  // already broken. Transpiling bundles the package into the graph instead, so
  // there is no external id left to resolve. The two options are mutually
  // exclusive for the same package.
  //
  // Not an app-code bug: HomeCareGenerator is already 'use client' and already
  // imports the package through `dynamic(..., { ssr: false })`. That flag skips
  // SSR *rendering*, not the SSR *build graph*. Drop this once Turbopack fixes
  // the externals resolution (next 16.2.0, @react-pdf/renderer 3.4.5).
  transpilePackages: ['@react-pdf/renderer'],
  experimental: {
    serverActions: {
      // Must match UPLOAD_MAX_BYTES in src/shared/config/uploads.ts (5 * 1024 * 1024).
      // Cannot import that constant here (ESM config runs before the TS compiler).
      bodySizeLimit: '5mb',
    },
  },
  // Allow subdomains to receive HMR in local development
  allowedDevOrigins: [
    'lourdes.lvh.me',
    'gloria.lvh.me',
    'auth.lvh.me',
  ],
  images: {
    remotePatterns: [
      {
        // Supabase Storage — public buckets only (logo, avatars, gallery)
        protocol: 'https',
        hostname: supabaseHostname,
        pathname: '/storage/v1/object/public/**',
      },
      {
        // Google OAuth avatars (closes Phase 30 debt: lh3.googleusercontent.com whitelist)
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com',
        pathname: '/**',
      },
    ],
  },
  async headers() {
    return [{ source: '/:path*', headers: securityHeaders }];
  },
};

export default withNextIntl(nextConfig);
