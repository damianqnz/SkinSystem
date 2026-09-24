import { NextResponse } from 'next/server';
import { sql } from 'drizzle-orm';
import { db } from '@/infrastructure/db';

export const runtime = 'nodejs';        // postgres.js is not edge-safe
export const dynamic = 'force-dynamic'; // never cache a health probe

export async function GET() {
  try {
    await db.execute(sql`select 1`);
    return NextResponse.json({ status: 'ok', db: 'up' }, { status: 200 });
  } catch {
    return NextResponse.json({ status: 'degraded', db: 'down' }, { status: 503 });
  }
}
