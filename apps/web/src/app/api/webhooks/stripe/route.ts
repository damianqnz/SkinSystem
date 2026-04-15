/**
 * POST /api/webhooks/stripe
 *
 * ── SECURITY CONTRACT ────────────────────────────────────────
 * 1. Raw body read BEFORE any JSON parsing — required by Stripe's
 *    signature verification (constructEvent needs raw bytes).
 * 2. Signature validated with STRIPE_WEBHOOK_SECRET before ANY
 *    business logic runs. Unauthenticated requests → 400.
 * 3. Organization ID always read from event.metadata — never from
 *    untrusted client input.
 * 4. All DB operations are tenant-isolated (organizationId filter).
 * 5. Redis locks released only after DB is confirmed updated.
 *
 * ── Handled events ───────────────────────────────────────────
 *   checkout.session.completed  → mark appointment confirmed + payment succeeded
 *   payment_intent.payment_failed → mark payment failed
 *   account.updated             → mark org as stripe-onboarded
 */

import { NextRequest, NextResponse } from 'next/server';
import type Stripe from 'stripe';
import { getStripe }           from '@/shared/lib/stripe';
import {
  createPaymentRecord,
  markPaymentSucceeded,
  markPaymentFailed,
} from '@/domains/billing/service';
import { markStripeOnboarded }   from '@/domains/organizations/service';
import { buildSlotKey, unlockSlot } from '@/shared/lib/redis-lock';
import { db }                    from '@/infrastructure/db';
import { appointments }          from '@/domains/booking/schema';
import { organizations }         from '@/infrastructure/db/schema/organizations';
import { eq, and }               from 'drizzle-orm';

// ── Helpers ───────────────────────────────────────────────────

function respond(body: object, status = 200) {
  return NextResponse.json(body, { status });
}

function orgIdFromMetadata(meta: Stripe.Metadata | null): string | null {
  return meta?.organizationId ?? null;
}

function appointmentIdFromMetadata(meta: Stripe.Metadata | null): string | null {
  return meta?.appointmentId ?? null;
}

// ── Route handler ─────────────────────────────────────────────

export async function POST(req: NextRequest) {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) {
    console.error('[stripe webhook] STRIPE_WEBHOOK_SECRET not set');
    return respond({ error: 'Server configuration error' }, 500);
  }

  // ── 1. Read raw body (MUST be text — not parsed JSON) ─────
  const rawBody = await req.text();
  const sig     = req.headers.get('stripe-signature');

  if (!sig) {
    return respond({ error: 'Missing stripe-signature header' }, 400);
  }

  // ── 2. Verify signature (rejects spoofed payloads) ────────
  let event: Stripe.Event;
  try {
    event = getStripe().webhooks.constructEvent(rawBody, sig, webhookSecret);
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Signature verification failed';
    console.error('[stripe webhook] Invalid signature:', msg);
    return respond({ error: `Webhook signature invalid: ${msg}` }, 400);
  }

  // ── 3. Dispatch by event type ──────────────────────────────
  try {
    switch (event.type) {

      // ── checkout.session.completed ───────────────────────
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        await handleCheckoutCompleted(session);
        break;
      }

      // ── payment_intent.payment_failed ────────────────────
      case 'payment_intent.payment_failed': {
        const pi = event.data.object as Stripe.PaymentIntent;
        await handlePaymentFailed(pi);
        break;
      }

      // ── account.updated ──────────────────────────────────
      // Fires when a connected account completes Stripe onboarding
      case 'account.updated': {
        const account = event.data.object as Stripe.Account;
        await handleAccountUpdated(account);
        break;
      }

      default:
        // Acknowledge unhandled events without processing
        break;
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Handler error';
    console.error(`[stripe webhook] Error handling ${event.type}:`, msg);
    // Return 200 to prevent Stripe from retrying a permanent error
    return respond({ received: true, warning: msg });
  }

  return respond({ received: true });
}

// ── Event handlers ────────────────────────────────────────────

/**
 * checkout.session.completed
 *
 * Flow:
 *   1. Extract orgId + appointmentId from metadata
 *   2. Create/update payment record
 *   3. Confirm appointment (pending → confirmed)
 *   4. Release Redis slot lock (if any)
 */
async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  const meta          = session.metadata;
  const orgId         = orgIdFromMetadata(meta);
  const appointmentId = appointmentIdFromMetadata(meta);

  if (!orgId || !appointmentId) {
    console.warn('[stripe webhook] checkout.session.completed — missing metadata', meta);
    return;
  }

  const paymentIntentId = typeof session.payment_intent === 'string'
    ? session.payment_intent
    : session.payment_intent?.id ?? '';

  const currency    = session.currency ?? 'eur';
  const amountTotal = session.amount_total ?? 0;

  // Create payment record (idempotent — ignore duplicate key)
  await createPaymentRecord({
    organizationId:        orgId,
    appointmentId,
    stripePaymentIntentId: paymentIntentId,
    amountCents:           amountTotal,
    currency,
  }).catch((e) => console.warn('[stripe webhook] createPaymentRecord:', e));

  // Mark payment as succeeded
  if (paymentIntentId) {
    await markPaymentSucceeded(paymentIntentId, orgId);
  }

  // Confirm appointment
  await db
    .update(appointments)
    .set({ status: 'confirmed', updatedAt: new Date() })
    .where(and(
      eq(appointments.id, appointmentId),
      eq(appointments.organizationId, orgId),
    ));

  // Release Redis slot lock (best-effort — don't fail if Redis is down)
  const serviceId  = meta?.serviceId;
  const startAtISO = meta?.slotStartISO;
  const sessionId  = meta?.lockedBySession;
  if (serviceId && startAtISO && sessionId) {
    const date = startAtISO.slice(0, 10);
    const key  = buildSlotKey(orgId, date, startAtISO, serviceId);
    await unlockSlot(key, sessionId).catch(() => null);
  }

  console.info(`[stripe webhook] appointment ${appointmentId} confirmed (payment: ${paymentIntentId})`);
}

/**
 * payment_intent.payment_failed
 *
 * Marks the payment as failed in DB. Appointment stays pending.
 */
async function handlePaymentFailed(pi: Stripe.PaymentIntent) {
  const orgId = orgIdFromMetadata(pi.metadata);
  if (!orgId) return;

  await markPaymentFailed(pi.id, orgId);
  console.info(`[stripe webhook] payment_intent ${pi.id} failed`);
}

/**
 * account.updated
 *
 * Fires after Stripe onboarding. When `details_submitted = true`,
 * the specialist can receive payments — mark them as onboarded.
 */
async function handleAccountUpdated(account: Stripe.Account) {
  if (!account.details_submitted) return;

  // Find the org that owns this Stripe account
  const rows = await db
    .select({ id: organizations.id })
    .from(organizations)
    .where(eq(organizations.stripeAccountId, account.id))
    .limit(1);

  if (!rows[0]) {
    console.warn(`[stripe webhook] account.updated — no org found for Stripe account ${account.id}`);
    return;
  }

  await markStripeOnboarded(rows[0].id, true);
  console.info(`[stripe webhook] org ${rows[0].id} marked as Stripe-onboarded`);
}
