import { invokeLLM } from "./_core/llm";
import { getActiveKnowledgeBase, getPageAiSettingsByDbPageId } from "./db";
import type { PageAiSetting } from "../drizzle/schema";

/** Map tone enum values to human-readable prompt instructions */
function getToneInstruction(tone: string): string {
  switch (tone) {
    case "casual_taglish":
      return 'Use casual Filipino-English (Taglish) tone when it feels natural (e.g., "po", "ma\'am/sir", mixing Tagalog and English naturally)';
    case "formal_english":
      return "Use formal, polished English. Maintain a professional and courteous tone throughout. Avoid slang or casual abbreviations.";
    case "casual_english":
      return "Use casual, friendly English. Keep it conversational and approachable, like chatting with a friend.";
    case "professional_filipino":
      return "Use professional Filipino (Tagalog). Maintain a respectful and business-appropriate tone in Filipino language.";
    default:
      return 'Use casual Filipino-English (Taglish) tone when it feels natural (e.g., "po", "ma\'am/sir")';
  }
}

/** Map response length enum to prompt instructions */
function getResponseLengthInstruction(length: string): string {
  switch (length) {
    case "short":
      return "Keep responses under 100 words — short punchy messages like real chat. One message at a time, one question at a time.";
    case "medium":
      return "Keep responses between 100-200 words. Be informative but concise. Cover the key points without being too brief or too lengthy.";
    case "detailed":
      return "Provide detailed, thorough responses (200-400 words). Include relevant details, examples, and explanations to be as helpful as possible.";
    default:
      return "Keep responses under 100 words — short punchy messages like real chat.";
  }
}

/** Map primary goal enum to prompt instructions */
function getPrimaryGoalInstruction(goal: string): string {
  switch (goal) {
    case "site_visit":
      return "Your #1 goal is to move every inquiry toward a SITE VISIT or IN-PERSON CONSULTATION. Guide the conversation toward scheduling a visit.";
    case "booking":
      return "Your #1 goal is to move every inquiry toward a BOOKING or APPOINTMENT. Guide the conversation toward confirming a booking.";
    case "quote_request":
      return "Your #1 goal is to move every inquiry toward requesting a QUOTE or ESTIMATE. Gather their requirements and offer to prepare a personalized quote.";
    case "general_support":
      return "Your #1 goal is to provide excellent CUSTOMER SUPPORT. Answer questions thoroughly, resolve concerns, and ensure customer satisfaction.";
    default:
      return "Your #1 goal is to move every inquiry toward a SITE VISIT or DESIGN CONSULTATION.";
  }
}

/** Build emoji instruction */
function getEmojiInstruction(useEmojis: boolean): string {
  if (useEmojis) {
    return "Use emojis sparingly and naturally (😊 is fine, don't overdo it)";
  }
  return "Do NOT use any emojis in your messages. Keep the tone clean and text-only.";
}

/**
 * Generate an AI response for a lead conversation.
 * Uses the business's knowledge base and per-page AI personality settings.
 */
