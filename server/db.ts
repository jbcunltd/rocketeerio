import { eq, desc, and, sql, gte, lte, count, avg } from "drizzle-orm";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import {
  InsertUser, users,
  facebookPages, InsertFacebookPage,
  leads, InsertLead,
  conversations, InsertConversation,
  messages, InsertMessage,
  knowledgeBase, InsertKnowledgeBaseEntry,
  followUpSequences, InsertFollowUpSequence,
  notificationPreferences, InsertNotificationPreference,
  pageAiSettings, InsertPageAiSetting,
  pageTesters, InsertPageTester,
  subscriptionPlans, InsertSubscriptionPlan,
  userSubscriptions, InsertUserSubscription,
  paymentHistory, InsertPaymentHistory,
  instagramAccounts, InsertInstagramAccount,
  followUpSettings, InsertFollowUpSetting,
  webhookEndpoints, InsertWebhookEndpoint,
  integrationSettings, InsertIntegrationSetting,
  handoffSettings, InsertHandoffSetting,
} from "../drizzle/schema";

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
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

// ─── Users ───────────────────────────────────────────────────────────

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.email) throw new Error("User email is required for upsert");
  const db = await getDb();
  if (!db) { console.warn("[Database] Cannot upsert user: database not available"); return; }
  try {
    const existing = await db.select().from(users).where(eq(users.email, user.email)).limit(1);
    if (existing.length > 0) {
      const updateSet: Record<string, unknown> = {};
      const textFields = ["name", "loginMethod"] as const;
      for (const field of textFields) {
        if (user[field] !== undefined) {
          updateSet[field] = user[field] ?? null;
        }
      }
      if (user.lastSignedIn !== undefined) updateSet.lastSignedIn = user.lastSignedIn;
      if (user.role !== undefined) updateSet.role = user.role;
      updateSet.updatedAt = new Date();
      if (Object.keys(updateSet).length > 0) {
        await db.update(users).set(updateSet).where(eq(users.email, user.email));
      }
    } else {
      await db.insert(users).values({
        ...user,
        lastSignedIn: user.lastSignedIn ?? new Date(),
      });
    }
  } catch (error) { console.error("[Database] Failed to upsert user:", error); throw error; }
}

export async function getUserByEmail(email: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.email, email)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getUserById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function updateUserProfile(userId: number, data: { name?: string; email?: string; phone?: string; company?: string; onboardingCompleted?: boolean; plan?: "free" | "growth" | "pro" | "scale" | "custom" }) {
  const db = await getDb();
  if (!db) return;
  await db.update(users).set({ ...data, updatedAt: new Date() }).where(eq(users.id, userId));
}

// ─── Facebook Pages ──────────────────────────────────────────────────

export async function getUserPages(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(facebookPages).where(eq(facebookPages.userId, userId)).orderBy(desc(facebookPages.createdAt));
}

export async function createPage(data: InsertFacebookPage) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.insert(facebookPages).values(data).returning({ id: facebookPages.id });
  return result[0]?.id ?? null;
}

export async function updatePage(pageId: number, data: Partial<InsertFacebookPage>) {
  const db = await getDb();
  if (!db) return;
  await db.update(facebookPages).set({ ...data, updatedAt: new Date() }).where(eq(facebookPages.id, pageId));
}

export async function deletePage(pageId: number) {
  const db = await getDb();
  if (!db) return;
  await db.delete(facebookPages).where(eq(facebookPages.id, pageId));
}

export async function getPageByFacebookId(fbPageId: string) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(facebookPages).where(eq(facebookPages.pageId, fbPageId)).limit(1);
  return result[0] ?? null;
}

export async function getAllActivePages() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(facebookPages).where(eq(facebookPages.isActive, true));
}

// ─── Leads ───────────────────────────────────────────────────────────

export async function getLeadsByUser(userId: number, classification?: string) {
  const db = await getDb();
  if (!db) return [];
  const conditions = [eq(leads.userId, userId)];
  if (classification && (classification === "hot" || classification === "warm" || classification === "cold")) {
    conditions.push(eq(leads.classification, classification));
  }
  return db.select().from(leads).where(and(...conditions)).orderBy(desc(leads.updatedAt));
}

export async function getLeadById(leadId: number) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(leads).where(eq(leads.id, leadId)).limit(1);
  return result[0] ?? null;
}

export async function createLead(data: InsertLead) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.insert(leads).values(data).returning({ id: leads.id });
  return result[0]?.id ?? null;
}

