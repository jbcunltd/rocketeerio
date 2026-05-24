import webpush, { type PushSubscription } from "web-push";
import { and, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { pushSubscriptionTable, type DbPushSubscription } from "@/lib/db/schema";

export type LeadPushPayload = {
  pageId: string;
  leadName: string;
  messagePreview: string;
  badge?: "HOT" | "QUALIFIED" | "NEW" | string;
  isHot?: boolean;
  qualificationStatus?: string;
  conversationId?: string;
  threadId?: string;
  imageUrl?: string;
};

export type PushSendSummary = {
  attempted: number;
  sent: number;
  expiredRemoved: number;
  failed: number;
};

const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || process.env.VAPID_PUBLIC_KEY;
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY;
const VAPID_SUBJECT = process.env.VAPID_SUBJECT || "mailto:hello@rocketeerio.com";

let vapidConfigured = false;

export function getVapidPublicKey() {
  return VAPID_PUBLIC_KEY || null;
}

export function assertPushIsConfigured() {
  if (!VAPID_PUBLIC_KEY || !VAPID_PRIVATE_KEY) {
    throw new Error("Push notifications are not configured. Set NEXT_PUBLIC_VAPID_PUBLIC_KEY and VAPID_PRIVATE_KEY.");
  }

  if (!vapidConfigured) {
    webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);
    vapidConfigured = true;
  }
}

function toWebPushSubscription(subscription: DbPushSubscription): PushSubscription {
  return {
    endpoint: subscription.endpoint,
    keys: {
      p256dh: subscription.p256dh,
      auth: subscription.auth,
    },
  };
}

function isExpiredSubscriptionError(error: unknown) {
  if (!error || typeof error !== "object") return false;
  const statusCode = "statusCode" in error ? Number((error as { statusCode?: unknown }).statusCode) : null;
  return statusCode === 404 || statusCode === 410;
}

export async function sendLeadPushNotificationToPage(
  payload: LeadPushPayload,
): Promise<PushSendSummary> {
  assertPushIsConfigured();

  const subscriptions = await db
    .select()
    .from(pushSubscriptionTable)
    .where(eq(pushSubscriptionTable.pageId, payload.pageId));

  const summary: PushSendSummary = {
    attempted: subscriptions.length,
    sent: 0,
    expiredRemoved: 0,
    failed: 0,
  };

  const notificationPayload = JSON.stringify({
    ...payload,
    badge: payload.badge || (payload.isHot ? "HOT" : payload.qualificationStatus === "qualified" ? "QUALIFIED" : "NEW"),
  });

  await Promise.all(
    subscriptions.map(async (subscription) => {
      try {
        await webpush.sendNotification(toWebPushSubscription(subscription), notificationPayload);
        summary.sent += 1;
        await db
          .update(pushSubscriptionTable)
          .set({ lastSentAt: new Date(), updatedAt: new Date() })
          .where(eq(pushSubscriptionTable.id, subscription.id));
      } catch (error) {
        if (isExpiredSubscriptionError(error)) {
          await db
            .delete(pushSubscriptionTable)
            .where(eq(pushSubscriptionTable.id, subscription.id));
          summary.expiredRemoved += 1;
          return;
        }

        summary.failed += 1;
        console.error("[push] Failed to send lead notification", {
          subscriptionId: subscription.id,
          pageId: payload.pageId,
          error,
        });
      }
    }),
  );

  return summary;
}

export async function deletePushSubscriptionForEndpoint(userId: string, endpoint: string) {
  await db
    .delete(pushSubscriptionTable)
    .where(and(eq(pushSubscriptionTable.userId, userId), eq(pushSubscriptionTable.endpoint, endpoint)));
}
