import { NextResponse } from "next/server";
import { FB_LOGIN_SCOPES, getLoginClient } from "@/lib/auth/facebook";
import { createOAuthState } from "@/lib/auth/oauth-state";

export const runtime = "nodejs";

export async function GET() {
  try {
    const facebook = getLoginClient();
    const state = await createOAuthState({
      purpose: "login",
      redirectTo: "/dashboard",
    });
    const url = facebook.createAuthorizationURL(state, FB_LOGIN_SCOPES);
    return NextResponse.redirect(url.toString());
  } catch (err) {
    console.error("[fb login start]", err);
    return NextResponse.redirect(
      new URL(
        "/login?error=facebook_unavailable",
        process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",
      ),
    );
  }
}
