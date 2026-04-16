import { getPendingFollowUps, updateFollowUp, createMessage, updateConversation, getConversation, getLeadByConversationId } from "./db";
import { sendMessengerMessage, sendEmail } from "./messaging";

const FACEBOOK_24H_WINDOW = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

/**
 * Check if the last user message was within the 24-hour Facebook window
 */
async function isWithin24HourWindow(conversationId: string): Promise<boolean> {
  try {
    const conversation = await getConversation(conversationId);
    if (!conversation || !conversation.lastUserMessageAt) {
      return false;
    }
    
    const lastUserMessageTime = new Date(conversation.lastUserMessageAt).getTime();
    const now = Date.now();
    const timeSinceLastUserMessage = now - lastUserMessageTime;
    
    return timeSinceLastUserMessage < FACEBOOK_24H_WINDOW;
  } catch (err) {
    console.error(`[FollowUp Worker] Error checking 24h window for conversation ${conversationId}:`, err);
    return false;
  }
}

/**
 * Send follow-up message via appropriate channel based on 24-hour rule
 */
async function sendFollowUpMessage(
  conversationId: string,
  messageContent: string,
  platform: string,
  delayMinutes: number
): Promise<boolean> {
  try {
    const within24h = await isWithin24HourWindow(conversationId);
    const shouldUseMessenger = within24h && (platform === "messenger" || platform === "instagram");

    if (shouldUseMessenger) {
      // Send via Messenger/Instagram
      const result = await sendMessengerMessage(conversationId, messageContent, platform);
      if (!result.success) {
        throw new Error(`Failed to send Messenger message: ${result.error}`);
      }
      console.log(`[FollowUp Worker] Sent Messenger follow-up for conversation ${conversationId}`);
      return true;
    } else {
      // Send via Email (fallback for after 24h window)
      const lead = await getLeadByConversationId(conversationId);
      if (!lead || !lead.email) {
        console.warn(`[FollowUp Worker] No email found for lead in conversation ${conversationId}`);
        return false;
      }

      const result = await sendEmail(lead.email, "Follow-up from Rocketeerio", messageContent);
      if (!result.success) {
        throw new Error(`Failed to send email: ${result.error}`);
      }
      console.log(`[FollowUp Worker] Sent Email follow-up for conversation ${conversationId}`);
      return true;
    }
  } catch (err) {
    console.error(`[FollowUp Worker] Error sending follow-up message:`, err);
    return false;
  }
}

/**
 * Background worker that processes pending follow-up messages.
 * Runs on an interval and sends follow-ups whose scheduled time has passed.
 * Respects Facebook's 24-hour messaging window rule.
 */
export async function processFollowUps(): Promise<void> {
  try {
    const pending = await getPendingFollowUps();
    if (pending.length === 0) {
      console.log("[FollowUp Worker] No pending follow-ups to process");
      return;
    }

    console.log(`[FollowUp Worker] Processing ${pending.length} pending follow-ups`);

    for (const followUp of pending) {
      try {
        if (!followUp.messageContent) {
          console.warn(`[FollowUp Worker] Follow-up ${followUp.id} has no message content, skipping`);
          await updateFollowUp(followUp.id, { status: "failed" });
          continue;
        }

        // Send the follow-up message via appropriate channel
        const sent = await sendFollowUpMessage(
          followUp.conversationId,
          followUp.messageContent,
          followUp.platform || "messenger",
          followUp.delayMinutes
        );

        if (sent) {
          // Create message record in conversation
          await createMessage({
            conversationId: followUp.conversationId,
            sender: "ai",
            content: followUp.messageContent,
            messageType: "text",
          });

          // Update conversation with latest message
          await updateConversation(followUp.conversationId, {
            lastMessagePreview: followUp.messageContent.substring(0, 200),
            lastMessageAt: new Date(),
          });

          // Mark follow-up as sent
          await updateFollowUp(followUp.id, {
            status: "sent",
            sentAt: Date.now(),
          });

          console.log(`[FollowUp Worker] Successfully processed follow-up ${followUp.id}`);
        } else {
          // Mark as failed if message sending failed
          await updateFollowUp(followUp.id, { status: "failed" });
          console.error(`[FollowUp Worker] Failed to send follow-up ${followUp.id}`);
        }
      } catch (err) {
        console.error(`[FollowUp Worker] Error processing follow-up ${followUp.id}:`, err);
        await updateFollowUp(followUp.id, { status: "failed" });
      }
    }

    console.log("[FollowUp Worker] Completed processing follow-ups");
  } catch (err) {
    console.error("[FollowUp Worker] Fatal error:", err);
  }
}

/**
 * Health check endpoint for the worker
 */
export async function healthCheck(): Promise<{ status: string; timestamp: string }> {
  return {
    status: "ok",
    timestamp: new Date().toISOString(),
  };
}
