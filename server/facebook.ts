import type { Express, Request, Response } from "express";
import { ENV } from "./_core/env";
import { sdk } from "./_core/sdk";
import { COOKIE_NAME } from "../shared/const";
import * as db from "./db";
import { generateAIResponse, scoreLead } from "./ai-engine";
import { notifyOwner } from "./_core/notification";

const FB_GRAPH = "https://graph.facebook.com/v19.0";

// ─── Messenger Send API ──────────────────────────────────────────────

async function sendMessengerMessage(pageAccessToken: string, recipientPsid: string, text: string) {
  const url = `${FB_GRAPH}/me/messages?access_token=${pageAccessToken}`;
  const body = {
    recipient: { id: recipientPsid },
    message: { text },
    messaging_type: "RESPONSE",
  };

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
  return true;
}

// ─── Get Facebook User Profile ───────────────────────────────────────

async function getFacebookUserProfile(psid: string, pageAccessToken: string) {
  try {
    const res = await fetch(
      `${FB_GRAPH}/${psid}?fields=first_name,last_name,profile_pic&access_token=${pageAccessToken}`
    );
    if (!res.ok) return null;
    const data = await res.json();
    return {
      name: [data.first_name, data.last_name].filter(Boolean).join(" ") || null,
      avatarUrl: data.profile_pic || null,
    };
  } catch {
    return null;
  }
}

// ─── Process Incoming Message ────────────────────────────────────────

