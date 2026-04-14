import { getPendingFollowUps, updateFollowUp, createMessage, updateConversation } from "./db";

/**
 * Background worker that processes pending follow-up messages.
 * Runs on an interval and sends follow-ups whose scheduled time has passed.
 */
export async function processFollowUps(): Promise<void> {
  try {
    const pending = await getPendingFollowUps();
    if (pending.length === 0) return;

    console.log(`[FollowUp Worker] Processing ${pending.length} pending follow-ups`);

    for (const followUp of pending) {
      try {
        // Create the follow-up message in the conversation
        if (followUp.messageContent) {
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
        }

        // Mark follow-up as sent
        await updateFollowUp(followUp.id, {
          status: "sent",
          sentAt: Date.now(),
        });

        console.log(`[FollowUp Worker] Sent follow-up ${followUp.id} for conversation ${followUp.conversationId}`);
      } catch (err) {
        console.error(`[FollowUp Worker] Failed to process follow-up ${followUp.id}:`, err);
        await updateFollowUp(followUp.id, { status: "failed" });
      }
    }
  } catch (err) {
    console.error("[FollowUp Worker] Error:", err);
  }
}
