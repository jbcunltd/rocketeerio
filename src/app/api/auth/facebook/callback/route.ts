import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { oauthAccountTable, userTable } from "@/lib/db/schema";
import {
  fetchFacebookUser,
  resolveAppUrl,
} from "@/lib/auth/facebook";
import { consumeOAuthState } from "@/lib/auth/oauth-state";
import {
  createSession,
  generateSessionToken,
} from "@/lib/auth/session";
import { setSessionCookie } from "@/lib/auth/cookies";
import { newId } from "@/lib/auth/ids";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const origin = resolveAppUrl(url.origin);
  const appUrl = (path: string): string => new URL(path, origin).toString();
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const error = url.searchParams.get("error");
  const debug = url.searchParams.get("debug");

  if (error) {
    return NextResponse.redirect(appUrl(`/login?error=${encodeURIComponent(error)}`));
  }
  if (!code || !state) {
    return NextResponse.redirect(appUrl("/login?error=missing_code"));
  }

  const persisted = await consumeOAuthState(state);
  if (!persisted || persisted.purpose !== "login") {
    return NextResponse.redirect(appUrl("/login?error=invalid_state"));
  }

  let accessToken: string;
  try {
    const redirectUri = `${origin}/api/auth/facebook/callback`;
    const tokenUrl = new URL("https://graph.facebook.com/v21.0/oauth/access_token");
    tokenUrl.searchParams.set("client_id", process.env.FACEBOOK_APP_ID!);
    tokenUrl.searchParams.set("client_secret", process.env.FACEBOOK_APP_SECRET!);
    tokenUrl.searchParams.set("redirect_uri", redirectUri);
    tokenUrl.searchParams.set("code", code);

    console.error("[fb login callback] attempting token exchange", {
      origin,
      redirectUri,
      hasCode: !!code,
      codeLength: code.length,
      clientId: process.env.FACEBOOK_APP_ID?.slice(0, 6) + "...",
      hasSecret: !!process.env.FACEBOOK_APP_SECRET,
    });

    const tokenRes = await fetch(tokenUrl.toString(), { cache: "no-store" });
    const responseText = await tokenRes.text();

    console.error("[fb login callback] Facebook response", {
      status: tokenRes.status,
      body: responseText.slice(0, 500),
    });

    if (!tokenRes.ok) {
      // Return debug info as JSON if debug mode, otherwise redirect with error details
      return NextResponse.redirect(
        appUrl(`/login?error=token_exchange&detail=${encodeURIComponent(responseText.slice(0, 200))}`)
      );
    }

    const tokenData = JSON.parse(responseText) as { access_token: string; token_type: string; expires_in?: number };
    accessToken = tokenData.access_token;
    if (!accessToken) {
      throw new Error("No access_token in response");
    }
  } catch (err) {
    console.error("[fb login callback] token exchange failed", err);
    const errMsg = err instanceof Error ? err.message : String(err);
    return NextResponse.redirect(appUrl(`/login?error=token_exchange&detail=${encodeURIComponent(errMsg.slice(0, 200))}`));
  }

  let fbUser;
  try {
    fbUser = await fetchFacebookUser(accessToken);
  } catch (err) {
    console.error("[fb login callback] fetch user failed", err);
    return NextResponse.redirect(appUrl("/login?error=graph_failed"));
  }

  // Look up existing oauth account
  const existingOauth = await db
    .select()
    .from(oauthAccountTable)
    .where(eq(oauthAccountTable.providerUserId, fbUser.id))
    .limit(1);

  let userId: string;
  if (existingOauth.length > 0) {
    userId = existingOauth[0].userId;
    await db
      .update(oauthAccountTable)
      .set({ accessToken })
      .where(eq(oauthAccountTable.providerUserId, fbUser.id));
  } else {
    // Try matching by email
    let matchedUserId: string | null = null;
    if (fbUser.email) {
      const matched = await db
        .select({ id: userTable.id })
        .from(userTable)
        .where(eq(userTable.email, fbUser.email.toLowerCase()))
        .limit(1);
      if (matched.length > 0) matchedUserId = matched[0].id;
    }

    if (matchedUserId) {
      userId = matchedUserId;
    } else {
      userId = newId();
      await db.insert(userTable).values({
        id: userId,
        email: (fbUser.email ?? `${fbUser.id}@facebook.local`).toLowerCase(),
        name: fbUser.name,
        avatarUrl: fbUser.picture?.data?.url ?? null,
      });
    }

    await db.insert(oauthAccountTable).values({
      provider: "facebook",
      providerUserId: fbUser.id,
      userId,
      accessToken,
    });
  }

  const token = generateSessionToken();
  const session = await createSession(token, userId);
  await setSessionCookie(token, session.expiresAt);

  return NextResponse.redirect(appUrl(persisted.redirectTo ?? "/dashboard"));
}
