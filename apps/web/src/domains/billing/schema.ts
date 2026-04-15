/**
 * @domain billing
 * @description Public schema surface for the Billing domain.
 *
 * The `payments` table (from the booking infrastructure) is the canonical
 * financial record. This domain re-exports it under the Invoice concept
 * and adds Stripe Connect fiscal logic (VAT/NIF per organization).
 *
 * Fiscal isolation rule: each organization uses its own Stripe account.
 * FORBIDDEN to mix payment flows between organizations.
 *
 * organization_id is MANDATORY in every query — enforced by RLS + app layer.
 */

import { z } from 'zod';
import {
  payments,
  paymentSurcharges,
  type Payment,
  type PaymentSurcharge,
} from '@/infrastructure/db/schema/booking';
import { paymentStatusEnum } from '@/infrastructure/db/schema/enums';
import { organizations, type Organization } from '@/infrastructure/db/schema/organizations';

// ── Table references (Drizzle) ────────────────────────────────
export { payments, paymentSurcharges, organizations, paymentStatusEnum };

// ── Inferred types ────────────────────────────────────────────
export type { Payment, PaymentSurcharge, Organization };

/**
 * Invoice = canonical name for a Payment record within the Billing domain.
 * These are the same DB rows — the alias clarifies intent.
 */
export type Invoice    = Payment;
export type NewInvoice = Omit<Payment, 'id' | 'createdAt' | 'updatedAt'>;

// ── ENUM values ───────────────────────────────────────────────
export const PAYMENT_STATUS = [
  'pending',
  'succeeded',
  'failed',
  'refunded',
] as const;

export type PaymentStatus = (typeof PAYMENT_STATUS)[number];

// ── Zod validators ────────────────────────────────────────────

export const createInvoiceSchema = z.object({
  organizationId:        z.string().uuid(),
  appointmentId:         z.string().uuid(),
  stripePaymentIntentId: z.string().min(1),
  amountCents:           z.number().int().positive(),
  currency:              z.string().length(3).optional().default('eur'),
  status:                z.enum(PAYMENT_STATUS).optional().default('pending'),
});

export const updateInvoiceStatusSchema = z.object({
  status:  z.enum(PAYMENT_STATUS),
  paidAt:  z.coerce.date().nullable().optional(),
});

export type CreateInvoiceInput       = z.infer<typeof createInvoiceSchema>;
export type UpdateInvoiceStatusInput = z.infer<typeof updateInvoiceStatusSchema>;
