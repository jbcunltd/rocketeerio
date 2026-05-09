import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function GET() {
  return NextResponse.json({
    hasFacebookAppId: !!process.env.FACEBOOK_APP_ID,
    hasFacebookAppSecret: !!process.env.FACEBOOK_APP_SECRET,
    hasNextPublicAppUrl: !!process.env.NEXT_PUBLIC_APP_URL,
    hasAppUrl: !!process.env.APP_URL,
    appIdLength: process.env.FACEBOOK_APP_ID?.length ?? 0,
    secretLength: process.env.FACEBOOK_APP_SECRET?.length ?? 0,
    resolvedUrl: process.env.NEXT_PUBLIC_APP_URL || process.env.APP_URL || process.env.VERCEL_PROJECT_PRODUCTION_URL || "none",
  });
}
