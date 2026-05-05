import { and, eq, lt } from "drizzle-orm";
import { db } from "@/lib/db";
import { oauthStateTable } from "@/lib/db/schema";

const STATE_TTL_MS = 1000 * 60 * 10; // 10 minutes

export type OAuthPurpose = "login" | "connect_pages";

export interface PersistedOAuthState {
  state: string;
  purpose: OAuthPurpose;
  userId: string | null;
  redirectTo: string | null;
}

function randomState(): string {
  const bytes = new Uint8Array(24);
  crypto.getRandomValues(bytes);
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export async function createOAuthState(input: {
  purpose: OAuthPurpose;
  userId?: string | null;
  redirectTo?: string | null;
}): Promise<string> {
  const state = randomState();
  await db.insert(oauthStateTable).values({
    state,
    purpose: input.purpose,
    userId: input.userId ?? null,
    redirectTo: input.redirectTo ?? null,
    expiresAt: new Date(Date.now() + STATE_TTL_MS),
  });
  return state;
}

export async function consumeOAuthState(
  state: string,
): Promise<PersistedOAuthState | null> {
  const rows = await db
    .select()
    .from(oauthStateTable)
    .where(eq(oauthStateTable.state, state))
    .limit(1);
  if (rows.length === 0) return null;

  // Always delete (single-use), even if expired.
  await db.delete(oauthStateTable).where(eq(oauthStateTable.state, state));

  const row = rows[0];
  if (row.expiresAt.getTime() < Date.now()) return null;

  return {
    state: row.state,
    purpose: row.purpose as OAuthPurpose,
    userId: row.userId,
    redirectTo: row.redirectTo,
  };
}

export async function gcExpiredOAuthStates(): Promise<void> {
  await db
    .delete(oauthStateTable)
    .where(lt(oauthStateTable.expiresAt, new Date()));
  // `and` import retained for future composite filtering.
  void and;
}
