import type { Express, Request, Response } from "express";
import { ENV } from "./_core/env";
import { sdk } from "./_core/sdk";
import { COOKIE_NAME } from "../shared/const";
import * as db from "./db";
import { generateAIResponse, scoreLead, detectHandoff, detectHighIntentFast } from "./ai-engine";
import { notifyOwner } from "./_core/notification";
import { dispatchWebhookEvent } from "./webhook-dispatcher";

// Phrase the AI is instructed to use when handing off. Used to detect post-reply handoff.
const IG_HANDOFF_PHRASE_RE = /(specialist|teammate|colleague|sales team|account manager).{0,40}(message you|reach out|get in touch|contact you|follow up|take it from here)/i;

const FB_GRAPH = "https://graph.facebook.com/v19.0";

// ─── Instagram Send API ─────────────────────────────────────────────

async function sendInstagramMessage(pageAccessToken: string, recipientIgScopedId: string, text: string) {
  const url = `${FB_GRAPH}/me/messages?access_token=${pageAccessToken}`;
  const body = {
    recipient: { id: recipientIgScopedId },
    message: { text },
    messaging_type: "RESPONSE",
  };

  console.log(`[Instagram] Sending reply to ${recipientIgScopedId}, length=${text.length}`);

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const errText = await res.text();
    console.error("[Instagram] Send failed:", res.status, errText);
    return false;
  }
  console.log(`[Instagram] Reply sent successfully to ${recipientIgScopedId}`);
  return true;
}

// ─── Get Instagram User Profile ─────────────────────────────────────

async function getInstagramUserProfile(igScopedId: string, pageAccessToken: string) {
  try {
    const res = await fetch(
      `${FB_GRAPH}/${igScopedId}?fields=name,username,profile_pic&access_token=${pageAccessToken}`
    );
    if (!res.ok) {
      console.warn(`[Instagram] Profile fetch failed for ${igScopedId}: ${res.status}`);
      return null;
    }
    const data = await res.json();
    return {
      name: data.name || data.username || null,
      username: data.username || null,
      avatarUrl: data.profile_pic || null,
    };
  } catch (err) {
    console.error(`[Instagram] Profile fetch error for ${igScopedId}:`, err);
    return null;
  }
}

// ─── Process Incoming Instagram DM ──────────────────────────────────

