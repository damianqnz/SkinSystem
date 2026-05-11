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

/** @type {import('next').NextConfig} */
const nextConfig = {
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
};

export default withNextIntl(nextConfig);