export async function updateLead(leadId: number, data: Partial<InsertLead>) {
  const db = await getDb();
  if (!db) return;
  await db.update(leads).set({ ...data, updatedAt: new Date() }).where(eq(leads.id, leadId));
}

export async function getLeadByPsid(psid: string, pageId: number) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(leads)
    .where(and(eq(leads.psid, psid), eq(leads.pageId, pageId)))
    .limit(1);
  return result[0] ?? null;
}

export async function getConversationByLeadId(leadId: number) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(conversations)
    .where(eq(conversations.leadId, leadId))
    .orderBy(desc(conversations.createdAt))
    .limit(1);
  return result[0] ?? null;
}

// ─── Conversations ───────────────────────────────────────────────────

export async function getConversationsByUser(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select({
    conversation: conversations,
    lead: leads,
    page: facebookPages,
  })
    .from(conversations)
    .leftJoin(leads, eq(conversations.leadId, leads.id))
    .leftJoin(facebookPages, eq(conversations.pageId, facebookPages.id))
    .where(eq(conversations.userId, userId))
    .orderBy(desc(conversations.lastMessageAt));
}

export async function getConversationById(conversationId: number) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select({
    conversation: conversations,
    lead: leads,
    page: facebookPages,
  })
    .from(conversations)
    .leftJoin(leads, eq(conversations.leadId, leads.id))
    .leftJoin(facebookPages, eq(conversations.pageId, facebookPages.id))
    .where(eq(conversations.id, conversationId))
    .limit(1);
  return result[0] ?? null;
}

export async function createConversation(data: InsertConversation) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.insert(conversations).values(data).returning({ id: conversations.id });
  return result[0]?.id ?? null;
}

export async function updateConversation(conversationId: number, data: Partial<InsertConversation>) {
  const db = await getDb();
  if (!db) return;
  await db.update(conversations).set({ ...data, updatedAt: new Date() }).where(eq(conversations.id, conversationId));
}

// ─── Messages ────────────────────────────────────────────────────────

export async function getMessagesByConversation(conversationId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(messages).where(eq(messages.conversationId, conversationId)).orderBy(messages.createdAt);
}

export async function createMessage(data: InsertMessage) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.insert(messages).values(data).returning({ id: messages.id });
  return result[0]?.id ?? null;
}

// ─── Knowledge Base ──────────────────────────────────────────────────

export async function getKnowledgeBase(userId: number, pageId?: number) {
  const db = await getDb();
  if (!db) return [];
  const conditions = [eq(knowledgeBase.userId, userId)];
  if (pageId !== undefined) conditions.push(eq(knowledgeBase.pageId, pageId));
  return db.select().from(knowledgeBase).where(and(...conditions)).orderBy(desc(knowledgeBase.createdAt));
}

export async function createKnowledgeEntry(data: InsertKnowledgeBaseEntry) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.insert(knowledgeBase).values(data).returning({ id: knowledgeBase.id });
  return result[0]?.id ?? null;
}

export async function updateKnowledgeEntry(entryId: number, data: Partial<InsertKnowledgeBaseEntry>) {
  const db = await getDb();
  if (!db) return;
  await db.update(knowledgeBase).set({ ...data, updatedAt: new Date() }).where(eq(knowledgeBase.id, entryId));
}

export async function deleteKnowledgeEntry(entryId: number) {
  const db = await getDb();
  if (!db) return;
  await db.delete(knowledgeBase).where(eq(knowledgeBase.id, entryId));
}

export async function getActiveKnowledgeBase(userId: number, pageId?: number) {
  const db = await getDb();
  if (!db) return [];
  const conditions = [eq(knowledgeBase.userId, userId), eq(knowledgeBase.isActive, true)];
  if (pageId !== undefined) conditions.push(eq(knowledgeBase.pageId, pageId));
  return db.select().from(knowledgeBase).where(and(...conditions));
}

export async function deleteKnowledgeBySource(userId: number, source: "manual" | "website" | "pdf", pageId?: number) {
  const db = await getDb();
  if (!db) return;
  const conditions = [eq(knowledgeBase.userId, userId), eq(knowledgeBase.source, source)];
  if (pageId !== undefined) conditions.push(eq(knowledgeBase.pageId, pageId));
  await db.delete(knowledgeBase).where(and(...conditions));
}

// ─── Follow-Up Sequences ────────────────────────────────────────────

export async function getFollowUps(conversationId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(followUpSequences).where(eq(followUpSequences.conversationId, conversationId)).orderBy(followUpSequences.scheduledAt);
}

export async function createFollowUp(data: InsertFollowUpSequence) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.insert(followUpSequences).values(data).returning({ id: followUpSequences.id });
  return result[0]?.id ?? null;
}

