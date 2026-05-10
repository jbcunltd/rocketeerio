import { NextRequest, NextResponse } from "next/server";
import { FB_LOGIN_SCOPES, resolveAppUrl } from "@/lib/auth/facebook";
import { createOAuthState } from "@/lib/auth/oauth-state";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const origin = resolveAppUrl(new URL(req.url).origin);

  try {
    const state = await createOAuthState({
      purpose: "login",
      redirectTo: "/dashboard",
    });

    const url = new URL("https://www.facebook.com/v21.0/dialog/oauth");
    url.searchParams.set("client_id", process.env.FACEBOOK_APP_ID!);
    url.searchParams.set("redirect_uri", `${origin}/api/auth/facebook/callback`);
    url.searchParams.set("state", state);
    url.searchParams.set("response_type", "code");
    // Only set scope if we have scopes to request
    // Facebook Login for Business grants basic profile by default
    if (FB_LOGIN_SCOPES.length > 0) {
      url.searchParams.set("scope", FB_LOGIN_SCOPES.join(","));
    }

    return NextResponse.redirect(url.toString());
  } catch (err) {
    console.error("[fb login start]", err);
    return NextResponse.redirect(
      new URL("/login?error=facebook_unavailable", origin),
    );
  }
}
