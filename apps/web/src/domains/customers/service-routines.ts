import 'server-only';

import { eq, and, desc } from 'drizzle-orm';
import { db } from '@/infrastructure/db';
import { customerRoutines } from '@/infrastructure/db/schema/routines';
import type { Result } from '@/shared/types/result';
import { z } from 'zod';

// ── Zod schemas (re-exported for Server Action) ───────────────

export const routineStepSchema = z.object({
  productName: z.string().min(1).max(100),
  instruction: z.string().min(1).max(200),
});

export const saveRoutineSchema = z.object({
  customerId:      z.string().uuid(),
  organizationId:  z.string().uuid(),
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

/** Persist a new Home Care routine. Returns the new row id. */
export async function saveCustomerRoutine(
  input: SaveRoutineInput,
  createdByProfileId: string,
): Promise<Result<{ id: string }>> {
  try {
    const rows = await db
      .insert(customerRoutines)
      .values({
        organizationId:    input.organizationId,
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