export async function updateFollowUp(id: number, data: Partial<InsertFollowUpSequence>) {
  const db = await getDb();
  if (!db) return;
  await db.update(followUpSequences).set({ ...data, updatedAt: new Date() }).where(eq(followUpSequences.id, id));
}

export async function getPendingFollowUps() {
  const db = await getDb();
  if (!db) return [];
  const now = Date.now();
  return db.select().from(followUpSequences)
    .where(and(eq(followUpSequences.status, "pending"), lte(followUpSequences.scheduledAt, now)));
}

// ─── Notification Preferences ────────────────────────────────────────

export async function getNotificationPrefs(userId: number) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(notificationPreferences).where(eq(notificationPreferences.userId, userId)).limit(1);
  return result[0] ?? null;
}

export async function upsertNotificationPrefs(userId: number, data: Partial<InsertNotificationPreference>) {
  const db = await getDb();
  if (!db) return;
  const existing = await getNotificationPrefs(userId);
  if (existing) {
    await db.update(notificationPreferences).set({ ...data, updatedAt: new Date() }).where(eq(notificationPreferences.userId, userId));
  } else {
    await db.insert(notificationPreferences).values({ userId, ...data });
  }
}

// ─── Dashboard Stats ─────────────────────────────────────────────────

export async function getDashboardStats(userId: number) {
  const db = await getDb();
  if (!db) return { totalConversations: 0, hotLeadsToday: 0, totalLeads: 0, conversionRate: 0, avgScore: 0 };

  const [convResult] = await db.select({ count: count() }).from(conversations).where(eq(conversations.userId, userId));
  const totalConversations = convResult?.count ?? 0;

  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const [hotResult] = await db.select({ count: count() }).from(leads)
    .where(and(eq(leads.userId, userId), eq(leads.classification, "hot"), gte(leads.createdAt, todayStart)));
  const hotLeadsToday = hotResult?.count ?? 0;

  const [totalLeadsResult] = await db.select({ count: count() }).from(leads).where(eq(leads.userId, userId));
  const totalLeads = totalLeadsResult?.count ?? 0;

  const [convertedResult] = await db.select({ count: count() }).from(leads)
    .where(and(eq(leads.userId, userId), eq(leads.status, "converted")));
  const converted = convertedResult?.count ?? 0;
  const conversionRate = totalLeads > 0 ? Math.round((converted / totalLeads) * 100) : 0;

  const [avgResult] = await db.select({ avg: avg(leads.score) }).from(leads).where(eq(leads.userId, userId));
  const avgScore = avgResult?.avg ? Math.round(Number(avgResult.avg)) : 0;

  return { totalConversations, hotLeadsToday, totalLeads, conversionRate, avgScore };
}

export async function getLeadActivityByDay(userId: number, days: number = 7) {
  const db = await getDb();
  if (!db) return [];
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);
  startDate.setHours(0, 0, 0, 0);

  const result = await db.select({
    date: sql<string>`DATE(${leads.createdAt})`,
    total: count(),
    hot: sql<number>`SUM(CASE WHEN ${leads.classification} = 'hot' THEN 1 ELSE 0 END)`,
    warm: sql<number>`SUM(CASE WHEN ${leads.classification} = 'warm' THEN 1 ELSE 0 END)`,
    cold: sql<number>`SUM(CASE WHEN ${leads.classification} = 'cold' THEN 1 ELSE 0 END)`,
  })
    .from(leads)
    .where(and(eq(leads.userId, userId), gte(leads.createdAt, startDate)))
    .groupBy(sql`DATE(${leads.createdAt})`)
    .orderBy(sql`DATE(${leads.createdAt})`);

  return result;
}

// ─── Page AI Settings ────────────────────────────────────────────────

export async function getPageAiSettings(pageId: number) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(pageAiSettings).where(eq(pageAiSettings.pageId, pageId)).limit(1);
  return result[0] ?? null;
}

export async function getPageAiSettingsByDbPageId(dbPageId: number) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(pageAiSettings).where(eq(pageAiSettings.pageId, dbPageId)).limit(1);
  return result[0] ?? null;
}

export async function upsertPageAiSettings(pageId: number, userId: number, data: Partial<InsertPageAiSetting>) {
  const db = await getDb();
  if (!db) return;
  const existing = await getPageAiSettings(pageId);
  if (existing) {
    await db.update(pageAiSettings).set({ ...data, updatedAt: new Date() }).where(eq(pageAiSettings.pageId, pageId));
  } else {
    await db.insert(pageAiSettings).values({ pageId, userId, ...data });
  }
}

