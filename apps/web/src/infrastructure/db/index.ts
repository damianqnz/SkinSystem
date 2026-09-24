import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

/**
 * Singleton Drizzle client for server-side use.
 * Use the Supabase pooler URL (port 6543, Transaction mode) for serverless.
 * Use the direct URL (port 5432) for drizzle-kit studio/introspection.
 *
 * Required env vars:
 *   DATABASE_URL — Supabase pooler connection string
 *   (Settings → Database → Connection string → Transaction mode)
 */

const globalForDb = globalThis as unknown as {
  dbClient: postgres.Sql | undefined;
};

const client =
  globalForDb.dbClient ??
  postgres(process.env.DATABASE_URL!, {
    prepare: false, // Required for Supabase Transaction mode pooler
    max: 1, // One connection per serverless instance; the Supabase pooler multiplexes across instances
  });

// Reuse the client across warm serverless invocations and dev HMR reloads so a
// hot instance never opens a second pool on the shared pooler.
globalForDb.dbClient = client;

export const db = drizzle(client, { schema });
export type DB = typeof db;
