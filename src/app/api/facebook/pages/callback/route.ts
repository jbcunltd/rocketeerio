import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { facebookUserTokenTable } from "@/lib/db/schema";
import {
  exchangeForLongLivedToken,
  fetchFacebookUser,
  FB_PAGES_SCOPES,
  getPagesClient,
  resolveAppUrl,
} from "@/lib/auth/facebook";
import { consumeOAuthState } from "@/lib/auth/oauth-state";
import { getCurrentSession } from "@/lib/auth/cookies";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const origin = resolveAppUrl(url.origin);
  const appUrl = (path: string): string => new URL(path, origin).toString();
  const { user } = await getCurrentSession();
  if (!user) {
    return NextResponse.redirect(appUrl("/login"));
  }

  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const error = url.searchParams.get("error");

  if (error) {
    return NextResponse.redirect(
      appUrl(`/dashboard/pages/select?error=${encodeURIComponent(error)}`),
    );
  }
  if (!code || !state) {
    return NextResponse.redirect(
      appUrl("/dashboard/pages/select?error=missing_code"),
    );
  }

  const persisted = await consumeOAuthState(state);
  if (
    !persisted ||
    persisted.purpose !== "connect_pages" ||
    persisted.userId !== user.id
  ) {
    return NextResponse.redirect(
      appUrl("/dashboard/pages/select?error=invalid_state"),
    );
  }

  let shortLived: string;
  try {
    const facebook = getPagesClient(origin);
    const tokens = await facebook.validateAuthorizationCode(code);
    shortLived = tokens.accessToken();
  } catch (err) {
    console.error("[fb pages cb] token exchange failed", err);
    return NextResponse.redirect(
      appUrl("/dashboard/pages/select?error=token_exchange"),
    );
  }

  let longLived: { accessToken: string; expiresIn?: number };
  try {
    longLived = await exchangeForLongLivedToken(shortLived);
  } catch (err) {
    console.error("[fb pages cb] long-lived exchange failed", err);
    return NextResponse.redirect(
      appUrl("/dashboard/pages/select?error=token_exchange"),
    );
  }

  let fbUser;
  try {
    fbUser = await fetchFacebookUser(longLived.accessToken);
  } catch (err) {
    console.error("[fb pages cb] fetch user failed", err);
    return NextResponse.redirect(
      appUrl("/dashboard/pages/select?error=graph_failed"),
    );
  }

  const expiresAt = longLived.expiresIn
    ? new Date(Date.now() + longLived.expiresIn * 1000)
    : null;

  // Upsert the user-level token (one per user).
  const existing = await db
    .select({ id: facebookUserTokenTable.id })
    .from(facebookUserTokenTable)
    .where(eq(facebookUserTokenTable.userId, user.id))
    .limit(1);

  if (existing.length > 0) {
    await db
      .update(facebookUserTokenTable)
      .set({
        fbUserId: fbUser.id,
        accessToken: longLived.accessToken,
        expiresAt,
        scopes: FB_PAGES_SCOPES.join(","),
        updatedAt: new Date(),
      })
      .where(eq(facebookUserTokenTable.userId, user.id));
  } else {
    await db.insert(facebookUserTokenTable).values({
      userId: user.id,
      fbUserId: fbUser.id,
      accessToken: longLived.accessToken,
      expiresAt,
      scopes: FB_PAGES_SCOPES.join(","),
    });
  }

  return NextResponse.redirect(appUrl("/dashboard/pages/select"));
}
