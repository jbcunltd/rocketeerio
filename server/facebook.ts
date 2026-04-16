import type { Express, Request, Response } from "express";
import { ENV } from "./_core/env";
import { sdk } from "./_core/sdk";
import { COOKIE_NAME } from "../shared/const";
import * as db from "./db";
import { generateAIResponse, scoreLead, detectHandoff } from "./ai-engine";
import { notifyOwner } from "./_core/notification";
import { dispatchWebhookEvent } from "./webhook-dispatcher";
import { dispatchLeadAlert } from "./hot-lead-alerts";
import { checkLeadLimit, checkConversationLimit, getPlanLimits } from "./plan-limits";

const FB_GRAPH = "https://graph.facebook.com/v19.0";

// In-memory temporary token store (keyed by userId, expires after 15 minutes)
const tempTokenStore = new Map<number, { token: string; expiresAt: number }>();

function storeTempToken(userId: number, token: string) {
  tempTokenStore.set(userId, { token, expiresAt: Date.now() + 15 * 60 * 1000 });
}

function getTempToken(userId: number): string | null {
  const entry = tempTokenStore.get(userId);
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) {
    tempTokenStore.delete(userId);
    return null;
  }
  return entry.token;
}

function clearTempToken(userId: number) {
  tempTokenStore.delete(userId);
}

// ─── Messenger Send API ──────────────────────────────────────────────

async function sendMessengerMessage(pageAccessToken: string, recipientPsid: string, text: string) {
  const url = `${FB_GRAPH}/me/messages?access_token=${pageAccessToken}`;
  const body = {
    recipient: { id: recipientPsid },
    message: { text },
    messaging_type: "RESPONSE",
  };

  console.log(`[Messenger] Sending reply to ${recipientPsid}, length=${text.length}`);

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const errText = await res.text();
    console.error("[Messenger] Send failed:", res.status, errText);
    return false;
  }
  console.log(`[Messenger] Reply sent successfully to ${recipientPsid}`);
  return true;
}

// ─── Get Facebook User Profile ───────────────────────────────────────

async function getFacebookUserProfile(psid: string, pageAccessToken: string) {
  try {
    const res = await fetch(
      `${FB_GRAPH}/${psid}?fields=first_name,last_name,profile_pic&access_token=${pageAccessToken}`
    );
    if (!res.ok) {
      console.warn(`[Messenger] Profile fetch failed for ${psid}: ${res.status}`);
      return null;
    }
    const data = await res.json();
    return {
      name: [data.first_name, data.last_name].filter(Boolean).join(" ") || null,
      avatarUrl: data.profile_pic || null,
    };
  } catch (err) {
    console.error(`[Messenger] Profile fetch error for ${psid}:`, err);
    return null;
  }
}

// ─── Process Incoming Message ────────────────────────────────────────

async function sendTestingModeReply(pageAccessToken: string, recipientPsid: string) {
  const text = "Thanks for your message! We're currently setting things up and will get back to you shortly.";
  await sendMessengerMessage(pageAccessToken, recipientPsid, text);
}

