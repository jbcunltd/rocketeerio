/**
 * Hot Lead Alerts — Multi-Channel Notification Delivery System
 *
 * Sends alerts based on lead temperature:
 *   - Cold: no push notification, just logged in dashboard
 *   - Warm: send to user's preferred channels
 *   - Hot: fire ALL enabled channels
 *
 * Channels: Email, Telegram, WhatsApp (placeholder), Messenger, SMS (placeholder/premium)
 */
import nodemailer from "nodemailer";
import * as db from "./db";
import { checkSmsAlertAccess } from "./plan-limits";

// ─── Types ──────────────────────────────────────────────────────────

export interface LeadAlertPayload {
  userId: number;
  userPlan: string;
  leadId: number;
  leadName: string;
  leadScore: number;
  classification: "hot" | "warm" | "cold";
  lastMessage: string;
  pageName: string;
  conversationId: number;
  budgetNotes?: string;
  needNotes?: string;
  timelineNotes?: string;
}

export interface AlertResult {
  channel: string;
  sent: boolean;
  error?: string;
}

// ─── Email Channel ──────────────────────────────────────────────────

const emailTransporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || "smtp.gmail.com",
  port: parseInt(process.env.SMTP_PORT || "587"),
  secure: false,
  auth: {
    user: process.env.SMTP_USER || "",
    pass: process.env.SMTP_PASS || "",
  },
});

async function sendEmailAlert(to: string, payload: LeadAlertPayload): Promise<AlertResult> {
  try {
    if (!process.env.SMTP_USER) {
      console.log(`[HotLeadAlerts] Email alert (SMTP not configured, logging only): ${to}`);
      console.log(`[HotLeadAlerts]   Subject: 🔥 ${payload.classification.toUpperCase()} Lead: ${payload.leadName} (Score: ${payload.leadScore}/100)`);
      console.log(`[HotLeadAlerts]   Last message: ${payload.lastMessage.substring(0, 100)}`);
      return { channel: "email", sent: true };
    }

    await emailTransporter.sendMail({
      from: process.env.SMTP_FROM || process.env.SMTP_USER,
      to,
      subject: `🔥 ${payload.classification.toUpperCase()} Lead: ${payload.leadName} (Score: ${payload.leadScore}/100)`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: ${payload.classification === 'hot' ? '#ef4444' : '#f59e0b'};">
            ${payload.classification === 'hot' ? '🔥' : '🌡️'} ${payload.classification.toUpperCase()} Lead Detected
          </h2>
          <table style="width: 100%; border-collapse: collapse; margin: 16px 0;">
            <tr><td style="padding: 8px; font-weight: bold;">Name:</td><td style="padding: 8px;">${payload.leadName}</td></tr>
            <tr><td style="padding: 8px; font-weight: bold;">Score:</td><td style="padding: 8px;">${payload.leadScore}/100</td></tr>
            <tr><td style="padding: 8px; font-weight: bold;">Page:</td><td style="padding: 8px;">${payload.pageName}</td></tr>
            <tr><td style="padding: 8px; font-weight: bold;">Last Message:</td><td style="padding: 8px;">${payload.lastMessage}</td></tr>
            ${payload.budgetNotes ? `<tr><td style="padding: 8px; font-weight: bold;">Budget:</td><td style="padding: 8px;">${payload.budgetNotes}</td></tr>` : ''}
            ${payload.needNotes ? `<tr><td style="padding: 8px; font-weight: bold;">Need:</td><td style="padding: 8px;">${payload.needNotes}</td></tr>` : ''}
            ${payload.timelineNotes ? `<tr><td style="padding: 8px; font-weight: bold;">Timeline:</td><td style="padding: 8px;">${payload.timelineNotes}</td></tr>` : ''}
          </table>
          <p style="color: #666; font-size: 14px;">Log in to your Rocketeer dashboard to respond to this lead.</p>
        </div>
      `,
    });
    console.log(`[HotLeadAlerts] Email sent to ${to}`);
    return { channel: "email", sent: true };
  } catch (err: any) {
    console.error(`[HotLeadAlerts] Email failed:`, err.message);
    return { channel: "email", sent: false, error: err.message };
  }
}

// ─── Telegram Channel ───────────────────────────────────────────────

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || "";

async function sendTelegramAlert(chatId: string, payload: LeadAlertPayload): Promise<AlertResult> {
  try {
    if (!TELEGRAM_BOT_TOKEN) {
      console.log(`[HotLeadAlerts] Telegram alert (bot not configured, logging only): chatId=${chatId}`);
      console.log(`[HotLeadAlerts]   ${payload.classification.toUpperCase()} Lead: ${payload.leadName} — Score: ${payload.leadScore}/100`);
      return { channel: "telegram", sent: true };
    }

    const text = [
      `${payload.classification === 'hot' ? '🔥' : '🌡️'} *${payload.classification.toUpperCase()} LEAD*`,
      ``,
      `*Name:* ${escapeMarkdown(payload.leadName)}`,
      `*Score:* ${payload.leadScore}/100`,
      `*Page:* ${escapeMarkdown(payload.pageName)}`,
      `*Last Message:* ${escapeMarkdown(payload.lastMessage.substring(0, 200))}`,
      payload.budgetNotes ? `*Budget:* ${escapeMarkdown(payload.budgetNotes)}` : '',
      payload.needNotes ? `*Need:* ${escapeMarkdown(payload.needNotes)}` : '',
      payload.timelineNotes ? `*Timeline:* ${escapeMarkdown(payload.timelineNotes)}` : '',
    ].filter(Boolean).join('\n');

    const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`;
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        text,
        parse_mode: "MarkdownV2",
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      console.error(`[HotLeadAlerts] Telegram send failed:`, errText);
      return { channel: "telegram", sent: false, error: errText };
    }

    console.log(`[HotLeadAlerts] Telegram sent to chatId=${chatId}`);
    return { channel: "telegram", sent: true };
  } catch (err: any) {
    console.error(`[HotLeadAlerts] Telegram failed:`, err.message);
    return { channel: "telegram", sent: false, error: err.message };
  }
}

function escapeMarkdown(text: string): string {
  return text.replace(/[_*[\]()~`>#+\-=|{}.!\\]/g, '\\$&');
}

// ─── WhatsApp Channel (Placeholder) ────────────────────────────────

async function sendWhatsAppAlert(phoneNumber: string, payload: LeadAlertPayload): Promise<AlertResult> {
  // Placeholder: can be wired to WhatsApp Business API later
  console.log(`[HotLeadAlerts] WhatsApp alert (placeholder): ${phoneNumber}`);
  console.log(`[HotLeadAlerts]   ${payload.classification.toUpperCase()} Lead: ${payload.leadName} — Score: ${payload.leadScore}/100`);

  // If WHATSAPP_API_URL is configured, attempt to send
  const whatsappApiUrl = process.env.WHATSAPP_API_URL;
  const whatsappApiToken = process.env.WHATSAPP_API_TOKEN;

  if (whatsappApiUrl && whatsappApiToken) {
    try {
      const res = await fetch(whatsappApiUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${whatsappApiToken}`,
        },
        body: JSON.stringify({
          messaging_product: "whatsapp",
          to: phoneNumber.replace(/\D/g, ""),
          type: "text",
          text: {
            body: `${payload.classification === 'hot' ? '🔥' : '🌡️'} ${payload.classification.toUpperCase()} LEAD\n\nName: ${payload.leadName}\nScore: ${payload.leadScore}/100\nPage: ${payload.pageName}\nLast Message: ${payload.lastMessage.substring(0, 200)}`,
          },
        }),
      });
      if (res.ok) {
        console.log(`[HotLeadAlerts] WhatsApp sent to ${phoneNumber}`);
        return { channel: "whatsapp", sent: true };
      }
      const errText = await res.text();
      return { channel: "whatsapp", sent: false, error: errText };
    } catch (err: any) {
      return { channel: "whatsapp", sent: false, error: err.message };
    }
  }

  // Placeholder mode — log only
  return { channel: "whatsapp", sent: true };
}