// ─── Page AI Mode ───────────────────────────────────────────────────

export async function updatePageMode(pageId: number, aiMode: "paused" | "testing" | "live") {
  const db = await getDb();
  if (!db) return;
  await db.update(facebookPages).set({ aiMode, updatedAt: new Date() }).where(eq(facebookPages.id, pageId));
}

export async function getPageMode(pageId: number) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select({ aiMode: facebookPages.aiMode }).from(facebookPages).where(eq(facebookPages.id, pageId)).limit(1);
  return result[0]?.aiMode ?? null;
}

// ─── Page Testers ───────────────────────────────────────────────────

export async function getPageTesters(pageId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(pageTesters).where(eq(pageTesters.pageId, pageId)).orderBy(desc(pageTesters.createdAt));
}

export async function addPageTester(data: InsertPageTester) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.insert(pageTesters).values(data).returning({ id: pageTesters.id });
  return result[0]?.id ?? null;
}

export async function removePageTester(testerId: number) {
  const db = await getDb();
  if (!db) return;
  await db.delete(pageTesters).where(eq(pageTesters.id, testerId));
}

export async function isTesterPsid(pageId: number, psid: string): Promise<boolean> {
  const db = await getDb();
  if (!db) return false;
  const result = await db.select({ id: pageTesters.id }).from(pageTesters)
    .where(and(eq(pageTesters.pageId, pageId), eq(pageTesters.psid, psid)))
    .limit(1);
  return result.length > 0;
}


// ─── Subscription Plans ─────────────────────────────────────────────

export async function getActiveSubscriptionPlans() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(subscriptionPlans)
    .where(eq(subscriptionPlans.isActive, true))
    .orderBy(subscriptionPlans.sortOrder);
}

export async function getSubscriptionPlanBySlug(slug: string) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(subscriptionPlans)
    .where(eq(subscriptionPlans.slug, slug))
    .limit(1);
  return result[0] ?? null;
}

export async function getSubscriptionPlanById(id: number) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(subscriptionPlans)
    .where(eq(subscriptionPlans.id, id))
    .limit(1);
  return result[0] ?? null;
}

export async function upsertSubscriptionPlan(plan: InsertSubscriptionPlan) {
  const db = await getDb();
  if (!db) return null;
  const existing = await db.select().from(subscriptionPlans)
    .where(eq(subscriptionPlans.slug, plan.slug!))
    .limit(1);
  if (existing.length > 0) {
    await db.update(subscriptionPlans)
      .set({ ...plan, updatedAt: new Date() })
      .where(eq(subscriptionPlans.slug, plan.slug!));
    return existing[0].id;
  }
  const result = await db.insert(subscriptionPlans).values(plan).returning({ id: subscriptionPlans.id });
  return result[0]?.id ?? null;
}

// ─── User Subscriptions ─────────────────────────────────────────────

export async function getUserSubscription(userId: number) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(userSubscriptions)
    .where(and(
      eq(userSubscriptions.userId, userId),
      eq(userSubscriptions.status, "active")
    ))
    .orderBy(desc(userSubscriptions.createdAt))
    .limit(1);
  if (!result[0]) return null;

  // Join with plan data
  const plan = await getSubscriptionPlanById(result[0].planId);
  return { ...result[0], plan };
}

export async function getUserSubscriptionByCheckoutId(checkoutId: string) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(userSubscriptions)
    .where(eq(userSubscriptions.paymongoCheckoutId, checkoutId))
    .limit(1);
  return result[0] ?? null;
}

export async function createUserSubscription(sub: InsertUserSubscription) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.insert(userSubscriptions).values(sub).returning({ id: userSubscriptions.id });
  return result[0]?.id ?? null;
}

export async function updateUserSubscription(id: number, data: Partial<InsertUserSubscription>) {
  const db = await getDb();
  if (!db) return;
  await db.update(userSubscriptions)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(userSubscriptions.id, id));
}

export async function cancelUserSubscription(userId: number) {
  const db = await getDb();
  if (!db) return;
  // Cancel all active subscriptions for the user
  await db.update(userSubscriptions)
    .set({ status: "cancelled", cancelledAt: new Date(), updatedAt: new Date() })
    .where(and(
      eq(userSubscriptions.userId, userId),
      eq(userSubscriptions.status, "active")
    ));
}

// ─── Payment History ────────────────────────────────────────────────

export async function createPaymentRecord(payment: InsertPaymentHistory) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.insert(paymentHistory).values(payment).returning({ id: paymentHistory.id });
  return result[0]?.id ?? null;
}

