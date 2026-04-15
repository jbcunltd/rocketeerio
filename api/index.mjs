// api/index.src.ts
import "dotenv/config";
import express from "express";
import { createExpressMiddleware } from "@trpc/server/adapters/express";

// server/_core/oauth.ts
import bcrypt from "bcryptjs";

// shared/const.ts
var COOKIE_NAME = "app_session_id";
var ONE_YEAR_MS = 1e3 * 60 * 60 * 24 * 365;
var UNAUTHED_ERR_MSG = "Please login (10001)";
var NOT_ADMIN_ERR_MSG = "You do not have required permission (10002)";

// server/_core/cookies.ts
function isSecureRequest(req) {
  if (req.protocol === "https") return true;
  const forwardedProto = req.headers["x-forwarded-proto"];
  if (!forwardedProto) return false;
  const protoList = Array.isArray(forwardedProto) ? forwardedProto : forwardedProto.split(",");
  return protoList.some((proto) => proto.trim().toLowerCase() === "https");
}
function getSessionCookieOptions(req) {
  return {
    httpOnly: true,
    path: "/",
    sameSite: "none",
    secure: isSecureRequest(req)
  };
}

// shared/_core/errors.ts
var HttpError = class extends Error {
  constructor(statusCode, message) {
    super(message);
    this.statusCode = statusCode;
    this.name = "HttpError";
  }
};
var ForbiddenError = (msg) => new HttpError(403, msg);

// server/_core/sdk.ts
import { parse as parseCookieHeader } from "cookie";
import { SignJWT, jwtVerify } from "jose";

// server/db.ts
import { eq, desc, and, sql, gte, lte, count, avg } from "drizzle-orm";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

