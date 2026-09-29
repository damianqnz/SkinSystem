import 'server-only';

import { eq, and, desc } from 'drizzle-orm';
import { db } from '@/infrastructure/db';
import { customerRoutines } from '@/infrastructure/db/schema/routines';
import { customers } from '@/infrastructure/db/schema/customers';
import type { Result } from '@/shared/types/result';
import { z } from 'zod';
import { idSchema } from '@/shared/lib/id-schema';

// ── Zod schemas (re-exported for Server Action) ───────────────

export const routineStepSchema = z.object({
  productName: z.string().min(1).max(100),
  instruction: z.string().min(1).max(200),
});

// No organizationId: the tenant is the caller's membership, resolved server-side.
export const saveRoutineSchema = z.object({
  customerId:      idSchema,
  locale:          z.enum(['es', 'pt', 'en']),
  title:           z.string().min(1).max(120),
  morningSteps:    z.array(routineStepSchema).max(8),
  afternoonSteps:  z.array(routineStepSchema).max(8),
  nightSteps:      z.array(routineStepSchema).max(8),
  specialistNotes: z.string().max(600).optional(),
});

export type SaveRoutineInput = z.infer<typeof saveRoutineSchema>;
export type RoutineStep      = z.infer<typeof routineStepSchema>;

// ── Helper ────────────────────────────────────────────────────

const dbErr = (m: string): Result<never> =>
  ({ data: null, error: { message: m, code: 'DB_ERROR' } });

// ── Services ──────────────────────────────────────────────────

/**
 * Persist a new Home Care routine. Returns the new row id.
 * NOT_FOUND when the customer is not in `organizationId`: the FK alone only
 * proves the customer exists in some tenant.
 */
export async function saveCustomerRoutine(
  input: SaveRoutineInput,
  organizationId: string,
  createdByProfileId: string,
): Promise<Result<{ id: string }>> {
  try {
    const [customer] = await db
      .select({ id: customers.id })
      .from(customers)
      .where(and(eq(customers.id, input.customerId), eq(customers.organizationId, organizationId)))
      .limit(1);
    if (!customer) return { data: null, error: { message: 'Customer not in organization', code: 'NOT_FOUND' } };

    const rows = await db
      .insert(customerRoutines)
      .values({
        organizationId,
        customerId:        input.customerId,
        createdByProfileId,
        locale:            input.locale,
        title:             input.title,
        morningSteps:      input.morningSteps,
        afternoonSteps:    input.afternoonSteps,
        nightSteps:        input.nightSteps,
        specialistNotes:   input.specialistNotes ?? null,
      })
      .returning({ id: customerRoutines.id });
    if (!rows[0]) return dbErr('Insert returned empty');
    return { data: { id: rows[0].id }, error: null };
  } catch {
    return dbErr('Failed to save routine');
  }
}

/** Latest routines for a customer — used in patient history. */
export async function getCustomerRoutines(
  customerId: string,
  organizationId: string,
): Promise<Result<typeof customerRoutines.$inferSelect[]>> {
  try {
    const data = await db
      .select()
      .from(customerRoutines)
      .where(and(
        eq(customerRoutines.customerId, customerId),
        eq(customerRoutines.organizationId, organizationId),
      ))
      .orderBy(desc(customerRoutines.createdAt))
      .limit(20);
    return { data, error: null };
  } catch {
    return dbErr('Failed to fetch routines');
  }
}
