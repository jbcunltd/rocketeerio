import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const confirmationCode = new URL(req.url).searchParams.get("id");

  return NextResponse.json({
    confirmation_code: confirmationCode,
    status: "received",
    message:
      "Your Facebook data deletion request has been received by Rocketeerio.",
  });
}