// drizzle/schema.ts
import {
  serial,
  pgTable,
  pgEnum,
  text,
  timestamp,
  varchar,
  boolean,
  json,
  bigint,
  integer,
  numeric
} from "drizzle-orm/pg-core";
var roleEnum = pgEnum("role", ["user", "admin"]);
var planEnum = pgEnum("plan", ["starter", "growth", "scale"]);
var classificationEnum = pgEnum("classification", ["hot", "warm", "cold"]);
var leadStatusEnum = pgEnum("lead_status", ["active", "converted", "archived", "lost"]);
var conversationStatusEnum = pgEnum("conversation_status", ["open", "closed", "archived"]);
var senderEnum = pgEnum("sender", ["lead", "ai", "human"]);
var messageTypeEnum = pgEnum("message_type", ["text", "image", "template", "quick_reply"]);
var kbCategoryEnum = pgEnum("kb_category", ["product", "pricing", "faq", "policy", "general"]);
var kbSourceEnum = pgEnum("kb_source", ["manual", "website", "pdf", "file"]);
var followUpStatusEnum = pgEnum("follow_up_status", ["pending", "sent", "cancelled", "failed"]);
var aiModeEnum = pgEnum("ai_mode", ["paused", "testing", "live"]);
var platformEnum = pgEnum("platform", ["messenger", "instagram"]);
var aiToneEnum = pgEnum("ai_tone", ["casual_taglish", "pure_tagalog", "professional_filipino", "casual_english", "formal_english", "professional_english"]);
var aiResponseLengthEnum = pgEnum("ai_response_length", ["short", "medium", "detailed"]);
var aiPrimaryGoalEnum = pgEnum("ai_primary_goal", ["site_visit", "booking", "quote_request", "general_support", "order_purchase", "reservation", "appointment", "collect_lead_info", "signup_registration", "custom_goal"]);
var users = pgTable("users", {
  id: serial("id").primaryKey(),
  email: varchar("email", { length: 320 }).notNull().unique(),
  passwordHash: text("passwordHash"),
  name: text("name"),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: roleEnum("role").default("user").notNull(),
  phone: varchar("phone", { length: 32 }),
  company: varchar("company", { length: 255 }),
  onboardingCompleted: boolean("onboardingCompleted").default(false).notNull(),
  plan: planEnum("plan").default("starter").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull()
});
var facebookPages = pgTable("facebook_pages", {
  id: serial("id").primaryKey(),
  userId: integer("userId").notNull(),
  pageId: varchar("pageId", { length: 128 }).notNull().unique(),
  pageName: varchar("pageName", { length: 255 }).notNull(),
  pageAccessToken: text("pageAccessToken"),
  category: varchar("category", { length: 128 }),
  isActive: boolean("isActive").default(true).notNull(),
  aiMode: aiModeEnum("aiMode").default("testing").notNull(),
  avatarUrl: text("avatarUrl"),
  followerCount: integer("followerCount").default(0),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull()
});
var instagramAccounts = pgTable("instagram_accounts", {
  id: serial("id").primaryKey(),
  userId: integer("userId").notNull(),
  facebookPageId: integer("facebookPageId"),
  igUserId: varchar("igUserId", { length: 128 }).notNull().unique(),
  igUsername: varchar("igUsername", { length: 255 }).notNull(),
  igName: varchar("igName", { length: 255 }),
  profilePicUrl: text("profilePicUrl"),
  followerCount: integer("followerCount").default(0),
  pageAccessToken: text("pageAccessToken"),
  isActive: boolean("isActive").default(true).notNull(),
  aiMode: aiModeEnum("aiMode").default("testing").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull()
});
var leads = pgTable("leads", {
  id: serial("id").primaryKey(),
  userId: integer("userId").notNull(),
  pageId: integer("pageId").notNull(),
  psid: varchar("psid", { length: 128 }),
  name: varchar("name", { length: 255 }),
  email: varchar("email", { length: 320 }),
  phone: varchar("phone", { length: 32 }),
  avatarUrl: text("avatarUrl"),
  score: integer("score").default(0).notNull(),
  classification: classificationEnum("classification").default("cold").notNull(),
  budgetScore: integer("budgetScore").default(0).notNull(),
  authorityScore: integer("authorityScore").default(0).notNull(),
  needScore: integer("needScore").default(0).notNull(),
  timelineScore: integer("timelineScore").default(0).notNull(),
  budgetNotes: text("budgetNotes"),
  authorityNotes: text("authorityNotes"),
  needNotes: text("needNotes"),
  timelineNotes: text("timelineNotes"),
  status: leadStatusEnum("status").default("active").notNull(),
  source: varchar("source", { length: 128 }).default("messenger"),
  platform: varchar("platform", { length: 32 }).default("messenger"),
  igScopedId: varchar("igScopedId", { length: 128 }),
  adId: varchar("adId", { length: 128 }),
  notifiedAt: timestamp("notifiedAt"),
  convertedAt: timestamp("convertedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull()
});
var conversations = pgTable("conversations", {
  id: serial("id").primaryKey(),
  userId: integer("userId").notNull(),
  pageId: integer("pageId").notNull(),
  leadId: integer("leadId").notNull(),
  lastMessageAt: timestamp("lastMessageAt").defaultNow().notNull(),
  lastMessagePreview: text("lastMessagePreview"),
  messageCount: integer("messageCount").default(0).notNull(),
  isAiActive: boolean("isAiActive").default(true).notNull(),
  platform: varchar("platform", { length: 32 }).default("messenger"),
  status: conversationStatusEnum("status").default("open").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull()
});
var messages = pgTable("messages", {
  id: serial("id").primaryKey(),
  conversationId: integer("conversationId").notNull(),
  sender: senderEnum("sender").notNull(),
  content: text("content").notNull(),
  messageType: messageTypeEnum("messageType").default("text").notNull(),
  metadata: json("metadata"),
  createdAt: timestamp("createdAt").defaultNow().notNull()
});
var knowledgeBase = pgTable("knowledge_base", {
  id: serial("id").primaryKey(),
  userId: integer("userId").notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  content: text("content").notNull(),
  category: kbCategoryEnum("category").default("general").notNull(),
  source: kbSourceEnum("source").default("manual").notNull(),
  sourceUrl: text("sourceUrl"),
  isActive: boolean("isActive").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull()
});
var followUpSequences = pgTable("follow_up_sequences", {
  id: serial("id").primaryKey(),
  conversationId: integer("conversationId").notNull(),
  leadId: integer("leadId").notNull(),
  delayMinutes: integer("delayMinutes").notNull(),
  scheduledAt: bigint("scheduledAt", { mode: "number" }).notNull(),
  sentAt: bigint("sentAt", { mode: "number" }),
  status: followUpStatusEnum("status").default("pending").notNull(),
  messageContent: text("messageContent"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull()
});
var followUpSettings = pgTable("follow_up_settings", {
  id: serial("id").primaryKey(),
  userId: integer("userId").notNull().unique(),
  isEnabled: boolean("isEnabled").default(true).notNull(),
  step1DelayMinutes: integer("step1DelayMinutes").default(1440).notNull(),
  step1Message: text("step1Message"),
  step1Enabled: boolean("step1Enabled").default(true).notNull(),
  step2DelayMinutes: integer("step2DelayMinutes").default(2880).notNull(),
  step2Message: text("step2Message"),
  step2Enabled: boolean("step2Enabled").default(true).notNull(),
  step3DelayMinutes: integer("step3DelayMinutes").default(10080).notNull(),
  step3Message: text("step3Message"),
  step3Enabled: boolean("step3Enabled").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull()
});
var notificationPreferences = pgTable("notification_preferences", {
  id: serial("id").primaryKey(),
  userId: integer("userId").notNull().unique(),
  smsEnabled: boolean("smsEnabled").default(true).notNull(),
  emailEnabled: boolean("emailEnabled").default(true).notNull(),
  hotLeadSms: boolean("hotLeadSms").default(true).notNull(),
  hotLeadEmail: boolean("hotLeadEmail").default(true).notNull(),
  warmLeadEmail: boolean("warmLeadEmail").default(false).notNull(),
  dailyDigest: boolean("dailyDigest").default(true).notNull(),
  smsPhone: varchar("smsPhone", { length: 32 }),
  notificationEmail: varchar("notificationEmail", { length: 320 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull()
});
var pageAiSettings = pgTable("page_ai_settings", {
  id: serial("id").primaryKey(),
  pageId: integer("pageId").notNull().unique(),
  userId: integer("userId").notNull(),
  agentName: varchar("agentName", { length: 128 }),
  tone: aiToneEnum("tone").default("casual_taglish").notNull(),
  responseLength: aiResponseLengthEnum("responseLength").default("short").notNull(),
  useEmojis: boolean("useEmojis").default(true).notNull(),
  primaryGoal: aiPrimaryGoalEnum("primaryGoal").default("site_visit").notNull(),
  customGoal: text("customGoal"),
  customInstructions: text("customInstructions"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull()
});
var pageTesters = pgTable("page_testers", {
  id: serial("id").primaryKey(),
  pageId: integer("pageId").notNull(),
  psid: varchar("psid", { length: 128 }).notNull(),
  label: varchar("label", { length: 255 }),
  createdAt: timestamp("createdAt").defaultNow().notNull()
});
var subscriptionStatusEnum = pgEnum("subscription_status", [
  "active",
  "cancelled",
  "past_due",
  "paused",
  "trialing",
  "expired"
]);
var paymentStatusEnum = pgEnum("payment_status", [
  "paid",
  "pending",
  "failed",
  "refunded"
]);
var billingIntervalEnum = pgEnum("billing_interval", ["monthly", "yearly"]);
var subscriptionPlans = pgTable("subscription_plans", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 128 }).notNull(),
  slug: varchar("slug", { length: 64 }).notNull().unique(),
  price: numeric("price", { precision: 10, scale: 2 }).notNull(),
  currency: varchar("currency", { length: 3 }).default("PHP").notNull(),
  interval: billingIntervalEnum("interval").default("monthly").notNull(),
  features: json("features").$type().default([]).notNull(),
  paymongoLinkId: varchar("paymongoLinkId", { length: 255 }),
  isActive: boolean("isActive").default(true).notNull(),
  sortOrder: integer("sortOrder").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull()
});
var userSubscriptions = pgTable("user_subscriptions", {
  id: serial("id").primaryKey(),
  userId: integer("userId").notNull(),
  planId: integer("planId").notNull(),
  status: subscriptionStatusEnum("status").default("active").notNull(),
  paymongoSubscriptionId: varchar("paymongoSubscriptionId", { length: 255 }),
  paymongoCheckoutId: varchar("paymongoCheckoutId", { length: 255 }),
  currentPeriodStart: timestamp("currentPeriodStart"),
  currentPeriodEnd: timestamp("currentPeriodEnd"),
  cancelledAt: timestamp("cancelledAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull()
});
var paymentHistory = pgTable("payment_history", {
  id: serial("id").primaryKey(),
  userId: integer("userId").notNull(),
  subscriptionId: integer("subscriptionId"),
  amount: numeric("amount", { precision: 10, scale: 2 }).notNull(),
  currency: varchar("currency", { length: 3 }).default("PHP").notNull(),
  status: paymentStatusEnum("status").default("pending").notNull(),
  paymongoPaymentId: varchar("paymongoPaymentId", { length: 255 }),
  paymongoCheckoutId: varchar("paymongoCheckoutId", { length: 255 }),
  description: text("description"),
  paidAt: timestamp("paidAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull()
});

// server/db.ts
var _db = null;
async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      const client = postgres(process.env.DATABASE_URL);
      _db = drizzle(client);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}
async function upsertUser(user) {
  if (!user.email) throw new Error("User email is required for upsert");
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }
  try {
    const existing = await db.select().from(users).where(eq(users.email, user.email)).limit(1);
    if (existing.length > 0) {
      const updateSet = {};
      const textFields = ["name", "loginMethod"];
      for (const field of textFields) {
        if (user[field] !== void 0) {
          updateSet[field] = user[field] ?? null;
        }
      }
      if (user.lastSignedIn !== void 0) updateSet.lastSignedIn = user.lastSignedIn;
      if (user.role !== void 0) updateSet.role = user.role;
      updateSet.updatedAt = /* @__PURE__ */ new Date();
      if (Object.keys(updateSet).length > 0) {
        await db.update(users).set(updateSet).where(eq(users.email, user.email));
      }
    } else {
      await db.insert(users).values({
        ...user,
        lastSignedIn: user.lastSignedIn ?? /* @__PURE__ */ new Date()
      });
    }
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}
async function getUserByEmail(email) {
  const db = await getDb();
  if (!db) return void 0;
  const result = await db.select().from(users).where(eq(users.email, email)).limit(1);
  return result.length > 0 ? result[0] : void 0;
}
async function getUserById(id) {
  const db = await getDb();
  if (!db) return void 0;
  const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
  return result.length > 0 ? result[0] : void 0;
}
async function updateUserProfile(userId, data) {
  const db = await getDb();
  if (!db) return;
  await db.update(users).set({ ...data, updatedAt: /* @__PURE__ */ new Date() }).where(eq(users.id, userId));
}
async function getUserPages(userId) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(facebookPages).where(eq(facebookPages.userId, userId)).orderBy(desc(facebookPages.createdAt));
}
async function createPage(data) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.insert(facebookPages).values(data).returning({ id: facebookPages.id });
  return result[0]?.id ?? null;
}
async function updatePage(pageId, data) {
  const db = await getDb();
  if (!db) return;
  await db.update(facebookPages).set({ ...data, updatedAt: /* @__PURE__ */ new Date() }).where(eq(facebookPages.id, pageId));
}
async function deletePage(pageId) {
  const db = await getDb();
  if (!db) return;
  await db.delete(facebookPages).where(eq(facebookPages.id, pageId));
}
async function getPageByFacebookId(fbPageId) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(facebookPages).where(eq(facebookPages.pageId, fbPageId)).limit(1);
  return result[0] ?? null;
}
async function getLeadsByUser(userId, classification) {
  const db = await getDb();
  if (!db) return [];
  const conditions = [eq(leads.userId, userId)];
  if (classification && (classification === "hot" || classification === "warm" || classification === "cold")) {
    conditions.push(eq(leads.classification, classification));
  }
  return db.select().from(leads).where(and(...conditions)).orderBy(desc(leads.updatedAt));
}
async function getLeadById(leadId) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(leads).where(eq(leads.id, leadId)).limit(1);
  return result[0] ?? null;
}
async function createLead(data) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.insert(leads).values(data).returning({ id: leads.id });
  return result[0]?.id ?? null;
}
async function updateLead(leadId, data) {
  const db = await getDb();
  if (!db) return;
  await db.update(leads).set({ ...data, updatedAt: /* @__PURE__ */ new Date() }).where(eq(leads.id, leadId));
}
async function getLeadByPsid(psid, pageId) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(leads).where(and(eq(leads.psid, psid), eq(leads.pageId, pageId))).limit(1);
  return result[0] ?? null;
}
async function getConversationByLeadId(leadId) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(conversations).where(eq(conversations.leadId, leadId)).orderBy(desc(conversations.createdAt)).limit(1);
  return result[0] ?? null;
}
async function getConversationsByUser(userId) {
  const db = await getDb();
  if (!db) return [];
  return db.select({
    conversation: conversations,
    lead: leads,
    page: facebookPages
  }).from(conversations).leftJoin(leads, eq(conversations.leadId, leads.id)).leftJoin(facebookPages, eq(conversations.pageId, facebookPages.id)).where(eq(conversations.userId, userId)).orderBy(desc(conversations.lastMessageAt));
}
async function getConversationById(conversationId) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select({
    conversation: conversations,
    lead: leads,
    page: facebookPages
  }).from(conversations).leftJoin(leads, eq(conversations.leadId, leads.id)).leftJoin(facebookPages, eq(conversations.pageId, facebookPages.id)).where(eq(conversations.id, conversationId)).limit(1);
  return result[0] ?? null;
}
async function createConversation(data) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.insert(conversations).values(data).returning({ id: conversations.id });
  return result[0]?.id ?? null;
}
async function updateConversation(conversationId, data) {
  const db = await getDb();
  if (!db) return;
  await db.update(conversations).set({ ...data, updatedAt: /* @__PURE__ */ new Date() }).where(eq(conversations.id, conversationId));
}
async function getMessagesByConversation(conversationId) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(messages).where(eq(messages.conversationId, conversationId)).orderBy(messages.createdAt);
}
async function createMessage(data) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.insert(messages).values(data).returning({ id: messages.id });
  return result[0]?.id ?? null;
}
async function getKnowledgeBase(userId) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(knowledgeBase).where(eq(knowledgeBase.userId, userId)).orderBy(desc(knowledgeBase.createdAt));
}
async function createKnowledgeEntry(data) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.insert(knowledgeBase).values(data).returning({ id: knowledgeBase.id });
  return result[0]?.id ?? null;
}
async function updateKnowledgeEntry(entryId, data) {
  const db = await getDb();
  if (!db) return;
  await db.update(knowledgeBase).set({ ...data, updatedAt: /* @__PURE__ */ new Date() }).where(eq(knowledgeBase.id, entryId));
}
async function deleteKnowledgeEntry(entryId) {
  const db = await getDb();
  if (!db) return;
  await db.delete(knowledgeBase).where(eq(knowledgeBase.id, entryId));
}
async function getActiveKnowledgeBase(userId) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(knowledgeBase).where(and(eq(knowledgeBase.userId, userId), eq(knowledgeBase.isActive, true)));
}
async function getFollowUps(conversationId) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(followUpSequences).where(eq(followUpSequences.conversationId, conversationId)).orderBy(followUpSequences.scheduledAt);
}
async function createFollowUp(data) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.insert(followUpSequences).values(data).returning({ id: followUpSequences.id });
  return result[0]?.id ?? null;
}
async function updateFollowUp(id, data) {
  const db = await getDb();
  if (!db) return;
  await db.update(followUpSequences).set({ ...data, updatedAt: /* @__PURE__ */ new Date() }).where(eq(followUpSequences.id, id));
}
async function getPendingFollowUps() {
  const db = await getDb();
  if (!db) return [];
  const now = Date.now();
  return db.select().from(followUpSequences).where(and(eq(followUpSequences.status, "pending"), lte(followUpSequences.scheduledAt, now)));
}
async function getNotificationPrefs(userId) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(notificationPreferences).where(eq(notificationPreferences.userId, userId)).limit(1);
  return result[0] ?? null;
}
async function upsertNotificationPrefs(userId, data) {
  const db = await getDb();
  if (!db) return;
  const existing = await getNotificationPrefs(userId);
  if (existing) {
    await db.update(notificationPreferences).set({ ...data, updatedAt: /* @__PURE__ */ new Date() }).where(eq(notificationPreferences.userId, userId));
  } else {
    await db.insert(notificationPreferences).values({ userId, ...data });
  }
}
async function getDashboardStats(userId) {
  const db = await getDb();
  if (!db) return { totalConversations: 0, hotLeadsToday: 0, totalLeads: 0, conversionRate: 0, avgScore: 0 };
  const [convResult] = await db.select({ count: count() }).from(conversations).where(eq(conversations.userId, userId));
  const totalConversations = convResult?.count ?? 0;
  const todayStart = /* @__PURE__ */ new Date();
  todayStart.setHours(0, 0, 0, 0);
  const [hotResult] = await db.select({ count: count() }).from(leads).where(and(eq(leads.userId, userId), eq(leads.classification, "hot"), gte(leads.createdAt, todayStart)));
  const hotLeadsToday = hotResult?.count ?? 0;
  const [totalLeadsResult] = await db.select({ count: count() }).from(leads).where(eq(leads.userId, userId));
  const totalLeads = totalLeadsResult?.count ?? 0;
  const [convertedResult] = await db.select({ count: count() }).from(leads).where(and(eq(leads.userId, userId), eq(leads.status, "converted")));
  const converted = convertedResult?.count ?? 0;
  const conversionRate = totalLeads > 0 ? Math.round(converted / totalLeads * 100) : 0;
  const [avgResult] = await db.select({ avg: avg(leads.score) }).from(leads).where(eq(leads.userId, userId));
  const avgScore = avgResult?.avg ? Math.round(Number(avgResult.avg)) : 0;
  return { totalConversations, hotLeadsToday, totalLeads, conversionRate, avgScore };
}
async function getLeadActivityByDay(userId, days = 7) {
  const db = await getDb();
  if (!db) return [];
  const startDate = /* @__PURE__ */ new Date();
  startDate.setDate(startDate.getDate() - days);
  startDate.setHours(0, 0, 0, 0);
  const result = await db.select({
    date: sql`DATE(${leads.createdAt})`,
    total: count(),
    hot: sql`SUM(CASE WHEN ${leads.classification} = 'hot' THEN 1 ELSE 0 END)`,
    warm: sql`SUM(CASE WHEN ${leads.classification} = 'warm' THEN 1 ELSE 0 END)`,
    cold: sql`SUM(CASE WHEN ${leads.classification} = 'cold' THEN 1 ELSE 0 END)`
  }).from(leads).where(and(eq(leads.userId, userId), gte(leads.createdAt, startDate))).groupBy(sql`DATE(${leads.createdAt})`).orderBy(sql`DATE(${leads.createdAt})`);
  return result;
}
async function getPageAiSettings(pageId) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(pageAiSettings).where(eq(pageAiSettings.pageId, pageId)).limit(1);
  return result[0] ?? null;
}
async function getPageAiSettingsByDbPageId(dbPageId) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(pageAiSettings).where(eq(pageAiSettings.pageId, dbPageId)).limit(1);
  return result[0] ?? null;
}
async function upsertPageAiSettings(pageId, userId, data) {
  const db = await getDb();
  if (!db) return;
  const existing = await getPageAiSettings(pageId);
  if (existing) {
    await db.update(pageAiSettings).set({ ...data, updatedAt: /* @__PURE__ */ new Date() }).where(eq(pageAiSettings.pageId, pageId));
  } else {
    await db.insert(pageAiSettings).values({ pageId, userId, ...data });
  }
}
async function updatePageMode(pageId, aiMode) {
  const db = await getDb();
  if (!db) return;
  await db.update(facebookPages).set({ aiMode, updatedAt: /* @__PURE__ */ new Date() }).where(eq(facebookPages.id, pageId));
}
async function getPageMode(pageId) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select({ aiMode: facebookPages.aiMode }).from(facebookPages).where(eq(facebookPages.id, pageId)).limit(1);
  return result[0]?.aiMode ?? null;
}
async function getPageTesters(pageId) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(pageTesters).where(eq(pageTesters.pageId, pageId)).orderBy(desc(pageTesters.createdAt));
}
async function addPageTester(data) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.insert(pageTesters).values(data).returning({ id: pageTesters.id });
  return result[0]?.id ?? null;
}
async function removePageTester(testerId) {
  const db = await getDb();
  if (!db) return;
  await db.delete(pageTesters).where(eq(pageTesters.id, testerId));
}
async function isTesterPsid(pageId, psid) {
  const db = await getDb();
  if (!db) return false;
  const result = await db.select({ id: pageTesters.id }).from(pageTesters).where(and(eq(pageTesters.pageId, pageId), eq(pageTesters.psid, psid))).limit(1);
  return result.length > 0;
}
async function getActiveSubscriptionPlans() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(subscriptionPlans).where(eq(subscriptionPlans.isActive, true)).orderBy(subscriptionPlans.sortOrder);
}
async function getSubscriptionPlanBySlug(slug) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(subscriptionPlans).where(eq(subscriptionPlans.slug, slug)).limit(1);
  return result[0] ?? null;
}
async function getSubscriptionPlanById(id) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(subscriptionPlans).where(eq(subscriptionPlans.id, id)).limit(1);
  return result[0] ?? null;
}
async function upsertSubscriptionPlan(plan) {
  const db = await getDb();
  if (!db) return null;
  const existing = await db.select().from(subscriptionPlans).where(eq(subscriptionPlans.slug, plan.slug)).limit(1);
  if (existing.length > 0) {
    await db.update(subscriptionPlans).set({ ...plan, updatedAt: /* @__PURE__ */ new Date() }).where(eq(subscriptionPlans.slug, plan.slug));
    return existing[0].id;
  }
  const result = await db.insert(subscriptionPlans).values(plan).returning({ id: subscriptionPlans.id });
  return result[0]?.id ?? null;
}
async function getUserSubscription(userId) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(userSubscriptions).where(and(
    eq(userSubscriptions.userId, userId),
    eq(userSubscriptions.status, "active")
  )).orderBy(desc(userSubscriptions.createdAt)).limit(1);
  if (!result[0]) return null;
  const plan = await getSubscriptionPlanById(result[0].planId);
  return { ...result[0], plan };
}
async function getUserSubscriptionByCheckoutId(checkoutId) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(userSubscriptions).where(eq(userSubscriptions.paymongoCheckoutId, checkoutId)).limit(1);
  return result[0] ?? null;
}
async function createUserSubscription(sub) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.insert(userSubscriptions).values(sub).returning({ id: userSubscriptions.id });
  return result[0]?.id ?? null;
}
async function updateUserSubscription(id, data) {
  const db = await getDb();
  if (!db) return;
  await db.update(userSubscriptions).set({ ...data, updatedAt: /* @__PURE__ */ new Date() }).where(eq(userSubscriptions.id, id));
}
async function cancelUserSubscription(userId) {
  const db = await getDb();
  if (!db) return;
  await db.update(userSubscriptions).set({ status: "cancelled", cancelledAt: /* @__PURE__ */ new Date(), updatedAt: /* @__PURE__ */ new Date() }).where(and(
    eq(userSubscriptions.userId, userId),
    eq(userSubscriptions.status, "active")
  ));
}
async function createPaymentRecord(payment) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.insert(paymentHistory).values(payment).returning({ id: paymentHistory.id });
  return result[0]?.id ?? null;
}
async function getPaymentsByUser(userId, limit = 20) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(paymentHistory).where(eq(paymentHistory.userId, userId)).orderBy(desc(paymentHistory.createdAt)).limit(limit);
}
async function updatePaymentByCheckoutId(checkoutId, data) {
  const db = await getDb();
  if (!db) return;
  await db.update(paymentHistory).set(data).where(eq(paymentHistory.paymongoCheckoutId, checkoutId));
}
async function seedSubscriptionPlans() {
  const plans = [
    {
      name: "Starter",
      slug: "starter",
      price: "2490.00",
      currency: "PHP",
      interval: "monthly",
      features: [
        "1 Facebook Page",
        "Up to 500 conversations/mo",
        "AI auto-replies",
        "BANT lead scoring",
        "Email notifications",
        "Basic knowledge base"
      ],
      sortOrder: 1,
      isActive: true
    },
    {
      name: "Growth",
      slug: "growth",
      price: "7490.00",
      currency: "PHP",
      interval: "monthly",
      features: [
        "Up to 5 Facebook Pages",
        "Unlimited conversations",
        "AI auto-replies + follow-ups",
        "BANT lead scoring",
        "SMS + Email notifications",
        "Advanced knowledge base",
        "Priority support",
        "Conversion analytics"
      ],
      sortOrder: 2,
      isActive: true
    },
    {
      name: "Scale",
      slug: "scale",
      price: "14990.00",
      currency: "PHP",
      interval: "monthly",
      features: [
        "Unlimited Facebook Pages",
        "Unlimited conversations",
        "AI auto-replies + follow-ups",
        "Advanced BANT scoring",
        "SMS + Email + Webhook alerts",
        "Custom AI persona",
        "Dedicated account manager",
        "API access",
        "White-label option"
      ],
      sortOrder: 3,
      isActive: true
    }
  ];
  for (const plan of plans) {
    await upsertSubscriptionPlan(plan);
  }
  console.log("[Database] Subscription plans seeded");
}
async function getUserInstagramAccounts(userId) {
  const database = await getDb();
  if (!database) return [];
  return database.select().from(instagramAccounts).where(eq(instagramAccounts.userId, userId));
}
async function getInstagramAccountByIgUserId(igUserId) {
  const database = await getDb();
  if (!database) return null;
  const rows = await database.select().from(instagramAccounts).where(eq(instagramAccounts.igUserId, igUserId));
  return rows[0] || null;
}
async function createInstagramAccount(data) {
  const database = await getDb();
  if (!database) return null;
  const rows = await database.insert(instagramAccounts).values(data).returning({ id: instagramAccounts.id });
  return rows[0]?.id || null;
}
async function updateInstagramAccount(id, data) {
  const database = await getDb();
  if (!database) return;
  await database.update(instagramAccounts).set({ ...data, updatedAt: /* @__PURE__ */ new Date() }).where(eq(instagramAccounts.id, id));
}
async function deleteInstagramAccount(id) {
  const database = await getDb();
  if (!database) return;
  await database.delete(instagramAccounts).where(eq(instagramAccounts.id, id));
}
async function updateInstagramAccountMode(id, aiMode) {
  const database = await getDb();
  if (!database) return;
  await database.update(instagramAccounts).set({ aiMode, updatedAt: /* @__PURE__ */ new Date() }).where(eq(instagramAccounts.id, id));
}
async function getLeadByIgScopedId(igScopedId, igAccountId) {
  const database = await getDb();
  if (!database) return null;
  const rows = await database.select().from(leads).where(eq(leads.igScopedId, igScopedId));
  return rows[0] || null;
}
async function getFollowUpSettings(userId) {
  const database = await getDb();
  if (!database) return null;
  const rows = await database.select().from(followUpSettings).where(eq(followUpSettings.userId, userId));
  return rows[0] || null;
}
async function upsertFollowUpSettings(userId, data) {
  const database = await getDb();
  if (!database) return;
  const existing = await getFollowUpSettings(userId);
  if (existing) {
    await database.update(followUpSettings).set({ ...data, updatedAt: /* @__PURE__ */ new Date() }).where(eq(followUpSettings.userId, userId));
  } else {
    await database.insert(followUpSettings).values({ userId, ...data });
  }
}