async function processIncomingMessage(
  pageEntry: { pageId: string; pageAccessToken: string; userId: number; dbPageId: number; aiMode: string },
  senderPsid: string,
  messageText: string
) {
  console.log(`[Webhook] Processing message from ${senderPsid} to page ${pageEntry.pageId}: "${messageText.substring(0, 80)}"`);

  // 0. Check page AI mode
  const mode = pageEntry.aiMode || "testing";

  if (mode === "paused") {
    console.log(`[Webhook] Page ${pageEntry.pageId} is PAUSED — ignoring message from ${senderPsid}`);
    return;
  }

  if (mode === "testing") {
    const isTester = await db.isTesterPsid(pageEntry.dbPageId, senderPsid);
    if (!isTester) {
      console.log(`[Webhook] Page ${pageEntry.pageId} is in TESTING mode — sender ${senderPsid} is NOT a tester, sending courtesy reply`);
      if (pageEntry.pageAccessToken) {
        await sendTestingModeReply(pageEntry.pageAccessToken, senderPsid);
      }
      return;
    }
    console.log(`[Webhook] Page ${pageEntry.pageId} is in TESTING mode — sender ${senderPsid} IS a tester, proceeding`);
  }

  // mode === "live" or tester in testing mode — proceed normally

  // 1. Find or create lead (with plan enforcement)
  const user = await db.getUserById(pageEntry.userId);
  const userPlan = user?.plan || "free";

  let lead = await db.getLeadByPsid(senderPsid, pageEntry.dbPageId);
  if (!lead) {
    // Check lead limit before creating
    const leadCheck = await checkLeadLimit(pageEntry.userId, userPlan);
    if (!leadCheck.allowed) {
      console.warn(`[Webhook] Lead limit reached for user ${pageEntry.userId} (${leadCheck.currentCount}/${leadCheck.limit}). Skipping new lead creation.`);
      // Still send a courtesy reply
      if (pageEntry.pageAccessToken) {
        await sendMessengerMessage(pageEntry.pageAccessToken, senderPsid,
          "Thanks for reaching out! We're currently at capacity but will get back to you soon.");
      }
      return;
    }

    console.log(`[Webhook] Creating new lead for PSID ${senderPsid}`);
    const profile = await getFacebookUserProfile(senderPsid, pageEntry.pageAccessToken);
    const leadId = await db.createLead({
      userId: pageEntry.userId,
      pageId: pageEntry.dbPageId,
      psid: senderPsid,
      name: profile?.name || `Messenger User`,
      avatarUrl: profile?.avatarUrl || undefined,
      source: "messenger",
      status: "active",
    });
    if (!leadId) { console.error("[Webhook] Failed to create lead"); return; }
    lead = await db.getLeadById(leadId);
    if (!lead) { console.error("[Webhook] Failed to fetch newly created lead"); return; }
    console.log(`[Webhook] Created lead id=${leadId}, name=${lead.name}`);
  } else {
    console.log(`[Webhook] Found existing lead id=${lead.id}, name=${lead.name}`);
  }

  // 2. Find or create conversation (with plan enforcement)
  let conv = await db.getConversationByLeadId(lead.id);
  if (!conv) {
    // Check conversation limit before creating
    const convCheck = await checkConversationLimit(pageEntry.userId, userPlan);
    if (!convCheck.allowed) {
      console.warn(`[Webhook] Conversation limit reached for user ${pageEntry.userId} (${convCheck.currentCount}/${convCheck.limit}). Skipping.`);
      if (pageEntry.pageAccessToken) {
        await sendMessengerMessage(pageEntry.pageAccessToken, senderPsid,
          "Thanks for your message! Our team will get back to you shortly.");
      }
      return;
    }

    console.log(`[Webhook] Creating new conversation for lead ${lead.id}`);
    const convId = await db.createConversation({
      userId: pageEntry.userId,
      pageId: pageEntry.dbPageId,
      leadId: lead.id,
      lastMessagePreview: messageText.substring(0, 200),
      messageCount: 0,
      status: "open",
    });
    if (!convId) { console.error("[Webhook] Failed to create conversation"); return; }
    conv = await db.getConversationByLeadId(lead.id);
    if (!conv) { console.error("[Webhook] Failed to fetch newly created conversation"); return; }
    console.log(`[Webhook] Created conversation id=${convId}`);
  } else {
    console.log(`[Webhook] Found existing conversation id=${conv.id}`);
  }

  // 3. Save incoming message
  await db.createMessage({
    conversationId: conv.id,
    content: messageText,
    sender: "lead",
    messageType: "text",
  });
  console.log(`[Webhook] Saved lead message to conversation ${conv.id}`);

  // 4. Check if AI is active for this conversation
  if (!conv.isAiActive) {
    console.log(`[Webhook] AI disabled for conversation ${conv.id}, skipping auto-reply`);
    return;
  }

  // 5. Get conversation history
  const history = await db.getMessagesByConversation(conv.id);
  const historyForAI = history.map(m => ({ sender: m.sender, content: m.content }));
  console.log(`[Webhook] Loaded ${history.length} messages for AI context`);

  // 6. Generate AI response
  console.log(`[Webhook] Calling OpenAI for AI response...`);
  const convDetail = await db.getConversationById(conv.id);
  const aiResponse = await generateAIResponse(
    pageEntry.userId,
    historyForAI,
    lead.name,
    convDetail?.page?.pageName ?? "Our Business",
    pageEntry.dbPageId
  );
  console.log(`[Webhook] AI response generated, length=${aiResponse.length}`);

  // 7. Save AI response
  await db.createMessage({
    conversationId: conv.id,
    content: aiResponse,
    sender: "ai",
    messageType: "text",
  });
  console.log(`[Webhook] Saved AI message to conversation ${conv.id}`);

  // 8. Send reply via Messenger
  if (pageEntry.pageAccessToken) {
    const sent = await sendMessengerMessage(pageEntry.pageAccessToken, senderPsid, aiResponse);
    console.log(`[Webhook] Messenger send result: ${sent}`);
  } else {
    console.warn(`[Webhook] No page access token, cannot send Messenger reply`);
  }

  // 9. Update conversation
  await db.updateConversation(conv.id, {
    lastMessagePreview: aiResponse.substring(0, 200),
    lastMessageAt: new Date(),
    messageCount: history.length + 2,
  });

  // 10. Score lead (non-critical — wrap in try/catch so it doesn't block the reply)
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

    // 11. Dispatch hot lead alert via multi-channel notification system
    const prevClassification = lead.classification;
    const newClassification = scoreResult.classification;
    const shouldAlert =
      (newClassification === "hot" && prevClassification !== "hot") ||
      (newClassification === "warm" && prevClassification === "cold");

    if (shouldAlert) {
      await dispatchLeadAlert({
        userId: pageEntry.userId,
        userPlan,
        leadId: lead.id,
        leadName: lead.name || "Unknown",
        leadScore: scoreResult.score,
        classification: newClassification as "hot" | "warm" | "cold",
        lastMessage: messageText,
        pageName: convDetail?.page?.pageName || "Unknown Page",
        conversationId: conv.id,
        budgetNotes: scoreResult.budgetNotes,
        needNotes: scoreResult.needNotes,
        timelineNotes: scoreResult.timelineNotes,
      });
      await db.updateLead(lead.id, { notifiedAt: new Date() });
    }

    console.log(`[Webhook] Lead scored: ${scoreResult.score}/100 (${scoreResult.classification})`);
  } catch (scoreErr) {
    console.error("[Webhook] Lead scoring failed (non-critical):", scoreErr);
  }

  // 12. Auto-schedule follow-ups on first contact (non-critical)
  try {
    const leadMessages = history.filter(m => m.sender === "lead");
    if (leadMessages.length <= 1) {
      const now = Date.now();
      const delays = [30, 120, 720];
      const followUpMessages = [
        "Hi! Just checking in — did you have any other questions about what we discussed?",
        "Hey! I wanted to follow up on our conversation. Is there anything else I can help you with?",
        "Hi there! I noticed we chatted earlier. I'd love to help you move forward — feel free to ask me anything!",
      ];
      for (let i = 0; i < delays.length; i++) {
        await db.createFollowUp({
          conversationId: conv.id,
          leadId: lead.id,
          delayMinutes: delays[i],
          scheduledAt: now + delays[i] * 60 * 1000,
          messageContent: followUpMessages[i],
        });
      }
      console.log(`[Webhook] Scheduled ${delays.length} follow-ups for lead ${lead.id}`);
    }
  } catch (followUpErr) {
    console.error("[Webhook] Follow-up scheduling failed (non-critical):", followUpErr);
  }
  // 13. Auto-detect handoff need (non-critical)
  try {
    if (conv.isAiActive && !conv.needsHandoff) {
      const allMsgs = [...historyForAI, { sender: "ai", content: aiResponse }];
      const handoffResult = await detectHandoff(allMsgs);
      if (handoffResult.shouldHandoff) {
        console.log(`[Webhook] Auto-handoff detected: ${handoffResult.reason} — ${handoffResult.reasonDetail}`);
        await db.requestHandoff(conv.id, `[Auto] ${handoffResult.reason}: ${handoffResult.reasonDetail}`);
        // Notify via multi-channel alert system for handoffs
        await dispatchLeadAlert({
          userId: pageEntry.userId,
          userPlan,
          leadId: lead.id,
          leadName: lead.name || "Unknown",
          leadScore: lead.score || 0,
          classification: "hot", // Handoffs are treated as hot alerts
          lastMessage: `[HANDOFF] ${handoffResult.reason}: ${handoffResult.reasonDetail}`,
          pageName: convDetail?.page?.pageName || "Unknown Page",
          conversationId: conv.id,
        });
        // Dispatch webhook event
        await dispatchWebhookEvent(pageEntry.userId, "conversation.handoff", {
          leadId: lead.id,
          leadName: lead.name,
          conversationId: conv.id,
          reason: handoffResult.reason,
          reasonDetail: handoffResult.reasonDetail,
          platform: "messenger",
        });
      }
    }
  } catch (handoffErr) {
    console.error("[Webhook] Handoff detection failed (non-critical):", handoffErr);
  }

  // 14. Dispatch webhook events for new leads (non-critical)
  try {
    const leadMsgs = history.filter(m => m.sender === "lead");
    if (leadMsgs.length <= 1) {
      await dispatchWebhookEvent(pageEntry.userId, "lead.created", {
        leadId: lead.id,
        leadName: lead.name,
        leadEmail: lead.email,
        leadPhone: lead.phone,
        platform: "messenger",
        source: lead.source,
      });
    }
  } catch (webhookErr) {
    console.error("[Webhook] Webhook dispatch failed (non-critical):", webhookErr);
  }

  console.log(`[Webhook] \u2705 Fully processed message from ${senderPsid} (lead=${lead.id}, conv=${conv.id})`);
}