async function processIncomingInstagramMessage(
  igAccount: { igUserId: string; pageAccessToken: string; userId: number; dbAccountId: number; facebookPageId: number | null; aiMode: string },
  senderIgScopedId: string,
  messageText: string
) {
  console.log(`[IG Webhook] Processing DM from ${senderIgScopedId} to IG account ${igAccount.igUserId}: "${messageText.substring(0, 80)}"`);

  const mode = igAccount.aiMode || "testing";

  if (mode === "paused") {
    console.log(`[IG Webhook] IG account ${igAccount.igUserId} is PAUSED — ignoring message`);
    return;
  }

  if (mode === "testing") {
    // In testing mode, send a courtesy reply
    if (igAccount.pageAccessToken) {
      await sendInstagramMessage(
        igAccount.pageAccessToken,
        senderIgScopedId,
        "Thanks for your message! We're currently setting things up and will get back to you shortly."
      );
    }
    return;
  }

  // Use the linked Facebook page ID for the database page reference, or 0
  const dbPageId = igAccount.facebookPageId || 0;

  // 1. Find or create lead
  let lead = await db.getLeadByIgScopedId(senderIgScopedId, igAccount.dbAccountId);
  if (!lead) {
    console.log(`[IG Webhook] Creating new lead for IG user ${senderIgScopedId}`);
    const profile = await getInstagramUserProfile(senderIgScopedId, igAccount.pageAccessToken);
    const leadId = await db.createLead({
      userId: igAccount.userId,
      pageId: dbPageId,
      psid: undefined,
      igScopedId: senderIgScopedId,
      name: profile?.name || `Instagram User`,
      avatarUrl: profile?.avatarUrl || undefined,
      source: "instagram",
      platform: "instagram",
      status: "active",
    });
    if (!leadId) { console.error("[IG Webhook] Failed to create lead"); return; }
    lead = await db.getLeadById(leadId);
    if (!lead) { console.error("[IG Webhook] Failed to fetch newly created lead"); return; }
    console.log(`[IG Webhook] Created lead id=${leadId}, name=${lead.name}`);
  } else {
    console.log(`[IG Webhook] Found existing lead id=${lead.id}, name=${lead.name}`);
  }

  // 2. Find or create conversation
  let conv = await db.getConversationByLeadId(lead.id);
  if (!conv) {
    console.log(`[IG Webhook] Creating new conversation for lead ${lead.id}`);
    const convId = await db.createConversation({
      userId: igAccount.userId,
      pageId: dbPageId,
      leadId: lead.id,
      lastMessagePreview: messageText.substring(0, 200),
      messageCount: 0,
      platform: "instagram",
      status: "open",
    });
    if (!convId) { console.error("[IG Webhook] Failed to create conversation"); return; }
    conv = await db.getConversationByLeadId(lead.id);
    if (!conv) { console.error("[IG Webhook] Failed to fetch newly created conversation"); return; }
    console.log(`[IG Webhook] Created conversation id=${convId}`);
  } else {
    console.log(`[IG Webhook] Found existing conversation id=${conv.id}`);
  }

  // 3. Save incoming message
  await db.createMessage({
    conversationId: conv.id,
    content: messageText,
    sender: "lead",
    messageType: "text",
  });

  // 4. Check if AI is active
  if (!conv.isAiActive) {
    console.log(`[IG Webhook] AI disabled for conversation ${conv.id}, skipping auto-reply`);
    return;
  }

  // 4b. Fast high-intent detection (Rocketeerio v1)
  const fastIntent = detectHighIntentFast(messageText);
  if (fastIntent.highIntent) {
    console.log(`[IG Webhook] HIGH INTENT detected (${fastIntent.signal}: "${fastIntent.matched}") in conversation ${conv.id}`);
  }

  // 5. Get conversation history
  const history = await db.getMessagesByConversation(conv.id);
  const historyForAI = history.map(m => ({ sender: m.sender, content: m.content }));

  // 6. Generate AI response
  const convDetail = await db.getConversationById(conv.id);
  const aiResponse = await generateAIResponse(
    igAccount.userId,
    historyForAI,
    lead.name,
    convDetail?.page?.pageName ?? "Our Business",
    dbPageId
  );

  // 7. Save AI response
  await db.createMessage({
    conversationId: conv.id,
    content: aiResponse,
    sender: "ai",
    messageType: "text",
  });

  // 8. Send reply via Instagram
  if (igAccount.pageAccessToken) {
    const sent = await sendInstagramMessage(igAccount.pageAccessToken, senderIgScopedId, aiResponse);
    console.log(`[IG Webhook] Instagram send result: ${sent}`);
  }

  // 9. Update conversation
  await db.updateConversation(conv.id, {
    lastMessagePreview: aiResponse.substring(0, 200),
    lastMessageAt: new Date(),
    messageCount: history.length + 2,
  });

  // 10. Score lead
  try {
    const allMessages = [...historyForAI, { sender: "ai", content: aiResponse }];
    const scoreResult = await scoreLead(allMessages);

    await db.updateLead(lead.id, {
      score: scoreResult.score,
      classification: scoreResult.classification,
      budgetScore: scoreResult.budgetScore,
      authorityScore: scoreResult.authorityScore,
      needScore: scoreResult.needScore,
      timelineScore: scoreResult.timelineScore,
      budgetNotes: scoreResult.budgetNotes,
      authorityNotes: scoreResult.authorityNotes,
      needNotes: scoreResult.needNotes,
      timelineNotes: scoreResult.timelineNotes,
    });

    if (scoreResult.classification === "hot" && !lead.notifiedAt) {
      await notifyOwner({
        title: `🔥 Hot Lead from Instagram: ${lead.name || "Unknown"}`,
        content: `Score: ${scoreResult.score}/100\nLast message: ${messageText}\nPlatform: Instagram DM`,
      });
      await db.updateLead(lead.id, { notifiedAt: new Date() });
    }
  } catch (scoreErr) {
    console.error("[IG Webhook] Lead scoring failed (non-critical):", scoreErr);
  }

  // 11. Auto-detect handoff need (non-critical)
  try {
    if (conv.isAiActive && !conv.needsHandoff) {
      const allMsgs = [...historyForAI, { sender: "ai", content: aiResponse }];

      // Fast path: trigger handoff immediately on high intent or AI self-handoff
      const aiSelfHandoff = IG_HANDOFF_PHRASE_RE.test(aiResponse);
      if (fastIntent.highIntent || aiSelfHandoff) {
        const reason = fastIntent.highIntent
          ? `[Hot Lead] ${fastIntent.signal}: "${fastIntent.matched}"`
          : `[Hot Lead] AI flagged handoff in reply`;
        console.log(`[IG Webhook] Auto-handoff (fast): ${reason}`);
        await db.requestHandoff(conv.id, reason);
        await notifyOwner({
          title: `🔥 Hot Lead from Instagram: ${lead.name || "Unknown Lead"}`,
          content: `${reason}\n\nLast message: "${messageText.substring(0, 200)}"`,
        });
        await dispatchWebhookEvent(igAccount.userId, "conversation.handoff", {
          leadId: lead.id,
          leadName: lead.name,
          conversationId: conv.id,
          reason: "hot_lead",
          reasonDetail: reason,
          platform: "instagram",
        });
        return;
      }

      const handoffResult = await detectHandoff(allMsgs);
      if (handoffResult.shouldHandoff) {
        console.log(`[IG Webhook] Auto-handoff detected: ${handoffResult.reason}`);
        await db.requestHandoff(conv.id, `[Auto] ${handoffResult.reason}: ${handoffResult.reasonDetail}`);
        await notifyOwner({
          title: `Agent Handoff (Instagram): ${lead.name || "Unknown Lead"}`,
          content: `Reason: ${handoffResult.reason}\n${handoffResult.reasonDetail}\n\nConversation has been paused for human agent.`,
        });
        await dispatchWebhookEvent(igAccount.userId, "conversation.handoff", {
          leadId: lead.id,
          leadName: lead.name,
          conversationId: conv.id,
          reason: handoffResult.reason,
          reasonDetail: handoffResult.reasonDetail,
          platform: "instagram",
        });
      }
    }
  } catch (handoffErr) {
    console.error("[IG Webhook] Handoff detection failed (non-critical):", handoffErr);
  }

  // 12. Dispatch webhook events for new leads (non-critical)
  try {
    const leadMsgs = history.filter(m => m.sender === "lead");
    if (leadMsgs.length <= 1) {
      await dispatchWebhookEvent(igAccount.userId, "lead.created", {
        leadId: lead.id,
        leadName: lead.name,
        leadEmail: lead.email,
        leadPhone: lead.phone,
        platform: "instagram",
        source: lead.source,
      });
    }
  } catch (webhookErr) {
    console.error("[IG Webhook] Webhook dispatch failed (non-critical):", webhookErr);
  }

  console.log(`[IG Webhook] \u2705 Fully processed Instagram DM from ${senderIgScopedId} (lead=${lead.id}, conv=${conv.id})`);
}

