/**
 * Lucia-style session management.
 *
 * Implements the Lucia v3 reference pattern (see
 * https://lucia-auth.com/sessions/basic-api/) using @oslojs primitives.
 * We avoid importing the Lucia npm package directly because Lucia is
 * intentionally distributed as a copy-paste reference; this gives us
 * a smaller, edge-friendly footprint and lets us keep all session
 * storage in Neon Postgres via Drizzle.
 */
import {
  encodeBase32LowerCaseNoPadding,
  encodeHexLowerCase,
} from "@oslojs/encoding";
import { sha256 } from "@oslojs/crypto/sha2";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { sessionTable, userTable, type DbSession, type DbUser } from "@/lib/db/schema";

const SESSION_TTL_MS = 1000 * 60 * 60 * 24 * 30; // 30 days
const SESSION_RENEW_THRESHOLD_MS = 1000 * 60 * 60 * 24 * 15; // 15 days

export const SESSION_COOKIE_NAME = "rocketeerio_session";

export function generateSessionToken(): string {
  const bytes = new Uint8Array(20);
  crypto.getRandomValues(bytes);
  return encodeBase32LowerCaseNoPadding(bytes);
}

function tokenToSessionId(token: string): string {
  return encodeHexLowerCase(sha256(new TextEncoder().encode(token)));
}

export async function createSession(
  token: string,
  userId: string,
): Promise<DbSession> {
  const sessionId = tokenToSessionId(token);
  const session: DbSession = {
    id: sessionId,
    userId,
    expiresAt: new Date(Date.now() + SESSION_TTL_MS),
  };
  await db.insert(sessionTable).values(session);
  return session;
}

export type ValidatedSession =
  | { session: DbSession; user: DbUser }
  | { session: null; user: null };

export async function validateSessionToken(
  token: string,
): Promise<ValidatedSession> {
  const sessionId = tokenToSessionId(token);
  const rows = await db
    .select({ user: userTable, session: sessionTable })
    .from(sessionTable)
    .innerJoin(userTable, eq(sessionTable.userId, userTable.id))
    .where(eq(sessionTable.id, sessionId))
    .limit(1);

  if (rows.length === 0) return { session: null, user: null };
  const { user, session } = rows[0];

  if (Date.now() >= session.expiresAt.getTime()) {
    await db.delete(sessionTable).where(eq(sessionTable.id, session.id));
    return { session: null, user: null };
  }

  // Sliding renewal.
  if (
    Date.now() >=
    session.expiresAt.getTime() - SESSION_RENEW_THRESHOLD_MS
  ) {
    const newExpiresAt = new Date(Date.now() + SESSION_TTL_MS);
    await db
      .update(sessionTable)
      .set({ expiresAt: newExpiresAt })
      .where(eq(sessionTable.id, session.id));
    session.expiresAt = newExpiresAt;
  }

  return { session, user };
}

export async function invalidateSession(sessionId: string): Promise<void> {
  await db.delete(sessionTable).where(eq(sessionTable.id, sessionId));
}

export async function invalidateUserSessions(userId: string): Promise<void> {
  await db.delete(sessionTable).where(eq(sessionTable.userId, userId));
}
