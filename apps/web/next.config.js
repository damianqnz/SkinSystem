/** @type {import('next').NextConfig} */
const nextConfig = {
  cacheComponents: true,
  // Allow subdomains to receive HMR in local development
  allowedDevOrigins: [
    'lourdes.lvh.me',
    'gloria.lvh.me',
    'auth.lvh.me',
  ],
};

export default nextConfig;