export async function generateAIResponse(
  userId: number,
  conversationHistory: Array<{ sender: string; content: string }>,
  leadName: string | null,
  pageName: string,
  pageDbId?: number
): Promise<string> {
  // Retrieve knowledge base for context
  const kbEntries = await getActiveKnowledgeBase(userId);
  const knowledgeContext = kbEntries
    .map(entry => `[${entry.category.toUpperCase()}] ${entry.title}:\n${entry.content}`)
    .join("\n\n---\n\n");

  // Retrieve per-page AI personality settings
  let settings: PageAiSetting | null = null;
  if (pageDbId) {
    settings = await getPageAiSettingsByDbPageId(pageDbId);
  }

  // Use settings or defaults
  const tone = settings?.tone ?? "casual_taglish";
  const responseLength = settings?.responseLength ?? "short";
  const useEmojis = settings?.useEmojis ?? true;
  const primaryGoal = settings?.primaryGoal ?? "site_visit";
  const agentName = settings?.agentName || null;
  const customInstructions = settings?.customInstructions || null;

  const historyMessages = conversationHistory.slice(-10).map(msg => ({
    role: (msg.sender === "lead" ? "user" : "assistant") as "user" | "assistant",
    content: msg.content,
  }));

  // Build the agent identity line
  const identityLine = agentName
    ? `You are "${agentName}", a real human sales agent for "${pageName}". You chat with customers on Facebook Messenger.`
    : `You are a real human sales agent for "${pageName}". You chat with customers on Facebook Messenger.`;

  const systemPrompt = `${identityLine}

YOUR PERSONALITY & STYLE:
- You sound like a real person, NOT an AI chatbot
- Warm, friendly, professional — like a trusted advisor
- ${getToneInstruction(tone)}
- ${getEmojiInstruction(useEmojis)}
- NEVER start messages with "Hi [name]!" every time — only greet by name on the FIRST message in a conversation
- Keep messages short and conversational, like real Messenger chat
- ALWAYS end your message with a question to keep the conversation moving
- ${getPrimaryGoalInstruction(primaryGoal)}

RESPONSE LENGTH:
- ${getResponseLengthInstruction(responseLength)}

KNOWLEDGE BASE & SCRIPTS:
${knowledgeContext || "No knowledge base entries available yet. Respond helpfully and offer to connect them with a human representative."}

RULES:
- Follow the scripts and objection handling in the knowledge base closely — they are proven to work
- NEVER make up pricing, timelines, or information not in the knowledge base
- If you don't know something specific, say "Let me check with our team and get back to you on that"
- Do NOT repeat the customer's name in every message — only use it occasionally and naturally
- Do NOT say "I'm an AI" or "As an AI" — you are a sales agent${agentName ? ` named ${agentName}` : ""}
- Never sound defensive about pricing — reframe toward value and design
- The lead's name is: ${leadName || "there"}${customInstructions ? `\n\nADDITIONAL INSTRUCTIONS:\n${customInstructions}` : ""}`;

  const result = await invokeLLM({
    messages: [
      { role: "system", content: systemPrompt },
      ...historyMessages,
    ],
  });

  const content = result.choices[0]?.message?.content;
  if (typeof content === "string") return content;
  if (Array.isArray(content)) {
    const textPart = content.find(p => typeof p === "object" && "type" in p && p.type === "text");
    if (textPart && "text" in textPart) return textPart.text;
  }
  return "Thanks for reaching out! Let me connect you with our team.";
}

/**
 * Score a lead using BANT methodology based on conversation history.
 * Returns structured scoring with individual dimension scores.
 */
export async function scoreLead(
  conversationHistory: Array<{ sender: string; content: string }>
): Promise<{
  score: number;
  classification: "hot" | "warm" | "cold";
  budgetScore: number;
  authorityScore: number;
  needScore: number;
  timelineScore: number;
  budgetNotes: string;
  authorityNotes: string;
  needNotes: string;
  timelineNotes: string;
}> {
  const transcript = conversationHistory
    .map(msg => `${msg.sender === "lead" ? "LEAD" : "AGENT"}: ${msg.content}`)
    .join("\n");

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

Return ONLY valid JSON.`,
      },
      {
        role: "user",
        content: `Score this conversation:\n\n${transcript}`,
      },
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
            timelineNotes: { type: "string", description: "Brief explanation for timeline score" },
          },
          required: ["budgetScore", "authorityScore", "needScore", "timelineScore", "budgetNotes", "authorityNotes", "needNotes", "timelineNotes"],
          additionalProperties: false,
        },
      },
    },
  });

  try {
    const content = result.choices[0]?.message?.content;
    const text = typeof content === "string" ? content : "";
    const parsed = JSON.parse(text);

    const budgetScore = Math.min(25, Math.max(0, parsed.budgetScore || 0));
    const authorityScore = Math.min(25, Math.max(0, parsed.authorityScore || 0));
    const needScore = Math.min(25, Math.max(0, parsed.needScore || 0));
    const timelineScore = Math.min(25, Math.max(0, parsed.timelineScore || 0));
    const score = budgetScore + authorityScore + needScore + timelineScore;

    let classification: "hot" | "warm" | "cold" = "cold";
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
      timelineNotes: parsed.timelineNotes || "",
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
      timelineNotes: "Unable to score",
    };
  }
}
