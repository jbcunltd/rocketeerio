import { cookies } from "next/headers";
import {
  SESSION_COOKIE_NAME,
  validateSessionToken,
  type ValidatedSession,
} from "./session";

const COOKIE_MAX_AGE = 60 * 60 * 24 * 30; // 30 days

export async function setSessionCookie(token: string, expiresAt: Date) {
  const jar = await cookies();
  jar.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires: expiresAt,
    maxAge: COOKIE_MAX_AGE,
  });
}

export async function clearSessionCookie() {
  const jar = await cookies();
  jar.set(SESSION_COOKIE_NAME, "", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0,
  });
}

/**
 * Read the session cookie and validate it. Returns user + session or nulls.
 * Safe to call from Server Components, route handlers, and server actions.
 */
export async function getCurrentSession(): Promise<ValidatedSession> {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE_NAME)?.value;
  if (!token) return { session: null, user: null };
  try {
    return await validateSessionToken(token);
  } catch (err) {
    console.error("[auth] failed to validate session", err);
    return { session: null, user: null };
  }
}
