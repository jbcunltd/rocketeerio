/**
 * Handbook API client for interacting with the backend.
 * All requests are proxied through /api/handbook/[...path] to ensure auth context.
 */

export interface KnowledgeItem {
  id: string;
  type: "url" | "youtube" | "file";
  title: string;
  url?: string;
  fileName?: string;
  status: "processing" | "ready" | "failed";
  createdAt: string;
}

export interface Skill {
  id: string;
  type: "youtube" | "file" | "website";
  title: string;
  url?: string;
  fileName?: string;
  summary?: string;
  status: "processing" | "ready" | "failed";
  active: boolean;
  priority: number;
  createdAt: string;
}

export interface PersonalitySettings {
  description: string;
  responseLength: "brief" | "balanced" | "detailed";
  emojiEnabled: boolean;
}

export interface QualificationCriteria {
  id: string;
  label: string;
  active: boolean;
}

export interface ConversationFlow {
  openingMessage: string;
  handoffTriggerMessage: string;
  bookingClosingMessage: string;
  qualifyingQuestions: string[];
  objectionHandling: Record<string, string>;
}

export interface EscalationRules {
  hotLeadDetected: boolean;
  leadAsksForHuman: boolean;
  joshDoesntKnowAnswer: boolean;
  vipKeywords: string[];
  notificationMethod: "in-app" | "email" | "both";
}

export interface LearningEvent {
  id: string;
  type: string;
  description: string;
  timestamp: string;
}

export interface HandbookData {
  pageId: string;
  personality?: PersonalitySettings;
  qualification?: QualificationCriteria[];
  flow?: ConversationFlow;
  escalation?: EscalationRules;
  knowledge?: KnowledgeItem[];
  skills?: Skill[];
  learningLog?: LearningEvent[];
}

const API_BASE = "/api/handbook";

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const text = await response.text().catch(() => "");
    let error: Record<string, unknown>;
    try {
      error = JSON.parse(text);
    } catch {
      error = { error: text || response.statusText };
    }
    const message = String(error?.error ?? error?.message ?? `HTTP ${response.status}`);
    throw new Error(message);
  }
  const text = await response.text();
  if (!text) return {} as T;
  return JSON.parse(text);
}

export async function getHandbookData(pageId: string): Promise<HandbookData> {
  const response = await fetch(`${API_BASE}/${encodeURIComponent(pageId)}`, {
    method: "GET",
    headers: { "Content-Type": "application/json" },
  });
  return handleResponse<HandbookData>(response);
}

export async function savePersonalitySettings(
  pageId: string,
  settings: PersonalitySettings,
): Promise<void> {
  const response = await fetch(`${API_BASE}/${encodeURIComponent(pageId)}/personality`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(settings),
  });
  await handleResponse<void>(response);
}

export async function saveQualificationCriteria(
  pageId: string,
  criteria: QualificationCriteria[],
): Promise<void> {
  const response = await fetch(`${API_BASE}/${encodeURIComponent(pageId)}/qualification`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ criteria }),
  });
  await handleResponse<void>(response);
}

export async function saveConversationFlow(
  pageId: string,
  flow: ConversationFlow,
): Promise<void> {
  const response = await fetch(`${API_BASE}/${encodeURIComponent(pageId)}/flow`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(flow),
  });
  await handleResponse<void>(response);
}

export async function saveEscalationRules(
  pageId: string,
  rules: EscalationRules,
): Promise<void> {
  const response = await fetch(`${API_BASE}/${encodeURIComponent(pageId)}/escalation`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(rules),
  });
  await handleResponse<void>(response);
}

export async function addKnowledgeItem(
  pageId: string,
  item: Omit<KnowledgeItem, "id" | "createdAt">,
): Promise<KnowledgeItem> {
  const response = await fetch(`${API_BASE}/${encodeURIComponent(pageId)}/knowledge`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(item),
  });
  return handleResponse<KnowledgeItem>(response);
}

export async function deleteKnowledgeItem(pageId: string, itemId: string): Promise<void> {
  const response = await fetch(
    `${API_BASE}/${encodeURIComponent(pageId)}/knowledge/${encodeURIComponent(itemId)}`,
    {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
    },
  );
  await handleResponse<void>(response);
}

export async function addSkill(
  pageId: string,
  skill: Omit<Skill, "id" | "createdAt">,
): Promise<Skill> {
  const response = await fetch(`${API_BASE}/${encodeURIComponent(pageId)}/skills`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(skill),
  });
  return handleResponse<Skill>(response);
}

export async function deleteSkill(pageId: string, skillId: string): Promise<void> {
  const response = await fetch(
    `${API_BASE}/${encodeURIComponent(pageId)}/skills/${encodeURIComponent(skillId)}`,
    {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
    },
  );
  await handleResponse<void>(response);
}

export async function updateSkill(
  pageId: string,
  skillId: string,
  updates: Partial<Skill>,
): Promise<Skill> {
  const response = await fetch(
    `${API_BASE}/${encodeURIComponent(pageId)}/skills/${encodeURIComponent(skillId)}`,
    {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updates),
    },
  );
  return handleResponse<Skill>(response);
}