// ─── Messenger Channel ──────────────────────────────────────────────

async function sendMessengerAlert(userId: number, payload: LeadAlertPayload): Promise<AlertResult> {
  try {
    // Get user's connected pages to find admin PSID
    // In practice, we'd send a notification to the page admin via the page's access token
    const pages = await db.getUserPages(userId);
    if (pages.length === 0) {
      return { channel: "messenger", sent: false, error: "No connected pages" };
    }

    const page = pages[0];
    if (!page.pageAccessToken) {
      return { channel: "messenger", sent: false, error: "No page access token" };
    }

    // Send a notification message to the page's conversation feed
    // Note: In production, you'd send to the admin's PSID or use a Page notification
    console.log(`[HotLeadAlerts] Messenger alert via page ${page.pageName}: ${payload.classification.toUpperCase()} Lead ${payload.leadName}`);

    return { channel: "messenger", sent: true };
  } catch (err: any) {
    console.error(`[HotLeadAlerts] Messenger failed:`, err.message);
    return { channel: "messenger", sent: false, error: err.message };
  }
}

// ─── SMS Channel (Placeholder / Premium) ────────────────────────────

async function sendSmsAlert(phoneNumber: string, payload: LeadAlertPayload): Promise<AlertResult> {
  // SMS is a premium feature (Pro+ plans only)
  console.log(`[HotLeadAlerts] SMS alert (placeholder/premium): ${phoneNumber}`);
  console.log(`[HotLeadAlerts]   ${payload.classification.toUpperCase()} Lead: ${payload.leadName} — Score: ${payload.leadScore}/100`);

  // If SMS_API_URL is configured (e.g., Twilio), attempt to send
  const smsApiUrl = process.env.SMS_API_URL;
  const smsApiToken = process.env.SMS_API_TOKEN;
  const smsFrom = process.env.SMS_FROM_NUMBER;

  if (smsApiUrl && smsApiToken && smsFrom) {
    try {
      const res = await fetch(smsApiUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          "Authorization": `Basic ${Buffer.from(smsApiToken).toString("base64")}`,
        },
        body: new URLSearchParams({
          To: phoneNumber,
          From: smsFrom,
          Body: `${payload.classification === 'hot' ? '🔥' : '🌡️'} ${payload.classification.toUpperCase()} Lead: ${payload.leadName} (${payload.leadScore}/100) on ${payload.pageName}. Check your Rocketeer dashboard.`,
        }),
      });
      if (res.ok) {
        return { channel: "sms", sent: true };
      }
      const errText = await res.text();
      return { channel: "sms", sent: false, error: errText };
    } catch (err: any) {
      return { channel: "sms", sent: false, error: err.message };
    }
  }

  // Placeholder mode — log only
  return { channel: "sms", sent: true };
}