export async function getPaymentsByUser(userId: number, limit = 20) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(paymentHistory)
    .where(eq(paymentHistory.userId, userId))
    .orderBy(desc(paymentHistory.createdAt))
    .limit(limit);
}

export async function updatePaymentByCheckoutId(checkoutId: string, data: Partial<InsertPaymentHistory>) {
  const db = await getDb();
  if (!db) return;
  await db.update(paymentHistory)
    .set(data)
    .where(eq(paymentHistory.paymongoCheckoutId, checkoutId));
}

// ─── Seed Default Plans ─────────────────────────────────────────────

export async function seedSubscriptionPlans() {
  const plans: InsertSubscriptionPlan[] = [
    {
      name: "Free",
      slug: "free",
      price: "0.00",
      currency: "USD",
      interval: "monthly",
      features: [
        "1 Facebook Page",
        "100 active leads",
        "50 conversations/mo",
        "AI auto-replies",
        "BANT lead scoring",
        "Basic analytics",
      ],
      sortOrder: 0,
      isActive: true,
    },
    {
      name: "Growth",
      slug: "growth",
      price: "29.00",
      currency: "USD",
      interval: "monthly",
      features: [
        "1 Facebook Page",
        "1,000 active leads",
        "500 conversations/mo",
        "AI auto-replies + follow-ups",
        "BANT lead scoring",
        "CRM pipeline",
        "Email notifications",
      ],
      sortOrder: 1,
      isActive: true,
    },
    {
      name: "Pro",
      slug: "pro",
      price: "69.00",
      currency: "USD",
      interval: "monthly",
      features: [
        "3 Facebook Pages",
        "5,000 active leads",
        "2,500 conversations/mo",
        "AI auto-replies + follow-ups",
        "Advanced BANT scoring",
        "CRM pipeline",
        "SMS + Email notifications",
        "Priority support",
      ],
      sortOrder: 2,
      isActive: true,
    },
    {
      name: "Scale",
      slug: "scale",
      price: "149.00",
      currency: "USD",
      interval: "monthly",
      features: [
        "10 Facebook Pages",
        "20,000 active leads",
        "10,000 conversations/mo",
        "AI auto-replies + follow-ups",
        "Advanced BANT scoring",
        "CRM pipeline",
        "SMS + Email + Webhook alerts",
        "Custom AI persona",
        "White-label option",
        "Dedicated account manager",
      ],
      sortOrder: 3,
      isActive: true,
    },
    {
      name: "Custom",
      slug: "custom",
      price: "0.00",
      currency: "USD",
      interval: "monthly",
      features: [
        "Unlimited Facebook Pages",
        "Unlimited active leads",
        "Unlimited conversations",
        "Everything in Scale",
        "Custom integrations",
        "Dedicated support",
        "SLA guarantee",
      ],
      sortOrder: 4,
      isActive: true,
    },
  ];

  for (const plan of plans) {
    await upsertSubscriptionPlan(plan);
  }
  console.log("[Database] Subscription plans seeded");
}

// ─── Instagram Accounts ─────────────────────────────────────────────

export async function getUserInstagramAccounts(userId: number) {
  const database = await getDb();
  if (!database) return [];
  return database.select().from(instagramAccounts).where(eq(instagramAccounts.userId, userId));
}

export async function getInstagramAccountByIgUserId(igUserId: string) {
  const database = await getDb();
  if (!database) return null;
  const rows = await database.select().from(instagramAccounts).where(eq(instagramAccounts.igUserId, igUserId));
  return rows[0] || null;
}

export async function createInstagramAccount(data: InsertInstagramAccount) {
  const database = await getDb();
  if (!database) return null;
  const rows = await database.insert(instagramAccounts).values(data).returning({ id: instagramAccounts.id });
  return rows[0]?.id || null;
}

export async function updateInstagramAccount(id: number, data: Partial<InsertInstagramAccount>) {
  const database = await getDb();
  if (!database) return;
  await database.update(instagramAccounts).set({ ...data, updatedAt: new Date() }).where(eq(instagramAccounts.id, id));
}

export async function deleteInstagramAccount(id: number) {
  const database = await getDb();
  if (!database) return;
  await database.delete(instagramAccounts).where(eq(instagramAccounts.id, id));
}

export async function updateInstagramAccountMode(id: number, aiMode: "paused" | "testing" | "live") {
  const database = await getDb();
  if (!database) return;
  await database.update(instagramAccounts).set({ aiMode, updatedAt: new Date() }).where(eq(instagramAccounts.id, id));
}

