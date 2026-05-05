"use server";

import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/lib/db";
import { userTable } from "@/lib/db/schema";
import { hashPassword, verifyPassword } from "@/lib/auth/password";
import {
  createSession,
  generateSessionToken,
  invalidateSession,
  SESSION_COOKIE_NAME,
  validateSessionToken,
} from "@/lib/auth/session";
import {
  clearSessionCookie,
  setSessionCookie,
} from "@/lib/auth/cookies";
import { newId } from "@/lib/auth/ids";
import { cookies } from "next/headers";

export type AuthActionState =
  | { ok: true }
  | { ok: false; error: string }
  | undefined;

const signupSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(120),
  email: z.string().trim().toLowerCase().email("Enter a valid email"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .max(256, "Password is too long"),
});

const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email("Enter a valid email"),
  password: z.string().min(1, "Password is required"),
});

export async function signupAction(
  _prev: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const parsed = signupSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? "Invalid input",
    };
  }
  const { name, email, password } = parsed.data;

  let userId: string;
  let session: { expiresAt: Date };
  let token: string;
  try {
    const existing = await db
      .select({ id: userTable.id })
      .from(userTable)
      .where(eq(userTable.email, email))
      .limit(1);
    if (existing.length > 0) {
      return {
        ok: false,
        error: "An account with that email already exists.",
      };
    }

    const passwordHash = await hashPassword(password);
    userId = newId();
    await db.insert(userTable).values({
      id: userId,
      email,
      name,
      passwordHash,
    });

    token = generateSessionToken();
    session = await createSession(token, userId);
  } catch (err) {
    console.error("[signup] failed", err);
    return {
      ok: false,
      error:
        "We couldn't create your account right now. Please try again in a moment.",
    };
  }
  await setSessionCookie(token, session.expiresAt);
  redirect("/dashboard");
}

export async function loginAction(
  _prev: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? "Invalid input",
    };
  }
  const { email, password } = parsed.data;

  let token: string;
  let session: { expiresAt: Date };
  try {
    const rows = await db
      .select()
      .from(userTable)
      .where(eq(userTable.email, email))
      .limit(1);
    const user = rows[0];
    if (!user || !user.passwordHash) {
      return { ok: false, error: "Invalid email or password." };
    }

    const valid = await verifyPassword(user.passwordHash, password);
    if (!valid) {
      return { ok: false, error: "Invalid email or password." };
    }

    token = generateSessionToken();
    session = await createSession(token, user.id);
  } catch (err) {
    console.error("[login] failed", err);
    return {
      ok: false,
      error:
        "We couldn't sign you in right now. Please try again in a moment.",
    };
  }
  await setSessionCookie(token, session.expiresAt);
  redirect("/dashboard");
}

export async function logoutAction(): Promise<void> {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE_NAME)?.value;
  if (token) {
    const { session } = await validateSessionToken(token);
    if (session) await invalidateSession(session.id);
  }
  await clearSessionCookie();
  redirect("/login");
}
