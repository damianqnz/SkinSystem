import 'server-only';

import { eq, and }         from 'drizzle-orm';
import { db }              from '@/infrastructure/db';
import { payments }        from './schema';
import { appointments }    from '@/domains/booking/schema';
import { catalogServices } from '@/domains/catalog/schema';
import { organizations }   from '@/infrastructure/db/schema/organizations';
import {
  getStripe,
  calcDepositAmount,
  calcApplicationFee,
} from '@/shared/lib/stripe';
import type { Result } from '@/shared/types/result';

// ── Types ─────────────────────────────────────────────────────

export type BookingSessionInput = {
  organizationId:    string;
  appointmentId:     string;
  serviceId:         string;
  customerEmail?:    string;
  customerName?:     string;
  /** Locale for Stripe's hosted page — "es", "pt", "en" */
  locale?:           string;
  successUrl:        string;
  cancelUrl:         string;
  /** Passed into Stripe metadata so webhook can release the Redis slot lock */
  slotStartISO?:     string;
  lockedBySession?:  string;
  /**
   * Override the computed deposit amount.
   * When provided, used directly instead of `priceCents * depositPercent / 100`.
   * Must already account for surcharges and coupons.
   */
  overrideAmountCents?: number;
};

export type BookingSessionResult = {
  checkoutUrl: string;
  sessionId:   string;
  amountCents: number;
};

// ── Helpers ───────────────────────────────────────────────────

const dbErr = (m: string): Result<never> =>
  ({ data: null, error: { message: m, code: 'DB_ERROR' } });

function resolveServiceName(nameI18n: unknown, locale = 'es'): string {
  if (!nameI18n || typeof nameI18n !== 'object') return 'Servicio';
  const o = nameI18n as Record<string, string>;
  return o[locale] ?? o['es'] ?? o['en'] ?? Object.values(o)[0] ?? 'Servicio';
}

// ── createBookingSession ──────────────────────────────────────

/**
 * Creates a Stripe Checkout Session for a booking deposit payment.
 *
 * Fiscal isolation guarantee:
 *   - `payment_intent_data.transfer_data.destination` = org's Stripe account
 *   - `payment_intent_data.application_fee_amount` = SkinSystem platform fee
 *   - If org has no Stripe account → returns error (never charges to platform)
 *
 * Amount charged = service.priceCents * service.depositPercent / 100
 */
