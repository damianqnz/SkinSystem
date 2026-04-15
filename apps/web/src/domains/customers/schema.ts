/**
 * @domain customers
 * @description Public schema surface for the Customers domain.
 *
 * Single Source of Truth: table definitions live in `@/infrastructure/db/schema/customers`.
 * This file re-exports what the domain needs and adds Zod validators for Server Actions.
 *
 * organization_id is MANDATORY in every query — enforced by RLS + app layer.
 */

import { z } from 'zod';
import {
  customers,
  customerOnboarding,
  customerSkinProfile,
  type Customer,
  type NewCustomer,
  type CustomerOnboarding,
  type CustomerSkinProfile,
} from '@/infrastructure/db/schema/customers';

// ── Table references (Drizzle) ────────────────────────────────
export { customers, customerOnboarding, customerSkinProfile };

// ── Inferred types ────────────────────────────────────────────
export type {
  Customer,
  NewCustomer,
  CustomerOnboarding,
  CustomerSkinProfile,
};

// Short domain aliases
export type SelectCustomer = Customer;
export type InsertCustomer = NewCustomer;

// ── Zod validators ────────────────────────────────────────────

export const createCustomerSchema = z.object({
  organizationId: z.string().uuid(),
  fullName:       z.string().min(2).max(120),
  phone:          z.string().max(30).nullable().optional(),
  email:          z.string().email().nullable().optional(),
  isGuest:        z.boolean().optional().default(false),
  notes:          z.string().max(1000).nullable().optional(),
});

export const updateCustomerSchema = createCustomerSchema
  .omit({ organizationId: true })
  .partial();

export type CreateCustomerInput = z.infer<typeof createCustomerSchema>;
export type UpdateCustomerInput = z.infer<typeof updateCustomerSchema>;
