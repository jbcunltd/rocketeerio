import { createRequire } from "module"; const require = createRequire(import.meta.url);

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
  integer
} from "drizzle-orm/pg-core";
var roleEnum = pgEnum("role", ["user", "admin"]);
var planEnum = pgEnum("plan", ["starter", "growth", "scale"]);
var classificationEnum = pgEnum("classification", ["hot", "warm", "cold"]);
var leadStatusEnum = pgEnum("lead_status", ["active", "converted", "archived", "lost"]);
var conversationStatusEnum = pgEnum("conversation_status", ["open", "closed", "archived"]);
var senderEnum = pgEnum("sender", ["lead", "ai", "human"]);
var messageTypeEnum = pgEnum("message_type", ["text", "image", "template", "quick_reply"]);
var kbCategoryEnum = pgEnum("kb_category", ["product", "pricing", "faq", "policy", "general"]);
var kbSourceEnum = pgEnum("kb_source", ["manual", "website", "pdf"]);
var followUpStatusEnum = pgEnum("follow_up_status", ["pending", "sent", "cancelled", "failed"]);
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
  avatarUrl: text("avatarUrl"),
  followerCount: integer("followerCount").default(0),
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
  appUrl: process.env.APP_URL ?? "https://rocketeerio.vercel.app"
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
async function generateAIResponse(userId, conversationHistory, leadName, pageName) {
  const kbEntries = await getActiveKnowledgeBase(userId);
  const knowledgeContext = kbEntries.map((entry) => `[${entry.category.toUpperCase()}] ${entry.title}:
${entry.content}`).join("\n\n---\n\n");
  const historyMessages = conversationHistory.slice(-10).map((msg) => ({
    role: msg.sender === "lead" ? "user" : "assistant",
    content: msg.content
  }));
  const systemPrompt = `You are Rocketeer AI, a professional and friendly sales assistant for "${pageName}". Your job is to:

1. Greet prospects warmly and professionally
2. Answer questions about the business using ONLY the provided knowledge base
3. Qualify leads by naturally asking about their Budget, Authority, Need, and Timeline (BANT)
4. Guide prospects toward taking action (booking, purchasing, requesting a quote)
5. Be concise \u2014 keep responses under 3 sentences when possible

KNOWLEDGE BASE:
${knowledgeContext || "No knowledge base entries available yet. Respond helpfully and offer to connect them with a human representative."}

RULES:
- NEVER make up information not in the knowledge base
- If you don't know something, say "Let me connect you with our team for that specific question"
- Be conversational and natural, not robotic
- Use the lead's name (${leadName || "there"}) when appropriate
- Ask one qualifying question at a time, don't overwhelm
- Keep responses under 150 words`;
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
async function processIncomingMessage(pageEntry, senderPsid, messageText) {
  console.log(`[Webhook] Processing message from ${senderPsid} to page ${pageEntry.pageId}: "${messageText.substring(0, 80)}"`);
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
    convDetail?.page?.pageName ?? "Our Business"
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
                  dbPageId: page.id
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
async function structurePdfContent(pdfText, fileName) {
  if (!pdfText || pdfText.trim().length < 20) {
    return { entries: [] };
  }
  const truncatedText = pdfText.substring(0, 3e4);
  const result = await invokeLLM({
    messages: [
      {
        role: "system",
        content: `You are a business information extractor. Analyze the PDF document content and extract structured knowledge base entries. The PDF may be a product catalog, brochure, price list, or specification sheet.

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
        content: `Extract business knowledge from this PDF document "${fileName}":

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
var upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 20 * 1024 * 1024 },
  // 20MB
  fileFilter: (_req, file, cb) => {
    if (file.mimetype === "application/pdf") {
      cb(null, true);
    } else {
      cb(new Error("Only PDF files are allowed"));
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
  app2.post("/api/kb/import-pdf", upload.single("pdf"), async (req, res) => {
    try {
      const userId = await authenticateRequest(req);
      if (!userId) return res.status(401).json({ error: "Not authenticated" });
      const file = req.file;
      if (!file) {
        return res.status(400).json({ error: "PDF file is required" });
      }
      console.log(`[KB Import] Processing PDF: ${file.originalname} (${(file.size / 1024).toFixed(1)}KB) for user ${userId}`);
      const pdfData = await parsePdf(file.buffer);
      const pdfText = pdfData.text;
      if (!pdfText || pdfText.trim().length < 20) {
        return res.json({
          success: true,
          entries: [],
          message: "Could not extract meaningful text from the PDF. It may be image-based."
        });
      }
      const result = await structurePdfContent(pdfText, file.originalname);
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
        conv.page?.pageName ?? "Our Business"
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
    })).mutation(async ({ input }) => {
      const now = Date.now();
      const delays = [30, 120, 720];
      const messages2 = [
        "Hi! Just checking in \u2014 did you have any other questions about what we discussed?",
        "Hey! I wanted to follow up on our conversation. Is there anything else I can help you with?",
        "Hi there! I noticed we chatted earlier. I'd love to help you move forward \u2014 feel free to ask me anything!"
      ];
      for (let i = 0; i < delays.length; i++) {
        await createFollowUp({
          conversationId: input.conversationId,
          leadId: input.leadId,
          delayMinutes: delays[i],
          scheduledAt: now + delays[i] * 60 * 1e3,
          messageContent: messages2[i]
        });
      }
      return { success: true, count: delays.length };
    }),
    cancel: protectedProcedure.input(z2.object({ id: z2.number() })).mutation(async ({ input }) => {
      await updateFollowUp(input.id, { status: "cancelled" });
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
registerKbImportRoutes(app);
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
