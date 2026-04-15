import 'server-only';

import { Redis } from '@upstash/redis';

// ── Singleton ─────────────────────────────────────────────────
// Lazy init so build-time imports don't fail when env vars are absent.
let _redis: Redis | null = null;

function getRedis(): Redis {
  if (!_redis) {
    const url   = process.env.UPSTASH_REDIS_REST_URL;
    const token = process.env.UPSTASH_REDIS_REST_TOKEN;
    if (!url || !token) {
      throw new Error(
        'Missing UPSTASH_REDIS_REST_URL or UPSTASH_REDIS_REST_TOKEN — add them to .env.local'
      );
    }
    _redis = new Redis({ url, token });
  }
  return _redis;
}

// ── Key helpers ───────────────────────────────────────────────

/**
 * Canonical key format: `slot:{orgId}:{YYYY-MM-DD}:{startISO}:{serviceId}`
 *
 * Including serviceId allows multi-room/multi-specialist orgs to have
 * simultaneous locks on different services at the same time.
 */
export function buildSlotKey(
  orgId:     string,
  date:      string,   // "YYYY-MM-DD"
  startISO:  string,   // ISO 8601 start time of slot
  serviceId: string,
): string {
  return `slot:${orgId}:${date}:${startISO}:${serviceId}`;
}

/** Extract the slot start ISO from a full key (for display purposes). */
export function parseSlotKeyDate(key: string): string {
  // slot:{orgId}:{date}:{startISO}:{serviceId}
  const parts = key.split(':');
  return parts[3] ?? '';
}

// ── Core operations ───────────────────────────────────────────

/**
 * Atomically acquire a slot lock.
 * Uses `SET key value NX EX ttl` — atomic in Redis, guarantees
 * only ONE session can acquire the lock (race-condition safe).
 *
 * @returns true if lock acquired, false if slot is already locked.
 */
export async function lockSlot(
  key:        string,
  sessionId:  string,
  ttlSeconds: number = 300,   // 5-minute default per WF-01
): Promise<boolean> {
  const result = await getRedis().set(key, sessionId, { nx: true, ex: ttlSeconds });
  return result === 'OK';
}

/**
 * Release a lock — but ONLY if owned by the caller.
 * Lua script runs as a single atomic operation on the Redis server,
 * preventing TOCTOU between GET and DEL.
 */
export async function unlockSlot(
  key:       string,
  sessionId: string,
): Promise<boolean> {
  const result = await getRedis().eval(
    // language=lua
    `if redis.call('get',KEYS[1])==ARGV[1] then
       return redis.call('del',KEYS[1])
     else
       return 0
     end`,
    [key],
    [sessionId],
  ) as number;
  return result === 1;
}

/**
 * Returns the session ID that currently holds the lock, or null.
 */
export async function getSlotOwner(key: string): Promise<string | null> {
  return getRedis().get<string>(key);
}

/**
 * Returns remaining TTL in seconds for a locked slot.
 * -2 = key doesn't exist, -1 = no TTL (should never happen).
 */
export async function getSlotTTL(key: string): Promise<number> {
  return getRedis().ttl(key);
}

/**
 * Scan all locked slot keys for a given org + calendar date.
 * Uses cursor-based SCAN (non-blocking, Redis-safe).
 *
 * Pattern: `slot:{orgId}:{date}:*`
 */
export async function getLockedSlotKeys(
  orgId: string,
  date:  string,   // "YYYY-MM-DD"
): Promise<string[]> {
  const redis   = getRedis();
  const pattern = `slot:${orgId}:${date}:*`;
  const keys: string[] = [];
  let cursor = 0;

  do {
    const [next, batch] = await redis.scan(cursor, { match: pattern, count: 100 });
    cursor = Number(next);
    keys.push(...(batch as string[]));
  } while (cursor !== 0);

  return keys;
}

/**
 * Batch-check multiple slot keys in a single round trip (MGET pipeline).
 * Returns a Map<key, sessionId | null>.
 */
export async function checkSlotLocks(
  keys: string[],
): Promise<Map<string, string | null>> {
  if (keys.length === 0) return new Map();
  const values = await getRedis().mget<(string | null)[]>(...keys);
  const result = new Map<string, string | null>();
  keys.forEach((k, i) => result.set(k, values[i] ?? null));
  return result;
}

/**
 * Extend the TTL of an existing lock (heartbeat pattern).
 * Only extends if the slot is already locked — does not create a new lock.
 */
export async function renewSlotLock(
  key:        string,
  sessionId:  string,
  ttlSeconds: number = 300,
): Promise<boolean> {
  // Only extend if this session still owns it
  const owner = await getSlotOwner(key);
  if (owner !== sessionId) return false;
  await getRedis().expire(key, ttlSeconds);
  return true;
}
