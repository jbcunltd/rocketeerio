import * as db from "./db";

/**
 * Dispatches webhook events to all registered endpoints for a user.
 * Called internally when events occur (new lead, conversation update, etc.)
 */
export async function dispatchWebhookEvent(
  userId: number,
  event: string,
  payload: Record<string, any>
): Promise<void> {
  try {
    const endpoints = await db.getActiveWebhooksForEvent(userId, event);
    if (endpoints.length === 0) return;

    console.log(`[Webhook] Dispatching "${event}" to ${endpoints.length} endpoint(s)`);

    for (const endpoint of endpoints) {
      try {
        const body = JSON.stringify({
          event,
          timestamp: new Date().toISOString(),
          data: payload,
        });

        const headers: Record<string, string> = {
          "Content-Type": "application/json",
          "X-Rocketeer-Event": event,
        };

        if (endpoint.secret) {
          // Simple HMAC-like signature using the secret
          const encoder = new TextEncoder();
          const key = await crypto.subtle.importKey(
            "raw",
            encoder.encode(endpoint.secret),
            { name: "HMAC", hash: "SHA-256" },
            false,
            ["sign"]
          );
          const signature = await crypto.subtle.sign("HMAC", key, encoder.encode(body));
          const hex = Array.from(new Uint8Array(signature)).map(b => b.toString(16).padStart(2, "0")).join("");
          headers["X-Rocketeer-Signature"] = `sha256=${hex}`;
        }

        const response = await fetch(endpoint.url, {
          method: "POST",
          headers,
          body,
          signal: AbortSignal.timeout(10000), // 10s timeout
        });

        if (response.ok) {
          await db.markWebhookTriggered(endpoint.id, true);
          console.log(`[Webhook] ✓ Delivered "${event}" to ${endpoint.name}`);
        } else {
          await db.markWebhookTriggered(endpoint.id, false);
          console.warn(`[Webhook] ✗ Failed "${event}" to ${endpoint.name}: ${response.status}`);
        }
      } catch (err) {
        await db.markWebhookTriggered(endpoint.id, false);
        console.error(`[Webhook] ✗ Error dispatching to ${endpoint.name}:`, err);
      }
    }
  } catch (err) {
    console.error("[Webhook] Dispatch error:", err);
  }
}

/** Available webhook events */
export const WEBHOOK_EVENTS = [
  { key: "lead.created", label: "New Lead Created", description: "Triggered when a new lead is captured" },
  { key: "lead.updated", label: "Lead Updated", description: "Triggered when a lead's info or score changes" },
  { key: "lead.classified", label: "Lead Classified", description: "Triggered when a lead is classified as hot/warm/cold" },
  { key: "conversation.created", label: "New Conversation", description: "Triggered when a new conversation starts" },
  { key: "conversation.message", label: "New Message", description: "Triggered on every new message in a conversation" },
  { key: "conversation.handoff", label: "Agent Handoff", description: "Triggered when AI hands off to a human agent" },
  { key: "followup.sent", label: "Follow-Up Sent", description: "Triggered when a follow-up message is sent" },
] as const;

/**
 * Export lead data to a Google Sheet via Apps Script Web App URL.
 * The user deploys a simple Apps Script that accepts POST requests
 * and appends rows to their sheet.
 */
export async function exportLeadToGoogleSheet(
  googleSheetWebAppUrl: string,
  leadData: Record<string, any>
): Promise<boolean> {
  try {
    if (!googleSheetWebAppUrl) return false;

    const body = JSON.stringify({
      timestamp: new Date().toISOString(),
      name: leadData.leadName || "",
      email: leadData.leadEmail || "",
      phone: leadData.leadPhone || "",
      platform: leadData.platform || "messenger",
      source: leadData.source || "",
      score: leadData.score || 0,
      classification: leadData.classification || "",
      status: leadData.status || "new",
    });

    const response = await fetch(googleSheetWebAppUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body,
      signal: AbortSignal.timeout(15000),
    });

    if (response.ok) {
      console.log("[Google Sheets] Lead exported successfully");
      return true;
    } else {
      console.warn(`[Google Sheets] Export failed: ${response.status}`);
      return false;
    }
  } catch (err) {
    console.error("[Google Sheets] Export error:", err);
    return false;
  }
}