// server/_core/env.ts
var ENV = {
  databaseUrl: process.env.DATABASE_URL ?? "",
  jwtSecret: process.env.JWT_SECRET ?? "change-me-in-production",
  openaiApiKey: process.env.OPENAI_API_KEY ?? "",
  ownerEmail: process.env.OWNER_EMAIL ?? "jandrickclimaco@gmail.com",
  isProduction: process.env.NODE_ENV === "production",
  // Facebook / Meta
  facebookAppId: process.env.FACEBOOK_APP_ID ?? "",
  facebookAppSecret: process.env.FACEBOOK_APP_SECRET ?? "",
  facebookVerifyToken: process.env.FACEBOOK_VERIFY_TOKEN ?? "rocketeer_verify_token_2024",
  appUrl: process.env.APP_URL ?? "https://rocketeerio.vercel.app",
  // PayMongo
  paymongoSecretKey: process.env.PAYMONGO_SECRET_KEY ?? "sk_test_placeholder",
  paymongoPublicKey: process.env.PAYMONGO_PUBLIC_KEY ?? "pk_test_placeholder"
};

// server/_core/sdk.ts
var isNonEmptyString = (value) => typeof value === "string" && value.length > 0;
var AuthService = class {
  parseCookies(cookieHeader) {
    if (!cookieHeader) {
      return /* @__PURE__ */ new Map();
    }
    const parsed = parseCookieHeader(cookieHeader);
    return new Map(Object.entries(parsed));
  }
  getSessionSecret() {
    return new TextEncoder().encode(ENV.jwtSecret);
  }
  async createSessionToken(userId, email, name, options = {}) {
    const issuedAt = Date.now();
    const expiresInMs = options.expiresInMs ?? ONE_YEAR_MS;
    const expirationSeconds = Math.floor((issuedAt + expiresInMs) / 1e3);
    const secretKey = this.getSessionSecret();
    return new SignJWT({
      userId,
      email,
      name
    }).setProtectedHeader({ alg: "HS256", typ: "JWT" }).setExpirationTime(expirationSeconds).sign(secretKey);
  }
  async verifySession(cookieValue) {
    if (!cookieValue) {
      return null;
    }
    try {
      const secretKey = this.getSessionSecret();
      const { payload } = await jwtVerify(cookieValue, secretKey, {
        algorithms: ["HS256"]
      });
      const { userId, email, name } = payload;
      if (typeof userId !== "number" || !isNonEmptyString(email)) {
        console.warn("[Auth] Session payload missing required fields");
        return null;
      }
      return {
        userId,
        email,
        name: typeof name === "string" ? name : ""
      };
    } catch (error) {
      console.warn("[Auth] Session verification failed", String(error));
      return null;
    }
  }
  async authenticateRequest(req) {
    const cookies = this.parseCookies(req.headers.cookie);
    const sessionCookie = cookies.get(COOKIE_NAME);
    const session = await this.verifySession(sessionCookie);
    if (!session) {
      throw ForbiddenError("Invalid session cookie");
    }
    const user = await getUserById(session.userId);
    if (!user) {
      throw ForbiddenError("User not found");
    }
    await upsertUser({
      email: user.email,
      lastSignedIn: /* @__PURE__ */ new Date()
    });
    return user;
  }
};
var sdk = new AuthService();

// server/_core/oauth.ts
var BCRYPT_ROUNDS = 10;
var OWNER_EMAIL = ENV.ownerEmail;
function registerAuthRoutes(app2) {
  app2.post("/api/auth/signup", async (req, res) => {
    try {
      const { email, password, name } = req.body;
      if (!email || !password) {
        return res.status(400).json({ error: "Email and password are required" });
      }
      if (password.length < 6) {
        return res.status(400).json({ error: "Password must be at least 6 characters" });
      }
      const existing = await getUserByEmail(email);
      if (existing) {
        return res.status(409).json({ error: "An account with this email already exists" });
      }
      const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);
      const isOwner = email.toLowerCase() === OWNER_EMAIL.toLowerCase();
      await upsertUser({
        email,
        passwordHash,
        name: name || email.split("@")[0],
        loginMethod: "email",
        role: isOwner ? "admin" : "user"
      });
      const user = await getUserByEmail(email);
      if (!user) {
        return res.status(500).json({ error: "Failed to create user" });
      }
      if (isOwner) {
        await updateUserProfile(user.id, { plan: "scale" });
      }
      const token = await sdk.createSessionToken(user.id, user.email, user.name || "");
      const cookieOptions = getSessionCookieOptions(req);
      res.cookie(COOKIE_NAME, token, cookieOptions);
      return res.json({ success: true, user: { id: user.id, email: user.email, name: user.name, role: user.role } });
    } catch (error) {
      console.error("[Auth] Signup error:", error);
      return res.status(500).json({ error: "Internal server error" });
    }
  });
  app2.post("/api/auth/login", async (req, res) => {
    try {
      const { email, password } = req.body;
      if (!email || !password) {
        return res.status(400).json({ error: "Email and password are required" });
      }
      const user = await getUserByEmail(email);
      if (!user || !user.passwordHash) {
        return res.status(401).json({ error: "Invalid email or password" });
      }
      const valid = await bcrypt.compare(password, user.passwordHash);
      if (!valid) {
        return res.status(401).json({ error: "Invalid email or password" });
      }
      await upsertUser({
        email: user.email,
        lastSignedIn: /* @__PURE__ */ new Date()
      });
      const token = await sdk.createSessionToken(user.id, user.email, user.name || "");
      const cookieOptions = getSessionCookieOptions(req);
      res.cookie(COOKIE_NAME, token, cookieOptions);
      return res.json({ success: true, user: { id: user.id, email: user.email, name: user.name, role: user.role } });
    } catch (error) {
      console.error("[Auth] Login error:", error);
      return res.status(500).json({ error: "Internal server error" });
    }
  });
}

// server/_core/llm.ts
var ensureArray = (value) => Array.isArray(value) ? value : [value];
var normalizeContentPart = (part) => {
  if (typeof part === "string") {
    return { type: "text", text: part };
  }
  if (part.type === "text") {
    return part;
  }
  if (part.type === "image_url") {
    return part;
  }
  if (part.type === "file_url") {
    return part;
  }
  throw new Error("Unsupported message content part");
};
var normalizeMessage = (message) => {
  const { role, name, tool_call_id } = message;
  if (role === "tool" || role === "function") {
    const content = ensureArray(message.content).map((part) => typeof part === "string" ? part : JSON.stringify(part)).join("\n");
    return {
      role,
      name,
      tool_call_id,
      content
    };
  }
  const contentParts = ensureArray(message.content).map(normalizeContentPart);
  if (contentParts.length === 1 && contentParts[0].type === "text") {
    return {
      role,
      name,
      content: contentParts[0].text
    };
  }
  return {
    role,
    name,
    content: contentParts
  };
};
var normalizeToolChoice = (toolChoice, tools) => {
  if (!toolChoice) return void 0;
  if (toolChoice === "none" || toolChoice === "auto") {
    return toolChoice;
  }
  if (toolChoice === "required") {
    if (!tools || tools.length === 0) {
      throw new Error(
        "tool_choice 'required' was provided but no tools were configured"
      );
    }
    if (tools.length > 1) {
      throw new Error(
        "tool_choice 'required' needs a single tool or specify the tool name explicitly"
      );
    }
    return {
      type: "function",
      function: { name: tools[0].function.name }
    };
  }
  if ("name" in toolChoice) {
    return {
      type: "function",
      function: { name: toolChoice.name }
    };
  }
  return toolChoice;
};
var resolveApiUrl = () => {
  const base = process.env.OPENAI_BASE_URL || "https://api.openai.com/v1";
  return `${base.replace(/\/$/, "")}/chat/completions`;
};
var assertApiKey = () => {
  if (!ENV.openaiApiKey) {
    throw new Error("OPENAI_API_KEY is not configured");
  }
};
var normalizeResponseFormat = ({
  responseFormat,
  response_format,
  outputSchema,
  output_schema
}) => {
  const explicitFormat = responseFormat || response_format;
  if (explicitFormat) {
    if (explicitFormat.type === "json_schema" && !explicitFormat.json_schema?.schema) {
      throw new Error(
        "responseFormat json_schema requires a defined schema object"
      );
    }
    return explicitFormat;
  }
  const schema = outputSchema || output_schema;
  if (!schema) return void 0;
  if (!schema.name || !schema.schema) {
    throw new Error("outputSchema requires both name and schema");
  }
  return {
    type: "json_schema",
    json_schema: {
      name: schema.name,
      schema: schema.schema,
      ...typeof schema.strict === "boolean" ? { strict: schema.strict } : {}
    }
  };
};
async function invokeLLM(params) {
  assertApiKey();
  const {
    messages: messages2,
    tools,
    toolChoice,
    tool_choice,
    outputSchema,
    output_schema,
    responseFormat,
    response_format
  } = params;
  const payload = {
    model: process.env.LLM_MODEL || "gpt-4.1-mini",
    messages: messages2.map(normalizeMessage)
  };
  if (tools && tools.length > 0) {
    payload.tools = tools;
  }
  const normalizedToolChoice = normalizeToolChoice(
    toolChoice || tool_choice,
    tools
  );
  if (normalizedToolChoice) {
    payload.tool_choice = normalizedToolChoice;
  }
  payload.max_tokens = 32768;
  const normalizedResponseFormat = normalizeResponseFormat({
    responseFormat,
    response_format,
    outputSchema,
    output_schema
  });
  if (normalizedResponseFormat) {
    payload.response_format = normalizedResponseFormat;
  }
  const response = await fetch(resolveApiUrl(), {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${ENV.openaiApiKey}`
    },
    body: JSON.stringify(payload)
  });
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(
      `LLM invoke failed: ${response.status} ${response.statusText} \u2013 ${errorText}`
    );
  }
  return await response.json();
}

// server/ai-engine.ts
function getToneInstruction(tone) {
  switch (tone) {
    case "casual_taglish":
      return `Use casual Filipino-English (Taglish) tone when it feels natural (e.g., "po", "ma'am/sir", mixing Tagalog and English naturally)`;
    case "pure_tagalog":
      return "Sumagot sa purong Tagalog. Gamitin ang natural na Filipino na pananalita, iwasan ang English words maliban kung walang katumbas sa Tagalog.";
    case "professional_filipino":
      return "Use professional Filipino (Tagalog). Maintain a respectful and business-appropriate tone in Filipino language. Use po and opo.";
    case "casual_english":
      return "Use casual, friendly English. Keep it conversational and approachable, like chatting with a friend.";
    case "formal_english":
      return "Use formal, polished English. Maintain a professional and courteous tone throughout. Avoid slang or casual abbreviations.";
    case "professional_english":
      return "Use professional business English. Be articulate, confident, and polished. Suitable for corporate or high-end clientele.";
    default:
      return `Use casual Filipino-English (Taglish) tone when it feels natural (e.g., "po", "ma'am/sir")`;
  }
}
function getResponseLengthInstruction(length) {
  switch (length) {
    case "short":
      return "Keep responses under 100 words \u2014 short punchy messages like real chat. One message at a time, one question at a time.";
    case "medium":
      return "Keep responses between 100-200 words. Be informative but concise. Cover the key points without being too brief or too lengthy.";
    case "detailed":
      return "Provide detailed, thorough responses (200-400 words). Include relevant details, examples, and explanations to be as helpful as possible.";
    default:
      return "Keep responses under 100 words \u2014 short punchy messages like real chat.";
  }
}
function getPrimaryGoalInstruction(goal, customGoal) {
  switch (goal) {
    case "site_visit":
      return "Your #1 goal is to move every inquiry toward a SITE VISIT or IN-PERSON CONSULTATION. Guide the conversation toward scheduling a visit.";
    case "booking":
      return "Your #1 goal is to move every inquiry toward a BOOKING or APPOINTMENT. Guide the conversation toward confirming a booking.";
    case "quote_request":
      return "Your #1 goal is to move every inquiry toward requesting a QUOTE or ESTIMATE. Gather their requirements and offer to prepare a personalized quote.";
    case "general_support":
      return "Your #1 goal is to provide excellent CUSTOMER SUPPORT. Answer questions thoroughly, resolve concerns, and ensure customer satisfaction.";
    case "order_purchase":
      return "Your #1 goal is to guide the customer toward placing an ORDER or completing a PURCHASE. Help them understand the product/service, address concerns, and move them to checkout or payment.";
    case "reservation":
      return "Your #1 goal is to help the customer make a RESERVATION. Ask for their preferred date, time, party size or room type, and confirm all reservation details before finalizing.";
    case "appointment":
      return "Your #1 goal is to schedule an APPOINTMENT. Ask for their preferred date and time, the service they need, and confirm all appointment details.";
    case "collect_lead_info":
      return "Your #1 goal is to COLLECT LEAD INFORMATION. Gather their name, contact information (email/phone), and understand their needs. Let them know a human team member will follow up with them soon.";
    case "signup_registration":
      return "Your #1 goal is to guide the customer toward SIGNING UP or REGISTERING. Explain the benefits, address any concerns, and help them complete the registration process.";
    case "custom_goal":
      return customGoal ? `Your #1 goal is: ${customGoal}` : "Your #1 goal is to move every inquiry toward a SITE VISIT or DESIGN CONSULTATION.";
    default:
      return "Your #1 goal is to move every inquiry toward a SITE VISIT or DESIGN CONSULTATION.";
  }
}
function getEmojiInstruction(useEmojis) {
  if (useEmojis) {
    return "Use emojis sparingly and naturally (\u{1F60A} is fine, don't overdo it)";
  }
  return "Do NOT use any emojis in your messages. Keep the tone clean and text-only.";
}
async function generateAIResponse(userId, conversationHistory, leadName, pageName, pageDbId) {
  const kbEntries = await getActiveKnowledgeBase(userId);
  const knowledgeContext = kbEntries.map((entry) => `[${entry.category.toUpperCase()}] ${entry.title}:
${entry.content}`).join("\n\n---\n\n");
  let settings = null;
  if (pageDbId) {
    settings = await getPageAiSettingsByDbPageId(pageDbId);
  }
  const tone = settings?.tone ?? "casual_taglish";
  const responseLength = settings?.responseLength ?? "short";
  const useEmojis = settings?.useEmojis ?? true;
  const primaryGoal = settings?.primaryGoal ?? "site_visit";
  const customGoal = settings?.customGoal || null;
  const agentName = settings?.agentName || null;
  const customInstructions = settings?.customInstructions || null;
  const historyMessages = conversationHistory.slice(-10).map((msg) => ({
    role: msg.sender === "lead" ? "user" : "assistant",
    content: msg.content
  }));
  const identityLine = agentName ? `You are "${agentName}", a real human sales agent for "${pageName}". You chat with customers on Facebook Messenger.` : `You are a real human sales agent for "${pageName}". You chat with customers on Facebook Messenger.`;
  const systemPrompt = `${identityLine}

YOUR PERSONALITY & STYLE:
- You sound like a real person, NOT an AI chatbot
- Warm, friendly, professional \u2014 like a trusted advisor
- ${getToneInstruction(tone)}
- ${getEmojiInstruction(useEmojis)}
- NEVER start messages with "Hi [name]!" every time \u2014 only greet by name on the FIRST message in a conversation
- Keep messages short and conversational, like real Messenger chat
- ALWAYS end your message with a question to keep the conversation moving
- ${getPrimaryGoalInstruction(primaryGoal, customGoal)}

RESPONSE LENGTH:
- ${getResponseLengthInstruction(responseLength)}

KNOWLEDGE BASE & SCRIPTS:
${knowledgeContext || "No knowledge base entries available yet. Respond helpfully and offer to connect them with a human representative."}

RULES:
- Follow the scripts and objection handling in the knowledge base closely \u2014 they are proven to work
- NEVER make up pricing, timelines, or information not in the knowledge base
- If you don't know something specific, say "Let me check with our team and get back to you on that"
- Do NOT repeat the customer's name in every message \u2014 only use it occasionally and naturally
- Do NOT say "I'm an AI" or "As an AI" \u2014 you are a sales agent${agentName ? ` named ${agentName}` : ""}
- Never sound defensive about pricing \u2014 reframe toward value and design
- The lead's name is: ${leadName || "there"}${customInstructions ? `

ADDITIONAL INSTRUCTIONS:
${customInstructions}` : ""}`;
  const result = await invokeLLM({
    messages: [
      { role: "system", content: systemPrompt },
      ...historyMessages
    ]
  });
  const content = result.choices[0]?.message?.content;
  if (typeof content === "string") return content;
  if (Array.isArray(content)) {
    const textPart = content.find((p) => typeof p === "object" && "type" in p && p.type === "text");
    if (textPart && "text" in textPart) return textPart.text;
  }
  return "Thanks for reaching out! Let me connect you with our team.";
}
async function scoreLead(conversationHistory) {
  const transcript = conversationHistory.map((msg) => `${msg.sender === "lead" ? "LEAD" : "AGENT"}: ${msg.content}`).join("\n");
  const result = await invokeLLM({
    messages: [
      {
        role: "system",
        content: `You are a lead scoring expert. Analyze the conversation transcript and score the lead using the BANT framework. Each dimension is scored 0-25 points.

SCORING CRITERIA:
- Budget (0-25): Has the prospect mentioned a budget, price range, or willingness to pay? 0 = no mention, 10 = vague interest, 20 = specific range, 25 = confirmed budget.
- Authority (0-25): Is this person the decision-maker? 0 = unknown, 10 = influencer, 20 = likely decision-maker, 25 = confirmed decision-maker.
- Need (0-25): Has the prospect expressed a clear need? 0 = no need expressed, 10 = general interest, 20 = specific need, 25 = urgent/critical need.
- Timeline (0-25): Has the prospect indicated when they want to buy? 0 = no timeline, 10 = someday, 20 = within months, 25 = immediate/this week.

Total score = Budget + Authority + Need + Timeline (0-100).
Classification: Hot (80-100), Warm (40-79), Cold (0-39).

Return ONLY valid JSON.`
      },
      {
        role: "user",
        content: `Score this conversation:

${transcript}`
      }
    ],
    response_format: {
      type: "json_schema",
      json_schema: {
        name: "lead_score",
        strict: true,
        schema: {
          type: "object",
          properties: {
            budgetScore: { type: "integer", description: "Budget score 0-25" },
            authorityScore: { type: "integer", description: "Authority score 0-25" },
            needScore: { type: "integer", description: "Need score 0-25" },
            timelineScore: { type: "integer", description: "Timeline score 0-25" },
            budgetNotes: { type: "string", description: "Brief explanation for budget score" },
            authorityNotes: { type: "string", description: "Brief explanation for authority score" },
            needNotes: { type: "string", description: "Brief explanation for need score" },
            timelineNotes: { type: "string", description: "Brief explanation for timeline score" }
          },
          required: ["budgetScore", "authorityScore", "needScore", "timelineScore", "budgetNotes", "authorityNotes", "needNotes", "timelineNotes"],
          additionalProperties: false
        }
      }
    }
  });
  try {
    const content = result.choices[0]?.message?.content;
    const text2 = typeof content === "string" ? content : "";
    const parsed = JSON.parse(text2);
    const budgetScore = Math.min(25, Math.max(0, parsed.budgetScore || 0));
    const authorityScore = Math.min(25, Math.max(0, parsed.authorityScore || 0));
    const needScore = Math.min(25, Math.max(0, parsed.needScore || 0));
    const timelineScore = Math.min(25, Math.max(0, parsed.timelineScore || 0));
    const score = budgetScore + authorityScore + needScore + timelineScore;
    let classification = "cold";
    if (score >= 80) classification = "hot";
    else if (score >= 40) classification = "warm";
    return {
      score,
      classification,
      budgetScore,
      authorityScore,
      needScore,
      timelineScore,
      budgetNotes: parsed.budgetNotes || "",
      authorityNotes: parsed.authorityNotes || "",
      needNotes: parsed.needNotes || "",
      timelineNotes: parsed.timelineNotes || ""
    };
  } catch {
    return {
      score: 0,
      classification: "cold",
      budgetScore: 0,
      authorityScore: 0,
      needScore: 0,
      timelineScore: 0,
      budgetNotes: "Unable to score",
      authorityNotes: "Unable to score",
      needNotes: "Unable to score",
      timelineNotes: "Unable to score"
    };
  }
}

// server/_core/notification.ts
import { TRPCError } from "@trpc/server";
var TITLE_MAX_LENGTH = 1200;
var CONTENT_MAX_LENGTH = 2e4;
var trimValue = (value) => value.trim();
var isNonEmptyString2 = (value) => typeof value === "string" && value.trim().length > 0;
var validatePayload = (input) => {
  if (!isNonEmptyString2(input.title)) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "Notification title is required."
    });
  }
  if (!isNonEmptyString2(input.content)) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "Notification content is required."
    });
  }
  const title = trimValue(input.title);
  const content = trimValue(input.content);
  if (title.length > TITLE_MAX_LENGTH) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: `Notification title must be at most ${TITLE_MAX_LENGTH} characters.`
    });
  }
  if (content.length > CONTENT_MAX_LENGTH) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: `Notification content must be at most ${CONTENT_MAX_LENGTH} characters.`
    });
  }
  return { title, content };
};
async function notifyOwner(payload) {
  const { title, content } = validatePayload(payload);
  console.log(`[Notification] \u2500\u2500\u2500 Owner Notification \u2500\u2500\u2500`);
  console.log(`[Notification] Title: ${title}`);
  console.log(`[Notification] Content: ${content}`);
  console.log(`[Notification] \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500`);
  return true;
}

