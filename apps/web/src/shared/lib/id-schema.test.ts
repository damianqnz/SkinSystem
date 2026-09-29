import { describe, expect, it } from 'vitest';
import { z } from 'zod';
import { idSchema } from './id-schema';

/** Ids as they exist in the migrations, with a version/variant nibble of 0. */
const SEEDED_ORG     = 'a1000000-0000-0000-0000-000000000001';
const SEEDED_PROFILE = 'b1000000-0000-0000-0000-000000000001';
/** As minted by `gen_random_uuid()`. */
const V4             = 'ca1fecef-badb-4685-9b40-1ea486a311c3';

describe('idSchema', () => {
  it('accepts the deterministic ids the migrations seed', () => {
    expect(idSchema.safeParse(SEEDED_ORG).success).toBe(true);
    expect(idSchema.safeParse(SEEDED_PROFILE).success).toBe(true);
  });

  it('accepts the v4 ids the app mints', () => {
    expect(idSchema.safeParse(V4).success).toBe(true);
  });

  it('still rejects anything that is not a uuid shape', () => {
    for (const garbage of ['', 'not-a-uuid', 'a1000000-0000-0000-0000', 'a1000000_0000_0000_0000_000000000001']) {
      expect(idSchema.safeParse(garbage).success).toBe(false);
    }
  });

  /**
   * Pins the reason this module exists. If a future Zod release loosens
   * `uuid()` again this assertion fails, which is the prompt to revisit the
   * comment in id-schema.ts rather than to silently delete this file.
   */
  it('documents that zod 4 uuid() rejects our seeded ids', () => {
    expect(z.uuid().safeParse(SEEDED_ORG).success).toBe(false);
    expect(z.string().uuid().safeParse(SEEDED_ORG).success).toBe(false);
  });
});
