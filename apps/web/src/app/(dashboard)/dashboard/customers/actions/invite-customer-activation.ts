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
import { headers }            from 'next/headers';
import { getTranslations }    from 'next-intl/server';
import { resolveTenantOrgId } from '@/shared/lib/resolve-tenant-org-id';
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

  // RBAC: Owner + Staff (STAFF_ROLES). Unlike the old manual getUser + metadata
  // read, resolveTenantOrgId() re-checks profiles.isActive and role on every
  // call, so a deactivated or role-changed staff member can no longer invoke
  // this action mid-session (AUTH-01). No new role gate: a staff member who can
  // already block, edit and delete a customer is not meaningfully escalated by
  // being able to email them a sign-in link (design.md sec 5.1).
  const auth = await resolveTenantOrgId();
  if ('error' in auth) return { data: null, error: { message: auth.error, code: auth.code } };

  // The inviting staff member's OWN tenant, from the request -- never derived
  // from the customer row -- so the link can only land on the inviting
  // organization's subdomain (design.md sec 5.2). resolveTenantOrgId() validates
  // x-tenant-slug internally but does not return it, so we still read it here to
  // build the OTP redirect origin.
  const slug = (await headers()).get('x-tenant-slug');
  if (!slug) return { data: null, error: { message: t('noOrganization'), code: 'UNAUTHORIZED' } };

  const result = await inviteCustomerActivation(
    auth.orgId,
    parsed.data.customerId,
    `${buildTenantOrigin(slug)}/auth/confirm?next=/me`,
  );

  if (result.error) {
    const key = ERROR_KEY[result.error.code ?? ''] ?? 'inviteFailed';
    return { data: null, error: { message: t(key), code: result.error.code ?? 'SEND_FAILED' } };
  }

  return result;
}
