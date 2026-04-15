import { headers } from 'next/headers';

export default async function TenantHomePage({
  params,
}: {
  params: Promise<{ tenant: string; locale: string }>;
}) {
  const { tenant, locale } = await params;
  const headersList = await headers();
  const tenantSlug = headersList.get('x-tenant-slug') ?? tenant;

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