// ─── Register Facebook Routes ────────────────────────────────────────

export function registerFacebookRoutes(app: Express) {

  // ─── Facebook OAuth: Initiate ──────────────────────────────────────
  app.get("/api/auth/facebook", async (req: Request, res: Response) => {
    try {
      // Verify user is logged in
      const cookies = req.headers.cookie || "";
      const sessionCookie = cookies.split(";").map(c => c.trim()).find(c => c.startsWith(`${COOKIE_NAME}=`));
      const token = sessionCookie?.split("=")[1];
      const session = await sdk.verifySession(token);
      if (!session) {
        return res.redirect("/?error=not_authenticated");
      }

      const redirectUri = `${ENV.appUrl}/api/auth/facebook/callback`;
      const scope = "pages_messaging,pages_manage_metadata,pages_show_list,business_management";
      const state = Buffer.from(JSON.stringify({ userId: session.userId })).toString("base64");

      const authUrl = `https://www.facebook.com/v19.0/dialog/oauth?client_id=${ENV.facebookAppId}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${scope}&state=${state}`;

      res.redirect(authUrl);
    } catch (error) {
      console.error("[Facebook OAuth] Error:", error);
      res.redirect("/settings?tab=pages&error=oauth_failed");
    }
  });

  // ─── Facebook OAuth: Callback ──────────────────────────────────────
  app.get("/api/auth/facebook/callback", async (req: Request, res: Response) => {
    try {
      const { code, state } = req.query;
      if (!code || !state) {
        return res.redirect("/settings?tab=pages&error=missing_code");
      }

      // Decode state to get userId
      const stateData = JSON.parse(Buffer.from(state as string, "base64").toString());
      const userId = stateData.userId;

      // Exchange code for user access token
      const redirectUri = `${ENV.appUrl}/api/auth/facebook/callback`;
      const tokenUrl = `${FB_GRAPH}/oauth/access_token?client_id=${ENV.facebookAppId}&redirect_uri=${encodeURIComponent(redirectUri)}&client_secret=${ENV.facebookAppSecret}&code=${code}`;

      const tokenRes = await fetch(tokenUrl);
      if (!tokenRes.ok) {
        const err = await tokenRes.text();
        console.error("[Facebook OAuth] Token exchange failed:", err);
        return res.redirect("/settings?tab=pages&error=token_exchange_failed");
      }

      const tokenData = await tokenRes.json();
      const userAccessToken = tokenData.access_token;

      // Get long-lived token
      const longLivedUrl = `${FB_GRAPH}/oauth/access_token?grant_type=fb_exchange_token&client_id=${ENV.facebookAppId}&client_secret=${ENV.facebookAppSecret}&fb_exchange_token=${userAccessToken}`;
      const longLivedRes = await fetch(longLivedUrl);
      const longLivedData = longLivedRes.ok ? await longLivedRes.json() : { access_token: userAccessToken };
      const longLivedToken = longLivedData.access_token || userAccessToken;

      // Get user's pages
      // Don't fetch pages here — the page picker will do that.
      // Just verify the token is valid by fetching the user's ID.
      const meUrl = `${FB_GRAPH}/me?access_token=${longLivedToken}`;
      const meRes = await fetch(meUrl);
      if (!meRes.ok) {
        console.error("[Facebook OAuth] Failed to verify token");
        return res.redirect("/settings?tab=pages&error=token_verification_failed");
      }

      // DO NOT auto-import pages. Only store the user-level access token.
      // The page picker will fetch available pages and let the user choose which to connect.
      storeTempToken(userId, longLivedToken);

      // Redirect to the page picker
      res.redirect(`/connect/pages`);
    } catch (error) {
      console.error("[Facebook OAuth] Callback error:", error);
      res.redirect("/settings?tab=pages&error=callback_failed");
    }
  });

  // ─── Messenger Webhook: Verification ───────────────────────────────
  app.get("/api/webhook/facebook", (req: Request, res: Response) => {
    const mode = req.query["hub.mode"];
    const token = req.query["hub.verify_token"];
    const challenge = req.query["hub.challenge"];

    console.log("[Webhook] Verification request:", { mode, token: token ? "***" : "missing" });

    if (mode === "subscribe" && token === ENV.facebookVerifyToken) {
      console.log("[Webhook] Verification successful");
      return res.status(200).send(challenge);
    }

    console.error("[Webhook] Verification failed");
    return res.sendStatus(403);
  });

  // ─── Messenger Webhook: Incoming Messages ──────────────────────────
  // IMPORTANT: We must await ALL processing before sending the 200 response.
  // On Vercel (especially Hobby plan), the serverless function is terminated
  // immediately after the response is sent. Fire-and-forget async work will
  // be killed. Facebook allows up to 20 seconds for the webhook response.
  app.post("/api/webhook/facebook", async (req: Request, res: Response) => {
    console.log("[Webhook] POST /api/webhook/facebook received");

    try {
      const body = req.body;
      if (body.object !== "page") {
        console.warn("[Webhook] Ignoring non-page object:", body.object);
        return res.sendStatus(200);
      }

      console.log(`[Webhook] Processing ${(body.entry || []).length} entry(ies)`);

      for (const entry of body.entry || []) {
        const pageId = entry.id;
        console.log(`[Webhook] Entry for page ${pageId}, messaging events: ${(entry.messaging || []).length}`);

        // Look up the page in our database
        const page = await db.getPageByFacebookId(pageId);
        if (!page || !page.pageAccessToken) {
          console.warn(`[Webhook] Received message for unknown/unconfigured page: ${pageId}`);
          continue;
        }

        for (const event of entry.messaging || []) {
          const senderPsid = event.sender?.id;
          if (!senderPsid || senderPsid === pageId) {
            console.log(`[Webhook] Skipping event: sender=${senderPsid}, pageId=${pageId}`);
            continue;
          }

          if (event.message?.text) {
            // Process text message — AWAIT it so it completes before we return 200
            try {
              await processIncomingMessage(
                {
                  pageId: page.pageId,
                  pageAccessToken: page.pageAccessToken,
                  userId: page.userId,
                  dbPageId: page.id,
                  aiMode: (page as any).aiMode || "testing",
                },
                senderPsid,
                event.message.text
              );
            } catch (err) {
              console.error(`[Webhook] processIncomingMessage failed for sender=${senderPsid}:`, err);
            }
          } else {
            console.log(`[Webhook] Non-text event from ${senderPsid}, skipping`);
          }
        }
      }
    } catch (error) {
      console.error("[Webhook] Top-level error processing webhook:", error);
    }

    // Return 200 AFTER all processing is complete
    return res.sendStatus(200);
  });

  // ─── API: Get Facebook OAuth URL (for frontend) ────────────────────
  app.get("/api/facebook/auth-url", async (req: Request, res: Response) => {
    try {
      const cookies = req.headers.cookie || "";
      const sessionCookie = cookies.split(";").map(c => c.trim()).find(c => c.startsWith(`${COOKIE_NAME}=`));
      const token = sessionCookie?.split("=")[1];
      const session = await sdk.verifySession(token);
      if (!session) {
        return res.status(401).json({ error: "Not authenticated" });
      }

      const redirectUri = `${ENV.appUrl}/api/auth/facebook/callback`;
      const scope = "pages_messaging,pages_manage_metadata,pages_show_list,business_management";
      const state = Buffer.from(JSON.stringify({ userId: session.userId })).toString("base64");

      const authUrl = `https://www.facebook.com/v19.0/dialog/oauth?client_id=${ENV.facebookAppId}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${scope}&state=${state}`;

      return res.json({ url: authUrl, appId: ENV.facebookAppId });
    } catch (error) {
      console.error("[Facebook] Auth URL error:", error);
      return res.status(500).json({ error: "Failed to generate auth URL" });
    }
  });

  // ─── API: Get Available Facebook Pages (for page picker) ──────────
  app.get("/api/facebook/available-pages", async (req: Request, res: Response) => {
    try {
      const cookies = req.headers.cookie || "";
      const sessionCookie = cookies.split(";").map(c => c.trim()).find(c => c.startsWith(`${COOKIE_NAME}=`));
      const token = sessionCookie?.split("=")[1];
      const session = await sdk.verifySession(token);
      if (!session) {
        return res.status(401).json({ error: "Not authenticated" });
      }

      const userToken = getTempToken(session.userId);
      if (!userToken) {
        return res.status(400).json({ error: "no_token", message: "No Facebook token found. Please reconnect Facebook." });
      }

      const pagesUrl = `${FB_GRAPH}/me/accounts?access_token=${userToken}&fields=id,name,category,access_token,picture,fan_count`;
      const pagesRes = await fetch(pagesUrl);
      if (!pagesRes.ok) {
        console.error("[Facebook] Failed to fetch available pages");
        return res.status(500).json({ error: "Failed to fetch pages from Facebook" });
      }

      const pagesData = await pagesRes.json();
      const fbPages = pagesData.data || [];

      // Check which pages are already connected (have valid pageAccessToken)
      const existingPages = await db.getUserPages(session.userId);
      const connectedPageIds = new Set(
        existingPages
          .filter(p => p.pageAccessToken) // Only pages with valid tokens
          .map(p => p.pageId)
      );

      const result = fbPages.map((p: any) => ({
        fbPageId: p.id,
        name: p.name,
        category: p.category || "",
        avatarUrl: p.picture?.data?.url || "",
        fanCount: p.fan_count || 0,
        isConnected: connectedPageIds.has(p.id),
        accessToken: p.access_token,
      }));

      return res.json({ pages: result });
    } catch (error) {
      console.error("[Facebook] Available pages error:", error);
      return res.status(500).json({ error: "Failed to get available pages" });
    }
  });

  // ─── API: Subscribe (connect) a single Facebook Page ──────────────
  app.post("/api/facebook/subscribe-page", async (req: Request, res: Response) => {
    try {
      const cookies = req.headers.cookie || "";
      const sessionCookie = cookies.split(";").map(c => c.trim()).find(c => c.startsWith(`${COOKIE_NAME}=`));
      const token = sessionCookie?.split("=")[1];
      const session = await sdk.verifySession(token);
      if (!session) {
        return res.status(401).json({ error: "Not authenticated" });
      }

      const { fbPageId, name, category, avatarUrl, fanCount, accessToken } = req.body;
      if (!fbPageId || !accessToken) {
        return res.status(400).json({ error: "Missing required fields" });
      }

      // Check plan limit
      const userRecord = await db.getUserById(session.userId);
      const userPlan = userRecord?.plan || "free";
      const currentPages = await db.getUserPages(session.userId);
      const planLimits = getPlanLimits(userPlan);
      if (currentPages.length >= planLimits.maxFacebookPages) {
        return res.status(403).json({ error: "plan_limit", message: `Your ${userPlan} plan allows ${planLimits.maxFacebookPages} page(s). Upgrade to connect more.` });
      }

      // Check if page already exists
      let pageId: number | null = null;
      const existing = await db.getPageByFacebookId(fbPageId);
      if (existing) {
        // Update token
        await db.updatePage(existing.id, {
          pageAccessToken: accessToken,
          pageName: name,
          category,
          avatarUrl,
          followerCount: fanCount || 0,
        });
        pageId = existing.id;
      } else {
        // Create new page
        pageId = await db.createPage({
          userId: session.userId,
          pageId: fbPageId,
          pageName: name,
          pageAccessToken: accessToken,
          category,
          avatarUrl,
          followerCount: fanCount || 0,
          isActive: true,
        });
      }

      // Subscribe to webhooks
      try {
        const subscribeUrl = `${FB_GRAPH}/${fbPageId}/subscribed_apps?subscribed_fields=messages,messaging_postbacks,messaging_optins&access_token=${accessToken}`;
        const subRes = await fetch(subscribeUrl, { method: "POST" });
        if (subRes.ok) {
          console.log(`[Facebook] Subscribed page ${name} (${fbPageId}) to webhooks`);
        } else {
          console.error(`[Facebook] Failed to subscribe page ${fbPageId}:`, await subRes.text());
        }
      } catch (err) {
        console.error(`[Facebook] Webhook subscription error for ${fbPageId}:`, err);
      }

      return res.json({ success: true, pageId });
    } catch (error) {
      console.error("[Facebook] Subscribe page error:", error);
      return res.status(500).json({ error: "Failed to connect page" });
    }
  });

  // ─── API: Refresh pages (re-fetch from Facebook) ──────────────────
  app.post("/api/facebook/refresh-pages", async (req: Request, res: Response) => {
    try {
      const cookies = req.headers.cookie || "";
      const sessionCookie = cookies.split(";").map(c => c.trim()).find(c => c.startsWith(`${COOKIE_NAME}=`));
      const token = sessionCookie?.split("=")[1];
      const session = await sdk.verifySession(token);
      if (!session) {
        return res.status(401).json({ error: "Not authenticated" });
      }

      const userToken = getTempToken(session.userId);
      if (!userToken) {
        return res.status(400).json({ error: "no_token", message: "Token expired. Please reconnect Facebook." });
      }

      const pagesUrl = `${FB_GRAPH}/me/accounts?access_token=${userToken}&fields=id,name,category,access_token,picture,fan_count`;
      const pagesRes = await fetch(pagesUrl);
      if (!pagesRes.ok) {
        return res.status(500).json({ error: "Failed to refresh pages from Facebook" });
      }

      const pagesData = await pagesRes.json();
      const fbPages = pagesData.data || [];

      const existingPages = await db.getUserPages(session.userId);
      const connectedPageIds = new Set(existingPages.map(p => p.pageId));

      const result = fbPages.map((p: any) => ({
        fbPageId: p.id,
        name: p.name,
        category: p.category || "",
        avatarUrl: p.picture?.data?.url || "",
        fanCount: p.fan_count || 0,
        isConnected: connectedPageIds.has(p.id),
        accessToken: p.access_token,
      }));

      return res.json({ pages: result });
    } catch (error) {
      console.error("[Facebook] Refresh pages error:", error);
      return res.status(500).json({ error: "Failed to refresh pages" });
    }
  });
}