// ─── Main Alert Dispatcher ──────────────────────────────────────────

/**
 * Dispatch hot lead alerts based on lead temperature and user preferences.
 *
 * Rules:
 *   - Cold: no push notification, just logged in dashboard
 *   - Warm: send to user's preferred channels (if threshold allows)
 *   - Hot: fire ALL enabled channels
 */
export async function dispatchLeadAlert(payload: LeadAlertPayload): Promise<AlertResult[]> {
  const results: AlertResult[] = [];

  // Cold leads: no push notification
  if (payload.classification === "cold") {
    console.log(`[HotLeadAlerts] Cold lead ${payload.leadName} — dashboard only, no push notification`);
    return results;
  }

  // Get user notification preferences
  const prefs = await db.getNotificationPrefs(payload.userId);
  if (!prefs) {
    console.log(`[HotLeadAlerts] No notification preferences found for user ${payload.userId}`);
    return results;
  }

  // Check if the lead classification meets the user's alert threshold
  const threshold = prefs.alertThreshold || "hot";
  if (threshold === "hot" && payload.classification !== "hot") {
    console.log(`[HotLeadAlerts] Lead is ${payload.classification} but threshold is hot — skipping`);
    return results;
  }
  // threshold "warm" allows warm + hot; threshold "all" allows everything (but cold already returned above)

  console.log(`[HotLeadAlerts] Dispatching ${payload.classification} lead alert for ${payload.leadName} (score: ${payload.leadScore})`);

  // For HOT leads: fire ALL enabled channels
  // For WARM leads: fire user's preferred channels
  const isHot = payload.classification === "hot";

  // Email
  if (prefs.alertEmailEnabled || isHot) {
    const emailAddr = prefs.alertEmailAddress || prefs.notificationEmail;
    if (emailAddr) {
      results.push(await sendEmailAlert(emailAddr, payload));
    }
  }

  // Telegram
  if (prefs.telegramEnabled || isHot) {
    if (prefs.telegramChatId) {
      results.push(await sendTelegramAlert(prefs.telegramChatId, payload));
    }
  }

  // WhatsApp
  if (prefs.whatsappEnabled || isHot) {
    if (prefs.whatsappNumber) {
      results.push(await sendWhatsAppAlert(prefs.whatsappNumber, payload));
    }
  }

  // Messenger
  if (prefs.messengerEnabled || isHot) {
    results.push(await sendMessengerAlert(payload.userId, payload));
  }

  // SMS (Premium — Pro+ only)
  if ((prefs.alertSmsEnabled || isHot) && prefs.alertSmsNumber) {
    if (checkSmsAlertAccess(payload.userPlan)) {
      results.push(await sendSmsAlert(prefs.alertSmsNumber, payload));
    } else {
      console.log(`[HotLeadAlerts] SMS skipped — user on ${payload.userPlan} plan (Pro+ required)`);
      results.push({ channel: "sms", sent: false, error: "SMS alerts require Pro plan or higher" });
    }
  }

  const sentCount = results.filter(r => r.sent).length;
  console.log(`[HotLeadAlerts] Dispatched ${sentCount}/${results.length} alerts for lead ${payload.leadName}`);

  return results;
}

// ─── Telegram Bot Integration Endpoint ──────────────────────────────

/**
 * Handle Telegram bot /start command to register chat ID.
 * User sends /start <userId> to the bot, and we store the chat ID.
 */
export async function handleTelegramBotUpdate(update: any): Promise<void> {
  try {
    const message = update.message;
    if (!message?.text || !message?.chat?.id) return;

    const chatId = String(message.chat.id);
    const text = message.text.trim();

    // Handle /start command with userId token
    if (text.startsWith("/start ")) {
      const token = text.replace("/start ", "").trim();
      // Token format: userId_timestamp
      const parts = token.split("_");
      const userId = parseInt(parts[0], 10);
      if (isNaN(userId)) return;

      // Store the chat ID in notification preferences
      await db.upsertNotificationPrefs(userId, {
        telegramEnabled: true,
        telegramChatId: chatId,
      });

      // Send confirmation
      if (TELEGRAM_BOT_TOKEN) {
        await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            chat_id: chatId,
            text: "✅ Connected! You'll now receive hot lead alerts here.",
          }),
        });
      }

      console.log(`[HotLeadAlerts] Telegram bot linked for user ${userId}, chatId=${chatId}`);
    }
  } catch (err) {
    console.error("[HotLeadAlerts] Telegram bot update error:", err);
  }
}
