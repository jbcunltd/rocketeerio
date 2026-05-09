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
  try {
    const url = new URL(req.url);
    const origin = resolveAppUrl(url.origin);
    const appUrl = (path: string): string => new URL(path, origin).toString();
    const code = url.searchParams.get("code");
    const state = url.searchParams.get("state");
    const error = url.searchParams.get("error");

    if (error) {
      return NextResponse.redirect(appUrl(`/login?error=${encodeURIComponent(error)}`));
    }
    if (!code || !state) {
      return NextResponse.redirect(appUrl("/login?error=missing_code"));
    }

    // Step 1: Consume state
    let persisted;
    try {
      persisted = await consumeOAuthState(state);
    } catch (stateErr) {
      console.error("[fb callback] state consumption crashed", stateErr);
      return NextResponse.json({ step: "consume_state", error: String(stateErr) }, { status: 500 });
    }

    if (!persisted || persisted.purpose !== "login") {
      return NextResponse.redirect(appUrl("/login?error=invalid_state"));
    }

    // Step 2: Exchange code for token
    let accessToken: string;
    try {
      const redirectUri = `${origin}/api/auth/facebook/callback`;
      const tokenUrl = new URL("https://graph.facebook.com/v21.0/oauth/access_token");
      tokenUrl.searchParams.set("client_id", process.env.FACEBOOK_APP_ID || "");
      tokenUrl.searchParams.set("client_secret", process.env.FACEBOOK_APP_SECRET || "");
      tokenUrl.searchParams.set("redirect_uri", redirectUri);
      tokenUrl.searchParams.set("code", code);

      const tokenRes = await fetch(tokenUrl.toString(), { cache: "no-store" });
      const responseText = await tokenRes.text();

      if (!tokenRes.ok) {
        console.error("[fb callback] token exchange failed", tokenRes.status, responseText);
        return NextResponse.json({
          step: "token_exchange",
          status: tokenRes.status,
          fbError: responseText,
          redirectUri,
          clientId: process.env.FACEBOOK_APP_ID?.slice(0, 8) + "...",
          hasSecret: !!process.env.FACEBOOK_APP_SECRET,
          secretPrefix: process.env.FACEBOOK_APP_SECRET?.slice(0, 4) + "...",
        }, { status: 502 });
      }

      const tokenData = JSON.parse(responseText) as { access_token: string; token_type: string; expires_in?: number };
      accessToken = tokenData.access_token;
      if (!accessToken) {
        return NextResponse.json({ step: "token_exchange", error: "No access_token in response", body: responseText }, { status: 502 });
      }
    } catch (err) {
      console.error("[fb callback] token exchange exception", err);
      return NextResponse.json({ step: "token_exchange_exception", error: String(err) }, { status: 500 });
    }

    // Step 3: Fetch Facebook user
    let fbUser;
    try {
      fbUser = await fetchFacebookUser(accessToken);
    } catch (err) {
      console.error("[fb callback] fetch user failed", err);
      return NextResponse.json({ step: "fetch_user", error: String(err) }, { status: 502 });
    }

    // Step 4: Upsert user in DB
    try {
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
            email: fbUser.email ? fbUser.email.toLowerCase() : null,
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

      // Step 5: Create session
      const token = generateSessionToken();
      const session = await createSession(token, userId);
      await setSessionCookie(token, session.expiresAt);

      return NextResponse.redirect(appUrl(persisted.redirectTo ?? "/dashboard"));
    } catch (err) {
      console.error("[fb callback] DB/session error", err);
      return NextResponse.json({ step: "db_or_session", error: String(err), fbUser: { id: fbUser.id, name: fbUser.name } }, { status: 500 });
    }
  } catch (topLevelErr) {
    console.error("[fb callback] UNHANDLED TOP-LEVEL ERROR", topLevelErr);
    return NextResponse.json({ step: "unhandled", error: String(topLevelErr) }, { status: 500 });
  }
}
