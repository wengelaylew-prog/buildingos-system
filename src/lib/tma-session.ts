import crypto from 'crypto';
import { db } from '../db/index.ts';
import { tmaSessions } from '../db/schema.ts';
import { eq } from 'drizzle-orm';

// Opaque, server-revocable session tokens for Tenant TMA email/phone logins.
// Only a SHA-256 hash of the token is ever persisted — the raw token exists only
// in the response body (once) and in the client's own memory/sessionStorage.
const SESSION_TTL_MS = 12 * 60 * 60 * 1000; // 12 hours

function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

export async function createTmaSession(userId: string, method: 'TELEGRAM' | 'EMAIL' | 'PHONE') {
  const token = crypto.randomBytes(32).toString('hex');
  const expiresAt = new Date(Date.now() + SESSION_TTL_MS);
  await db.insert(tmaSessions).values({
    userId,
    tokenHash: hashToken(token),
    method,
    expiresAt,
  });
  return { token, expiresAt };
}

export async function resolveTmaSession(token: string) {
  const row = (await db.select().from(tmaSessions).where(eq(tmaSessions.tokenHash, hashToken(token))))[0];
  if (!row) return null;
  if (row.revokedAt) return null;
  if (row.expiresAt.getTime() < Date.now()) return null;

  // Best-effort activity tracking; never block the request on this write.
  db.update(tmaSessions).set({ lastUsedAt: new Date() }).where(eq(tmaSessions.id, row.id)).catch(() => {});

  return row;
}

export async function revokeTmaSession(token: string): Promise<void> {
  await db.update(tmaSessions).set({ revokedAt: new Date() }).where(eq(tmaSessions.tokenHash, hashToken(token)));
}
