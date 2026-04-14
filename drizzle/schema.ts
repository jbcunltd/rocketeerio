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
} from "drizzle-orm/pg-core";

// ─── Enums ──────────────────────────────────────────────────────────
export const roleEnum = pgEnum("role", ["user", "admin"]);
export const planEnum = pgEnum("plan", ["starter", "growth", "scale"]);
export const classificationEnum = pgEnum("classification", ["hot", "warm", "cold"]);
export const leadStatusEnum = pgEnum("lead_status", ["active", "converted", "archived", "lost"]);
export const conversationStatusEnum = pgEnum("conversation_status", ["open", "closed", "archived"]);
export const senderEnum = pgEnum("sender", ["lead", "ai", "human"]);
export const messageTypeEnum = pgEnum("message_type", ["text", "image", "template", "quick_reply"]);
export const kbCategoryEnum = pgEnum("kb_category", ["product", "pricing", "faq", "policy", "general"]);
export const kbSourceEnum = pgEnum("kb_source", ["manual", "website", "pdf", "file"]);
export const followUpStatusEnum = pgEnum("follow_up_status", ["pending", "sent", "cancelled", "failed"]);
export const aiToneEnum = pgEnum("ai_tone", ["casual_taglish", "formal_english", "casual_english", "professional_filipino"]);
export const aiResponseLengthEnum = pgEnum("ai_response_length", ["short", "medium", "detailed"]);
export const aiPrimaryGoalEnum = pgEnum("ai_primary_goal", ["site_visit", "booking", "quote_request", "general_support"]);

// ─── Users ───────────────────────────────────────────────────────────
export const users = pgTable("users", {
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
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

// ─── Facebook Pages ──────────────────────────────────────────────────
export const facebookPages = pgTable("facebook_pages", {
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
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export type FacebookPage = typeof facebookPages.$inferSelect;
export type InsertFacebookPage = typeof facebookPages.$inferInsert;

// ─── Leads ───────────────────────────────────────────────────────────
export const leads = pgTable("leads", {
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
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export type Lead = typeof leads.$inferSelect;
export type InsertLead = typeof leads.$inferInsert;

// ─── Conversations ───────────────────────────────────────────────────
export const conversations = pgTable("conversations", {
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
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export type Conversation = typeof conversations.$inferSelect;
export type InsertConversation = typeof conversations.$inferInsert;

// ─── Messages ────────────────────────────────────────────────────────
export const messages = pgTable("messages", {
  id: serial("id").primaryKey(),
  conversationId: integer("conversationId").notNull(),
  sender: senderEnum("sender").notNull(),
  content: text("content").notNull(),
  messageType: messageTypeEnum("messageType").default("text").notNull(),
  metadata: json("metadata"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Message = typeof messages.$inferSelect;
export type InsertMessage = typeof messages.$inferInsert;

// ─── Knowledge Base ──────────────────────────────────────────────────
export const knowledgeBase = pgTable("knowledge_base", {
  id: serial("id").primaryKey(),
  userId: integer("userId").notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  content: text("content").notNull(),
  category: kbCategoryEnum("category").default("general").notNull(),
  source: kbSourceEnum("source").default("manual").notNull(),
  sourceUrl: text("sourceUrl"),
  isActive: boolean("isActive").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export type KnowledgeBaseEntry = typeof knowledgeBase.$inferSelect;
export type InsertKnowledgeBaseEntry = typeof knowledgeBase.$inferInsert;

// ─── Follow-Up Sequences ────────────────────────────────────────────
export const followUpSequences = pgTable("follow_up_sequences", {
  id: serial("id").primaryKey(),
  conversationId: integer("conversationId").notNull(),
  leadId: integer("leadId").notNull(),
  delayMinutes: integer("delayMinutes").notNull(),
  scheduledAt: bigint("scheduledAt", { mode: "number" }).notNull(),
  sentAt: bigint("sentAt", { mode: "number" }),
  status: followUpStatusEnum("status").default("pending").notNull(),
  messageContent: text("messageContent"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export type FollowUpSequence = typeof followUpSequences.$inferSelect;
export type InsertFollowUpSequence = typeof followUpSequences.$inferInsert;

// ─── Notification Preferences ────────────────────────────────────────
export const notificationPreferences = pgTable("notification_preferences", {
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
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export type NotificationPreference = typeof notificationPreferences.$inferSelect;
export type InsertNotificationPreference = typeof notificationPreferences.$inferInsert;

// ─── Page AI Settings ────────────────────────────────────────────────
export const pageAiSettings = pgTable("page_ai_settings", {
  id: serial("id").primaryKey(),
  pageId: integer("pageId").notNull().unique(),
  userId: integer("userId").notNull(),
  agentName: varchar("agentName", { length: 128 }),
  tone: aiToneEnum("tone").default("casual_taglish").notNull(),
  responseLength: aiResponseLengthEnum("responseLength").default("short").notNull(),
  useEmojis: boolean("useEmojis").default(true).notNull(),
  primaryGoal: aiPrimaryGoalEnum("primaryGoal").default("site_visit").notNull(),
  customInstructions: text("customInstructions"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});
export type PageAiSetting = typeof pageAiSettings.$inferSelect;
export type InsertPageAiSetting = typeof pageAiSettings.$inferInsert;