// server/facebook.ts
var FB_GRAPH = "https://graph.facebook.com/v19.0";
async function sendMessengerMessage(pageAccessToken, recipientPsid, text2) {
  const url = `${FB_GRAPH}/me/messages?access_token=${pageAccessToken}`;
  const body = {
    recipient: { id: recipientPsid },
    message: { text: text2 },
    messaging_type: "RESPONSE"
  };
  console.log(`[Messenger] Sending reply to ${recipientPsid}, length=${text2.length}`);
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body)
  });
  if (!res.ok) {
    const errText = await res.text();
    console.error("[Messenger] Send failed:", res.status, errText);
    return false;
  }
  console.log(`[Messenger] Reply sent successfully to ${recipientPsid}`);
  return true;
}
async function getFacebookUserProfile(psid, pageAccessToken) {
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
      avatarUrl: data.profile_pic || null
    };
  } catch (err) {
    console.error(`[Messenger] Profile fetch error for ${psid}:`, err);
    return null;
  }
}
async function sendTestingModeReply(pageAccessToken, recipientPsid) {
  const text2 = "Thanks for your message! We're currently setting things up and will get back to you shortly.";
  await sendMessengerMessage(pageAccessToken, recipientPsid, text2);
}
async function processIncomingMessage(pageEntry, senderPsid, messageText) {
  console.log(`[Webhook] Processing message from ${senderPsid} to page ${pageEntry.pageId}: "${messageText.substring(0, 80)}"`);
  const mode = pageEntry.aiMode || "testing";
  if (mode === "paused") {
    console.log(`[Webhook] Page ${pageEntry.pageId} is PAUSED \u2014 ignoring message from ${senderPsid}`);
    return;
  }
  if (mode === "testing") {
    const isTester = await isTesterPsid(pageEntry.dbPageId, senderPsid);
    if (!isTester) {
      console.log(`[Webhook] Page ${pageEntry.pageId} is in TESTING mode \u2014 sender ${senderPsid} is NOT a tester, sending courtesy reply`);
      if (pageEntry.pageAccessToken) {
        await sendTestingModeReply(pageEntry.pageAccessToken, senderPsid);
      }
      return;
    }
    console.log(`[Webhook] Page ${pageEntry.pageId} is in TESTING mode \u2014 sender ${senderPsid} IS a tester, proceeding`);
  }
  let lead = await getLeadByPsid(senderPsid, pageEntry.dbPageId);
  if (!lead) {
    console.log(`[Webhook] Creating new lead for PSID ${senderPsid}`);
    const profile = await getFacebookUserProfile(senderPsid, pageEntry.pageAccessToken);
    const leadId = await createLead({
      userId: pageEntry.userId,
      pageId: pageEntry.dbPageId,
      psid: senderPsid,
      name: profile?.name || `Messenger User`,
      avatarUrl: profile?.avatarUrl || void 0,
      source: "messenger",
      status: "active"
    });
    if (!leadId) {
      console.error("[Webhook] Failed to create lead");
      return;
    }
    lead = await getLeadById(leadId);
    if (!lead) {
      console.error("[Webhook] Failed to fetch newly created lead");
      return;
    }
    console.log(`[Webhook] Created lead id=${leadId}, name=${lead.name}`);
  } else {
    console.log(`[Webhook] Found existing lead id=${lead.id}, name=${lead.name}`);
  }
  let conv = await getConversationByLeadId(lead.id);
  if (!conv) {
    console.log(`[Webhook] Creating new conversation for lead ${lead.id}`);
    const convId = await createConversation({
      userId: pageEntry.userId,
      pageId: pageEntry.dbPageId,
      leadId: lead.id,
      lastMessagePreview: messageText.substring(0, 200),
      messageCount: 0,
      status: "open"
    });
    if (!convId) {
      console.error("[Webhook] Failed to create conversation");
      return;
    }
    conv = await getConversationByLeadId(lead.id);
    if (!conv) {
      console.error("[Webhook] Failed to fetch newly created conversation");
      return;
    }
    console.log(`[Webhook] Created conversation id=${convId}`);
  } else {
    console.log(`[Webhook] Found existing conversation id=${conv.id}`);
  }
  await createMessage({
    conversationId: conv.id,
    content: messageText,
    sender: "lead",
    messageType: "text"
  });
  console.log(`[Webhook] Saved lead message to conversation ${conv.id}`);
  if (!conv.isAiActive) {
    console.log(`[Webhook] AI disabled for conversation ${conv.id}, skipping auto-reply`);
    return;
  }
  const history = await getMessagesByConversation(conv.id);
  const historyForAI = history.map((m) => ({ sender: m.sender, content: m.content }));
  console.log(`[Webhook] Loaded ${history.length} messages for AI context`);
  console.log(`[Webhook] Calling OpenAI for AI response...`);
  const convDetail = await getConversationById(conv.id);
  const aiResponse = await generateAIResponse(
    pageEntry.userId,
    historyForAI,
    lead.name,
    convDetail?.page?.pageName ?? "Our Business",
    pageEntry.dbPageId
  );
  console.log(`[Webhook] AI response generated, length=${aiResponse.length}`);
  await createMessage({
    conversationId: conv.id,
    content: aiResponse,
    sender: "ai",
    messageType: "text"
  });
  console.log(`[Webhook] Saved AI message to conversation ${conv.id}`);
  if (pageEntry.pageAccessToken) {
    const sent = await sendMessengerMessage(pageEntry.pageAccessToken, senderPsid, aiResponse);
    console.log(`[Webhook] Messenger send result: ${sent}`);
  } else {
    console.warn(`[Webhook] No page access token, cannot send Messenger reply`);
  }
  await updateConversation(conv.id, {
    lastMessagePreview: aiResponse.substring(0, 200),
    lastMessageAt: /* @__PURE__ */ new Date(),
    messageCount: history.length + 2
  });
  try {
    const allMessages = [...historyForAI, { sender: "ai", content: aiResponse }];
    const scoreResult = await scoreLead(allMessages);
    await updateLead(lead.id, {
      score: scoreResult.score,
      classification: scoreResult.classification,
      budgetScore: scoreResult.budgetScore,
      authorityScore: scoreResult.authorityScore,
      needScore: scoreResult.needScore,
      timelineScore: scoreResult.timelineScore,
      budgetNotes: scoreResult.budgetNotes,
      authorityNotes: scoreResult.authorityNotes,
      needNotes: scoreResult.needNotes,
      timelineNotes: scoreResult.timelineNotes
    });
    if (scoreResult.classification === "hot" && !lead.notifiedAt) {
      await notifyOwner({
        title: `Hot Lead Detected: ${lead.name || "Unknown"}`,
        content: `Score: ${scoreResult.score}/100
Last message: ${messageText}

Budget: ${scoreResult.budgetNotes}
Need: ${scoreResult.needNotes}
Timeline: ${scoreResult.timelineNotes}`
      });
      await updateLead(lead.id, { notifiedAt: /* @__PURE__ */ new Date() });
    }
    console.log(`[Webhook] Lead scored: ${scoreResult.score}/100 (${scoreResult.classification})`);
  } catch (scoreErr) {
    console.error("[Webhook] Lead scoring failed (non-critical):", scoreErr);
  }
  try {
    const leadMessages = history.filter((m) => m.sender === "lead");
    if (leadMessages.length <= 1) {
      const now = Date.now();
      const delays = [30, 120, 720];
      const followUpMessages = [
        "Hi! Just checking in \u2014 did you have any other questions about what we discussed?",
        "Hey! I wanted to follow up on our conversation. Is there anything else I can help you with?",
        "Hi there! I noticed we chatted earlier. I'd love to help you move forward \u2014 feel free to ask me anything!"
      ];
      for (let i = 0; i < delays.length; i++) {
        await createFollowUp({
          conversationId: conv.id,
          leadId: lead.id,
          delayMinutes: delays[i],
          scheduledAt: now + delays[i] * 60 * 1e3,
          messageContent: followUpMessages[i]
        });
      }
      console.log(`[Webhook] Scheduled ${delays.length} follow-ups for lead ${lead.id}`);
    }
  } catch (followUpErr) {
    console.error("[Webhook] Follow-up scheduling failed (non-critical):", followUpErr);
  }
  console.log(`[Webhook] \u2705 Fully processed message from ${senderPsid} (lead=${lead.id}, conv=${conv.id})`);
}
function registerFacebookRoutes(app2) {
  app2.get("/api/auth/facebook", async (req, res) => {
    try {
      const cookies = req.headers.cookie || "";
      const sessionCookie = cookies.split(";").map((c) => c.trim()).find((c) => c.startsWith(`${COOKIE_NAME}=`));
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
  app2.get("/api/auth/facebook/callback", async (req, res) => {
    try {
      const { code, state } = req.query;
      if (!code || !state) {
        return res.redirect("/settings?tab=pages&error=missing_code");
      }
      const stateData = JSON.parse(Buffer.from(state, "base64").toString());
      const userId = stateData.userId;
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
      const longLivedUrl = `${FB_GRAPH}/oauth/access_token?grant_type=fb_exchange_token&client_id=${ENV.facebookAppId}&client_secret=${ENV.facebookAppSecret}&fb_exchange_token=${userAccessToken}`;
      const longLivedRes = await fetch(longLivedUrl);
      const longLivedData = longLivedRes.ok ? await longLivedRes.json() : { access_token: userAccessToken };
      const longLivedToken = longLivedData.access_token || userAccessToken;
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
      for (const page of pages) {
        const existing = await getPageByFacebookId(page.id);
        if (existing) {
          await updatePage(existing.id, {
            pageAccessToken: page.access_token,
            pageName: page.name,
            category: page.category,
            avatarUrl: page.picture?.data?.url,
            followerCount: page.fan_count || 0
          });
        } else {
          await createPage({
            userId,
            pageId: page.id,
            pageName: page.name,
            pageAccessToken: page.access_token,
            category: page.category,
            avatarUrl: page.picture?.data?.url,
            followerCount: page.fan_count || 0,
            isActive: true
          });
        }
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
  app2.get("/api/webhook/messenger", (req, res) => {
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
  app2.post("/api/webhook/messenger", async (req, res) => {
    console.log("[Webhook] POST /api/webhook/messenger received");
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
        const page = await getPageByFacebookId(pageId);
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
            try {
              await processIncomingMessage(
                {
                  pageId: page.pageId,
                  pageAccessToken: page.pageAccessToken,
                  userId: page.userId,
                  dbPageId: page.id,
                  aiMode: page.aiMode || "testing"
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
    return res.sendStatus(200);
  });
  app2.get("/api/facebook/auth-url", async (req, res) => {
    try {
      const cookies = req.headers.cookie || "";
      const sessionCookie = cookies.split(";").map((c) => c.trim()).find((c) => c.startsWith(`${COOKIE_NAME}=`));
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

// server/instagram.ts
var FB_GRAPH2 = "https://graph.facebook.com/v19.0";
async function sendInstagramMessage(pageAccessToken, recipientIgScopedId, text2) {
  const url = `${FB_GRAPH2}/me/messages?access_token=${pageAccessToken}`;
  const body = {
    recipient: { id: recipientIgScopedId },
    message: { text: text2 },
    messaging_type: "RESPONSE"
  };
  console.log(`[Instagram] Sending reply to ${recipientIgScopedId}, length=${text2.length}`);
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body)
  });
  if (!res.ok) {
    const errText = await res.text();
    console.error("[Instagram] Send failed:", res.status, errText);
    return false;
  }
  console.log(`[Instagram] Reply sent successfully to ${recipientIgScopedId}`);
  return true;
}
async function getInstagramUserProfile(igScopedId, pageAccessToken) {
  try {
    const res = await fetch(
      `${FB_GRAPH2}/${igScopedId}?fields=name,username,profile_pic&access_token=${pageAccessToken}`
    );
    if (!res.ok) {
      console.warn(`[Instagram] Profile fetch failed for ${igScopedId}: ${res.status}`);
      return null;
    }
    const data = await res.json();
    return {
      name: data.name || data.username || null,
      username: data.username || null,
      avatarUrl: data.profile_pic || null
    };
  } catch (err) {
    console.error(`[Instagram] Profile fetch error for ${igScopedId}:`, err);
    return null;
  }
}
async function processIncomingInstagramMessage(igAccount, senderIgScopedId, messageText) {
  console.log(`[IG Webhook] Processing DM from ${senderIgScopedId} to IG account ${igAccount.igUserId}: "${messageText.substring(0, 80)}"`);
  const mode = igAccount.aiMode || "testing";
  if (mode === "paused") {
    console.log(`[IG Webhook] IG account ${igAccount.igUserId} is PAUSED \u2014 ignoring message`);
    return;
  }
  if (mode === "testing") {
    if (igAccount.pageAccessToken) {
      await sendInstagramMessage(
        igAccount.pageAccessToken,
        senderIgScopedId,
        "Thanks for your message! We're currently setting things up and will get back to you shortly."
      );
    }
    return;
  }
  const dbPageId = igAccount.facebookPageId || 0;
  let lead = await getLeadByIgScopedId(senderIgScopedId, igAccount.dbAccountId);
  if (!lead) {
    console.log(`[IG Webhook] Creating new lead for IG user ${senderIgScopedId}`);
    const profile = await getInstagramUserProfile(senderIgScopedId, igAccount.pageAccessToken);
    const leadId = await createLead({
      userId: igAccount.userId,
      pageId: dbPageId,
      psid: void 0,
      igScopedId: senderIgScopedId,
      name: profile?.name || `Instagram User`,
      avatarUrl: profile?.avatarUrl || void 0,
      source: "instagram",
      platform: "instagram",
      status: "active"
    });
    if (!leadId) {
      console.error("[IG Webhook] Failed to create lead");
      return;
    }
    lead = await getLeadById(leadId);
    if (!lead) {
      console.error("[IG Webhook] Failed to fetch newly created lead");
      return;
    }
    console.log(`[IG Webhook] Created lead id=${leadId}, name=${lead.name}`);
  } else {
    console.log(`[IG Webhook] Found existing lead id=${lead.id}, name=${lead.name}`);
  }
  let conv = await getConversationByLeadId(lead.id);
  if (!conv) {
    console.log(`[IG Webhook] Creating new conversation for lead ${lead.id}`);
    const convId = await createConversation({
      userId: igAccount.userId,
      pageId: dbPageId,
      leadId: lead.id,
      lastMessagePreview: messageText.substring(0, 200),
      messageCount: 0,
      platform: "instagram",
      status: "open"
    });
    if (!convId) {
      console.error("[IG Webhook] Failed to create conversation");
      return;
    }
    conv = await getConversationByLeadId(lead.id);
    if (!conv) {
      console.error("[IG Webhook] Failed to fetch newly created conversation");
      return;
    }
    console.log(`[IG Webhook] Created conversation id=${convId}`);
  } else {
    console.log(`[IG Webhook] Found existing conversation id=${conv.id}`);
  }
  await createMessage({
    conversationId: conv.id,
    content: messageText,
    sender: "lead",
    messageType: "text"
  });
  if (!conv.isAiActive) {
    console.log(`[IG Webhook] AI disabled for conversation ${conv.id}, skipping auto-reply`);
    return;
  }
  const history = await getMessagesByConversation(conv.id);
  const historyForAI = history.map((m) => ({ sender: m.sender, content: m.content }));
  const convDetail = await getConversationById(conv.id);
  const aiResponse = await generateAIResponse(
    igAccount.userId,
    historyForAI,
    lead.name,
    convDetail?.page?.pageName ?? "Our Business",
    dbPageId
  );
  await createMessage({
    conversationId: conv.id,
    content: aiResponse,
    sender: "ai",
    messageType: "text"
  });
  if (igAccount.pageAccessToken) {
    const sent = await sendInstagramMessage(igAccount.pageAccessToken, senderIgScopedId, aiResponse);
    console.log(`[IG Webhook] Instagram send result: ${sent}`);
  }
  await updateConversation(conv.id, {
    lastMessagePreview: aiResponse.substring(0, 200),
    lastMessageAt: /* @__PURE__ */ new Date(),
    messageCount: history.length + 2
  });
  try {
    const allMessages = [...historyForAI, { sender: "ai", content: aiResponse }];
    const scoreResult = await scoreLead(allMessages);
    await updateLead(lead.id, {
      score: scoreResult.score,
      classification: scoreResult.classification,
      budgetScore: scoreResult.budgetScore,
      authorityScore: scoreResult.authorityScore,
      needScore: scoreResult.needScore,
      timelineScore: scoreResult.timelineScore,
      budgetNotes: scoreResult.budgetNotes,
      authorityNotes: scoreResult.authorityNotes,
      needNotes: scoreResult.needNotes,
      timelineNotes: scoreResult.timelineNotes
    });
    if (scoreResult.classification === "hot" && !lead.notifiedAt) {
      await notifyOwner({
        title: `\u{1F525} Hot Lead from Instagram: ${lead.name || "Unknown"}`,
        content: `Score: ${scoreResult.score}/100
Last message: ${messageText}
Platform: Instagram DM`
      });
      await updateLead(lead.id, { notifiedAt: /* @__PURE__ */ new Date() });
    }
  } catch (scoreErr) {
    console.error("[IG Webhook] Lead scoring failed (non-critical):", scoreErr);
  }
  console.log(`[IG Webhook] \u2705 Fully processed Instagram DM from ${senderIgScopedId} (lead=${lead.id}, conv=${conv.id})`);
}
function registerInstagramRoutes(app2) {
  app2.get("/api/auth/instagram", async (req, res) => {
    try {
      const cookies = req.headers.cookie || "";
      const sessionCookie = cookies.split(";").map((c) => c.trim()).find((c) => c.startsWith(`${COOKIE_NAME}=`));
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
  app2.get("/api/auth/instagram/callback", async (req, res) => {
    try {
      const { code, state } = req.query;
      if (!code || !state) {
        return res.redirect("/settings?tab=instagram&error=missing_code");
      }
      const stateData = JSON.parse(Buffer.from(state, "base64").toString());
      const userId = stateData.userId;
      const redirectUri = `${ENV.appUrl}/api/auth/instagram/callback`;
      const tokenUrl = `${FB_GRAPH2}/oauth/access_token?client_id=${ENV.facebookAppId}&redirect_uri=${encodeURIComponent(redirectUri)}&client_secret=${ENV.facebookAppSecret}&code=${code}`;
      const tokenRes = await fetch(tokenUrl);
      if (!tokenRes.ok) {
        console.error("[Instagram OAuth] Token exchange failed:", await tokenRes.text());
        return res.redirect("/settings?tab=instagram&error=token_exchange_failed");
      }
      const tokenData = await tokenRes.json();
      const userAccessToken = tokenData.access_token;
      const longLivedUrl = `${FB_GRAPH2}/oauth/access_token?grant_type=fb_exchange_token&client_id=${ENV.facebookAppId}&client_secret=${ENV.facebookAppSecret}&fb_exchange_token=${userAccessToken}`;
      const longLivedRes = await fetch(longLivedUrl);
      const longLivedData = longLivedRes.ok ? await longLivedRes.json() : { access_token: userAccessToken };
      const longLivedToken = longLivedData.access_token || userAccessToken;
      const pagesUrl = `${FB_GRAPH2}/me/accounts?access_token=${longLivedToken}&fields=id,name,access_token,instagram_business_account{id,username,name,profile_picture_url,followers_count}`;
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
        const dbPage = await getPageByFacebookId(page.id);
        const existing = await getInstagramAccountByIgUserId(igAccount.id);
        if (existing) {
          await updateInstagramAccount(existing.id, {
            igUsername: igAccount.username || existing.igUsername,
            igName: igAccount.name || existing.igName,
            profilePicUrl: igAccount.profile_picture_url,
            followerCount: igAccount.followers_count || 0,
            pageAccessToken: page.access_token,
            facebookPageId: dbPage?.id || existing.facebookPageId
          });
        } else {
          await createInstagramAccount({
            userId,
            facebookPageId: dbPage?.id || null,
            igUserId: igAccount.id,
            igUsername: igAccount.username || "unknown",
            igName: igAccount.name,
            profilePicUrl: igAccount.profile_picture_url,
            followerCount: igAccount.followers_count || 0,
            pageAccessToken: page.access_token,
            isActive: true
          });
        }
        try {
          const subscribeUrl = `${FB_GRAPH2}/${page.id}/subscribed_apps?subscribed_fields=messages,messaging_postbacks&access_token=${page.access_token}`;
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
  app2.get("/api/webhook/instagram", (req, res) => {
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
  app2.post("/api/webhook/instagram", async (req, res) => {
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
            const igAccount = await getInstagramAccountByIgUserId(igUserId);
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
                  aiMode: igAccount.aiMode || "testing"
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
  app2.get("/api/instagram/auth-url", async (req, res) => {
    try {
      const cookies = req.headers.cookie || "";
      const sessionCookie = cookies.split(";").map((c) => c.trim()).find((c) => c.startsWith(`${COOKIE_NAME}=`));
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

// server/kb-import.ts
import multer from "multer";

// server/website-crawler.ts
import * as cheerio from "cheerio";
var MAX_PAGES = 10;
var FETCH_TIMEOUT = 15e3;
async function crawlWebsite(url) {
  if (!url.startsWith("http")) url = "https://" + url;
  const baseUrl = new URL(url);
  const origin = baseUrl.origin;
  const pagesToCrawl = /* @__PURE__ */ new Set([url]);
  const crawled = /* @__PURE__ */ new Set();
  const allContent = [];
  const priorityPaths = ["/about", "/products", "/services", "/pricing", "/faq", "/contact", "/menu", "/catalog"];
  for (const path of priorityPaths) {
    pagesToCrawl.add(origin + path);
    pagesToCrawl.add(origin + path + "/");
  }
  for (const pageUrl of Array.from(pagesToCrawl)) {
    if (crawled.size >= MAX_PAGES) break;
    if (crawled.has(pageUrl)) continue;
    crawled.add(pageUrl);
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT);
      const res = await fetch(pageUrl, {
        signal: controller.signal,
        headers: {
          "User-Agent": "Mozilla/5.0 (compatible; RocketeerBot/1.0; +https://rocketeerio.vercel.app)",
          "Accept": "text/html,application/xhtml+xml"
        }
      });
      clearTimeout(timeout);
      if (!res.ok) continue;
      const contentType = res.headers.get("content-type") || "";
      if (!contentType.includes("text/html")) continue;
      const html = await res.text();
      const $ = cheerio.load(html);
      const title = $("title").text().trim() || $("h1").first().text().trim() || pageUrl;
      $("script, style, nav, footer, header, iframe, noscript, .cookie-banner, .popup").remove();
      const mainContent = $("main, article, .content, .main-content, #content, #main").text().trim();
      const bodyContent = $("body").text().trim();
      const text2 = (mainContent || bodyContent).replace(/\s+/g, " ").replace(/\n{3,}/g, "\n\n").trim().substring(0, 8e3);
      if (text2.length > 50) {
        allContent.push({ url: pageUrl, title, text: text2 });
      }
      if (crawled.size < MAX_PAGES) {
        $("a[href]").each((_, el) => {
          const href = $(el).attr("href");
          if (!href) return;
          try {
            const resolved = new URL(href, pageUrl);
            if (resolved.origin === origin && !resolved.hash && !resolved.pathname.match(/\.(pdf|jpg|png|gif|svg|css|js|zip)$/i)) {
              pagesToCrawl.add(resolved.origin + resolved.pathname);
            }
          } catch {
          }
        });
      }
    } catch (err) {
      console.warn(`[Crawler] Failed to fetch ${pageUrl}:`, err);
    }
  }
  if (allContent.length === 0) {
    return { entries: [], pagesScraped: 0, sourceUrl: url };
  }
  const combinedText = allContent.map((p) => `=== PAGE: ${p.title} (${p.url}) ===
${p.text}`).join("\n\n---\n\n").substring(0, 3e4);
  const result = await invokeLLM({
    messages: [
      {
        role: "system",
        content: `You are a business information extractor. Analyze the website content and extract structured knowledge base entries. Create entries for each distinct topic found.

Categories:
- "product": Products, services, offerings, features
- "pricing": Prices, packages, plans, costs
- "faq": Common questions, how-to information
- "policy": Terms, warranties, return policies, shipping
- "general": Company info, about us, mission, contact details

For each entry, write a clear, detailed description that an AI sales agent could use to answer customer questions. Include specific details like prices, features, timelines, etc.

Return ONLY valid JSON.`
      },
      {
        role: "user",
        content: `Extract business knowledge from this website content:

${combinedText}`
      }
    ],
    response_format: {
      type: "json_schema",
      json_schema: {
        name: "knowledge_entries",
        strict: true,
        schema: {
          type: "object",
          properties: {
            entries: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  title: { type: "string", description: "Clear, descriptive title" },
                  content: { type: "string", description: "Detailed content for the AI to reference" },
                  category: { type: "string", enum: ["product", "pricing", "faq", "policy", "general"], description: "Category" }
                },
                required: ["title", "content", "category"],
                additionalProperties: false
              }
            }
          },
          required: ["entries"],
          additionalProperties: false
        }
      }
    }
  });
  try {
    const content = result.choices[0]?.message?.content;
    const text2 = typeof content === "string" ? content : "";
    const parsed = JSON.parse(text2);
    const entries = (parsed.entries || []).map((e) => ({
      title: String(e.title || "").substring(0, 255),
      content: String(e.content || ""),
      category: ["product", "pricing", "faq", "policy", "general"].includes(e.category) ? e.category : "general"
    }));
    return { entries, pagesScraped: allContent.length, sourceUrl: url };
  } catch {
    return { entries: [], pagesScraped: allContent.length, sourceUrl: url };
  }
}
async function structureDocumentContent(documentText, fileName) {
  if (!documentText || documentText.trim().length < 20) {
    return { entries: [] };
  }
  const truncatedText = documentText.substring(0, 3e4);
  const result = await invokeLLM({
    messages: [
      {
        role: "system",
        content: `You are a business information extractor. Analyze the document content and extract structured knowledge base entries. The document may be a product catalog, brochure, price list, specification sheet, script, SOP, or any business document.

Categories:
- "product": Products, services, offerings, features, specifications
- "pricing": Prices, packages, plans, costs
- "faq": Common questions, how-to information
- "policy": Terms, warranties, return policies, shipping
- "general": Company info, about us, mission, contact details

For each entry, write a clear, detailed description that an AI sales agent could use to answer customer questions. Include specific details like prices, features, dimensions, materials, etc.

Return ONLY valid JSON.`
      },
      {
        role: "user",
        content: `Extract business knowledge from this document "${fileName}":

${truncatedText}`
      }
    ],
    response_format: {
      type: "json_schema",
      json_schema: {
        name: "knowledge_entries",
        strict: true,
        schema: {
          type: "object",
          properties: {
            entries: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  title: { type: "string", description: "Clear, descriptive title" },
                  content: { type: "string", description: "Detailed content for the AI to reference" },
                  category: { type: "string", enum: ["product", "pricing", "faq", "policy", "general"], description: "Category" }
                },
                required: ["title", "content", "category"],
                additionalProperties: false
              }
            }
          },
          required: ["entries"],
          additionalProperties: false
        }
      }
    }
  });
  try {
    const content = result.choices[0]?.message?.content;
    const text2 = typeof content === "string" ? content : "";
    const parsed = JSON.parse(text2);
    const entries = (parsed.entries || []).map((e) => ({
      title: String(e.title || "").substring(0, 255),
      content: String(e.content || ""),
      category: ["product", "pricing", "faq", "policy", "general"].includes(e.category) ? e.category : "general"
    }));
    return { entries };
  } catch {
    return { entries: [] };
  }
}

// server/kb-import.ts
var ALLOWED_MIMES = /* @__PURE__ */ new Set([
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  // .docx
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  // .xlsx
  "text/csv",
  "text/plain",
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif"
]);
var upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 20 * 1024 * 1024 },
  // 20MB
  fileFilter: (_req, file, cb) => {
    if (ALLOWED_MIMES.has(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error(`File type ${file.mimetype} is not supported. Accepted: PDF, DOCX, XLSX, CSV, TXT, JPG, PNG.`));
    }
  }
});
async function authenticateRequest(req) {
  const cookies = req.headers.cookie || "";
  const sessionCookie = cookies.split(";").map((c) => c.trim()).find((c) => c.startsWith(`${COOKIE_NAME}=`));
  const token = sessionCookie?.split("=")[1];
  const session = await sdk.verifySession(token);
  return session?.userId ?? null;
}
async function parsePdf(buffer) {
  const pdfParseFn = (await import("pdf-parse/lib/pdf-parse.js")).default ?? await import("pdf-parse/lib/pdf-parse.js");
  return pdfParseFn(buffer);
}
async function parseDocx(buffer) {
  const mammoth = await import("mammoth");
  const result = await mammoth.default.extractRawText({ buffer });
  return result.value;
}
async function parseXlsx(buffer) {
  const XLSX = await import("xlsx");
  const workbook = XLSX.read(buffer, { type: "buffer" });
  const lines = [];
  for (const sheetName of workbook.SheetNames) {
    const sheet = workbook.Sheets[sheetName];
    if (!sheet) continue;
    lines.push(`=== Sheet: ${sheetName} ===`);
    const csv = XLSX.utils.sheet_to_csv(sheet);
    lines.push(csv);
    lines.push("");
  }
  return lines.join("\n");
}
async function parseImage(buffer, mimeType) {
  const base64 = buffer.toString("base64");
  const dataUrl = `data:${mimeType};base64,${base64}`;
  const result = await invokeLLM({
    messages: [
      {
        role: "system",
        content: "You are a business document OCR and content extraction assistant. Extract ALL text visible in the image. If the image contains a product, menu, price list, brochure, or any business-related content, describe it in detail including any visible text, prices, product names, and other relevant information. Return the extracted content as plain text."
      },
      {
        role: "user",
        content: [
          { type: "text", text: "Extract all text and business information from this image:" },
          { type: "image_url", image_url: { url: dataUrl, detail: "high" } }
        ]
      }
    ]
  });
  const content = result.choices[0]?.message?.content;
  if (typeof content === "string") return content;
  if (Array.isArray(content)) {
    const textPart = content.find((p) => typeof p === "object" && "type" in p && p.type === "text");
    if (textPart && "text" in textPart) return textPart.text;
  }
  return "";
}
async function extractTextFromFile(buffer, mimeType, originalName) {
  switch (mimeType) {
    case "application/pdf": {
      const pdfData = await parsePdf(buffer);
      return pdfData.text;
    }
    case "application/vnd.openxmlformats-officedocument.wordprocessingml.document": {
      return parseDocx(buffer);
    }
    case "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": {
      return parseXlsx(buffer);
    }
    case "text/csv":
    case "text/plain": {
      return buffer.toString("utf-8");
    }
    case "image/jpeg":
    case "image/png":
    case "image/webp":
    case "image/gif": {
      return parseImage(buffer, mimeType);
    }
    default:
      throw new Error(`Unsupported file type: ${mimeType}`);
  }
}
function getSourceForMime(mimeType) {
  if (mimeType === "application/pdf") return "pdf";
  return "file";
}
function registerKbImportRoutes(app2) {
  app2.post("/api/kb/import-website", async (req, res) => {
    try {
      const userId = await authenticateRequest(req);
      if (!userId) return res.status(401).json({ error: "Not authenticated" });
      const { url } = req.body;
      if (!url || typeof url !== "string") {
        return res.status(400).json({ error: "URL is required" });
      }
      console.log(`[KB Import] Crawling website: ${url} for user ${userId}`);
      const result = await crawlWebsite(url);
      if (result.entries.length === 0) {
        return res.json({
          success: true,
          entries: [],
          pagesScraped: result.pagesScraped,
          message: "No content could be extracted from the website."
        });
      }
      const savedEntries = [];
      for (const entry of result.entries) {
        const id = await createKnowledgeEntry({
          userId,
          title: entry.title,
          content: entry.content,
          category: entry.category,
          source: "website",
          sourceUrl: url
        });
        if (id) {
          savedEntries.push({ id, ...entry });
        }
      }
      console.log(`[KB Import] Saved ${savedEntries.length} entries from ${result.pagesScraped} pages`);
      return res.json({
        success: true,
        entries: savedEntries,
        pagesScraped: result.pagesScraped,
        message: `Extracted ${savedEntries.length} entries from ${result.pagesScraped} pages.`
      });
    } catch (error) {
      console.error("[KB Import] Website crawl error:", error);
      return res.status(500).json({ error: "Failed to crawl website" });
    }
  });
  app2.post("/api/kb/import-file", upload.single("file"), async (req, res) => {
    try {
      const userId = await authenticateRequest(req);
      if (!userId) return res.status(401).json({ error: "Not authenticated" });
      const file = req.file;
      if (!file) {
        return res.status(400).json({ error: "File is required" });
      }
      console.log(`[KB Import] Processing file: ${file.originalname} (${file.mimetype}, ${(file.size / 1024).toFixed(1)}KB) for user ${userId}`);
      const extractedText = await extractTextFromFile(file.buffer, file.mimetype, file.originalname);
      if (!extractedText || extractedText.trim().length < 20) {
        return res.json({
          success: true,
          entries: [],
          message: "Could not extract meaningful text from the file. It may be empty or unreadable."
        });
      }
      const result = await structureDocumentContent(extractedText, file.originalname);
      if (result.entries.length === 0) {
        return res.json({
          success: true,
          entries: [],
          message: "No structured content could be extracted from the file."
        });
      }
      const source = getSourceForMime(file.mimetype);
      const savedEntries = [];
      for (const entry of result.entries) {
        const id = await createKnowledgeEntry({
          userId,
          title: entry.title,
          content: entry.content,
          category: entry.category,
          source,
          sourceUrl: file.originalname
        });
        if (id) {
          savedEntries.push({ id, ...entry });
        }
      }
      console.log(`[KB Import] Saved ${savedEntries.length} entries from file: ${file.originalname}`);
      return res.json({
        success: true,
        entries: savedEntries,
        message: `Extracted ${savedEntries.length} entries from "${file.originalname}".`
      });
    } catch (error) {
      console.error("[KB Import] File import error:", error);
      return res.status(500).json({ error: "Failed to process file" });
    }
  });
  app2.post("/api/kb/import-pdf", upload.single("pdf"), async (req, res) => {
    try {
      const userId = await authenticateRequest(req);
      if (!userId) return res.status(401).json({ error: "Not authenticated" });
      const file = req.file;
      if (!file) {
        return res.status(400).json({ error: "PDF file is required" });
      }
      console.log(`[KB Import] Processing PDF (legacy): ${file.originalname} (${(file.size / 1024).toFixed(1)}KB) for user ${userId}`);
      const pdfData = await parsePdf(file.buffer);
      const pdfText = pdfData.text;
      if (!pdfText || pdfText.trim().length < 20) {
        return res.json({
          success: true,
          entries: [],
          message: "Could not extract meaningful text from the PDF. It may be image-based."
        });
      }
      const result = await structureDocumentContent(pdfText, file.originalname);
      if (result.entries.length === 0) {
        return res.json({
          success: true,
          entries: [],
          message: "No structured content could be extracted from the PDF."
        });
      }
      const savedEntries = [];
      for (const entry of result.entries) {
        const id = await createKnowledgeEntry({
          userId,
          title: entry.title,
          content: entry.content,
          category: entry.category,
          source: "pdf",
          sourceUrl: file.originalname
        });
        if (id) {
          savedEntries.push({ id, ...entry });
        }
      }
      console.log(`[KB Import] Saved ${savedEntries.length} entries from PDF: ${file.originalname}`);
      return res.json({
        success: true,
        entries: savedEntries,
        message: `Extracted ${savedEntries.length} entries from "${file.originalname}".`
      });
    } catch (error) {
      console.error("[KB Import] PDF import error:", error);
      return res.status(500).json({ error: "Failed to process PDF" });
    }
  });
}

// server/paymongo.ts
var PAYMONGO_API = "https://api.paymongo.com/v1";
function getAuthHeader() {
  return "Basic " + Buffer.from(ENV.paymongoSecretKey + ":").toString("base64");
}
async function paymongoRequest(endpoint, options = {}) {
  const url = `${PAYMONGO_API}${endpoint}`;
  const res = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Authorization: getAuthHeader(),
      ...options.headers
    }
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
async function createCheckoutSession(params) {
  const {
    amount,
    currency = "USD",
    description,
    planSlug,
    userId,
    successUrl,
    cancelUrl
  } = params;
  const response = await paymongoRequest("/checkout_sessions", {
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
            "grab_pay"
          ],
          line_items: [
            {
              name: description,
              quantity: 1,
              amount,
              currency
            }
          ],
          description: `Rocketeer ${description} subscription`,
          success_url: successUrl,
          cancel_url: cancelUrl,
          metadata: {
            plan_slug: planSlug,
            user_id: String(userId)
          }
        }
      }
    })
  });
  return {
    checkoutId: response.data.id,
    checkoutUrl: response.data.attributes.checkout_url
  };
}
var PAYMONGO_EVENTS = {
  CHECKOUT_SESSION_PAYMENT_PAID: "checkout_session.payment.paid",
  PAYMENT_PAID: "payment.paid",
  PAYMENT_FAILED: "payment.failed",
  SOURCE_CHARGEABLE: "source.chargeable"
};

// server/paymongo-webhook.ts
function registerPaymongoWebhookRoutes(app2) {
  app2.post("/api/webhook/paymongo", async (req, res) => {
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
      res.status(200).json({ received: true });
    } catch (error) {
      console.error("[PayMongo Webhook] Processing error:", error);
      res.status(200).json({ received: true, error: "Processing error" });
    }
  });
  app2.get("/api/webhook/paymongo", (_req, res) => {
    res.json({ status: "ok", message: "PayMongo webhook endpoint is active" });
  });
}
async function handleCheckoutPaymentPaid(eventData) {
  try {
    const checkoutId = eventData?.id;
    const attributes = eventData?.attributes;
    const paymentId = attributes?.payments?.[0]?.id;
    const metadata = attributes?.metadata;
    console.log("[PayMongo Webhook] Checkout payment paid:", {
      checkoutId,
      paymentId,
      userId: metadata?.user_id,
      planSlug: metadata?.plan_slug
    });
    if (!checkoutId) {
      console.warn("[PayMongo Webhook] No checkout ID in event data");
      return;
    }
    const subscription = await getUserSubscriptionByCheckoutId(checkoutId);
    if (subscription) {
      await updateUserSubscription(subscription.id, {
        status: "active",
        paymongoSubscriptionId: paymentId ?? void 0
      });
      console.log("[PayMongo Webhook] Subscription activated for user:", subscription.userId);
    }
    await updatePaymentByCheckoutId(checkoutId, {
      status: "paid",
      paymongoPaymentId: paymentId ?? void 0,
      paidAt: /* @__PURE__ */ new Date()
    });
    if (metadata?.user_id && metadata?.plan_slug) {
      const planSlug = metadata.plan_slug;
      await updateUserProfile(parseInt(metadata.user_id, 10), {
        plan: planSlug
      });
      console.log("[PayMongo Webhook] User plan updated to:", planSlug);
    }
  } catch (error) {
    console.error("[PayMongo Webhook] Error handling checkout payment:", error);
  }
}
async function handlePaymentPaid(eventData) {
  try {
    const paymentId = eventData?.id;
    const attributes = eventData?.attributes;
    const amount = attributes?.amount;
    const metadata = attributes?.metadata;
    console.log("[PayMongo Webhook] Payment paid:", {
      paymentId,
      amount,
      userId: metadata?.user_id
    });
    if (metadata?.user_id) {
      const userId = parseInt(metadata.user_id, 10);
      await createPaymentRecord({
        userId,
        amount: String((amount ?? 0) / 100),
        currency: attributes?.currency ?? "PHP",
        status: "paid",
        paymongoPaymentId: paymentId,
        description: `Payment received via ${attributes?.source?.type ?? "unknown"}`,
        paidAt: /* @__PURE__ */ new Date()
      });
    }
  } catch (error) {
    console.error("[PayMongo Webhook] Error handling payment paid:", error);
  }
}
async function handlePaymentFailed(eventData) {
  try {
    const paymentId = eventData?.id;
    const metadata = eventData?.attributes?.metadata;
    console.log("[PayMongo Webhook] Payment failed:", {
      paymentId,
      userId: metadata?.user_id
    });
    if (metadata?.user_id) {
      const userId = parseInt(metadata.user_id, 10);
      const subscription = await getUserSubscription(userId);
      if (subscription) {
        await updateUserSubscription(subscription.id, {
          status: "past_due"
        });
      }
    }
  } catch (error) {
    console.error("[PayMongo Webhook] Error handling payment failed:", error);
  }
}

// server/_core/systemRouter.ts
import { z } from "zod";

// server/_core/trpc.ts
import { initTRPC, TRPCError as TRPCError2 } from "@trpc/server";
import superjson from "superjson";
var t = initTRPC.context().create({
  transformer: superjson
});
var router = t.router;
var publicProcedure = t.procedure;
var requireUser = t.middleware(async (opts) => {
  const { ctx, next } = opts;
  if (!ctx.user) {
    throw new TRPCError2({ code: "UNAUTHORIZED", message: UNAUTHED_ERR_MSG });
  }
  return next({
    ctx: {
      ...ctx,
      user: ctx.user
    }
  });
});
var protectedProcedure = t.procedure.use(requireUser);
var adminProcedure = t.procedure.use(
  t.middleware(async (opts) => {
    const { ctx, next } = opts;
    if (!ctx.user || ctx.user.role !== "admin") {
      throw new TRPCError2({ code: "FORBIDDEN", message: NOT_ADMIN_ERR_MSG });
    }
    return next({
      ctx: {
        ...ctx,
        user: ctx.user
      }
    });
  })
);

// server/_core/systemRouter.ts
var systemRouter = router({
  health: publicProcedure.input(
    z.object({
      timestamp: z.number().min(0, "timestamp cannot be negative")
    })
  ).query(() => ({
    ok: true
  })),
  notifyOwner: adminProcedure.input(
    z.object({
      title: z.string().min(1, "title is required"),
      content: z.string().min(1, "content is required")
    })
  ).mutation(async ({ input }) => {
    const delivered = await notifyOwner(input);
    return {
      success: delivered
    };
  })
});

// server/routers.ts
import { z as z2 } from "zod";
var appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query((opts) => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true };
    })
  }),
  // ─── User Profile & Onboarding ─────────────────────────────────────
  user: router({
    updateProfile: protectedProcedure.input(z2.object({
      name: z2.string().optional(),
      email: z2.string().email().optional(),
      phone: z2.string().optional(),
      company: z2.string().optional(),
      onboardingCompleted: z2.boolean().optional(),
      plan: z2.enum(["starter", "growth", "scale"]).optional()
    })).mutation(async ({ ctx, input }) => {
      await updateUserProfile(ctx.user.id, input);
      return { success: true };
    })
  }),
  // ─── Facebook Pages ────────────────────────────────────────────────
  pages: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      return getUserPages(ctx.user.id);
    }),
    create: protectedProcedure.input(z2.object({
      pageId: z2.string(),
      pageName: z2.string(),
      category: z2.string().optional(),
      avatarUrl: z2.string().optional(),
      followerCount: z2.number().optional()
    })).mutation(async ({ ctx, input }) => {
      const id = await createPage({
        userId: ctx.user.id,
        ...input
      });
      return { id };
    }),
    update: protectedProcedure.input(z2.object({
      id: z2.number(),
      pageName: z2.string().optional(),
      isActive: z2.boolean().optional(),
      category: z2.string().optional()
    })).mutation(async ({ input }) => {
      const { id, ...data } = input;
      await updatePage(id, data);
      return { success: true };
    }),
    delete: protectedProcedure.input(z2.object({ id: z2.number() })).mutation(async ({ input }) => {
      await deletePage(input.id);
      return { success: true };
    })
  }),
  // ─── Instagram Accounts ────────────────────────────────────────────
  instagram: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      return getUserInstagramAccounts(ctx.user.id);
    }),
    delete: protectedProcedure.input(z2.object({ id: z2.number() })).mutation(async ({ input }) => {
      await deleteInstagramAccount(input.id);
      return { success: true };
    }),
    updateMode: protectedProcedure.input(z2.object({
      id: z2.number(),
      aiMode: z2.enum(["paused", "testing", "live"])
    })).mutation(async ({ input }) => {
      await updateInstagramAccountMode(input.id, input.aiMode);
      return { success: true };
    })
  }),
  // ─── Leads ─────────────────────────────────────────────────────────
  leads: router({
    list: protectedProcedure.input(z2.object({ classification: z2.string().optional() }).optional()).query(async ({ ctx, input }) => {
      return getLeadsByUser(ctx.user.id, input?.classification);
    }),
    get: protectedProcedure.input(z2.object({ id: z2.number() })).query(async ({ input }) => {
      return getLeadById(input.id);
    }),
    update: protectedProcedure.input(z2.object({
      id: z2.number(),
      status: z2.enum(["active", "converted", "archived", "lost"]).optional(),
      name: z2.string().optional(),
      email: z2.string().optional(),
      phone: z2.string().optional()
    })).mutation(async ({ input }) => {
      const { id, ...data } = input;
      const updateData = { ...data };
      if (data.status === "converted") {
        updateData.convertedAt = /* @__PURE__ */ new Date();
      }
      await updateLead(id, updateData);
      return { success: true };
    })
  }),
  // ─── Conversations ─────────────────────────────────────────────────
  conversations: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      return getConversationsByUser(ctx.user.id);
    }),
    get: protectedProcedure.input(z2.object({ id: z2.number() })).query(async ({ input }) => {
      return getConversationById(input.id);
    }),
    updateStatus: protectedProcedure.input(z2.object({
      id: z2.number(),
      status: z2.enum(["open", "closed", "archived"])
    })).mutation(async ({ input }) => {
      await updateConversation(input.id, { status: input.status });
      return { success: true };
    }),
    toggleAi: protectedProcedure.input(z2.object({
      id: z2.number(),
      isAiActive: z2.boolean()
    })).mutation(async ({ input }) => {
      await updateConversation(input.id, { isAiActive: input.isAiActive });
      return { success: true };
    })
  }),
  // ─── Messages ──────────────────────────────────────────────────────
  messages: router({
    list: protectedProcedure.input(z2.object({ conversationId: z2.number() })).query(async ({ input }) => {
      return getMessagesByConversation(input.conversationId);
    }),
    send: protectedProcedure.input(z2.object({
      conversationId: z2.number(),
      content: z2.string(),
      sender: z2.enum(["human", "lead"]).default("human")
    })).mutation(async ({ input }) => {
      const id = await createMessage({
        conversationId: input.conversationId,
        content: input.content,
        sender: input.sender,
        messageType: "text"
      });
      await updateConversation(input.conversationId, {
        lastMessagePreview: input.content.substring(0, 200),
        lastMessageAt: /* @__PURE__ */ new Date()
      });
      return { id };
    }),
    // AI-powered reply: generates response and scores lead
    aiReply: protectedProcedure.input(z2.object({
      conversationId: z2.number(),
      leadMessage: z2.string()
    })).mutation(async ({ ctx, input }) => {
      await createMessage({
        conversationId: input.conversationId,
        content: input.leadMessage,
        sender: "lead",
        messageType: "text"
      });
      const conv = await getConversationById(input.conversationId);
      if (!conv) throw new Error("Conversation not found");
      const history = await getMessagesByConversation(input.conversationId);
      const historyForAI = history.map((m) => ({ sender: m.sender, content: m.content }));
      const aiResponse = await generateAIResponse(
        ctx.user.id,
        historyForAI,
        conv.lead?.name ?? null,
        conv.page?.pageName ?? "Our Business",
        conv.page?.id
      );
      await createMessage({
        conversationId: input.conversationId,
        content: aiResponse,
        sender: "ai",
        messageType: "text"
      });
      await updateConversation(input.conversationId, {
        lastMessagePreview: aiResponse.substring(0, 200),
        lastMessageAt: /* @__PURE__ */ new Date(),
        messageCount: history.length + 2
      });
      const allMessages = [...historyForAI, { sender: "ai", content: aiResponse }];
      const scoreResult = await scoreLead(allMessages);
      if (conv.lead) {
        await updateLead(conv.lead.id, {
          score: scoreResult.score,
          classification: scoreResult.classification,
          budgetScore: scoreResult.budgetScore,
          authorityScore: scoreResult.authorityScore,
          needScore: scoreResult.needScore,
          timelineScore: scoreResult.timelineScore,
          budgetNotes: scoreResult.budgetNotes,
          authorityNotes: scoreResult.authorityNotes,
          needNotes: scoreResult.needNotes,
          timelineNotes: scoreResult.timelineNotes
        });
        if (scoreResult.classification === "hot" && !conv.lead.notifiedAt) {
          await notifyOwner({
            title: `\u{1F525} Hot Lead Detected: ${conv.lead.name || "Unknown"}`,
            content: `Score: ${scoreResult.score}/100
Page: ${conv.page?.pageName}
Last message: ${input.leadMessage}

Budget: ${scoreResult.budgetNotes}
Need: ${scoreResult.needNotes}
Timeline: ${scoreResult.timelineNotes}`
          });
          await updateLead(conv.lead.id, { notifiedAt: /* @__PURE__ */ new Date() });
        }
      }
      const leadMessages = history.filter((m) => m.sender === "lead");
      if (leadMessages.length <= 1 && conv.lead) {
        const now = Date.now();
        const delays = [30, 120, 720];
        const followUpMessages = [
          "Hi! Just checking in \u2014 did you have any other questions about what we discussed?",
          "Hey! I wanted to follow up on our conversation. Is there anything else I can help you with?",
          "Hi there! I noticed we chatted earlier. I'd love to help you move forward \u2014 feel free to ask me anything!"
        ];
        for (let i = 0; i < delays.length; i++) {
          await createFollowUp({
            conversationId: input.conversationId,
            leadId: conv.lead.id,
            delayMinutes: delays[i],
            scheduledAt: now + delays[i] * 60 * 1e3,
            messageContent: followUpMessages[i]
          });
        }
      }
      return { aiResponse, score: scoreResult };
    })
  }),
  // ─── Knowledge Base ────────────────────────────────────────────────
  knowledgeBase: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      return getKnowledgeBase(ctx.user.id);
    }),
    create: protectedProcedure.input(z2.object({
      title: z2.string(),
      content: z2.string(),
      category: z2.enum(["product", "pricing", "faq", "policy", "general"]).default("general")
    })).mutation(async ({ ctx, input }) => {
      const id = await createKnowledgeEntry({
        userId: ctx.user.id,
        ...input
      });
      return { id };
    }),
    update: protectedProcedure.input(z2.object({
      id: z2.number(),
      title: z2.string().optional(),
      content: z2.string().optional(),
      category: z2.enum(["product", "pricing", "faq", "policy", "general"]).optional(),
      isActive: z2.boolean().optional()
    })).mutation(async ({ input }) => {
      const { id, ...data } = input;
      await updateKnowledgeEntry(id, data);
      return { success: true };
    }),
    delete: protectedProcedure.input(z2.object({ id: z2.number() })).mutation(async ({ input }) => {
      await deleteKnowledgeEntry(input.id);
      return { success: true };
    })
  }),
  // ─── Follow-Up Sequences ──────────────────────────────────────────
  followUps: router({
    list: protectedProcedure.input(z2.object({ conversationId: z2.number() })).query(async ({ input }) => {
      return getFollowUps(input.conversationId);
    }),
    schedule: protectedProcedure.input(z2.object({
      conversationId: z2.number(),
      leadId: z2.number()
    })).mutation(async ({ ctx, input }) => {
      const settings = await getFollowUpSettings(ctx.user.id);
      if (settings && !settings.isEnabled) {
        return { success: false, count: 0, reason: "Follow-ups disabled" };
      }
      const now = Date.now();
      const steps = [
        { delay: settings?.step1DelayMinutes ?? 1440, message: settings?.step1Message || "Hi! Just checking in \u2014 did you have any other questions about what we discussed?", enabled: settings?.step1Enabled ?? true },
        { delay: settings?.step2DelayMinutes ?? 2880, message: settings?.step2Message || "Hey! I wanted to follow up on our conversation. Is there anything else I can help you with?", enabled: settings?.step2Enabled ?? true },
        { delay: settings?.step3DelayMinutes ?? 10080, message: settings?.step3Message || "Hi there! I noticed we chatted earlier. I\u2019d love to help you move forward \u2014 feel free to ask me anything!", enabled: settings?.step3Enabled ?? true }
      ];
      let count2 = 0;
      for (const step of steps) {
        if (!step.enabled) continue;
        await createFollowUp({
          conversationId: input.conversationId,
          leadId: input.leadId,
          delayMinutes: step.delay,
          scheduledAt: now + step.delay * 60 * 1e3,
          messageContent: step.message
        });
        count2++;
      }
      return { success: true, count: count2 };
    }),
    cancel: protectedProcedure.input(z2.object({ id: z2.number() })).mutation(async ({ input }) => {
      await updateFollowUp(input.id, { status: "cancelled" });
      return { success: true };
    }),
    // ─── Follow-Up Settings ────────────────────────────────────────
    getSettings: protectedProcedure.query(async ({ ctx }) => {
      const settings = await getFollowUpSettings(ctx.user.id);
      return settings || {
        isEnabled: true,
        step1DelayMinutes: 1440,
        step1Message: "Hi! Just checking in \u2014 did you have any other questions about what we discussed?",
        step1Enabled: true,
        step2DelayMinutes: 2880,
        step2Message: "Hey! I wanted to follow up on our conversation. Is there anything else I can help you with?",
        step2Enabled: true,
        step3DelayMinutes: 10080,
        step3Message: "Hi there! I noticed we chatted earlier. I\u2019d love to help you move forward \u2014 feel free to ask me anything!",
        step3Enabled: true
      };
    }),
    updateSettings: protectedProcedure.input(z2.object({
      isEnabled: z2.boolean().optional(),
      step1DelayMinutes: z2.number().min(1).optional(),
      step1Message: z2.string().optional(),
      step1Enabled: z2.boolean().optional(),
      step2DelayMinutes: z2.number().min(1).optional(),
      step2Message: z2.string().optional(),
      step2Enabled: z2.boolean().optional(),
      step3DelayMinutes: z2.number().min(1).optional(),
      step3Message: z2.string().optional(),
      step3Enabled: z2.boolean().optional()
    })).mutation(async ({ ctx, input }) => {
      await upsertFollowUpSettings(ctx.user.id, input);
      return { success: true };
    })
  }),
  // ─── Notification Preferences ──────────────────────────────────────
  notifications: router({
    get: protectedProcedure.query(async ({ ctx }) => {
      return getNotificationPrefs(ctx.user.id);
    }),
    update: protectedProcedure.input(z2.object({
      smsEnabled: z2.boolean().optional(),
      emailEnabled: z2.boolean().optional(),
      hotLeadSms: z2.boolean().optional(),
      hotLeadEmail: z2.boolean().optional(),
      warmLeadEmail: z2.boolean().optional(),
      dailyDigest: z2.boolean().optional(),
      smsPhone: z2.string().optional(),
      notificationEmail: z2.string().optional()
    })).mutation(async ({ ctx, input }) => {
      await upsertNotificationPrefs(ctx.user.id, input);
      return { success: true };
    })
  }),
  // ─── Page Mode ─────────────────────────────────────────────────────
  pageMode: router({
    get: protectedProcedure.input(z2.object({ pageId: z2.number() })).query(async ({ input }) => {
      return { mode: await getPageMode(input.pageId) };
    }),
    update: protectedProcedure.input(z2.object({
      pageId: z2.number(),
      mode: z2.enum(["paused", "testing", "live"])
    })).mutation(async ({ input }) => {
      await updatePageMode(input.pageId, input.mode);
      return { success: true };
    })
  }),
  // ─── Page Testers ─────────────────────────────────────────────────
  testers: router({
    list: protectedProcedure.input(z2.object({ pageId: z2.number() })).query(async ({ input }) => {
      return getPageTesters(input.pageId);
    }),
    add: protectedProcedure.input(z2.object({
      pageId: z2.number(),
      psid: z2.string().min(1),
      label: z2.string().optional()
    })).mutation(async ({ input }) => {
      const id = await addPageTester({
        pageId: input.pageId,
        psid: input.psid,
        label: input.label
      });
      return { id };
    }),
    remove: protectedProcedure.input(z2.object({ id: z2.number() })).mutation(async ({ input }) => {
      await removePageTester(input.id);
      return { success: true };
    })
  }),
  // ─── AI Personality Settings ───────────────────────────────────────
  aiSettings: router({
    get: protectedProcedure.input(z2.object({ pageId: z2.number() })).query(async ({ input }) => {
      return getPageAiSettings(input.pageId);
    }),
    update: protectedProcedure.input(z2.object({
      pageId: z2.number(),
      agentName: z2.string().optional(),
      tone: z2.enum(["casual_taglish", "pure_tagalog", "professional_filipino", "casual_english", "formal_english", "professional_english"]).optional(),
      responseLength: z2.enum(["short", "medium", "detailed"]).optional(),
      useEmojis: z2.boolean().optional(),
      primaryGoal: z2.enum(["site_visit", "booking", "quote_request", "general_support", "order_purchase", "reservation", "appointment", "collect_lead_info", "signup_registration", "custom_goal"]).optional(),
      customGoal: z2.string().optional(),
      customInstructions: z2.string().optional()
    })).mutation(async ({ ctx, input }) => {
      const { pageId, ...data } = input;
      await upsertPageAiSettings(pageId, ctx.user.id, data);
      return { success: true };
    })
  }),
  // ─── Dashboard ─────────────────────────────────────────────────────
  dashboard: router({
    stats: protectedProcedure.query(async ({ ctx }) => {
      return getDashboardStats(ctx.user.id);
    }),
    activity: protectedProcedure.input(z2.object({ days: z2.number().default(7) }).optional()).query(async ({ ctx, input }) => {
      return getLeadActivityByDay(ctx.user.id, input?.days ?? 7);
    })
  }),
  // ─── Demo Data Seeding ─────────────────────────────────────────────
  seed: router({
    generate: protectedProcedure.mutation(async ({ ctx }) => {
      const userId = ctx.user.id;
      const pageId = await createPage({
        userId,
        pageId: `demo_page_${Date.now()}`,
        pageName: "My Business Page",
        category: "Local Business",
        followerCount: 2450,
        isActive: true
      });
      if (!pageId) return { success: false };
      const kbEntries = [
        { title: "Product Overview", content: "We offer premium home renovation services including kitchen remodeling, bathroom upgrades, and full home renovations. Our prices start at $5,000 for basic packages and go up to $50,000 for luxury full-home renovations.", category: "product" },
        { title: "Pricing Packages", content: "Basic Package: $5,000-$10,000 (single room). Standard Package: $15,000-$25,000 (kitchen or bathroom). Premium Package: $30,000-$50,000 (full home). All packages include free consultation and 3D design preview.", category: "pricing" },
        { title: "FAQ - Timeline", content: "Basic renovations take 2-4 weeks. Standard projects take 4-8 weeks. Full home renovations take 8-16 weeks. We provide a detailed timeline during the free consultation.", category: "faq" },
        { title: "FAQ - Warranty", content: "All our work comes with a 5-year warranty on labor and materials. We use only certified contractors and premium materials from trusted suppliers.", category: "faq" },
        { title: "Booking Policy", content: "Free consultations available Monday-Saturday. Book online or call us at (555) 123-4567. We require a 20% deposit to begin work, with the balance due upon completion.", category: "policy" }
      ];
      for (const entry of kbEntries) {
        await createKnowledgeEntry({ userId, ...entry });
      }
      const demoLeads = [
        { name: "Sarah Mitchell", email: "sarah.m@email.com", phone: "+1-555-0101", score: 92, classification: "hot", budgetScore: 23, authorityScore: 25, needScore: 22, timelineScore: 22, budgetNotes: "Mentioned budget of $30K-40K for kitchen remodel", authorityNotes: "Homeowner and decision-maker", needNotes: "Kitchen is outdated, needs modern upgrade", timelineNotes: "Wants to start within 2 weeks" },
        { name: "James Rodriguez", email: "j.rodriguez@company.com", phone: "+1-555-0102", score: 74, classification: "warm", budgetScore: 18, authorityScore: 20, needScore: 20, timelineScore: 16, budgetNotes: "Exploring pricing options", authorityNotes: "Property manager for rental units", needNotes: "Multiple bathrooms need updating", timelineNotes: "Planning for next quarter" },
        { name: "Emily Chen", email: "emily.c@gmail.com", phone: "+1-555-0103", score: 85, classification: "hot", budgetScore: 22, authorityScore: 23, needScore: 20, timelineScore: 20, budgetNotes: "Has $25K budget approved", authorityNotes: "Confirmed homeowner", needNotes: "Bathroom renovation for accessibility", timelineNotes: "Needs it done within a month" },
        { name: "Michael Brown", email: "m.brown@outlook.com", phone: "", score: 45, classification: "warm", budgetScore: 10, authorityScore: 15, needScore: 12, timelineScore: 8, budgetNotes: "No specific budget mentioned", authorityNotes: "Renting, needs landlord approval", needNotes: "General interest in home improvement", timelineNotes: "No specific timeline" },
        { name: "Lisa Park", email: "lisa.park@email.com", phone: "+1-555-0105", score: 28, classification: "cold", budgetScore: 5, authorityScore: 8, needScore: 10, timelineScore: 5, budgetNotes: "Just browsing", authorityNotes: "Unknown role", needNotes: "Casual inquiry", timelineNotes: "No urgency" },
        { name: "David Kim", email: "d.kim@business.com", phone: "+1-555-0106", score: 88, classification: "hot", budgetScore: 24, authorityScore: 22, needScore: 22, timelineScore: 20, budgetNotes: "Budget of $45K for full renovation", authorityNotes: "Business owner renovating office", needNotes: "Complete office renovation needed", timelineNotes: "Must complete before lease renewal in 6 weeks" },
        { name: "Anna Williams", email: "anna.w@gmail.com", phone: "+1-555-0107", score: 62, classification: "warm", budgetScore: 15, authorityScore: 17, needScore: 18, timelineScore: 12, budgetNotes: "Comparing quotes from multiple contractors", authorityNotes: "Co-owner with spouse", needNotes: "Master bedroom renovation", timelineNotes: "Sometime this year" },
        { name: "Robert Taylor", email: "r.taylor@email.com", phone: "", score: 15, classification: "cold", budgetScore: 3, authorityScore: 5, needScore: 4, timelineScore: 3, budgetNotes: "No budget discussion", authorityNotes: "Unknown", needNotes: "Very vague inquiry", timelineNotes: "No timeline mentioned" }
      ];
      const demoConversations = [
        {
          leadIdx: 0,
          messages: [
            { sender: "lead", content: "Hi! I saw your ad about kitchen renovations. We have a budget of about $35,000 and want to completely redo our kitchen. How soon can you start?" },
            { sender: "ai", content: "Hi Sarah! Thanks for reaching out! A $35K budget gives you great options for a full kitchen transformation. We can typically start within 2 weeks of signing. Would you like to schedule a free consultation this week to discuss your vision?" },
            { sender: "lead", content: "Yes! I'm the homeowner and I'm ready to move forward. Can you do a consultation on Thursday?" },
            { sender: "ai", content: "Perfect! I've noted Thursday for your consultation. Our designer will bring 3D renderings of popular kitchen layouts in your budget range. Is morning or afternoon better for you?" },
            { sender: "lead", content: "Morning works great. Around 10am?" },
            { sender: "ai", content: "10am Thursday is confirmed! We'll send you a confirmation email with our portfolio. Looking forward to helping you create your dream kitchen, Sarah!" }
          ]
        },
        {
          leadIdx: 1,
          messages: [
            { sender: "lead", content: "Hello, I manage several rental properties and need to update the bathrooms in 3 units. What are your rates?" },
            { sender: "ai", content: "Hi James! Great to hear from you. For multi-unit bathroom renovations, we offer volume discounts. Our standard bathroom package runs $15K-$25K per unit. With 3 units, we can offer a 15% discount. Would you like to discuss the specific needs for each unit?" },
            { sender: "lead", content: "That sounds reasonable. I need to check with the property owner first, but we're looking at doing this next quarter." },
            { sender: "ai", content: "Absolutely, take your time! I can prepare a detailed proposal with the multi-unit discount for you to present. Shall I email that to you?" }
          ]
        },
        {
          leadIdx: 2,
          messages: [
            { sender: "lead", content: "I need a bathroom renovated for accessibility - grab bars, walk-in shower, etc. I have about $25K. This is urgent as my mother is moving in next month." },
            { sender: "ai", content: "Hi Emily! Accessibility renovations are one of our specialties. With $25K, we can do a comprehensive accessible bathroom with walk-in shower, grab bars, non-slip flooring, and ADA-compliant fixtures. Given the timeline, we can prioritize your project. Can we schedule a consultation this week?" },
            { sender: "lead", content: "Yes please! The sooner the better. I own the home so I can make decisions right away." }
          ]
        },
        {
          leadIdx: 3,
          messages: [
            { sender: "lead", content: "Just curious about home improvement options. What do you guys do?" },
            { sender: "ai", content: "Hi Michael! We specialize in home renovations \u2014 kitchens, bathrooms, and full-home makeovers. Our packages start at $5,000. Is there a specific area of your home you're thinking about improving?" },
            { sender: "lead", content: "I'm renting right now so I'd need to check with my landlord. Just exploring options." }
          ]
        },
        {
          leadIdx: 4,
          messages: [
            { sender: "lead", content: "How much does a renovation cost?" },
            { sender: "ai", content: "Hi Lisa! Our renovation packages range from $5,000 for single-room updates to $50,000 for full-home transformations. What type of renovation are you considering?" }
          ]
        },
        {
          leadIdx: 5,
          messages: [
            { sender: "lead", content: "I need my entire office renovated. Budget is $45K. We need it done before our lease renewal in 6 weeks. Is that possible?" },
            { sender: "ai", content: "Hi David! A $45K budget for a full office renovation is very doable. The 6-week timeline is tight but achievable with our express service. We'd need to start planning immediately. Are you the business owner making this decision?" },
            { sender: "lead", content: "Yes, I'm the owner. Let's get this moving ASAP. Can you come see the space tomorrow?" },
            { sender: "ai", content: "Absolutely! I'll have our commercial renovation specialist visit tomorrow. What time works best, and what's the office address? We'll bring preliminary layout options based on your budget." },
            { sender: "lead", content: "123 Business Ave, Suite 200. Anytime after 9am works. Looking forward to it!" }
          ]
        },
        {
          leadIdx: 6,
          messages: [
            { sender: "lead", content: "My husband and I are thinking about redoing our master bedroom. We're getting quotes from a few contractors." },
            { sender: "ai", content: "Hi Anna! A master bedroom renovation is a great investment. We'd love to be one of your options! Our bedroom packages typically run $8K-$20K depending on scope. What changes are you envisioning?" },
            { sender: "lead", content: "New flooring, built-in closets, maybe an ensuite bathroom addition. Probably sometime this year." },
            { sender: "ai", content: "Those are wonderful upgrades! An ensuite addition would be the biggest component. I can prepare a detailed estimate for each element so you can compare. Would you like to schedule a free in-home consultation?" }
          ]
        },
        {
          leadIdx: 7,
          messages: [
            { sender: "lead", content: "hi" },
            { sender: "ai", content: "Hi there! Welcome to our page. How can I help you today? Are you interested in home renovation services?" }
          ]
        }
      ];
      for (let i = 0; i < demoLeads.length; i++) {
        const lead = demoLeads[i];
        const leadId = await createLead({
          userId,
          pageId,
          name: lead.name,
          email: lead.email,
          phone: lead.phone,
          score: lead.score,
          classification: lead.classification,
          budgetScore: lead.budgetScore,
          authorityScore: lead.authorityScore,
          needScore: lead.needScore,
          timelineScore: lead.timelineScore,
          budgetNotes: lead.budgetNotes,
          authorityNotes: lead.authorityNotes,
          needNotes: lead.needNotes,
          timelineNotes: lead.timelineNotes,
          source: "messenger",
          status: i === 0 ? "converted" : "active"
        });
        if (!leadId) continue;
        const convData = demoConversations.find((c) => c.leadIdx === i);
        if (!convData) continue;
        const convId = await createConversation({
          userId,
          pageId,
          leadId,
          lastMessagePreview: convData.messages[convData.messages.length - 1].content.substring(0, 200),
          messageCount: convData.messages.length,
          status: "open"
        });
        if (!convId) continue;
        for (const msg of convData.messages) {
          await createMessage({
            conversationId: convId,
            sender: msg.sender,
            content: msg.content,
            messageType: "text"
          });
        }
      }
      await upsertNotificationPrefs(userId, {
        smsEnabled: true,
        emailEnabled: true,
        hotLeadSms: true,
        hotLeadEmail: true,
        warmLeadEmail: false,
        dailyDigest: true,
        notificationEmail: ctx.user.email || ""
      });
      await updateUserProfile(userId, { onboardingCompleted: true });
      return { success: true };
    })
  }),
  // ─── Billing / Subscriptions ────────────────────────────────────────
  billing: router({
    plans: publicProcedure.query(async () => {
      const plans = await getActiveSubscriptionPlans();
      if (plans.length === 0) {
        await seedSubscriptionPlans();
        return getActiveSubscriptionPlans();
      }
      return plans;
    }),
    currentSubscription: protectedProcedure.query(async ({ ctx }) => {
      return getUserSubscription(ctx.user.id);
    }),
    paymentHistory: protectedProcedure.query(async ({ ctx }) => {
      return getPaymentsByUser(ctx.user.id);
    }),
    createCheckout: protectedProcedure.input(z2.object({ planSlug: z2.string() })).mutation(async ({ ctx, input }) => {
      const plan = await getSubscriptionPlanBySlug(input.planSlug);
      if (!plan) throw new Error("Plan not found");
      const existing = await getUserSubscription(ctx.user.id);
      if (existing && existing.status === "active") {
        throw new Error("You already have an active subscription. Cancel it first to switch plans.");
      }
      const amountInCentavos = Math.round(parseFloat(plan.price) * 100);
      const baseUrl = ENV.appUrl;
      const { checkoutId, checkoutUrl } = await createCheckoutSession({
        amount: amountInCentavos,
        currency: plan.currency,
        description: `${plan.name} Plan`,
        planSlug: plan.slug,
        userId: ctx.user.id,
        successUrl: `${baseUrl}/billing?status=success&checkout_id={id}`,
        cancelUrl: `${baseUrl}/billing?status=cancelled`
      });
      const now = /* @__PURE__ */ new Date();
      const periodEnd = new Date(now);
      periodEnd.setMonth(periodEnd.getMonth() + 1);
      await createUserSubscription({
        userId: ctx.user.id,
        planId: plan.id,
        status: "active",
        paymongoCheckoutId: checkoutId,
        currentPeriodStart: now,
        currentPeriodEnd: periodEnd
      });
      await createPaymentRecord({
        userId: ctx.user.id,
        amount: plan.price,
        currency: plan.currency,
        status: "pending",
        paymongoCheckoutId: checkoutId,
        description: `${plan.name} Plan - Monthly subscription`
      });
      const paidPlanSlugs = ["growth", "pro", "scale"];
      if (paidPlanSlugs.includes(plan.slug)) {
        const planField = plan.slug;
        await updateUserProfile(ctx.user.id, { plan: planField });
      }
      return { checkoutUrl, checkoutId };
    }),
    cancelSubscription: protectedProcedure.mutation(async ({ ctx }) => {
      await cancelUserSubscription(ctx.user.id);
      await updateUserProfile(ctx.user.id, { plan: "starter" });
      return { success: true };
    })
  })
});