export async function getLeadByIgScopedId(igScopedId: string, igAccountId: number) {
  const database = await getDb();
  if (!database) return null;
  const rows = await database.select().from(leads).where(eq(leads.igScopedId, igScopedId));
  return rows[0] || null;
}

// ─── Follow-Up Settings ─────────────────────────────────────────────

export async function getFollowUpSettings(userId: number, pageId?: number) {
  const database = await getDb();
  if (!database) return null;
  const conditions = [eq(followUpSettings.userId, userId)];
  if (pageId !== undefined) conditions.push(eq(followUpSettings.pageId, pageId));
  const rows = await database.select().from(followUpSettings).where(and(...conditions));
  return rows[0] || null;
}

export async function upsertFollowUpSettings(userId: number, data: Partial<InsertFollowUpSetting>, pageId?: number) {
  const database = await getDb();
  if (!database) return;
  const existing = await getFollowUpSettings(userId, pageId);
  if (existing) {
    const conditions = [eq(followUpSettings.userId, userId)];
    if (pageId !== undefined) conditions.push(eq(followUpSettings.pageId, pageId));
    await database.update(followUpSettings).set({ ...data, updatedAt: new Date() }).where(and(...conditions));
  } else {
    await database.insert(followUpSettings).values({ userId, pageId: pageId ?? null, ...data });
  }
}

// ─── Analytics ──────────────────────────────────────────────────────

export async function getAnalyticsOverview(userId: number) {
  const database = await getDb();
  if (!database) return {
    totalConversations: 0, totalLeads: 0, hotLeads: 0, warmLeads: 0, coldLeads: 0,
    convertedLeads: 0, conversionRate: 0, avgScore: 0, totalMessages: 0,
    aiMessages: 0, humanMessages: 0, avgResponseTime: 0,
  };

  const [convResult] = await database.select({ count: count() }).from(conversations).where(eq(conversations.userId, userId));
  const totalConversations = convResult?.count ?? 0;

  const [totalLeadsResult] = await database.select({ count: count() }).from(leads).where(eq(leads.userId, userId));
  const totalLeads = totalLeadsResult?.count ?? 0;

  const [hotResult] = await database.select({ count: count() }).from(leads).where(and(eq(leads.userId, userId), eq(leads.classification, "hot")));
  const hotLeads = hotResult?.count ?? 0;

  const [warmResult] = await database.select({ count: count() }).from(leads).where(and(eq(leads.userId, userId), eq(leads.classification, "warm")));
  const warmLeads = warmResult?.count ?? 0;

  const [coldResult] = await database.select({ count: count() }).from(leads).where(and(eq(leads.userId, userId), eq(leads.classification, "cold")));
  const coldLeads = coldResult?.count ?? 0;

  const [convertedResult] = await database.select({ count: count() }).from(leads).where(and(eq(leads.userId, userId), eq(leads.status, "converted")));
  const convertedLeads = convertedResult?.count ?? 0;
  const conversionRate = totalLeads > 0 ? Math.round((convertedLeads / totalLeads) * 100) : 0;

  const [avgResult] = await database.select({ avg: avg(leads.score) }).from(leads).where(eq(leads.userId, userId));
  const avgScore = avgResult?.avg ? Math.round(Number(avgResult.avg)) : 0;

  const [totalMsgResult] = await database.select({ count: count() }).from(messages)
    .innerJoin(conversations, eq(messages.conversationId, conversations.id))
    .where(eq(conversations.userId, userId));
  const totalMessages = totalMsgResult?.count ?? 0;

  const [aiMsgResult] = await database.select({ count: count() }).from(messages)
    .innerJoin(conversations, eq(messages.conversationId, conversations.id))
    .where(and(eq(conversations.userId, userId), eq(messages.sender, "ai")));
  const aiMessages = aiMsgResult?.count ?? 0;

  const humanMessages = totalMessages - aiMessages;

  return {
    totalConversations, totalLeads, hotLeads, warmLeads, coldLeads,
    convertedLeads, conversionRate, avgScore, totalMessages,
    aiMessages, humanMessages, avgResponseTime: 0,
  };
}

export async function getConversationsOverTime(userId: number, days: number = 30) {
  const database = await getDb();
  if (!database) return [];
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);
  startDate.setHours(0, 0, 0, 0);
  const result = await database.select({
    date: sql<string>`DATE(${conversations.createdAt})`,
    total: count(),
  })
    .from(conversations)
    .where(and(eq(conversations.userId, userId), gte(conversations.createdAt, startDate)))
    .groupBy(sql`DATE(${conversations.createdAt})`)
    .orderBy(sql`DATE(${conversations.createdAt})`);
  return result;
}

