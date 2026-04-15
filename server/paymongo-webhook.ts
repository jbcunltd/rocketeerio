/**
 * PayMongo Webhook Handler
 * Registers Express routes for handling PayMongo payment event webhooks.
 */
import type { Express } from "express";
import * as db from "./db";
import { PAYMONGO_EVENTS } from "./paymongo";

export function registerPaymongoWebhookRoutes(app: Express) {
  // POST /api/webhook/paymongo — receives payment event notifications
  app.post("/api/webhook/paymongo", async (req, res) => {
    try {
      const event = req.body;
      console.log("[PayMongo Webhook] Received event:", JSON.stringify(event?.data?.attributes?.type ?? "unknown"));

      if (!event?.data?.attributes) {
        console.warn("[PayMongo Webhook] Invalid payload structure");
        res.status(400).json({ error: "Invalid payload" });
        return;
      }

      const eventType = event.data.attributes.type;
      const eventData = event.data.attributes.data;

      switch (eventType) {
        case PAYMONGO_EVENTS.CHECKOUT_SESSION_PAYMENT_PAID: {
          await handleCheckoutPaymentPaid(eventData);
          break;
        }
        case PAYMONGO_EVENTS.PAYMENT_PAID: {
          await handlePaymentPaid(eventData);
          break;
        }
        case PAYMONGO_EVENTS.PAYMENT_FAILED: {
          await handlePaymentFailed(eventData);
          break;
        }
        default:
          console.log("[PayMongo Webhook] Unhandled event type:", eventType);
      }

      // Always return 200 to acknowledge receipt
      res.status(200).json({ received: true });
    } catch (error) {
      console.error("[PayMongo Webhook] Processing error:", error);
      // Still return 200 to prevent retries for processing errors
      res.status(200).json({ received: true, error: "Processing error" });
    }
  });

  // GET /api/webhook/paymongo — health check for webhook endpoint
  app.get("/api/webhook/paymongo", (_req, res) => {
    res.json({ status: "ok", message: "PayMongo webhook endpoint is active" });
  });
}

// ─── Event Handlers ─────────────────────────────────────────────────

async function handleCheckoutPaymentPaid(eventData: any) {
  try {
    const checkoutId = eventData?.id;
    const attributes = eventData?.attributes;
    const paymentId = attributes?.payments?.[0]?.id;
    const metadata = attributes?.metadata;

    console.log("[PayMongo Webhook] Checkout payment paid:", {
      checkoutId,
      paymentId,
      userId: metadata?.user_id,
      planSlug: metadata?.plan_slug,
    });

    if (!checkoutId) {
      console.warn("[PayMongo Webhook] No checkout ID in event data");
      return;
    }

    // Update the subscription record
    const subscription = await db.getUserSubscriptionByCheckoutId(checkoutId);
    if (subscription) {
      await db.updateUserSubscription(subscription.id, {
        status: "active",
        paymongoSubscriptionId: paymentId ?? undefined,
      });
      console.log("[PayMongo Webhook] Subscription activated for user:", subscription.userId);
    }

    // Update the payment record
    await db.updatePaymentByCheckoutId(checkoutId, {
      status: "paid",
      paymongoPaymentId: paymentId ?? undefined,
      paidAt: new Date(),
    });

    // Update user plan if metadata is available
    if (metadata?.user_id && metadata?.plan_slug) {
      const validPlanSlugs = ["free", "growth", "pro", "scale", "custom"] as const;
      const planSlug = metadata.plan_slug;
      if (validPlanSlugs.includes(planSlug)) {
        await db.updateUserProfile(parseInt(metadata.user_id, 10), {
          plan: planSlug as typeof validPlanSlugs[number],
        });
        console.log("[PayMongo Webhook] User plan updated to:", planSlug);
      } else {
        console.warn("[PayMongo Webhook] Unknown plan slug from metadata:", planSlug);
      }
    }
  } catch (error) {
    console.error("[PayMongo Webhook] Error handling checkout payment:", error);
  }
}

async function handlePaymentPaid(eventData: any) {
  try {
    const paymentId = eventData?.id;
    const attributes = eventData?.attributes;
    const amount = attributes?.amount;
    const metadata = attributes?.metadata;

    console.log("[PayMongo Webhook] Payment paid:", {
      paymentId,
      amount,
      userId: metadata?.user_id,
    });

    // If there's a user_id in metadata, log the payment
    if (metadata?.user_id) {
      const userId = parseInt(metadata.user_id, 10);
      await db.createPaymentRecord({
        userId,
        amount: String((amount ?? 0) / 100),
        currency: attributes?.currency ?? "PHP",
        status: "paid",
        paymongoPaymentId: paymentId,
        description: `Payment received via ${attributes?.source?.type ?? "unknown"}`,
        paidAt: new Date(),
      });
    }
  } catch (error) {
    console.error("[PayMongo Webhook] Error handling payment paid:", error);
  }
}

async function handlePaymentFailed(eventData: any) {
  try {
    const paymentId = eventData?.id;
    const metadata = eventData?.attributes?.metadata;

    console.log("[PayMongo Webhook] Payment failed:", {
      paymentId,
      userId: metadata?.user_id,
    });

    if (metadata?.user_id) {
      const userId = parseInt(metadata.user_id, 10);
      // Mark subscription as past_due if payment fails
      const subscription = await db.getUserSubscription(userId);
      if (subscription) {
        await db.updateUserSubscription(subscription.id, {
          status: "past_due",
        });
      }
    }
  } catch (error) {
    console.error("[PayMongo Webhook] Error handling payment failed:", error);
  }
}
