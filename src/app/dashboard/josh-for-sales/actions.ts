"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { getCurrentSession } from "@/lib/auth/cookies";
import { db } from "@/lib/db";
import { joshAgentSettingsTable } from "@/lib/db/schema";

export type SaveJoshSettingsState =
  | { ok: true; savedAt: string }
  | { ok: false; error: string }
  | undefined;

const skillsSchema = z.object({
  leadQualification: z.boolean(),
  appointmentBooking: z.boolean(),
  objectionHandling: z.boolean(),
  productRecommendations: z.boolean(),
  pricingInquiries: z.boolean(),
  followUpSequences: z.boolean(),
  hotLeadAlerts: z.boolean(),
  instantQuotation: z.boolean(),
});

const businessInfoSchema = z.object({
  companyName: z.string().max(160).default(""),
  description: z.string().max(4000).default(""),
  productsServices: z.string().max(4000).default(""),
});

const knowledgeEntrySchema = z.object({
  id: z.string().min(1).max(80),
  category: z.enum([
    "products_pricing",
    "faqs",
    "objection_scripts",
    "golden_rules",
    "custom_notes",
  ]),
  title: z.string().trim().min(1).max(160),
  content: z.string().trim().min(1).max(8000),
});

const behaviorRulesSchema = z.object({
  alwaysEndWithQuestion: z.boolean(),
  neverMentionCompetitors: z.boolean(),
  alwaysPushTowardSiteVisit: z.boolean(),
  responseLength: z.enum(["short", "medium", "detailed"]),
  customRules: z.array(z.string().trim().min(1).max(500)).max(30),
});

const settingsSchema = z.object({
  mode: z.enum(["paused", "testing", "live"]),
  agentName: z.string().trim().min(1).max(80),
  roleTitle: z.string().trim().min(1).max(120),
  personalityTone: z.enum(["friendly_casual", "professional", "elevated_taglish"]),
  avatarUrl: z
    .string()
    .trim()
    .max(200000, "Avatar image is too large. Please use a smaller image.")
    .optional()
    .nullable()
    .transform((value) => (value ? value : null)),
  skills: skillsSchema,
  businessInfo: businessInfoSchema,
  knowledgeBase: z.array(knowledgeEntrySchema).max(100),
  behaviorRules: behaviorRulesSchema,
});

export async function saveJoshAgentSettingsAction(
  _prev: SaveJoshSettingsState,
  formData: FormData,
): Promise<SaveJoshSettingsState> {
  const { user } = await getCurrentSession();
  if (!user) redirect("/login");

  const rawPayload = String(formData.get("settings") ?? "");
  let payload: unknown;
  try {
    payload = JSON.parse(rawPayload);
  } catch {
    return { ok: false, error: "We couldn't read the settings payload." };
  }

  const parsed = settingsSchema.safeParse(payload);
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? "Please review the settings form.",
    };
  }

  const values = {
    mode: parsed.data.mode,
    agentName: parsed.data.agentName,
    roleTitle: parsed.data.roleTitle,
    personalityTone: parsed.data.personalityTone,
    avatarUrl: parsed.data.avatarUrl,
    skills: parsed.data.skills,
    businessInfo: parsed.data.businessInfo,
    knowledgeBase: parsed.data.knowledgeBase,
    behaviorRules: parsed.data.behaviorRules,
    updatedAt: new Date(),
  };

  try {
    const existing = await db
      .select({ id: joshAgentSettingsTable.id })
      .from(joshAgentSettingsTable)
      .where(eq(joshAgentSettingsTable.userId, user.id))
      .limit(1);

    if (existing.length > 0) {
      await db
        .update(joshAgentSettingsTable)
        .set(values)
        .where(eq(joshAgentSettingsTable.id, existing[0].id));
    } else {
      await db.insert(joshAgentSettingsTable).values({
        userId: user.id,
        ...values,
      });
    }
  } catch (err) {
    console.error("[josh settings] save failed", err);
    return {
      ok: false,
      error: "We couldn't save Josh's settings. Please try again in a moment.",
    };
  }

  revalidatePath("/dashboard/josh-for-sales");
  revalidatePath("/dashboard/settings");

  return { ok: true, savedAt: new Date().toISOString() };
}
