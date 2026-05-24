import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { sendLeadPushNotificationToPage } from "@/lib/push-notifications";

export const dynamic = "force-dynamic";

const sendPushSchema = z.object({
  pageId: z.string().min(1),
  leadName: z.string().trim().min(1).max(120),
  messagePreview: z.string().trim().min(1).max(240),
  badge: z.string().trim().max(32).optional(),
  isHot: z.boolean().optional(),
  isNewConversation: z.boolean().optional(),
  qualificationStatus: z.string().trim().max(64).optional(),
  conversationId: z.string().trim().max(160).optional(),
  threadId: z.string().trim().max(160).optional(),
  imageUrl: z.string().url().optional(),
});

function getBearerToken(request: NextRequest) {
  const authorization = request.headers.get("authorization");
  if (authorization?.toLowerCase().startsWith("bearer ")) {
    return authorization.slice("bearer ".length).trim();
  }

  return request.headers.get("x-rocketeerio-push-secret")?.trim() || null;
}

function isNotifiableLead(payload: z.infer<typeof sendPushSchema>) {
  const qualificationStatus = payload.qualificationStatus?.toLowerCase();
  const badge = payload.badge?.toLowerCase();

  return Boolean(
    payload.isHot ||
      payload.isNewConversation ||
      qualificationStatus === "hot" ||
      qualificationStatus === "qualified" ||
      badge === "hot" ||
      badge === "qualified",
  );
}

export async function POST(request: NextRequest) {
  const apiSecret = process.env.PUSH_NOTIFICATION_API_SECRET;

  if (!apiSecret) {
    return NextResponse.json(
      { error: "Push notification API secret is not configured" },
      { status: 503 },
    );
  }

  if (getBearerToken(request) !== apiSecret) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const parsed = sendPushSchema.safeParse(await request.json().catch(() => null));

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid push notification payload" }, { status: 400 });
  }

  if (!isNotifiableLead(parsed.data)) {
    return NextResponse.json({
      ok: true,
      skipped: true,
      reason: "Lead is not hot/qualified and this is not a new conversation.",
    });
  }

  try {
    const summary = await sendLeadPushNotificationToPage({
      pageId: parsed.data.pageId,
      leadName: parsed.data.leadName,
      messagePreview: parsed.data.messagePreview,
      badge: parsed.data.badge,
      isHot: parsed.data.isHot,
      qualificationStatus: parsed.data.qualificationStatus,
      conversationId: parsed.data.conversationId,
      threadId: parsed.data.threadId,
      imageUrl: parsed.data.imageUrl,
    });

    return NextResponse.json({
      ok: true,
      skipped: false,
      ...summary,
    });
  } catch (error) {
    console.error("[push] Failed to send notification batch", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to send push notification" },
      { status: 500 },
    );
  }
}
