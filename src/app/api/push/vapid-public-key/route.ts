import { NextResponse } from "next/server";
import { getCurrentSession } from "@/lib/auth/cookies";
import { getVapidPublicKey } from "@/lib/push-notifications";

export const dynamic = "force-dynamic";

export async function GET() {
  const { user } = await getCurrentSession();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const publicKey = getVapidPublicKey();

  if (!publicKey) {
    return NextResponse.json(
      { error: "Push notifications are not configured" },
      { status: 503 },
    );
  }

  return NextResponse.json({ publicKey });
}
