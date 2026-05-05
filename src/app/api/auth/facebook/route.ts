import { NextRequest, NextResponse } from "next/server";
import {
  FB_LOGIN_SCOPES,
  getLoginClient,
  resolveAppUrl,
} from "@/lib/auth/facebook";
import { createOAuthState } from "@/lib/auth/oauth-state";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const origin = resolveAppUrl(new URL(req.url).origin);
  try {
    const facebook = getLoginClient(origin);
    const state = await createOAuthState({
      purpose: "login",
      redirectTo: "/dashboard",
    });
    const url = facebook.createAuthorizationURL(state, FB_LOGIN_SCOPES);
    return NextResponse.redirect(url.toString());
  } catch (err) {
    console.error("[fb login start]", err);
    return NextResponse.redirect(
      new URL("/login?error=facebook_unavailable", origin),
    );
  }
}
