/** @type {import('next').NextConfig} */
const nextConfig = {
  // cacheComponents removed — incompatible with real-time multi-tenant data.
  // Dynamic pages (those calling headers/cookies) are already opt-out of
  // Next.js Full Route Cache without this flag.
  // Allow subdomains to receive HMR in local development
  allowedDevOrigins: [
    'lourdes.lvh.me',
    'gloria.lvh.me',
    'auth.lvh.me',
  ],
};

export default nextConfig;
