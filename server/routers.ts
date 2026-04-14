import { COOKIE_NAME } from "../shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { z } from "zod";
import * as db from "./db";
import { generateAIResponse, scoreLead } from "./ai-engine";
import { notifyOwner } from "./_core/notification";

export const appRouter = router({
  system: systemRouter,

  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),

  // ─── User Profile & Onboarding ─────────────────────────────────────
  user: router({
    updateProfile: protectedProcedure
      .input(z.object({
        name: z.string().optional(),
        email: z.string().email().optional(),
        phone: z.string().optional(),
        company: z.string().optional(),
        onboardingCompleted: z.boolean().optional(),
        plan: z.enum(["starter", "growth", "scale"]).optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        await db.updateUserProfile(ctx.user.id, input);
        return { success: true };
      }),
  }),

  // ─── Facebook Pages ────────────────────────────────────────────────
  pages: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      return db.getUserPages(ctx.user.id);
    }),

    create: protectedProcedure
      .input(z.object({
        pageId: z.string(),
        pageName: z.string(),
        category: z.string().optional(),
        avatarUrl: z.string().optional(),
        followerCount: z.number().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const id = await db.createPage({
          userId: ctx.user.id,
          ...input,
        });
        return { id };
      }),

    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        pageName: z.string().optional(),
        isActive: z.boolean().optional(),
        category: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const { id, ...data } = input;
        await db.updatePage(id, data);
        return { success: true };
      }),

    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await db.deletePage(input.id);
        return { success: true };
      }),
  }),

  // ─── Leads ─────────────────────────────────────────────────────────
  leads: router({
    list: protectedProcedure
      .input(z.object({ classification: z.string().optional() }).optional())
      .query(async ({ ctx, input }) => {
        return db.getLeadsByUser(ctx.user.id, input?.classification);
      }),

    get: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        return db.getLeadById(input.id);
      }),

    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        status: z.enum(["active", "converted", "archived", "lost"]).optional(),
        name: z.string().optional(),
        email: z.string().optional(),
        phone: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const { id, ...data } = input;
        const updateData: Record<string, unknown> = { ...data };
        if (data.status === "converted") {
          updateData.convertedAt = new Date();
        }
        await db.updateLead(id, updateData as any);
        return { success: true };
      }),
  }),

  // ─── Conversations ─────────────────────────────────────────────────
  conversations: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      return db.getConversationsByUser(ctx.user.id);
    }),

    get: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        return db.getConversationById(input.id);
      }),

    updateStatus: protectedProcedure
      .input(z.object({
        id: z.number(),
        status: z.enum(["open", "closed", "archived"]),
      }))
      .mutation(async ({ input }) => {
        await db.updateConversation(input.id, { status: input.status });
        return { success: true };
      }),

    toggleAi: protectedProcedure
      .input(z.object({
        id: z.number(),
        isAiActive: z.boolean(),
      }))
      .mutation(async ({ input }) => {
        await db.updateConversation(input.id, { isAiActive: input.isAiActive });
        return { success: true };
      }),
  }),

  // ─── Messages ──────────────────────────────────────────────────────
  messages: router({
    list: protectedProcedure
      .input(z.object({ conversationId: z.number() }))
      .query(async ({ input }) => {
        return db.getMessagesByConversation(input.conversationId);
      }),

    send: protectedProcedure
      .input(z.object({
        conversationId: z.number(),
        content: z.string(),
        sender: z.enum(["human", "lead"]).default("human"),
      }))
      .mutation(async ({ input }) => {
        const id = await db.createMessage({
          conversationId: input.conversationId,
          content: input.content,
          sender: input.sender,
          messageType: "text",
        });
        await db.updateConversation(input.conversationId, {
          lastMessagePreview: input.content.substring(0, 200),
          lastMessageAt: new Date(),
        });
        return { id };
      }),

    // AI-powered reply: generates response and scores lead
    aiReply: protectedProcedure
      .input(z.object({
        conversationId: z.number(),
        leadMessage: z.string(),
      }))
      .mutation(async ({ ctx, input }) => {
        // Save the lead's message
        await db.createMessage({
          conversationId: input.conversationId,
          content: input.leadMessage,
          sender: "lead",
          messageType: "text",
        });

        // Get conversation details
        const conv = await db.getConversationById(input.conversationId);
        if (!conv) throw new Error("Conversation not found");

        // Get message history
        const history = await db.getMessagesByConversation(input.conversationId);
        const historyForAI = history.map(m => ({ sender: m.sender, content: m.content }));

        // Generate AI response (pass page DB id for per-page AI personality)
        const aiResponse = await generateAIResponse(
          ctx.user.id,
          historyForAI,
          conv.lead?.name ?? null,
          conv.page?.pageName ?? "Our Business",
          conv.page?.id
        );

        // Save AI response
        await db.createMessage({
          conversationId: input.conversationId,
          content: aiResponse,
          sender: "ai",
          messageType: "text",
        });

        // Update conversation
        await db.updateConversation(input.conversationId, {
          lastMessagePreview: aiResponse.substring(0, 200),
          lastMessageAt: new Date(),
          messageCount: history.length + 2,
        });

        // Score the lead
        const allMessages = [...historyForAI, { sender: "ai", content: aiResponse }];
        const scoreResult = await scoreLead(allMessages);

        // Update lead score
        if (conv.lead) {
          await db.updateLead(conv.lead.id, {
            score: scoreResult.score,
            classification: scoreResult.classification,
            budgetScore: scoreResult.budgetScore,
            authorityScore: scoreResult.authorityScore,
            needScore: scoreResult.needScore,
            timelineScore: scoreResult.timelineScore,
            budgetNotes: scoreResult.budgetNotes,
            authorityNotes: scoreResult.authorityNotes,
            needNotes: scoreResult.needNotes,
            timelineNotes: scoreResult.timelineNotes,
          });

          // Notify owner if hot lead detected
          if (scoreResult.classification === "hot" && !conv.lead.notifiedAt) {
            await notifyOwner({
              title: `🔥 Hot Lead Detected: ${conv.lead.name || "Unknown"}`,
              content: `Score: ${scoreResult.score}/100\nPage: ${conv.page?.pageName}\nLast message: ${input.leadMessage}\n\nBudget: ${scoreResult.budgetNotes}\nNeed: ${scoreResult.needNotes}\nTimeline: ${scoreResult.timelineNotes}`,
            });
            await db.updateLead(conv.lead.id, { notifiedAt: new Date() });
          }
        }

        // Auto-schedule follow-ups on first contact (when this is the first AI reply)
        const leadMessages = history.filter(m => m.sender === "lead");
        if (leadMessages.length <= 1 && conv.lead) {
          const now = Date.now();
          const delays = [30, 120, 720]; // 30 min, 2 hrs, 12 hrs
          const followUpMessages = [
            "Hi! Just checking in — did you have any other questions about what we discussed?",
            "Hey! I wanted to follow up on our conversation. Is there anything else I can help you with?",
            "Hi there! I noticed we chatted earlier. I'd love to help you move forward — feel free to ask me anything!",
          ];
          for (let i = 0; i < delays.length; i++) {
            await db.createFollowUp({
              conversationId: input.conversationId,
              leadId: conv.lead.id,
              delayMinutes: delays[i],
              scheduledAt: now + delays[i] * 60 * 1000,
              messageContent: followUpMessages[i],
            });
          }
        }

        return { aiResponse, score: scoreResult };
      }),
  }),

  // ─── Knowledge Base ────────────────────────────────────────────────
  knowledgeBase: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      return db.getKnowledgeBase(ctx.user.id);
    }),

    create: protectedProcedure
      .input(z.object({
        title: z.string(),
        content: z.string(),
        category: z.enum(["product", "pricing", "faq", "policy", "general"]).default("general"),
      }))
      .mutation(async ({ ctx, input }) => {
        const id = await db.createKnowledgeEntry({
          userId: ctx.user.id,
          ...input,
        });
        return { id };
      }),

    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        title: z.string().optional(),
        content: z.string().optional(),
        category: z.enum(["product", "pricing", "faq", "policy", "general"]).optional(),
        isActive: z.boolean().optional(),
      }))
      .mutation(async ({ input }) => {
        const { id, ...data } = input;
        await db.updateKnowledgeEntry(id, data);
        return { success: true };
      }),

    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await db.deleteKnowledgeEntry(input.id);
        return { success: true };
      }),
  }),

  // ─── Follow-Up Sequences ──────────────────────────────────────────
  followUps: router({
    list: protectedProcedure
      .input(z.object({ conversationId: z.number() }))
      .query(async ({ input }) => {
        return db.getFollowUps(input.conversationId);
      }),

    schedule: protectedProcedure
      .input(z.object({
        conversationId: z.number(),
        leadId: z.number(),
      }))
      .mutation(async ({ input }) => {
        const now = Date.now();
        const delays = [30, 120, 720]; // 30 min, 2 hrs, 12 hrs
        const messages = [
          "Hi! Just checking in — did you have any other questions about what we discussed?",
          "Hey! I wanted to follow up on our conversation. Is there anything else I can help you with?",
          "Hi there! I noticed we chatted earlier. I'd love to help you move forward — feel free to ask me anything!",
        ];

        for (let i = 0; i < delays.length; i++) {
          await db.createFollowUp({
            conversationId: input.conversationId,
            leadId: input.leadId,
            delayMinutes: delays[i],
            scheduledAt: now + delays[i] * 60 * 1000,
            messageContent: messages[i],
          });
        }
        return { success: true, count: delays.length };
      }),

    cancel: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await db.updateFollowUp(input.id, { status: "cancelled" });
        return { success: true };
      }),
  }),

  // ─── Notification Preferences ──────────────────────────────────────
  notifications: router({
    get: protectedProcedure.query(async ({ ctx }) => {
      return db.getNotificationPrefs(ctx.user.id);
    }),

    update: protectedProcedure
      .input(z.object({
        smsEnabled: z.boolean().optional(),
        emailEnabled: z.boolean().optional(),
        hotLeadSms: z.boolean().optional(),
        hotLeadEmail: z.boolean().optional(),
        warmLeadEmail: z.boolean().optional(),
        dailyDigest: z.boolean().optional(),
        smsPhone: z.string().optional(),
        notificationEmail: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        await db.upsertNotificationPrefs(ctx.user.id, input);
        return { success: true };
      }),
  }),

  // ─── Page Mode ─────────────────────────────────────────────────────
  pageMode: router({
    get: protectedProcedure
      .input(z.object({ pageId: z.number() }))
      .query(async ({ input }) => {
        return { mode: await db.getPageMode(input.pageId) };
      }),

    update: protectedProcedure
      .input(z.object({
        pageId: z.number(),
        mode: z.enum(["paused", "testing", "live"]),
      }))
      .mutation(async ({ input }) => {
        await db.updatePageMode(input.pageId, input.mode);
        return { success: true };
      }),
  }),

  // ─── Page Testers ─────────────────────────────────────────────────
  testers: router({
    list: protectedProcedure
      .input(z.object({ pageId: z.number() }))
      .query(async ({ input }) => {
        return db.getPageTesters(input.pageId);
      }),

    add: protectedProcedure
      .input(z.object({
        pageId: z.number(),
        psid: z.string().min(1),
        label: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const id = await db.addPageTester({
          pageId: input.pageId,
          psid: input.psid,
          label: input.label,
        });
        return { id };
      }),

    remove: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await db.removePageTester(input.id);
        return { success: true };
      }),
  }),

  // ─── AI Personality Settings ───────────────────────────────────────
  aiSettings: router({
    get: protectedProcedure
      .input(z.object({ pageId: z.number() }))
      .query(async ({ input }) => {
        return db.getPageAiSettings(input.pageId);
      }),

    update: protectedProcedure
      .input(z.object({
        pageId: z.number(),
        agentName: z.string().optional(),
        tone: z.enum(["casual_taglish", "pure_tagalog", "professional_filipino", "casual_english", "formal_english", "professional_english"]).optional(),
        responseLength: z.enum(["short", "medium", "detailed"]).optional(),
        useEmojis: z.boolean().optional(),
        primaryGoal: z.enum(["site_visit", "booking", "quote_request", "general_support", "order_purchase", "reservation", "appointment", "collect_lead_info", "signup_registration", "custom_goal"]).optional(),
        customGoal: z.string().optional(),
        customInstructions: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const { pageId, ...data } = input;
        await db.upsertPageAiSettings(pageId, ctx.user.id, data);
        return { success: true };
      }),
  }),

  // ─── Dashboard ─────────────────────────────────────────────────────
  dashboard: router({
    stats: protectedProcedure.query(async ({ ctx }) => {
      return db.getDashboardStats(ctx.user.id);
    }),

    activity: protectedProcedure
      .input(z.object({ days: z.number().default(7) }).optional())
      .query(async ({ ctx, input }) => {
        return db.getLeadActivityByDay(ctx.user.id, input?.days ?? 7);
      }),
  }),

  // ─── Demo Data Seeding ─────────────────────────────────────────────
  seed: router({
    generate: protectedProcedure.mutation(async ({ ctx }) => {
      const userId = ctx.user.id;

      // Create a demo Facebook page
      const pageId = await db.createPage({
        userId,
        pageId: `demo_page_${Date.now()}`,
        pageName: "My Business Page",
        category: "Local Business",
        followerCount: 2450,
        isActive: true,
      });
      if (!pageId) return { success: false };

      // Create demo knowledge base
      const kbEntries = [
        { title: "Product Overview", content: "We offer premium home renovation services including kitchen remodeling, bathroom upgrades, and full home renovations. Our prices start at $5,000 for basic packages and go up to $50,000 for luxury full-home renovations.", category: "product" as const },
        { title: "Pricing Packages", content: "Basic Package: $5,000-$10,000 (single room). Standard Package: $15,000-$25,000 (kitchen or bathroom). Premium Package: $30,000-$50,000 (full home). All packages include free consultation and 3D design preview.", category: "pricing" as const },
        { title: "FAQ - Timeline", content: "Basic renovations take 2-4 weeks. Standard projects take 4-8 weeks. Full home renovations take 8-16 weeks. We provide a detailed timeline during the free consultation.", category: "faq" as const },
        { title: "FAQ - Warranty", content: "All our work comes with a 5-year warranty on labor and materials. We use only certified contractors and premium materials from trusted suppliers.", category: "faq" as const },
        { title: "Booking Policy", content: "Free consultations available Monday-Saturday. Book online or call us at (555) 123-4567. We require a 20% deposit to begin work, with the balance due upon completion.", category: "policy" as const },
      ];
      for (const entry of kbEntries) {
        await db.createKnowledgeEntry({ userId, ...entry });
      }

      // Create demo leads and conversations
      const demoLeads = [
        { name: "Sarah Mitchell", email: "sarah.m@email.com", phone: "+1-555-0101", score: 92, classification: "hot" as const, budgetScore: 23, authorityScore: 25, needScore: 22, timelineScore: 22, budgetNotes: "Mentioned budget of $30K-40K for kitchen remodel", authorityNotes: "Homeowner and decision-maker", needNotes: "Kitchen is outdated, needs modern upgrade", timelineNotes: "Wants to start within 2 weeks" },
        { name: "James Rodriguez", email: "j.rodriguez@company.com", phone: "+1-555-0102", score: 74, classification: "warm" as const, budgetScore: 18, authorityScore: 20, needScore: 20, timelineScore: 16, budgetNotes: "Exploring pricing options", authorityNotes: "Property manager for rental units", needNotes: "Multiple bathrooms need updating", timelineNotes: "Planning for next quarter" },
        { name: "Emily Chen", email: "emily.c@gmail.com", phone: "+1-555-0103", score: 85, classification: "hot" as const, budgetScore: 22, authorityScore: 23, needScore: 20, timelineScore: 20, budgetNotes: "Has $25K budget approved", authorityNotes: "Confirmed homeowner", needNotes: "Bathroom renovation for accessibility", timelineNotes: "Needs it done within a month" },
        { name: "Michael Brown", email: "m.brown@outlook.com", phone: "", score: 45, classification: "warm" as const, budgetScore: 10, authorityScore: 15, needScore: 12, timelineScore: 8, budgetNotes: "No specific budget mentioned", authorityNotes: "Renting, needs landlord approval", needNotes: "General interest in home improvement", timelineNotes: "No specific timeline" },
        { name: "Lisa Park", email: "lisa.park@email.com", phone: "+1-555-0105", score: 28, classification: "cold" as const, budgetScore: 5, authorityScore: 8, needScore: 10, timelineScore: 5, budgetNotes: "Just browsing", authorityNotes: "Unknown role", needNotes: "Casual inquiry", timelineNotes: "No urgency" },
        { name: "David Kim", email: "d.kim@business.com", phone: "+1-555-0106", score: 88, classification: "hot" as const, budgetScore: 24, authorityScore: 22, needScore: 22, timelineScore: 20, budgetNotes: "Budget of $45K for full renovation", authorityNotes: "Business owner renovating office", needNotes: "Complete office renovation needed", timelineNotes: "Must complete before lease renewal in 6 weeks" },
        { name: "Anna Williams", email: "anna.w@gmail.com", phone: "+1-555-0107", score: 62, classification: "warm" as const, budgetScore: 15, authorityScore: 17, needScore: 18, timelineScore: 12, budgetNotes: "Comparing quotes from multiple contractors", authorityNotes: "Co-owner with spouse", needNotes: "Master bedroom renovation", timelineNotes: "Sometime this year" },
        { name: "Robert Taylor", email: "r.taylor@email.com", phone: "", score: 15, classification: "cold" as const, budgetScore: 3, authorityScore: 5, needScore: 4, timelineScore: 3, budgetNotes: "No budget discussion", authorityNotes: "Unknown", needNotes: "Very vague inquiry", timelineNotes: "No timeline mentioned" },
      ];

      const demoConversations: Array<{ leadIdx: number; messages: Array<{ sender: "lead" | "ai"; content: string }> }> = [
        {
          leadIdx: 0,
          messages: [
            { sender: "lead", content: "Hi! I saw your ad about kitchen renovations. We have a budget of about $35,000 and want to completely redo our kitchen. How soon can you start?" },
            { sender: "ai", content: "Hi Sarah! Thanks for reaching out! A $35K budget gives you great options for a full kitchen transformation. We can typically start within 2 weeks of signing. Would you like to schedule a free consultation this week to discuss your vision?" },
            { sender: "lead", content: "Yes! I'm the homeowner and I'm ready to move forward. Can you do a consultation on Thursday?" },
            { sender: "ai", content: "Perfect! I've noted Thursday for your consultation. Our designer will bring 3D renderings of popular kitchen layouts in your budget range. Is morning or afternoon better for you?" },
            { sender: "lead", content: "Morning works great. Around 10am?" },
            { sender: "ai", content: "10am Thursday is confirmed! We'll send you a confirmation email with our portfolio. Looking forward to helping you create your dream kitchen, Sarah!" },
          ],
        },
        {
          leadIdx: 1,
          messages: [
            { sender: "lead", content: "Hello, I manage several rental properties and need to update the bathrooms in 3 units. What are your rates?" },
            { sender: "ai", content: "Hi James! Great to hear from you. For multi-unit bathroom renovations, we offer volume discounts. Our standard bathroom package runs $15K-$25K per unit. With 3 units, we can offer a 15% discount. Would you like to discuss the specific needs for each unit?" },
            { sender: "lead", content: "That sounds reasonable. I need to check with the property owner first, but we're looking at doing this next quarter." },
            { sender: "ai", content: "Absolutely, take your time! I can prepare a detailed proposal with the multi-unit discount for you to present. Shall I email that to you?" },
          ],
        },
        {
          leadIdx: 2,
          messages: [
            { sender: "lead", content: "I need a bathroom renovated for accessibility - grab bars, walk-in shower, etc. I have about $25K. This is urgent as my mother is moving in next month." },
            { sender: "ai", content: "Hi Emily! Accessibility renovations are one of our specialties. With $25K, we can do a comprehensive accessible bathroom with walk-in shower, grab bars, non-slip flooring, and ADA-compliant fixtures. Given the timeline, we can prioritize your project. Can we schedule a consultation this week?" },
            { sender: "lead", content: "Yes please! The sooner the better. I own the home so I can make decisions right away." },
          ],
        },
        {
          leadIdx: 3,
          messages: [
            { sender: "lead", content: "Just curious about home improvement options. What do you guys do?" },
            { sender: "ai", content: "Hi Michael! We specialize in home renovations — kitchens, bathrooms, and full-home makeovers. Our packages start at $5,000. Is there a specific area of your home you're thinking about improving?" },
            { sender: "lead", content: "I'm renting right now so I'd need to check with my landlord. Just exploring options." },
          ],
        },
        {
          leadIdx: 4,
          messages: [
            { sender: "lead", content: "How much does a renovation cost?" },
            { sender: "ai", content: "Hi Lisa! Our renovation packages range from $5,000 for single-room updates to $50,000 for full-home transformations. What type of renovation are you considering?" },
          ],
        },
        {
          leadIdx: 5,
          messages: [
            { sender: "lead", content: "I need my entire office renovated. Budget is $45K. We need it done before our lease renewal in 6 weeks. Is that possible?" },
            { sender: "ai", content: "Hi David! A $45K budget for a full office renovation is very doable. The 6-week timeline is tight but achievable with our express service. We'd need to start planning immediately. Are you the business owner making this decision?" },
            { sender: "lead", content: "Yes, I'm the owner. Let's get this moving ASAP. Can you come see the space tomorrow?" },
            { sender: "ai", content: "Absolutely! I'll have our commercial renovation specialist visit tomorrow. What time works best, and what's the office address? We'll bring preliminary layout options based on your budget." },
            { sender: "lead", content: "123 Business Ave, Suite 200. Anytime after 9am works. Looking forward to it!" },
          ],
        },
        {
          leadIdx: 6,
          messages: [
            { sender: "lead", content: "My husband and I are thinking about redoing our master bedroom. We're getting quotes from a few contractors." },
            { sender: "ai", content: "Hi Anna! A master bedroom renovation is a great investment. We'd love to be one of your options! Our bedroom packages typically run $8K-$20K depending on scope. What changes are you envisioning?" },
            { sender: "lead", content: "New flooring, built-in closets, maybe an ensuite bathroom addition. Probably sometime this year." },
            { sender: "ai", content: "Those are wonderful upgrades! An ensuite addition would be the biggest component. I can prepare a detailed estimate for each element so you can compare. Would you like to schedule a free in-home consultation?" },
          ],
        },
        {
          leadIdx: 7,
          messages: [
            { sender: "lead", content: "hi" },
            { sender: "ai", content: "Hi there! Welcome to our page. How can I help you today? Are you interested in home renovation services?" },
          ],
        },
      ];

      for (let i = 0; i < demoLeads.length; i++) {
        const lead = demoLeads[i];
        const leadId = await db.createLead({
          userId,
          pageId: pageId,
          name: lead.name,
          email: lead.email,
          phone: lead.phone,
          score: lead.score,
          classification: lead.classification,
          budgetScore: lead.budgetScore,
          authorityScore: lead.authorityScore,
          needScore: lead.needScore,
          timelineScore: lead.timelineScore,
          budgetNotes: lead.budgetNotes,
          authorityNotes: lead.authorityNotes,
          needNotes: lead.needNotes,
          timelineNotes: lead.timelineNotes,
          source: "messenger",
          status: i === 0 ? "converted" : "active",
        });
        if (!leadId) continue;

        const convData = demoConversations.find(c => c.leadIdx === i);
        if (!convData) continue;

        const convId = await db.createConversation({
          userId,
          pageId: pageId,
          leadId,
          lastMessagePreview: convData.messages[convData.messages.length - 1].content.substring(0, 200),
          messageCount: convData.messages.length,
          status: "open",
        });
        if (!convId) continue;

        for (const msg of convData.messages) {
          await db.createMessage({
            conversationId: convId,
            sender: msg.sender,
            content: msg.content,
            messageType: "text",
          });
        }
      }

      // Create notification preferences
      await db.upsertNotificationPrefs(userId, {
        smsEnabled: true,
        emailEnabled: true,
        hotLeadSms: true,
        hotLeadEmail: true,
        warmLeadEmail: false,
        dailyDigest: true,
        notificationEmail: ctx.user.email || "",
      });

      // Mark onboarding as complete
      await db.updateUserProfile(userId, { onboardingCompleted: true });

      return { success: true };
    }),
  }),
});

export type AppRouter = typeof appRouter;
