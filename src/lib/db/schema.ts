import {
  boolean,
  index,
  integer,
  jsonb,
  pgTable,
  serial,
  text,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";

/**
 * User accounts. Either created via email/password (passwordHash set)
 * or via Facebook OAuth (passwordHash null, oauthAccount row present).
 */
export const userTable = pgTable(
  "users",
  {
    id: text("id").primaryKey(), // ULID-like id
    email: text("email"),
    name: text("name"),
    avatarUrl: text("avatar_url"),
    passwordHash: text("password_hash"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (t) => ({
    emailIdx: uniqueIndex("users_email_unique").on(t.email),
  }),
);

export type DbUser = typeof userTable.$inferSelect;
export type NewDbUser = typeof userTable.$inferInsert;

/**
 * Lucia-style session table.
 */
export const sessionTable = pgTable(
  "sessions",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => userTable.id, { onDelete: "cascade" }),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  },
  (t) => ({
    userIdx: index("sessions_user_idx").on(t.userId),
  }),
);

export type DbSession = typeof sessionTable.$inferSelect;

/**
 * Linked third-party identity accounts (Facebook login).
 * Distinct from `facebookPageTokens` which stores per-page tokens.
 */
export const oauthAccountTable = pgTable(
  "oauth_accounts",
  {
    provider: text("provider").notNull(), // e.g. "facebook"
    providerUserId: text("provider_user_id").notNull(),
    userId: text("user_id")
      .notNull()
      .references(() => userTable.id, { onDelete: "cascade" }),
    accessToken: text("access_token"),
    refreshToken: text("refresh_token"),
    accessTokenExpiresAt: timestamp("access_token_expires_at", {
      withTimezone: true,
    }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (t) => ({
    pk: uniqueIndex("oauth_accounts_provider_pk").on(
      t.provider,
      t.providerUserId,
    ),
    userIdx: index("oauth_accounts_user_idx").on(t.userId),
  }),
);

/**
 * Stored user-level Facebook OAuth token used to read the user's Pages list.
 * (One row per (userId, scope) pair — typically one per user.)
 */
export const facebookUserTokenTable = pgTable(
  "facebook_user_tokens",
  {
    id: serial("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => userTable.id, { onDelete: "cascade" }),
    fbUserId: text("fb_user_id").notNull(),
    accessToken: text("access_token").notNull(), // long-lived
    expiresAt: timestamp("expires_at", { withTimezone: true }),
    scopes: text("scopes"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (t) => ({
    userUnique: uniqueIndex("facebook_user_tokens_user_unique").on(t.userId),
  }),
);

/**
 * Connected Facebook Pages owned/managed by a user.
 */
export const facebookPageTable = pgTable(
  "facebook_pages",
  {
    id: serial("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => userTable.id, { onDelete: "cascade" }),
    pageId: text("page_id").notNull(), // Facebook Page ID
    name: text("name").notNull(),
    category: text("category"),
    pictureUrl: text("picture_url"),
    pageAccessToken: text("page_access_token").notNull(),
    tokenExpiresAt: timestamp("token_expires_at", { withTimezone: true }),
    tasks: text("tasks"), // JSON-serialized list of allowed tasks
    isActive: boolean("is_active").default(true).notNull(),
    connectedAt: timestamp("connected_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (t) => ({
    userPageUnique: uniqueIndex("facebook_pages_user_page_unique").on(
      t.userId,
      t.pageId,
    ),
    pageIdIdx: index("facebook_pages_page_idx").on(t.pageId),
  }),
);

export type DbFacebookPage = typeof facebookPageTable.$inferSelect;

/**
 * One-time state values for OAuth CSRF protection.
 */
export const oauthStateTable = pgTable("oauth_states", {
  state: text("state").primaryKey(),
  purpose: text("purpose").notNull(), // "login" | "connect_pages"
  userId: text("user_id"), // null for login flow
  redirectTo: text("redirect_to"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
});

/**
 * Email captures from marketing forms (lead magnet, exit-intent popup, etc.).
 */
export const leadCaptureTable = pgTable(
  "lead_captures",
  {
    id: serial("id").primaryKey(),
    email: text("email").notNull(),
    source: text("source").notNull().default("unknown"),
    ip: text("ip"),
    userAgent: text("user_agent"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (t) => ({
    emailSourceUnique: uniqueIndex("lead_captures_email_source_unique").on(
      t.email,
      t.source,
    ),
  }),
);

export type DbLeadCapture = typeof leadCaptureTable.$inferSelect;

export type JoshAgentMode = "paused" | "testing" | "live";
export type JoshPersonalityTone =
  | "friendly_casual"
  | "professional"
  | "elevated_taglish";
export type JoshResponseLength = "short" | "medium" | "detailed";

export interface JoshSkillSettings {
  leadQualification: boolean;
  appointmentBooking: boolean;
  objectionHandling: boolean;
  productRecommendations: boolean;
  pricingInquiries: boolean;
  followUpSequences: boolean;
  hotLeadAlerts: boolean;
  instantQuotation: boolean;
}

export interface JoshBusinessInfo {
  companyName: string;
  description: string;
  productsServices: string;
}

export interface JoshKnowledgeEntry {
  id: string;
  category:
    | "products_pricing"
    | "faqs"
    | "objection_scripts"
    | "golden_rules"
    | "custom_notes";
  title: string;
  content: string;
}

export interface JoshBehaviorRules {
  alwaysEndWithQuestion: boolean;
  neverMentionCompetitors: boolean;
  alwaysPushTowardSiteVisit: boolean;
  responseLength: JoshResponseLength;
  customRules: string[];
}

/**
 * Per-user configuration for the Josh for Sales AI agent. The middleware can
 * read this single row to configure Josh's identity, enabled skills, knowledge,
 * and guardrails for each dashboard user.
 */
export const joshAgentSettingsTable = pgTable(
  "josh_agent_settings",
  {
    id: serial("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => userTable.id, { onDelete: "cascade" }),
    mode: text("mode").$type<JoshAgentMode>().notNull().default("paused"),
    agentName: text("agent_name").notNull().default("Josh"),
    roleTitle: text("role_title").notNull().default("Sales Agent"),
    personalityTone: text("personality_tone")
      .$type<JoshPersonalityTone>()
      .notNull()
      .default("friendly_casual"),
    avatarUrl: text("avatar_url"),
    skills: jsonb("skills").$type<JoshSkillSettings>().notNull(),
    businessInfo: jsonb("business_info").$type<JoshBusinessInfo>().notNull(),
    knowledgeBase: jsonb("knowledge_base")
      .$type<JoshKnowledgeEntry[]>()
      .notNull(),
    behaviorRules: jsonb("behavior_rules")
      .$type<JoshBehaviorRules>()
      .notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (t) => ({
    userUnique: uniqueIndex("josh_agent_settings_user_unique").on(t.userId),
  }),
);

export type DbJoshAgentSettings = typeof joshAgentSettingsTable.$inferSelect;

// Convenience re-exports
export const tables = {
  userTable,
  sessionTable,
  oauthAccountTable,
  facebookUserTokenTable,
  facebookPageTable,
  oauthStateTable,
  leadCaptureTable,
  joshAgentSettingsTable,
};

export const integerCol = integer; // ensure import not pruned
