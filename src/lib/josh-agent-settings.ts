import type {
  DbJoshAgentSettings,
  JoshAgentMode,
  JoshBehaviorRules,
  JoshBusinessInfo,
  JoshKnowledgeEntry,
  JoshPersonalityTone,
  JoshResponseLength,
  JoshSkillSettings,
} from "@/lib/db/schema";

export interface JoshAgentSettingsValue {
  mode: JoshAgentMode;
  agentName: string;
  roleTitle: string;
  personalityTone: JoshPersonalityTone;
  avatarUrl: string | null;
  skills: JoshSkillSettings;
  businessInfo: JoshBusinessInfo;
  knowledgeBase: JoshKnowledgeEntry[];
  behaviorRules: JoshBehaviorRules;
}

export const JOSH_MODE_OPTIONS: Array<{
  value: JoshAgentMode;
  label: string;
  description: string;
  colorClass: string;
}> = [
  {
    value: "paused",
    label: "Paused",
    description: "AI off",
    colorClass: "border-ink-200 bg-ink-50 text-ink-700",
  },
  {
    value: "testing",
    label: "Testing",
    description: "Only responds to testers",
    colorClass: "border-amber-200 bg-amber-50 text-amber-800",
  },
  {
    value: "live",
    label: "Live",
    description: "Responds to everyone",
    colorClass: "border-emerald-200 bg-emerald-50 text-emerald-800",
  },
];

export const JOSH_TONE_OPTIONS: Array<{
  value: JoshPersonalityTone;
  label: string;
  description: string;
}> = [
  {
    value: "friendly_casual",
    label: "Friendly & Casual",
    description: "Warm, approachable, and conversational.",
  },
  {
    value: "professional",
    label: "Professional",
    description: "Polished, concise, and business-first.",
  },
  {
    value: "elevated_taglish",
    label: "Elevated Taglish",
    description: "Premium but natural Taglish for Filipino buyers.",
  },
];

export const JOSH_RESPONSE_LENGTH_OPTIONS: Array<{
  value: JoshResponseLength;
  label: string;
}> = [
  { value: "short", label: "Short" },
  { value: "medium", label: "Medium" },
  { value: "detailed", label: "Detailed" },
];

export const JOSH_SKILL_OPTIONS: Array<{
  key: keyof JoshSkillSettings;
  label: string;
  description: string;
}> = [
  {
    key: "leadQualification",
    label: "Lead Qualification (BANT scoring)",
    description: "Assess budget, authority, need, and timing before escalation.",
  },
  {
    key: "appointmentBooking",
    label: "Appointment/Site Visit Booking",
    description: "Invite prospects to book calls, meetings, or property visits.",
  },
  {
    key: "objectionHandling",
    label: "Objection Handling",
    description: "Respond to hesitation with approved rebuttals and next steps.",
  },
  {
    key: "productRecommendations",
    label: "Product Recommendations",
    description: "Match buyers to relevant offers, units, or packages.",
  },
  {
    key: "pricingInquiries",
    label: "Pricing Inquiries",
    description: "Answer price, financing, and availability questions.",
  },
  {
    key: "followUpSequences",
    label: "Follow-up Sequences",
    description: "Continue conversations with timely nurturing prompts.",
  },
  {
    key: "hotLeadAlerts",
    label: "Hot Lead Alerts (SMS/Email)",
    description: "Flag high-intent prospects for the human sales team.",
  },
  {
    key: "instantQuotation",
    label: "Instant Quotation",
    description: "Generate quick quote-style summaries when enough details exist.",
  },
];

export const JOSH_KNOWLEDGE_CATEGORIES: Array<{
  value: JoshKnowledgeEntry["category"];
  label: string;
  placeholder: string;
}> = [
  {
    value: "products_pricing",
    label: "Products & pricing",
    placeholder: "List packages, units, prices, promos, financing, or exclusions.",
  },
  {
    value: "faqs",
    label: "FAQs",
    placeholder: "Add common questions and the approved answers Josh should use.",
  },
  {
    value: "objection_scripts",
    label: "Objection scripts & rebuttals",
    placeholder: "Example: If buyer says it is too expensive, acknowledge then explain value.",
  },
  {
    value: "golden_rules",
    label: "Golden Rules",
    placeholder: "Things Josh should always or never say.",
  },
  {
    value: "custom_notes",
    label: "Custom instructions/notes",
    placeholder: "Any extra guidance, policy, qualification criteria, or sales playbook notes.",
  },
];

export const DEFAULT_JOSH_SETTINGS: JoshAgentSettingsValue = {
  mode: "paused",
  agentName: "Josh",
  roleTitle: "Sales Agent",
  personalityTone: "friendly_casual",
  avatarUrl: null,
  skills: {
    leadQualification: true,
    appointmentBooking: true,
    objectionHandling: true,
    productRecommendations: true,
    pricingInquiries: true,
    followUpSequences: true,
    hotLeadAlerts: false,
    instantQuotation: false,
  },
  businessInfo: {
    companyName: "",
    description: "",
    productsServices: "",
  },
  knowledgeBase: [],
  behaviorRules: {
    alwaysEndWithQuestion: true,
    neverMentionCompetitors: true,
    alwaysPushTowardSiteVisit: false,
    responseLength: "medium",
    customRules: [],
  },
};

function mergeSkills(skills: Partial<JoshSkillSettings> | null): JoshSkillSettings {
  return { ...DEFAULT_JOSH_SETTINGS.skills, ...(skills ?? {}) };
}

function mergeBusinessInfo(
  businessInfo: Partial<JoshBusinessInfo> | null,
): JoshBusinessInfo {
  return { ...DEFAULT_JOSH_SETTINGS.businessInfo, ...(businessInfo ?? {}) };
}

function mergeBehaviorRules(
  behaviorRules: Partial<JoshBehaviorRules> | null,
): JoshBehaviorRules {
  return {
    ...DEFAULT_JOSH_SETTINGS.behaviorRules,
    ...(behaviorRules ?? {}),
    customRules: Array.isArray(behaviorRules?.customRules)
      ? behaviorRules.customRules
      : [],
  };
}

export function toJoshSettingsValue(
  row?: DbJoshAgentSettings,
): JoshAgentSettingsValue {
  if (!row) return DEFAULT_JOSH_SETTINGS;

  return {
    mode: row.mode ?? DEFAULT_JOSH_SETTINGS.mode,
    agentName: row.agentName || DEFAULT_JOSH_SETTINGS.agentName,
    roleTitle: row.roleTitle || DEFAULT_JOSH_SETTINGS.roleTitle,
    personalityTone: row.personalityTone ?? DEFAULT_JOSH_SETTINGS.personalityTone,
    avatarUrl: row.avatarUrl ?? null,
    skills: mergeSkills(row.skills),
    businessInfo: mergeBusinessInfo(row.businessInfo),
    knowledgeBase: Array.isArray(row.knowledgeBase) ? row.knowledgeBase : [],
    behaviorRules: mergeBehaviorRules(row.behaviorRules),
  };
}
