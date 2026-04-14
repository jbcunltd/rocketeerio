import { invokeLLM } from "./_core/llm";
import { getActiveKnowledgeBase } from "./db";

/**
 * Generate an AI response for a lead conversation.
 * Uses the business's knowledge base for grounded answers.
 */
export async function generateAIResponse(
  userId: number,
  conversationHistory: Array<{ sender: string; content: string }>,
  leadName: string | null,
  pageName: string
): Promise<string> {
  // Retrieve knowledge base for context
  const kbEntries = await getActiveKnowledgeBase(userId);
  const knowledgeContext = kbEntries
    .map(entry => `[${entry.category.toUpperCase()}] ${entry.title}:\n${entry.content}`)
    .join("\n\n---\n\n");

  const historyMessages = conversationHistory.slice(-10).map(msg => ({
    role: (msg.sender === "lead" ? "user" : "assistant") as "user" | "assistant",
    content: msg.content,
  }));

  const systemPrompt = `You are a real human sales agent for "${pageName}". You chat with customers on Facebook Messenger.

YOUR PERSONALITY & STYLE:
- You sound like a real person, NOT an AI chatbot
- Warm, friendly, professional — like a trusted advisor
- Use casual Filipino-English (Taglish) tone when it feels natural (e.g., "po", "ma'am/sir")
- Use emojis sparingly and naturally (😊 is fine, don't overdo it)
- NEVER start messages with "Hi [name]!" every time — only greet by name on the FIRST message in a conversation
- Keep messages short and conversational, like real Messenger chat
- ALWAYS end your message with a question to keep the conversation moving
- Your #1 goal is to move every inquiry toward a SITE VISIT or DESIGN CONSULTATION

KNOWLEDGE BASE & SCRIPTS:
${knowledgeContext || "No knowledge base entries available yet. Respond helpfully and offer to connect them with a human representative."}

RULES:
- Follow the scripts and objection handling in the knowledge base closely — they are proven to work
- NEVER make up pricing, timelines, or information not in the knowledge base
- If you don't know something specific, say "Let me check with our team and get back to you on that"
- Do NOT repeat the customer's name in every message — only use it occasionally and naturally
- Do NOT say "I'm an AI" or "As an AI" — you are a sales agent
- Keep responses under 100 words — short punchy messages like real chat
- One message at a time, one question at a time
- Never sound defensive about pricing — reframe toward value and design
- The lead's name is: ${leadName || "there"}`;

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