export async function getLeadsByClassification(userId: number) {
  const database = await getDb();
  if (!database) return [];
  const result = await database.select({
    classification: leads.classification,
    count: count(),
  })
    .from(leads)
    .where(eq(leads.userId, userId))
    .groupBy(leads.classification);
  return result;
}

export async function getLeadsByStatus(userId: number) {
  const database = await getDb();
  if (!database) return [];
  const result = await database.select({
    status: leads.status,
    count: count(),
  })
    .from(leads)
    .where(eq(leads.userId, userId))
    .groupBy(leads.status);
  return result;
}

export async function getConversationsByPlatform(userId: number) {
  const database = await getDb();
  if (!database) return [];
  const result = await database.select({
    platform: conversations.platform,
    count: count(),
  })
    .from(conversations)
    .where(eq(conversations.userId, userId))
    .groupBy(conversations.platform);
  return result;
}

// ─── Webhook Endpoints ──────────────────────────────────────────────

export async function getUserWebhookEndpoints(userId: number) {
  const database = await getDb();
  if (!database) return [];
  return database.select().from(webhookEndpoints).where(eq(webhookEndpoints.userId, userId));
}

export async function createWebhookEndpoint(data: InsertWebhookEndpoint) {
  const database = await getDb();
  if (!database) return null;
  const rows = await database.insert(webhookEndpoints).values(data).returning({ id: webhookEndpoints.id });
  return rows[0]?.id || null;
}

export async function updateWebhookEndpoint(id: number, data: Partial<InsertWebhookEndpoint>) {
  const database = await getDb();
  if (!database) return;
  await database.update(webhookEndpoints).set({ ...data, updatedAt: new Date() }).where(eq(webhookEndpoints.id, id));
}

export async function deleteWebhookEndpoint(id: number) {
  const database = await getDb();
  if (!database) return;
  await database.delete(webhookEndpoints).where(eq(webhookEndpoints.id, id));
}

export async function getActiveWebhooksForEvent(userId: number, event: string) {
  const database = await getDb();
  if (!database) return [];
  const all = await database.select().from(webhookEndpoints)
    .where(and(eq(webhookEndpoints.userId, userId), eq(webhookEndpoints.isActive, true)));
  return all.filter(wh => wh.events.includes(event));
}

export async function markWebhookTriggered(id: number, success: boolean) {
  const database = await getDb();
  if (!database) return;
  if (success) {
    await database.update(webhookEndpoints).set({ lastTriggeredAt: new Date(), failCount: 0 }).where(eq(webhookEndpoints.id, id));
  } else {
    await database.update(webhookEndpoints).set({
      failCount: sql`${webhookEndpoints.failCount} + 1`,
    }).where(eq(webhookEndpoints.id, id));
  }
}

// ─── Leads Export (for Google Sheets) ───────────────────────────────

export async function getLeadsForExport(userId: number) {
  const database = await getDb();
  if (!database) return [];
  return database.select().from(leads).where(eq(leads.userId, userId)).orderBy(desc(leads.createdAt));
}

// ─── Live Agent Handoff ─────────────────────────────────────────────

export async function requestHandoff(conversationId: number, reason: string) {
  const database = await getDb();
  if (!database) return;
  await database.update(conversations).set({
    needsHandoff: true,
    handoffReason: reason,
    handoffAt: new Date(),
    isAiActive: false,
    updatedAt: new Date(),
  }).where(eq(conversations.id, conversationId));
}

export async function resolveHandoff(conversationId: number) {
  const database = await getDb();
  if (!database) return;
  await database.update(conversations).set({
    needsHandoff: false,
    handoffReason: null,
    isAiActive: true,
    updatedAt: new Date(),
  }).where(eq(conversations.id, conversationId));
}

export async function getHandoffQueue(userId: number) {
  const database = await getDb();
  if (!database) return [];
  return database.select({
    conversation: conversations,
    lead: leads,
    page: facebookPages,
  })
    .from(conversations)
    .leftJoin(leads, eq(conversations.leadId, leads.id))
    .leftJoin(facebookPages, eq(conversations.pageId, facebookPages.id))
    .where(and(eq(conversations.userId, userId), eq(conversations.needsHandoff, true)))
    .orderBy(desc(conversations.handoffAt));
}

export async function getHandoffCount(userId: number) {
  const database = await getDb();
  if (!database) return 0;
  const [result] = await database.select({ count: count() }).from(conversations)
    .where(and(eq(conversations.userId, userId), eq(conversations.needsHandoff, true)));
  return result?.count ?? 0;
}