// server/follow-up-worker.ts
async function processFollowUps() {
  try {
    const pending = await getPendingFollowUps();
    if (pending.length === 0) return;
    console.log(`[FollowUp Worker] Processing ${pending.length} pending follow-ups`);
    for (const followUp of pending) {
      try {
        if (followUp.messageContent) {
          await createMessage({
            conversationId: followUp.conversationId,
            sender: "ai",
            content: followUp.messageContent,
            messageType: "text"
          });
          await updateConversation(followUp.conversationId, {
            lastMessagePreview: followUp.messageContent.substring(0, 200),
            lastMessageAt: /* @__PURE__ */ new Date()
          });
        }
        await updateFollowUp(followUp.id, {
          status: "sent",
          sentAt: Date.now()
        });
        console.log(`[FollowUp Worker] Sent follow-up ${followUp.id} for conversation ${followUp.conversationId}`);
      } catch (err) {
        console.error(`[FollowUp Worker] Failed to process follow-up ${followUp.id}:`, err);
        await updateFollowUp(followUp.id, { status: "failed" });
      }
    }
  } catch (err) {
    console.error("[FollowUp Worker] Error:", err);
  }
}

// server/_core/context.ts
async function createContext(opts) {
  let user = null;
  try {
    user = await sdk.authenticateRequest(opts.req);
  } catch (error) {
    user = null;
  }
  return {
    req: opts.req,
    res: opts.res,
    user
  };
}

// api/index.src.ts
var app = express();
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));
registerAuthRoutes(app);
registerFacebookRoutes(app);
registerInstagramRoutes(app);
registerKbImportRoutes(app);
registerPaymongoWebhookRoutes(app);
app.post("/api/cron/follow-ups", async (_req, res) => {
  try {
    await processFollowUps();
    res.json({ success: true });
  } catch (error) {
    console.error("[Cron] Follow-up processing failed:", error);
    res.status(500).json({ error: "Follow-up processing failed" });
  }
});
app.use(
  "/api/trpc",
  createExpressMiddleware({
    router: appRouter,
    createContext
  })
);
var index_src_default = app;
export {
  index_src_default as default
};
