import type { Config } from 'drizzle-kit';

export default {
  schema: './src/infrastructure/db/schema/index.ts',
  // Migrations are managed via Supabase MCP — drizzle-kit is used
  // for type generation and studio only. Do NOT run drizzle-kit push/migrate.
  out: './supabase/drizzle-migrations',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
} satisfies Config;
