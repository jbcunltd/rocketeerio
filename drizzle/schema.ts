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
  numeric,
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
export const aiModeEnum = pgEnum("ai_mode", ["paused", "testing", "live"]);
export const platformEnum = pgEnum("platform", ["messenger", "instagram"]);
export const aiToneEnum = pgEnum("ai_tone", ["casual_taglish", "pure_tagalog", "professional_filipino", "casual_english", "formal_english", "professional_english"]);
export const aiResponseLengthEnum = pgEnum("ai_response_length", ["short", "medium", "detailed"]);
export const aiPrimaryGoalEnum = pgEnum("ai_primary_goal", ["site_visit", "booking", "quote_request", "general_support", "order_purchase", "reservation", "appointment", "collect_lead_info", "signup_registration", "custom_goal"]);

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
  aiMode: aiModeEnum("aiMode").default("testing").notNull(),
  avatarUrl: text("avatarUrl"),
  followerCount: integer("followerCount").default(0),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export type FacebookPage = typeof facebookPages.$inferSelect;
export type InsertFacebookPage = typeof facebookPages.$inferInsert;

// ─── Instagram Accounts ─────────────────────────────────────────────
export const instagramAccounts = pgTable("instagram_accounts", {
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
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export type InstagramAccount = typeof instagramAccounts.$inferSelect;
export type InsertInstagramAccount = typeof instagramAccounts.$inferInsert;

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
  platform: varchar("platform", { length: 32 }).default("messenger"),
  igScopedId: varchar("igScopedId", { length: 128 }),
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
  platform: varchar("platform", { length: 32 }).default("messenger"),
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

// ─── Follow-Up Settings (configurable per user) ───────────────────
export const followUpSettings = pgTable("follow_up_settings", {
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
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export type FollowUpSetting = typeof followUpSettings.$inferSelect;
export type InsertFollowUpSetting = typeof followUpSettings.$inferInsert;

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
  customGoal: text("customGoal"),
  customInstructions: text("customInstructions"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});
export type PageAiSetting = typeof pageAiSettings.$inferSelect;
export type InsertPageAiSetting = typeof pageAiSettings.$inferInsert;

// ─── Page Testers ───────────────────────────────────────────────────
export const pageTesters = pgTable("page_testers", {
  id: serial("id").primaryKey(),
  pageId: integer("pageId").notNull(),
  psid: varchar("psid", { length: 128 }).notNull(),
  label: varchar("label", { length: 255 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type PageTester = typeof pageTesters.$inferSelect;
export type InsertPageTester = typeof pageTesters.$inferInsert;

// ─── Subscription Enums ─────────────────────────────────────────────
export const subscriptionStatusEnum = pgEnum("subscription_status", [
  "active", "cancelled", "past_due", "paused", "trialing", "expired",
]);
export const paymentStatusEnum = pgEnum("payment_status", [
  "paid", "pending", "failed", "refunded",
]);
export const billingIntervalEnum = pgEnum("billing_interval", ["monthly", "yearly"]);

// ─── Subscription Plans ─────────────────────────────────────────────
export const subscriptionPlans = pgTable("subscription_plans", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 128 }).notNull(),
  slug: varchar("slug", { length: 64 }).notNull().unique(),
  price: numeric("price", { precision: 10, scale: 2 }).notNull(),
  currency: varchar("currency", { length: 3 }).default("PHP").notNull(),
  interval: billingIntervalEnum("interval").default("monthly").notNull(),
  features: json("features").$type<string[]>().default([]).notNull(),
  paymongoLinkId: varchar("paymongoLinkId", { length: 255 }),
  isActive: boolean("isActive").default(true).notNull(),
  sortOrder: integer("sortOrder").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export type SubscriptionPlan = typeof subscriptionPlans.$inferSelect;
export type InsertSubscriptionPlan = typeof subscriptionPlans.$inferInsert;

// ─── User Subscriptions ─────────────────────────────────────────────
export const userSubscriptions = pgTable("user_subscriptions", {
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
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export type UserSubscription = typeof userSubscriptions.$inferSelect;
export type InsertUserSubscription = typeof userSubscriptions.$inferInsert;

// ─── Payment History ────────────────────────────────────────────────
export const paymentHistory = pgTable("payment_history", {
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
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type PaymentHistoryEntry = typeof paymentHistory.$inferSelect;
export type InsertPaymentHistory = typeof paymentHistory.$inferInsert;
