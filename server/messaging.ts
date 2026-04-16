/**
 * Messaging helpers — stub module.
 * sendMessengerMessage is defined in facebook.ts for webhook processing;
 * this module provides the same signature for the follow-up worker.
 */

const FB_GRAPH = "https://graph.facebook.com/v19.0";

export async function sendMessengerMessage(
  pageAccessToken: string,
  recipientPsid: string,
  text: string,
): Promise<boolean> {
  const url = `${FB_GRAPH}/me/messages?access_token=${pageAccessToken}`;
  const body = {
    recipient: { id: recipientPsid },
    message: { text },
    messaging_type: "RESPONSE",
  };

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      console.error("[Messaging] Send failed:", res.status, await res.text());
      return false;
    }
    return true;
  } catch (err) {
    console.error("[Messaging] Send error:", err);
    return false;
  }
}

export async function sendEmail(
  _to: string,
  _subject: string,
  _body: string,
): Promise<boolean> {
  console.warn("[Messaging] sendEmail is not yet implemented");
  return false;
}
