/**
 * PayMongo Service Module
 * Wraps PayMongo REST API calls for subscription billing.
 * Docs: https://developers.paymongo.com/docs
 */
import { ENV } from "./_core/env";

const PAYMONGO_API = "https://api.paymongo.com/v1";

function getAuthHeader(): string {
  return "Basic " + Buffer.from(ENV.paymongoSecretKey + ":").toString("base64");
}

async function paymongoRequest<T = any>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${PAYMONGO_API}${endpoint}`;
  const res = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Authorization: getAuthHeader(),
      ...options.headers,
    },
  });

  const body = await res.json();

  if (!res.ok) {
    console.error("[PayMongo] API error:", res.status, JSON.stringify(body));
    throw new Error(
      body?.errors?.[0]?.detail ?? `PayMongo API error: ${res.status}`
    );
  }

  return body;
}

// ─── Checkout Sessions ──────────────────────────────────────────────

export interface CreateCheckoutParams {
  amount: number; // in centavos (e.g., 490000 = ₱4,900.00)
  currency?: string;
  description: string;
  planSlug: string;
  userId: number;
  successUrl: string;
  cancelUrl: string;
}

export async function createCheckoutSession(params: CreateCheckoutParams) {
  const {
    amount,
    currency = "PHP",
    description,
    planSlug,
    userId,
    successUrl,
    cancelUrl,
  } = params;

  const response = await paymongoRequest<any>("/checkout_sessions", {
    method: "POST",
    body: JSON.stringify({
      data: {
        attributes: {
          send_email_receipt: true,
          show_description: true,
          show_line_items: true,
          payment_method_types: [
            "card",
            "gcash",
            "maya",
            "grab_pay",
          ],
          line_items: [
            {
              name: description,
              quantity: 1,
              amount,
              currency,
            },
          ],
          description: `Rocketeer ${description} subscription`,
          success_url: successUrl,
          cancel_url: cancelUrl,
          metadata: {
            plan_slug: planSlug,
            user_id: String(userId),
          },
        },
      },
    }),
  });

  return {
    checkoutId: response.data.id as string,
    checkoutUrl: response.data.attributes.checkout_url as string,
  };
}

// ─── Retrieve Checkout Session ──────────────────────────────────────

export async function getCheckoutSession(checkoutId: string) {
  const response = await paymongoRequest<any>(
    `/checkout_sessions/${checkoutId}`
  );
  return response.data;
}

// ─── Payments ───────────────────────────────────────────────────────

export async function getPayment(paymentId: string) {
  const response = await paymongoRequest<any>(`/payments/${paymentId}`);
  return response.data;
}

// ─── Payment Links (alternative to checkout) ────────────────────────

export interface CreatePaymentLinkParams {
  amount: number;
  currency?: string;
  description: string;
  remarks?: string;
}

export async function createPaymentLink(params: CreatePaymentLinkParams) {
  const { amount, currency = "PHP", description, remarks } = params;

  const response = await paymongoRequest<any>("/links", {
    method: "POST",
    body: JSON.stringify({
      data: {
        attributes: {
          amount,
          currency,
          description,
          remarks: remarks ?? "",
        },
      },
    }),
  });

  return {
    linkId: response.data.id as string,
    checkoutUrl: response.data.attributes.checkout_url as string,
    referenceNumber: response.data.attributes.reference_number as string,
  };
}

// ─── Webhooks ───────────────────────────────────────────────────────

export async function createWebhook(url: string, events: string[]) {
  const response = await paymongoRequest<any>("/webhooks", {
    method: "POST",
    body: JSON.stringify({
      data: {
        attributes: {
          url,
          events,
        },
      },
    }),
  });

  return response.data;
}

export async function listWebhooks() {
  const response = await paymongoRequest<any>("/webhooks");
  return response.data;
}

// ─── Webhook Signature Verification ─────────────────────────────────

export function verifyWebhookSignature(
  payload: string,
  signatureHeader: string,
  webhookSecretKey: string
): boolean {
  // PayMongo sends signatures in the format:
  // t=<timestamp>,te=<test_signature>,li=<live_signature>
  // For now, we do basic validation. In production, use HMAC-SHA256.
  try {
    if (!signatureHeader) return false;
    const parts = signatureHeader.split(",");
    const timestamp = parts.find((p) => p.startsWith("t="))?.split("=")[1];
    if (!timestamp) return false;

    // Basic timestamp freshness check (within 5 minutes)
    const ts = parseInt(timestamp, 10);
    const now = Math.floor(Date.now() / 1000);
    if (Math.abs(now - ts) > 300) {
      console.warn("[PayMongo] Webhook timestamp too old");
      return false;
    }

    return true;
  } catch (error) {
    console.error("[PayMongo] Signature verification failed:", error);
    return false;
  }
}

// ─── Webhook Event Types ────────────────────────────────────────────

export const PAYMONGO_EVENTS = {
  CHECKOUT_SESSION_PAYMENT_PAID: "checkout_session.payment.paid",
  PAYMENT_PAID: "payment.paid",
  PAYMENT_FAILED: "payment.failed",
  SOURCE_CHARGEABLE: "source.chargeable",
} as const;