export async function createBookingSession(
  input: BookingSessionInput,
): Promise<Result<BookingSessionResult>> {
  const stripe = getStripe();

  try {
    // ── 1. Fetch org Stripe account ────────────────────────
    const orgRows = await db
      .select({ stripeAccountId: organizations.stripeAccountId, name: organizations.name })
      .from(organizations)
      .where(eq(organizations.id, input.organizationId))
      .limit(1);

    const org = orgRows[0];
    if (!org) return { data: null, error: { message: 'Organization not found', code: 'NOT_FOUND' } };

    const isTestMode = process.env.STRIPE_SECRET_KEY?.startsWith('sk_test_') ?? false;

    // In production, a connected Stripe account is mandatory for fiscal isolation.
    // In test mode, allow a direct platform charge so the full flow can be tested
    // without completing Stripe Connect onboarding.
    if (!org.stripeAccountId && !isTestMode) {
      return { data: null, error: { message: 'Specialist has not connected Stripe', code: 'STRIPE_NOT_CONNECTED' } };
    }

    // ── 2. Fetch service pricing ───────────────────────────
    const svcRows = await db
      .select({
        nameI18n:       catalogServices.nameI18n,
        priceCents:     catalogServices.priceCents,
        currency:       catalogServices.currency,
        depositPercent: catalogServices.depositPercent,
      })
      .from(catalogServices)
      .where(and(
        eq(catalogServices.id, input.serviceId),
        eq(catalogServices.organizationId, input.organizationId),
      ))
      .limit(1);

    const svc = svcRows[0];
    if (!svc) return { data: null, error: { message: 'Service not found', code: 'NOT_FOUND' } };

    // Use override amount (surcharges + coupons already applied) or fall back to deposit calc
    const amountCents = input.overrideAmountCents !== undefined
      ? input.overrideAmountCents
      : calcDepositAmount(svc.priceCents, svc.depositPercent);

    const applicationFee = org.stripeAccountId ? calcApplicationFee(amountCents) : 0;
    const serviceName    = resolveServiceName(svc.nameI18n, input.locale ?? 'es');

    if (amountCents <= 0) {
      return { data: null, error: { message: 'Deposit amount is zero — no payment needed', code: 'ZERO_AMOUNT' } };
    }

    // ── 3. Create Stripe Checkout Session ─────────────────
    const stripeLocale = (input.locale === 'pt' ? 'pt' : input.locale === 'en' ? 'en' : 'es') as 'es' | 'pt' | 'en';

    // Build payment_intent_data — with or without Connect transfer
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const paymentIntentData: Record<string, any> = {
      metadata: {
        organizationId: input.organizationId,
        appointmentId:  input.appointmentId,
        serviceId:      input.serviceId,
      },
      ...(org.stripeAccountId ? {
        transfer_data:          { destination: org.stripeAccountId },
        application_fee_amount: applicationFee,
      } : {}),
    };

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      payment_method_types: ['card'],
      locale: stripeLocale,

      line_items: [{
        quantity: 1,
        price_data: {
          currency:     svc.currency.toLowerCase(),
          unit_amount:  amountCents,
          product_data: {
            name:        serviceName,
            description: amountCents < svc.priceCents
              ? `Pago parcial · Total ${(svc.priceCents / 100).toFixed(2)} ${svc.currency}`
              : undefined,
          },
        },
      }],

      payment_intent_data: paymentIntentData,

      customer_email: input.customerEmail,

      metadata: {
        organizationId:  input.organizationId,
        appointmentId:   input.appointmentId,
        serviceId:       input.serviceId,
        ...(input.slotStartISO    ? { slotStartISO:    input.slotStartISO    } : {}),
        ...(input.lockedBySession ? { lockedBySession: input.lockedBySession } : {}),
      },

      success_url: input.successUrl,
      cancel_url:  input.cancelUrl,
    });

    if (!session.url) {
      return { data: null, error: { message: 'Stripe did not return a checkout URL', code: 'STRIPE_ERROR' } };
    }

    return {
      data: { checkoutUrl: session.url, sessionId: session.id, amountCents },
      error: null,
    };
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Stripe error';
    return { data: null, error: { message: msg, code: 'STRIPE_ERROR' } };
  }
}

// ── Payment record helpers ─────────────────────────────────────

export async function createPaymentRecord(input: {
  organizationId:        string;
  appointmentId:         string;
  stripePaymentIntentId: string;
  amountCents:           number;
  currency:              string;
}): Promise<Result<{ id: string }>> {
  try {
    const rows = await db
      .insert(payments)
      .values({
        organizationId:        input.organizationId,
        appointmentId:         input.appointmentId,
        stripePaymentIntentId: input.stripePaymentIntentId,
        amountCents:           input.amountCents,
        currency:              input.currency.toLowerCase(),
        status:                'pending',
      })
      .returning({ id: payments.id });
    if (!rows[0]) return dbErr('Insert returned empty');
    return { data: { id: rows[0].id }, error: null };
  } catch {
    return dbErr('Failed to create payment record');
  }
}

export async function markPaymentSucceeded(
  stripePaymentIntentId: string,
  organizationId:        string,
): Promise<Result<{ id: string }>> {
  try {
    const rows = await db
      .update(payments)
      .set({ status: 'succeeded', paidAt: new Date(), updatedAt: new Date() })
      .where(and(
        eq(payments.stripePaymentIntentId, stripePaymentIntentId),
        eq(payments.organizationId, organizationId),
      ))
      .returning({ id: payments.id });
    if (!rows[0]) return dbErr('Payment record not found');
    return { data: { id: rows[0].id }, error: null };
  } catch {
    return dbErr('Failed to update payment status');
  }
}

export async function markPaymentFailed(
  stripePaymentIntentId: string,
  organizationId:        string,
): Promise<Result<{ id: string }>> {
  try {
    const rows = await db
      .update(payments)
      .set({ status: 'failed', updatedAt: new Date() })
      .where(and(
        eq(payments.stripePaymentIntentId, stripePaymentIntentId),
        eq(payments.organizationId, organizationId),
      ))
      .returning({ id: payments.id });
    if (!rows[0]) return dbErr('Payment record not found');
    return { data: { id: rows[0].id }, error: null };
  } catch {
    return dbErr('Failed to update payment status');
  }
}
