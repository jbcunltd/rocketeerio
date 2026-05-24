import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { getCurrentSession } from "@/lib/auth/cookies";
import { loadDashboardConnectedPages } from "@/lib/dashboard-data";
import { pushSubscriptionTable } from "@/lib/db/schema";
import { deletePushSubscriptionForEndpoint } from "@/lib/push-notifications";

export const dynamic = "force-dynamic";

const subscriptionSchema = z.object({
  pageId: z.string().min(1).optional(),
  subscription: z.object({
    endpoint: z.string().url(),
    keys: z.object({
      p256dh: z.string().min(1),
      auth: z.string().min(1),
    }),
  }),
});

const unsubscribeSchema = z.object({
  endpoint: z.string().url(),
});

async function resolveUserPage(userId: string, requestedPageId?: string) {
  const pageLoad = await loadDashboardConnectedPages(userId);
  const activePage = requestedPageId
    ? pageLoad.pages.find((page) => page.pageId === requestedPageId)
    : pageLoad.pages[0];

  return {
    page: activePage ?? null,
    dbUnavailable: pageLoad.unavailable,
  };
}

export async function POST(request: NextRequest) {
  const { user } = await getCurrentSession();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const parsed = subscriptionSchema.safeParse(await request.json().catch(() => null));

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid push subscription" }, { status: 400 });
  }

  const { page, dbUnavailable } = await resolveUserPage(user.id, parsed.data.pageId);

  if (!page) {
    return NextResponse.json(
      {
        error: dbUnavailable
          ? "Connected Pages are temporarily unavailable. Please try again shortly."
          : "Connect a Facebook Page before enabling notifications.",
      },
      { status: dbUnavailable ? 503 : 400 },
    );
  }

  const now = new Date();

  await db
    .insert(pushSubscriptionTable)
    .values({
      userId: user.id,
      pageId: page.pageId,
      endpoint: parsed.data.subscription.endpoint,
      p256dh: parsed.data.subscription.keys.p256dh,
      auth: parsed.data.subscription.keys.auth,
      userAgent: request.headers.get("user-agent"),
      createdAt: now,
      updatedAt: now,
    })
    .onConflictDoUpdate({
      target: pushSubscriptionTable.endpoint,
      set: {
        userId: user.id,
        pageId: page.pageId,
        p256dh: parsed.data.subscription.keys.p256dh,
        auth: parsed.data.subscription.keys.auth,
        userAgent: request.headers.get("user-agent"),
        updatedAt: now,
      },
    });

  return NextResponse.json({
    ok: true,
    pageId: page.pageId,
    pageName: page.name,
  });
}

export async function DELETE(request: NextRequest) {
  const { user } = await getCurrentSession();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const parsed = unsubscribeSchema.safeParse(await request.json().catch(() => null));

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid push subscription endpoint" }, { status: 400 });
  }

  await deletePushSubscriptionForEndpoint(user.id, parsed.data.endpoint);

  return NextResponse.json({ ok: true });
}
