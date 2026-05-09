import { NextRequest, NextResponse } from "next/server";
import { redirect } from "next/navigation";
import { getCurrentSession } from "@/lib/auth/cookies";
import {
  FB_PAGES_SCOPES,
  resolveAppUrl,
} from "@/lib/auth/facebook";
import { createOAuthState } from "@/lib/auth/oauth-state";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const origin = resolveAppUrl(new URL(req.url).origin);
  const { user } = await getCurrentSession();
  if (!user) redirect("/login");

  try {
    const state = await createOAuthState({
      purpose: "connect_pages",
      userId: user.id,
      redirectTo: "/dashboard/pages/select",
    });

    const redirectUri = `${origin}/api/facebook/pages/callback`;
    const configId = process.env.FACEBOOK_LOGIN_CONFIG_ID || "1015579324127162";

    // Manually build the authorization URL with config_id (required for Login for Business)
    const authUrl = new URL("https://www.facebook.com/v21.0/dialog/oauth");
    authUrl.searchParams.set("client_id", process.env.FACEBOOK_APP_ID || "");
    authUrl.searchParams.set("redirect_uri", redirectUri);
    authUrl.searchParams.set("state", state);
    authUrl.searchParams.set("response_type", "code");
    authUrl.searchParams.set("config_id", configId);
    authUrl.searchParams.set("scope", FB_PAGES_SCOPES.join(","));

    return NextResponse.redirect(authUrl.toString());
  } catch (err) {
    console.error("[fb pages start]", err);
    return NextResponse.redirect(
      new URL("/dashboard/pages/select?error=facebook_unavailable", origin),
    );
  }
}