async function processIncomingMessage(
  pageEntry: { pageId: string; pageAccessToken: string; userId: number; dbPageId: number },
  senderPsid: string,
  messageText: string
) {
  console.log(`[Webhook] Message from ${senderPsid} to page ${pageEntry.pageId}: "${messageText.substring(0, 50)}..."`);

  // 1. Find or create lead
  let lead = await db.getLeadByPsid(senderPsid, pageEntry.dbPageId);
  if (!lead) {
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
    if (!lead) return;
  }

  // 2. Find or create conversation
  let conv = await db.getConversationByLeadId(lead.id);
  if (!conv) {
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
    if (!conv) return;
  }

  // 3. Save incoming message
  await db.createMessage({
    conversationId: conv.id,
    content: messageText,
    sender: "lead",
    messageType: "text",
  });

  // 4. Check if AI is active for this conversation
  if (!conv.isAiActive) {
    console.log(`[Webhook] AI disabled for conversation ${conv.id}, skipping auto-reply`);
    return;
  }

  // 5. Get conversation history
  const history = await db.getMessagesByConversation(conv.id);
  const historyForAI = history.map(m => ({ sender: m.sender, content: m.content }));

  // 6. Generate AI response
  const convDetail = await db.getConversationById(conv.id);
  const aiResponse = await generateAIResponse(
    pageEntry.userId,
    historyForAI,
    lead.name,
    convDetail?.page?.pageName ?? "Our Business"
  );

  // 7. Save AI response
  await db.createMessage({
    conversationId: conv.id,
    content: aiResponse,
    sender: "ai",
    messageType: "text",
  });

  // 8. Send reply via Messenger
  if (pageEntry.pageAccessToken) {
    await sendMessengerMessage(pageEntry.pageAccessToken, senderPsid, aiResponse);
  }

  // 9. Update conversation
  await db.updateConversation(conv.id, {
    lastMessagePreview: aiResponse.substring(0, 200),
    lastMessageAt: new Date(),
    messageCount: history.length + 2,
  });

  // 10. Score lead
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

  // 11. Notify if hot lead
  if (scoreResult.classification === "hot" && !lead.notifiedAt) {
    await notifyOwner({
      title: `Hot Lead Detected: ${lead.name || "Unknown"}`,
      content: `Score: ${scoreResult.score}/100\nLast message: ${messageText}\n\nBudget: ${scoreResult.budgetNotes}\nNeed: ${scoreResult.needNotes}\nTimeline: ${scoreResult.timelineNotes}`,
    });
    await db.updateLead(lead.id, { notifiedAt: new Date() });
  }

  // 12. Auto-schedule follow-ups on first contact
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
  }

  console.log(`[Webhook] Replied to ${senderPsid} with AI response (score: ${scoreResult.score})`);
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
      const scope = "pages_messaging,pages_manage_metadata,pages_read_engagement";
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
      const pagesUrl = `${FB_GRAPH}/me/accounts?access_token=${longLivedToken}&fields=id,name,category,access_token,picture,fan_count`;
      const pagesRes = await fetch(pagesUrl);
      if (!pagesRes.ok) {
        console.error("[Facebook OAuth] Failed to get pages");
        return res.redirect("/settings?tab=pages&error=pages_fetch_failed");
      }

      const pagesData = await pagesRes.json();
      const pages = pagesData.data || [];

      if (pages.length === 0) {
        return res.redirect("/settings?tab=pages&error=no_pages");
      }

      // Store pages in a temporary way — redirect to page selection
      // For MVP, auto-connect all pages (or first page)
      for (const page of pages) {
        const existing = await db.getPageByFacebookId(page.id);
        if (existing) {
          // Update token
          await db.updatePage(existing.id, {
            pageAccessToken: page.access_token,
            pageName: page.name,
            category: page.category,
            avatarUrl: page.picture?.data?.url,
            followerCount: page.fan_count || 0,
          });
        } else {
          await db.createPage({
            userId,
            pageId: page.id,
            pageName: page.name,
            pageAccessToken: page.access_token,
            category: page.category,
            avatarUrl: page.picture?.data?.url,
            followerCount: page.fan_count || 0,
            isActive: true,
          });
        }

        // Subscribe to webhooks for this page
        try {
          const subscribeUrl = `${FB_GRAPH}/${page.id}/subscribed_apps?subscribed_fields=messages,messaging_postbacks,messaging_optins&access_token=${page.access_token}`;
          const subRes = await fetch(subscribeUrl, { method: "POST" });
          if (subRes.ok) {
            console.log(`[Facebook] Subscribed page ${page.name} (${page.id}) to webhooks`);
          } else {
            console.error(`[Facebook] Failed to subscribe page ${page.id}:`, await subRes.text());
          }
        } catch (err) {
          console.error(`[Facebook] Webhook subscription error for ${page.id}:`, err);
        }
      }

      res.redirect("/settings?tab=pages&success=connected");
    } catch (error) {
      console.error("[Facebook OAuth] Callback error:", error);
      res.redirect("/settings?tab=pages&error=callback_failed");
    }
  });

  // ─── Messenger Webhook: Verification ───────────────────────────────
  app.get("/api/webhook/messenger", (req: Request, res: Response) => {
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
  app.post("/api/webhook/messenger", async (req: Request, res: Response) => {
    // Facebook expects a 200 response within 20 seconds
    res.sendStatus(200);

    try {
      const body = req.body;
      if (body.object !== "page") return;

      for (const entry of body.entry || []) {
        const pageId = entry.id;

        // Look up the page in our database
        const page = await db.getPageByFacebookId(pageId);
        if (!page || !page.pageAccessToken) {
          console.warn(`[Webhook] Received message for unknown/unconfigured page: ${pageId}`);
          continue;
        }

        for (const event of entry.messaging || []) {
          const senderPsid = event.sender?.id;
          if (!senderPsid || senderPsid === pageId) continue; // Skip messages from the page itself

          if (event.message?.text) {
            // Process text message
            processIncomingMessage(
              {
                pageId: page.pageId,
                pageAccessToken: page.pageAccessToken,
                userId: page.userId,
                dbPageId: page.id,
              },
              senderPsid,
              event.message.text
            ).catch(err => console.error("[Webhook] Process error:", err));
          }
        }
      }
    } catch (error) {
      console.error("[Webhook] Error processing:", error);
    }
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
      const scope = "pages_messaging,pages_manage_metadata,pages_read_engagement";
      const state = Buffer.from(JSON.stringify({ userId: session.userId })).toString("base64");

      const authUrl = `https://www.facebook.com/v19.0/dialog/oauth?client_id=${ENV.facebookAppId}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${scope}&state=${state}`;

      return res.json({ url: authUrl, appId: ENV.facebookAppId });
    } catch (error) {
      console.error("[Facebook] Auth URL error:", error);
      return res.status(500).json({ error: "Failed to generate auth URL" });
    }
  });
}