// \u2500\u2500\u2500 Register Instagram Routes─────────────────────────

export function registerInstagramRoutes(app: Express) {

  // ─── Instagram OAuth: Initiate ────────────────────────────────────
  // Instagram DMs use the same Facebook OAuth but with additional instagram_basic,
  // instagram_manage_messages permissions. The IG account is linked to a FB Page.
  app.get("/api/auth/instagram", async (req: Request, res: Response) => {
    try {
      const cookies = req.headers.cookie || "";
      const sessionCookie = cookies.split(";").map(c => c.trim()).find(c => c.startsWith(`${COOKIE_NAME}=`));
      const token = sessionCookie?.split("=")[1];
      const session = await sdk.verifySession(token);
      if (!session) {
        return res.redirect("/?error=not_authenticated");
      }

      const redirectUri = `${ENV.appUrl}/api/auth/instagram/callback`;
      const scope = "pages_messaging,pages_manage_metadata,pages_read_engagement,instagram_basic,instagram_manage_messages";
      const state = Buffer.from(JSON.stringify({ userId: session.userId })).toString("base64");

      const authUrl = `https://www.facebook.com/v19.0/dialog/oauth?client_id=${ENV.facebookAppId}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${scope}&state=${state}`;

      res.redirect(authUrl);
    } catch (error) {
      console.error("[Instagram OAuth] Error:", error);
      res.redirect("/settings?tab=instagram&error=oauth_failed");
    }
  });

  // ─── Instagram OAuth: Callback ────────────────────────────────────
  app.get("/api/auth/instagram/callback", async (req: Request, res: Response) => {
    try {
      const { code, state } = req.query;
      if (!code || !state) {
        return res.redirect("/settings?tab=instagram&error=missing_code");
      }

      const stateData = JSON.parse(Buffer.from(state as string, "base64").toString());
      const userId = stateData.userId;

      // Exchange code for user access token
      const redirectUri = `${ENV.appUrl}/api/auth/instagram/callback`;
      const tokenUrl = `${FB_GRAPH}/oauth/access_token?client_id=${ENV.facebookAppId}&redirect_uri=${encodeURIComponent(redirectUri)}&client_secret=${ENV.facebookAppSecret}&code=${code}`;

      const tokenRes = await fetch(tokenUrl);
      if (!tokenRes.ok) {
        console.error("[Instagram OAuth] Token exchange failed:", await tokenRes.text());
        return res.redirect("/settings?tab=instagram&error=token_exchange_failed");
      }

      const tokenData = await tokenRes.json();
      const userAccessToken = tokenData.access_token;

      // Get long-lived token
      const longLivedUrl = `${FB_GRAPH}/oauth/access_token?grant_type=fb_exchange_token&client_id=${ENV.facebookAppId}&client_secret=${ENV.facebookAppSecret}&fb_exchange_token=${userAccessToken}`;
      const longLivedRes = await fetch(longLivedUrl);
      const longLivedData = longLivedRes.ok ? await longLivedRes.json() : { access_token: userAccessToken };
      const longLivedToken = longLivedData.access_token || userAccessToken;

      // Get user's pages (IG accounts are linked to FB Pages)
      const pagesUrl = `${FB_GRAPH}/me/accounts?access_token=${longLivedToken}&fields=id,name,access_token,instagram_business_account{id,username,name,profile_picture_url,followers_count}`;
      const pagesRes = await fetch(pagesUrl);
      if (!pagesRes.ok) {
        console.error("[Instagram OAuth] Failed to get pages");
        return res.redirect("/settings?tab=instagram&error=pages_fetch_failed");
      }

      const pagesData = await pagesRes.json();
      const pages = pagesData.data || [];

      let connectedCount = 0;

      for (const page of pages) {
        const igAccount = page.instagram_business_account;
        if (!igAccount) continue;

        // Look up the FB page in our DB
        const dbPage = await db.getPageByFacebookId(page.id);

        const existing = await db.getInstagramAccountByIgUserId(igAccount.id);
        if (existing) {
          await db.updateInstagramAccount(existing.id, {
            igUsername: igAccount.username || existing.igUsername,
            igName: igAccount.name || existing.igName,
            profilePicUrl: igAccount.profile_picture_url,
            followerCount: igAccount.followers_count || 0,
            pageAccessToken: page.access_token,
            facebookPageId: dbPage?.id || existing.facebookPageId,
          });
        } else {
          await db.createInstagramAccount({
            userId,
            facebookPageId: dbPage?.id || null,
            igUserId: igAccount.id,
            igUsername: igAccount.username || "unknown",
            igName: igAccount.name,
            profilePicUrl: igAccount.profile_picture_url,
            followerCount: igAccount.followers_count || 0,
            pageAccessToken: page.access_token,
            isActive: true,
          });
        }

        // Subscribe the page to instagram messaging webhooks
        try {
          const subscribeUrl = `${FB_GRAPH}/${page.id}/subscribed_apps?subscribed_fields=messages,messaging_postbacks&access_token=${page.access_token}`;
          const subRes = await fetch(subscribeUrl, { method: "POST" });
          if (subRes.ok) {
            console.log(`[Instagram] Subscribed page ${page.name} (${page.id}) for IG messaging webhooks`);
          }
        } catch (err) {
          console.error(`[Instagram] Webhook subscription error for page ${page.id}:`, err);
        }

        connectedCount++;
      }

      if (connectedCount === 0) {
        return res.redirect("/settings?tab=instagram&error=no_ig_accounts");
      }

      res.redirect("/settings?tab=instagram&success=connected");
    } catch (error) {
      console.error("[Instagram OAuth] Callback error:", error);
      res.redirect("/settings?tab=instagram&error=callback_failed");
    }
  });

  // ─── Instagram Webhook: Verification ──────────────────────────────
  app.get("/api/webhook/instagram", (req: Request, res: Response) => {
    const mode = req.query["hub.mode"];
    const token = req.query["hub.verify_token"];
    const challenge = req.query["hub.challenge"];

    console.log("[IG Webhook] Verification request:", { mode, token: token ? "***" : "missing" });

    if (mode === "subscribe" && token === ENV.facebookVerifyToken) {
      console.log("[IG Webhook] Verification successful");
      return res.status(200).send(challenge);
    }

    console.error("[IG Webhook] Verification failed");
    return res.sendStatus(403);
  });

  // ─── Instagram Webhook: Incoming DMs ──────────────────────────────
  app.post("/api/webhook/instagram", async (req: Request, res: Response) => {
    console.log("[IG Webhook] POST /api/webhook/instagram received");

    try {
      const body = req.body;
      if (body.object !== "instagram") {
        console.warn("[IG Webhook] Ignoring non-instagram object:", body.object);
        return res.sendStatus(200);
      }

      for (const entry of body.entry || []) {
        const igUserId = entry.id;

        for (const event of entry.messaging || []) {
          const senderIgScopedId = event.sender?.id;
          if (!senderIgScopedId || senderIgScopedId === igUserId) continue;

          if (event.message?.text) {
            // Look up the IG account in our database
            const igAccount = await db.getInstagramAccountByIgUserId(igUserId);
            if (!igAccount || !igAccount.pageAccessToken) {
              console.warn(`[IG Webhook] Unknown/unconfigured IG account: ${igUserId}`);
              continue;
            }

            try {
              await processIncomingInstagramMessage(
                {
                  igUserId: igAccount.igUserId,
                  pageAccessToken: igAccount.pageAccessToken,
                  userId: igAccount.userId,
                  dbAccountId: igAccount.id,
                  facebookPageId: igAccount.facebookPageId,
                  aiMode: igAccount.aiMode || "testing",
                },
                senderIgScopedId,
                event.message.text
              );
            } catch (err) {
              console.error(`[IG Webhook] processIncomingInstagramMessage failed:`, err);
            }
          }
        }
      }
    } catch (error) {
      console.error("[IG Webhook] Top-level error:", error);
    }

    return res.sendStatus(200);
  });

  // ─── API: Get Instagram OAuth URL ─────────────────────────────────
  app.get("/api/instagram/auth-url", async (req: Request, res: Response) => {
    try {
      const cookies = req.headers.cookie || "";
      const sessionCookie = cookies.split(";").map(c => c.trim()).find(c => c.startsWith(`${COOKIE_NAME}=`));
      const token = sessionCookie?.split("=")[1];
      const session = await sdk.verifySession(token);
      if (!session) {
        return res.status(401).json({ error: "Not authenticated" });
      }

      const redirectUri = `${ENV.appUrl}/api/auth/instagram/callback`;
      const scope = "pages_messaging,pages_manage_metadata,pages_read_engagement,instagram_basic,instagram_manage_messages";
      const state = Buffer.from(JSON.stringify({ userId: session.userId })).toString("base64");

      const authUrl = `https://www.facebook.com/v19.0/dialog/oauth?client_id=${ENV.facebookAppId}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${scope}&state=${state}`;

      return res.json({ url: authUrl, appId: ENV.facebookAppId });
    } catch (error) {
      console.error("[Instagram] Auth URL error:", error);
      return res.status(500).json({ error: "Failed to generate auth URL" });
    }
  });
}