// ─── Integration Settings ───────────────────────────────────────────

export async function getIntegrationSettings(userId: number) {
  const database = await getDb();
  if (!database) return null;
  const result = await database.select().from(integrationSettings)
    .where(eq(integrationSettings.userId, userId)).limit(1);
  return result[0] ?? null;
}

export async function upsertIntegrationSettings(userId: number, data: Partial<InsertIntegrationSetting>) {
  const database = await getDb();
  if (!database) return;
  const existing = await database.select().from(integrationSettings)
    .where(eq(integrationSettings.userId, userId)).limit(1);
  if (existing.length > 0) {
    await database.update(integrationSettings)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(integrationSettings.userId, userId));
  } else {
    await database.insert(integrationSettings).values({ userId, ...data });
  }
}

// ─── Handoff Settings ───────────────────────────────────────────────

export async function getHandoffSettings(userId: number, pageId?: number) {
  const database = await getDb();
  if (!database) return null;
  const conditions = [eq(handoffSettings.userId, userId)];
  if (pageId !== undefined) conditions.push(eq(handoffSettings.pageId, pageId));
  const result = await database.select().from(handoffSettings)
    .where(and(...conditions)).limit(1);
  return result[0] ?? null;
}

export async function upsertHandoffSettings(userId: number, data: Partial<InsertHandoffSetting>, pageId?: number) {
  const database = await getDb();
  if (!database) return;
  const existing = await getHandoffSettings(userId, pageId);
  if (existing) {
    const conditions = [eq(handoffSettings.userId, userId)];
    if (pageId !== undefined) conditions.push(eq(handoffSettings.pageId, pageId));
    await database.update(handoffSettings)
      .set({ ...data, updatedAt: new Date() })
      .where(and(...conditions));
  } else {
    await database.insert(handoffSettings).values({ userId, pageId: pageId ?? null, ...data });
  }
}


// ─── Plan Enforcement Helpers ───────────────────────────────────────

export async function getActiveLeadCount(userId: number): Promise<number> {
  const database = await getDb();
  if (!database) return 0;
  const [result] = await database.select({ count: count() }).from(leads)
    .where(and(eq(leads.userId, userId), eq(leads.status, "active")));
  return result?.count ?? 0;
}

export async function getMonthlyConversationCount(userId: number): Promise<number> {
  const database = await getDb();
  if (!database) return 0;
  const monthStart = new Date();
  monthStart.setDate(1);
  monthStart.setHours(0, 0, 0, 0);
  const [result] = await database.select({ count: count() }).from(conversations)
    .where(and(eq(conversations.userId, userId), gte(conversations.createdAt, monthStart)));
  return result?.count ?? 0;
}


// ─── Follow-Up Worker Aliases ──────────────────────────────────────

/** Alias for getConversationById used by follow-up worker (accepts number) */
export async function getConversation(conversationId: number | string) {
  const id = typeof conversationId === "string" ? parseInt(conversationId, 10) : conversationId;
  if (isNaN(id)) return null;
  const database = await getDb();
  if (!database) return null;
  const result = await database.select().from(conversations).where(eq(conversations.id, id)).limit(1);
  return result[0] ?? null;
}

/** Get lead by conversation ID — used by follow-up worker */
export async function getLeadByConversationId(conversationId: number | string) {
  const id = typeof conversationId === "string" ? parseInt(conversationId, 10) : conversationId;
  if (isNaN(id)) return null;
  const database = await getDb();
  if (!database) return null;
  const conv = await database.select().from(conversations).where(eq(conversations.id, id)).limit(1);
  if (!conv[0]?.leadId) return null;
  const lead = await database.select().from(leads).where(eq(leads.id, conv[0].leadId)).limit(1);
  return lead[0] ?? null;
}


// ─── Facebook Disconnect: Clear all page tokens for a user ──────────
export async function clearUserPageTokens(userId: number) {
  const database = await getDb();
  if (!database) return;
  await database.update(facebookPages)
    .set({ pageAccessToken: null, updatedAt: new Date() })
    .where(eq(facebookPages.userId, userId));
}

export async function getUserHasFacebookToken(userId: number) {
  const db = await getDb();
  if (!db) return false;
  const result = await db.select({ id: facebookPages.id })
    .from(facebookPages)
    .where(and(
      eq(facebookPages.userId, userId),
      sql`${facebookPages.pageAccessToken} IS NOT NULL`
    ))
    .limit(1);
  return result.length > 0;
}
