import { invokeLLM } from "./_core/llm";
import { getActiveKnowledgeBase, getPageAiSettingsByDbPageId } from "./db";
import type { PageAiSetting } from "../drizzle/schema";

/** Map tone enum values to human-readable prompt instructions */
function getToneInstruction(tone: string): string {
  switch (tone) {
    case "casual_taglish":
      return 'Use casual Filipino-English (Taglish) tone when it feels natural (e.g., "po", "ma\'am/sir", mixing Tagalog and English naturally)';
    case "pure_tagalog":
      return "Sumagot sa purong Tagalog. Gamitin ang natural na Filipino na pananalita, iwasan ang English words maliban kung walang katumbas sa Tagalog.";
    case "professional_filipino":
      return "Use professional Filipino (Tagalog). Maintain a respectful and business-appropriate tone in Filipino language. Use po and opo.";
    case "casual_english":
      return "Use casual, friendly English. Keep it conversational and approachable, like chatting with a friend.";
    case "formal_english":
      return "Use formal, polished English. Maintain a professional and courteous tone throughout. Avoid slang or casual abbreviations.";
    case "professional_english":
      return "Use professional business English. Be articulate, confident, and polished. Suitable for corporate or high-end clientele.";
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
function getPrimaryGoalInstruction(goal: string, customGoal?: string | null): string {
  switch (goal) {
    case "site_visit":
      return "Your #1 goal is to move every inquiry toward a SITE VISIT or IN-PERSON CONSULTATION. Guide the conversation toward scheduling a visit.";
    case "booking":
      return "Your #1 goal is to move every inquiry toward a BOOKING or APPOINTMENT. Guide the conversation toward confirming a booking.";
    case "quote_request":
      return "Your #1 goal is to move every inquiry toward requesting a QUOTE or ESTIMATE. Gather their requirements and offer to prepare a personalized quote.";
    case "general_support":
      return "Your #1 goal is to provide excellent CUSTOMER SUPPORT. Answer questions thoroughly, resolve concerns, and ensure customer satisfaction.";
    case "order_purchase":
      return "Your #1 goal is to guide the customer toward placing an ORDER or completing a PURCHASE. Help them understand the product/service, address concerns, and move them to checkout or payment.";
    case "reservation":
      return "Your #1 goal is to help the customer make a RESERVATION. Ask for their preferred date, time, party size or room type, and confirm all reservation details before finalizing.";
    case "appointment":
      return "Your #1 goal is to schedule an APPOINTMENT. Ask for their preferred date and time, the service they need, and confirm all appointment details.";
    case "collect_lead_info":
      return "Your #1 goal is to COLLECT LEAD INFORMATION. Gather their name, contact information (email/phone), and understand their needs. Let them know a human team member will follow up with them soon.";
    case "signup_registration":
      return "Your #1 goal is to guide the customer toward SIGNING UP or REGISTERING. Explain the benefits, address any concerns, and help them complete the registration process.";
    case "custom_goal":
      return customGoal ? `Your #1 goal is: ${customGoal}` : "Your #1 goal is to move every inquiry toward a SITE VISIT or DESIGN CONSULTATION.";
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
  const customGoal = settings?.customGoal || null;
  const agentName = settings?.agentName || null;
  const customInstructions = settings?.customInstructions || null;

  const historyMessages = conversationHistory.slice(-10).map(msg => ({
    role: (msg.sender === "lead" ? "user" : "assistant") as "user" | "assistant",
    content: msg.content,
  }));

  // Build the agent identity line
  const identityLine = agentName
    ? `You are "${agentName}", part of the team at "${pageName}". You chat with customers on Facebook Messenger.`
    : `You are part of the team at "${pageName}". You chat with customers on Facebook Messenger.`;

  // Count how many lead messages so far — helps the model know which step of the flow we're in
  const leadTurnCount = conversationHistory.filter(m => m.sender === "lead").length;

  const systemPrompt = `${identityLine}

ROLE
You are a sales assistant whose ONLY job is to identify serious buyers and move them to a human teammate as quickly as possible. You are NOT a general chatbot. You are NOT here to answer everything.

PRIORITY
- Qualify, don't explain.
- Every reply must move the conversation forward.
- Speed of qualification > conversation length.

CONVERSATION STYLE
- Short, natural, human. One or two sentences max.
- Avoid long explanations. Avoid sounding robotic.
- ${getToneInstruction(tone)}
- ${getEmojiInstruction(useEmojis)}
- ${getResponseLengthInstruction(responseLength)}
- Never greet with "Hi [name]!" more than once per conversation.
- Never use the customer's name in every message.

FLOW (current lead turn: ${leadTurnCount})
1. OPENING: Do NOT ask "How can I help?". Open with a guided question that surfaces intent (e.g., "Are you looking for X for yourself or a project you're working on?").
2. QUALIFICATION: Ask a MAXIMUM of 3–4 questions total across the whole conversation, focused on:
   - what they need
   - when they need it
   - location (only if relevant to the business)
   Do NOT over-question. Do NOT stack questions.
3. MOMENTUM: Every message should either move toward intent or toward the next concrete step. Avoid idle chitchat.
4. ${getPrimaryGoalInstruction(primaryGoal, customGoal)}

INTENT SIGNALS (treat the lead as HIGH INTENT if any are true)
- They ask about price, cost, or quote
- They share specifics (size, quantity, address, dates, model, etc.)
- They express urgency ("this week", "asap", "today", "need it now")
- They ask how to proceed, book, sign up, or pay

HANDOFF
If high intent is detected, do exactly this:
  1. Acknowledge briefly and positively.
  2. Confirm what they're after in one short line.
  3. Reply with this EXACT line (you may slightly adjust wording but keep meaning):
     "This looks like something we can help you with directly. Let me have our specialist message you right away."
  4. Stop. Do NOT keep chatting after that. Do NOT ask another question.

STOP CONDITIONS
Do not continue the conversation after any of:
- Clear buying intent
- Quote / pricing request
- Stated readiness to proceed
- An explicit ask for a human

POSITIONING
- You are part of the ${pageName} team. Never call yourself a chatbot, AI, bot, or assistant tool.
- You are not here to be helpful for the sake of helpfulness. You are here to qualify.

KNOWLEDGE BASE (use ONLY for facts; never fabricate)
${knowledgeContext || "No knowledge base entries available yet. If asked for specifics, say you'll get the right teammate to confirm."}

RULES
- NEVER make up pricing, timelines, or details not in the knowledge base.
- If you don't know a specific fact, say "Let me get the right person on this for you" and trigger the handoff line.
- Do NOT say "I'm an AI" or "As an AI".
- The lead's name is: ${leadName || "there"}.${customInstructions ? `\n\nADDITIONAL INSTRUCTIONS:\n${customInstructions}` : ""}`;

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

/**
 * Detect if a conversation should be handed off to a human agent.
 * Checks for: angry/frustrated customers, complex questions, explicit requests for human.
 */
export async function detectHandoff(
  conversationHistory: Array<{ sender: string; content: string }>,
  handoffKeywords: string[] = ["speak to a human", "talk to someone", "real person", "human agent", "manager"]
): Promise<{
  shouldHandoff: boolean;
  reason: string;
  reasonDetail: string;
}> {
  // 1. Check for keyword-based triggers first (fast, no LLM call)
  const lastLeadMessages = conversationHistory
    .filter(m => m.sender === "lead")
    .slice(-3);
  
  for (const msg of lastLeadMessages) {
    const lower = msg.content.toLowerCase();
    for (const keyword of handoffKeywords) {
      if (lower.includes(keyword.toLowerCase())) {
        return {
          shouldHandoff: true,
          reason: "explicit_request",
          reasonDetail: `Lead used keyword: "${keyword}" in message: "${msg.content.substring(0, 100)}"`,
        };
      }
    }
  }

  // 2. Use LLM to detect sentiment and complexity issues
  if (conversationHistory.length < 3) {
    return { shouldHandoff: false, reason: "", reasonDetail: "" };
  }

  const recentMessages = conversationHistory.slice(-6);
  const transcript = recentMessages
    .map(msg => `${msg.sender === "lead" ? "CUSTOMER" : "AGENT"}: ${msg.content}`)
    .join("\n");

  try {
    const result = await invokeLLM({
      messages: [
        {
          role: "system",
          content: `You are a conversation analyzer. Determine if this customer conversation should be handed off to a human agent.

Handoff reasons:
- "angry_customer": Customer is angry, frustrated, threatening, or using aggressive language
- "complex_question": Customer has a question the AI clearly cannot answer (legal, medical, highly specific technical)
- "explicit_request": Customer explicitly asks for a human, manager, or supervisor
- "ai_uncertain": The AI agent seems to be going in circles, repeating itself, or giving unhelpful responses
- "none": No handoff needed, conversation is going well

Return ONLY valid JSON.`,
        },
        {
          role: "user",
          content: `Analyze this conversation:\n\n${transcript}`,
        },
      ],
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "handoff_detection",
          strict: true,
          schema: {
            type: "object",
            properties: {
              shouldHandoff: { type: "boolean", description: "Whether handoff is needed" },
              reason: { type: "string", description: "One of: angry_customer, complex_question, explicit_request, ai_uncertain, none" },
              reasonDetail: { type: "string", description: "Brief explanation of why handoff is needed" },
            },
            required: ["shouldHandoff", "reason", "reasonDetail"],
            additionalProperties: false,
          },
        },
      },
    });

    const content = result.choices[0]?.message?.content;
    const text = typeof content === "string" ? content : "";
    const parsed = JSON.parse(text);

    return {
      shouldHandoff: parsed.shouldHandoff === true,
      reason: parsed.reason || "none",
      reasonDetail: parsed.reasonDetail || "",
    };
  } catch (err) {
    console.error("[Handoff Detection] LLM analysis failed:", err);
    return { shouldHandoff: false, reason: "", reasonDetail: "" };
  }
}


// ─── High-Intent Detection (Rocketeerio v1) ──────────────────────────
//
// Lightweight, deterministic, no-LLM detector that fires the moment a
// lead shows clear buying intent. Used by the Messenger/Instagram
// webhooks BEFORE the full BANT score runs, so handoff happens fast.

const HIGH_INTENT_PATTERNS: Array<{ regex: RegExp; signal: string }> = [
  // Price / quote intent
  { regex: /\b(price|pricing|cost|how much|quote|quotation|estimate|rate|fees?)\b/i, signal: "asked_price" },
  { regex: /\b(magkano|presyo|presyong|halaga)\b/i, signal: "asked_price" },
  // Urgency
  { regex: /\b(asap|today|tonight|this week|tomorrow|right now|urgent|kailangan na|ngayon na)\b/i, signal: "urgency" },
  // Ready to proceed
  { regex: /\b(book|booking|reserve|schedule|sign ?up|order|buy|purchase|pay|deposit|invoice|checkout|contract)\b/i, signal: "ready_to_proceed" },
  { regex: /\b(how (do|can) i (book|order|sign up|pay|proceed|get started))\b/i, signal: "ready_to_proceed" },
  // Asks for a human
  { regex: /\b(speak to (a )?human|talk to (someone|a person)|real person|sales(person| rep)|manager|owner|specialist)\b/i, signal: "asked_human" },
];

/**
 * Returns a high-intent signal if the latest lead message contains a
 * clear buying-intent trigger. Cheap, deterministic, runs every turn.
 */
export function detectHighIntentFast(
  latestLeadMessage: string,
): { highIntent: boolean; signal: string; matched: string | null } {
  const text = (latestLeadMessage || "").trim();
  if (!text) return { highIntent: false, signal: "", matched: null };

  for (const { regex, signal } of HIGH_INTENT_PATTERNS) {
    const match = text.match(regex);
    if (match) {
      return { highIntent: true, signal, matched: match[0] };
    }
  }
  return { highIntent: false, signal: "", matched: null };
}
