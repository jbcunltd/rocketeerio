/**
 * Plan Limits Configuration & Enforcement
 * Defines what each plan gets and provides helpers to check limits.
 */
import * as db from "./db";
import { TRPCError } from "@trpc/server";

// ─── Plan Limits Config ─────────────────────────────────────────────

export type PlanSlug = "free" | "growth" | "pro" | "scale" | "custom";

export interface PlanLimits {
  name: string;
  slug: PlanSlug;
  price: number; // USD per month
  maxFacebookPages: number;
  maxActiveLeads: number;
  maxConversationsPerMonth: number;
  features: {
    basicAnalytics: boolean;
    crmPipeline: boolean;
    prioritySupport: boolean;
    whiteLabel: boolean;
    smsAlerts: boolean;
  };
}

export const PLAN_LIMITS: Record<PlanSlug, PlanLimits> = {
  free: {
    name: "Free",
    slug: "free",
    price: 0,
    maxFacebookPages: 1,
    maxActiveLeads: 100,
    maxConversationsPerMonth: 50,
    features: {
      basicAnalytics: true,
      crmPipeline: false,
      prioritySupport: false,
      whiteLabel: false,
      smsAlerts: false,
    },
  },
  growth: {
    name: "Growth",
    slug: "growth",
    price: 29,
    maxFacebookPages: 1,
    maxActiveLeads: 1000,
    maxConversationsPerMonth: 500,
    features: {
      basicAnalytics: true,
      crmPipeline: true,
      prioritySupport: false,
      whiteLabel: false,
      smsAlerts: false,
    },
  },
  pro: {
    name: "Pro",
    slug: "pro",
    price: 79,
    maxFacebookPages: 3,
    maxActiveLeads: 5000,
    maxConversationsPerMonth: 2500,
    features: {
      basicAnalytics: true,
      crmPipeline: true,
      prioritySupport: true,
      whiteLabel: false,
      smsAlerts: true,
    },
  },
  scale: {
    name: "Scale",
    slug: "scale",
    price: 149,
    maxFacebookPages: 10,
    maxActiveLeads: 20000,
    maxConversationsPerMonth: 10000,
    features: {
      basicAnalytics: true,
      crmPipeline: true,
      prioritySupport: true,
      whiteLabel: true,
      smsAlerts: true,
    },
  },
  custom: {
    name: "Custom",
    slug: "custom",
    price: 0, // negotiated
    maxFacebookPages: Infinity,
    maxActiveLeads: Infinity,
    maxConversationsPerMonth: Infinity,
    features: {
      basicAnalytics: true,
      crmPipeline: true,
      prioritySupport: true,
      whiteLabel: true,
      smsAlerts: true,
    },
  },
};

/** Get the next upgrade plan slug */
export function getNextPlan(currentPlan: PlanSlug): PlanSlug | null {
  const order: PlanSlug[] = ["free", "growth", "pro", "scale", "custom"];
  const idx = order.indexOf(currentPlan);
  if (idx === -1 || idx >= order.length - 1) return null;
  return order[idx + 1];
}

/** Get plan limits for a user's current plan */
export function getPlanLimits(plan: string): PlanLimits {
  return PLAN_LIMITS[plan as PlanSlug] ?? PLAN_LIMITS.free;
}

// ─── Enforcement Helpers ────────────────────────────────────────────

export interface PlanCheckResult {
  allowed: boolean;
  currentCount: number;
  limit: number;
  planName: string;
  nextPlan: PlanSlug | null;
}

/** Check if user can connect another Facebook page */
export async function checkPageLimit(userId: number, userPlan: string): Promise<PlanCheckResult> {
  const limits = getPlanLimits(userPlan);
  const pages = await db.getUserPages(userId);
  const currentCount = pages.length;
  const nextPlan = getNextPlan(userPlan as PlanSlug);

  return {
    allowed: currentCount < limits.maxFacebookPages,
    currentCount,
    limit: limits.maxFacebookPages,
    planName: limits.name,
    nextPlan,
  };
}

/** Check if user can create another active lead */
export async function checkLeadLimit(userId: number, userPlan: string): Promise<PlanCheckResult> {
  const limits = getPlanLimits(userPlan);
  const currentCount = await db.getActiveLeadCount(userId);
  const nextPlan = getNextPlan(userPlan as PlanSlug);

  return {
    allowed: currentCount < limits.maxActiveLeads,
    currentCount,
    limit: limits.maxActiveLeads,
    planName: limits.name,
    nextPlan,
  };
}

/** Check if user can have another conversation this month */
export async function checkConversationLimit(userId: number, userPlan: string): Promise<PlanCheckResult> {
  const limits = getPlanLimits(userPlan);
  const currentCount = await db.getMonthlyConversationCount(userId);
  const nextPlan = getNextPlan(userPlan as PlanSlug);

  return {
    allowed: currentCount < limits.maxConversationsPerMonth,
    currentCount,
    limit: limits.maxConversationsPerMonth,
    planName: limits.name,
    nextPlan,
  };
}

/** Check if user has access to SMS alerts (Pro+ only) */
export function checkSmsAlertAccess(userPlan: string): boolean {
  const limits = getPlanLimits(userPlan);
  return limits.features.smsAlerts;
}

/** Enforce a plan limit — throws TRPCError if limit exceeded */
export function enforcePlanLimit(check: PlanCheckResult, resourceName: string): void {
  if (!check.allowed) {
    const nextPlanName = check.nextPlan ? PLAN_LIMITS[check.nextPlan].name : "Custom";
    throw new TRPCError({
      code: "FORBIDDEN",
      message: `You've reached the ${resourceName} limit for the ${check.planName} plan (${check.currentCount}/${check.limit}). Upgrade to ${nextPlanName} to unlock more.`,
    });
  }
}

/** Get full plan usage summary for a user */
export async function getPlanUsage(userId: number, userPlan: string) {
  const limits = getPlanLimits(userPlan);
  const pages = await db.getUserPages(userId);
  const activeLeads = await db.getActiveLeadCount(userId);
  const monthlyConversations = await db.getMonthlyConversationCount(userId);

  return {
    plan: userPlan,
    planName: limits.name,
    pages: {
      current: pages.length,
      limit: limits.maxFacebookPages,
      percentage: limits.maxFacebookPages === Infinity ? 0 : Math.round((pages.length / limits.maxFacebookPages) * 100),
    },
    leads: {
      current: activeLeads,
      limit: limits.maxActiveLeads,
      percentage: limits.maxActiveLeads === Infinity ? 0 : Math.round((activeLeads / limits.maxActiveLeads) * 100),
    },
    conversations: {
      current: monthlyConversations,
      limit: limits.maxConversationsPerMonth,
      percentage: limits.maxConversationsPerMonth === Infinity ? 0 : Math.round((monthlyConversations / limits.maxConversationsPerMonth) * 100),
    },
    features: limits.features,
    nextPlan: getNextPlan(userPlan as PlanSlug),
  };
}
