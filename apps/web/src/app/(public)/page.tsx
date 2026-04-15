import { headers } from 'next/headers';

/**
 * Public landing page.
 * Tenant identity is resolved server-side from the `x-tenant-slug` header
 * injected by middleware.ts — no URL params required.
 */
export default async function PublicHomePage() {
  const headersList = await headers();
  const tenantSlug = headersList.get('x-tenant-slug') ?? 'unknown';
  const locale = headersList.get('x-locale') ?? 'es';

  return (
    <main style={{ padding: '2rem', fontFamily: 'sans-serif' }}>
      <h1>SkinSystem</h1>
      <p>
        <strong>Tenant:</strong> {tenantSlug}
      </p>
      <p>
        <strong>Locale:</strong> {locale}
      </p>
    </main>
  );
}
