import { z } from 'zod';

/**
 * The id validator every schema in this app must use.
 *
 * WHY NOT `z.uuid()` / `z.string().uuid()`: Zod 4 tightened `uuid()` to the
 * full RFC 9562 pattern, which requires a version nibble of `[1-8]` and a
 * variant nibble of `[89ab]`. The identifiers this project seeds from its
 * migrations do not satisfy that: organizations are `a1000000-…` and profiles
 * (which must mirror `auth.users.id`) are `b1000000-…`, both with version `0`
 * and variant `0`. Those values are UUID-shaped, hex, and 8-4-4-4-12 long —
 * they are simply not version-stamped.
 *
 * The consequence is not theoretical. With `z.string().uuid()`, every schema
 * field holding an `organizationId` rejected the real tenant, so
 * `activateCustomerIdentity` returned INVALID_INPUT and customer activation
 * never linked a row, while create-service/create-category in the dashboard
 * failed with "invalid data". Nothing ever wrote through those paths.
 *
 * `z.guid()` validates the shape only, so it accepts both the deterministic
 * seeded ids and the `gen_random_uuid()` v4 ids the app mints.
 *
 * DO NOT tighten this back to `uuid()`. Nothing here depends on the version
 * bits — ids are validated for shape before reaching the database, never as a
 * security boundary — so the version check only ever rejects our own data.
 */
export const idSchema = z.guid();
