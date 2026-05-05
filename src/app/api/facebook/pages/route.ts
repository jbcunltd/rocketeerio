import { NextRequest, NextResponse } from "next/server";
import { redirect } from "next/navigation";
import { getCurrentSession } from "@/lib/auth/cookies";
import {
  FB_PAGES_SCOPES,
  getPagesClient,
  resolveAppUrl,
} from "@/lib/auth/facebook";
import { createOAuthState } from "@/lib/auth/oauth-state";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const origin = resolveAppUrl(new URL(req.url).origin);
  const { user } = await getCurrentSession();
  if (!user) redirect("/login");

  try {
    const facebook = getPagesClient(origin);
    const state = await createOAuthState({
      purpose: "connect_pages",
      userId: user.id,
      redirectTo: "/dashboard/settings?fb=connected",
    });
    const url = facebook.createAuthorizationURL(state, FB_PAGES_SCOPES);
    return NextResponse.redirect(url.toString());
  } catch (err) {
    console.error("[fb pages start]", err);
    return NextResponse.redirect(
      new URL("/dashboard/settings?error=facebook_unavailable", origin),
    );
  }
}
