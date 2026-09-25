'use server';
import 'server-only';

/**
 * @file invite-customer-activation.ts
 * @description Server Action shell for the staff-triggered activation invite
 *              (spec.md Req 4 scenario 3-4, design.md sec 5). Structurally
 *              mirrors `toggle-block-customer.ts` for the auth/org-resolution
 *              boilerplate; the invite eligibility rules and the OTP send
 *              itself are domain logic and live in
 *              `domains/customers/service.ts` (`inviteCustomerActivation`),
 *              not here.
 */
import { z }                  from 'zod';
import { eq }                  from 'drizzle-orm';
import { createServerClient } from '@supabase/ssr';
import { cookies, headers }   from 'next/headers';
import { getTranslations }    from 'next-intl/server';
import { db }                  from '@/infrastructure/db';
import { profiles }            from '@/infrastructure/db/schema/organizations';
import { inviteCustomerActivation } from '@/domains/customers/service';
import { localeFromHeader }    from '@/i18n/detect-locale';
import { buildTenantOrigin }   from '@/infrastructure/auth/resolve-redirect-url';
import type { Result }         from '@/shared/types/result';

async function getActionTranslations() {
  const hdrs = await headers();
  return getTranslations({ locale: localeFromHeader(hdrs.get('x-locale')), namespace: 'dashboard.customers.actions' });
}

const schema = z.object({ customerId: z.string().uuid() });

/** Maps the domain function's typed error code to a translated staff-facing message. */
const ERROR_KEY: Record<string, string> = {
  NOT_FOUND:      'customerNotFound',
  NO_EMAIL:       'inviteNoEmail',
  BLOCKED:        'inviteBlocked',
  ALREADY_ACTIVE: 'inviteAlreadyActive',
  RATE_LIMITED:   'inviteRateLimited',
  SEND_FAILED:    'inviteFailed',
};

export async function inviteCustomerActivationAction(
  customerId: string,
): Promise<Result<{ sent: true }>> {
  const t = await getActionTranslations();

  const parsed = schema.safeParse({ customerId });
  if (!parsed.success) return { data: null, error: { message: t('invalidInput'), code: 'INVALID_INPUT' } };

  const jar      = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    { cookies: { getAll: () => jar.getAll(), setAll: (pairs) => pairs.forEach(({ name, value, options }) => jar.set(name, value, options)) } },
  );

  const { data: { user }, error: authErr } = await supabase.auth.getUser();
  if (authErr || !user) return { data: null, error: { message: t('unauthorized'), code: 'UNAUTHORIZED' } };

  // RBAC: Owner and Staff both -- same "has a profiles row in this org" check
  // `toggle-block-customer.ts` uses. No new role gate: a staff member who can
  // already block, edit and delete a customer is not meaningfully escalated by
  // being able to email them a sign-in link (design.md sec 5.1).
  let orgId = user.user_metadata?.organization_id as string | undefined;
  if (!orgId) {
    const profileRows = await db.select({ organizationId: profiles.organizationId })
      .from(profiles).where(eq(profiles.id, user.id)).limit(1);
    orgId = profileRows[0]?.organizationId;
  }
  if (!orgId) return { data: null, error: { message: t('noOrganization'), code: 'UNAUTHORIZED' } };

  // The inviting staff member's OWN tenant, from the request -- never derived
  // from the customer row -- so the link can only land on the inviting
  // organization's subdomain (design.md sec 5.2).
  const slug = (await headers()).get('x-tenant-slug');
  if (!slug) return { data: null, error: { message: t('noOrganization'), code: 'UNAUTHORIZED' } };

  const result = await inviteCustomerActivation(
    orgId,
    parsed.data.customerId,
    `${buildTenantOrigin(slug)}/auth/confirm?next=/me`,
  );

  if (result.error) {
    const key = ERROR_KEY[result.error.code ?? ''] ?? 'inviteFailed';
    return { data: null, error: { message: t(key), code: result.error.code ?? 'SEND_FAILED' } };
  }

  return result;
}
