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
  try {\n    const within24h = await isWithin24HourWindow(conversationId);\n    const shouldUseMessenger = within24h && (platform === \"messenger\" || platform === \"instagram\");\n\n    if (shouldUseMessenger) {\n      // Send via Messenger/Instagram\n      const result = await sendMessengerMessage(conversationId, messageContent, platform);\n      if (!result.success) {\n        throw new Error(`Failed to send Messenger message: ${result.error}`);\n      }\n      console.log(`[FollowUp Worker] Sent Messenger follow-up for conversation ${conversationId}`);\n      return true;\n    } else {\n      // Send via Email (fallback for after 24h window)\n      const lead = await getLeadByConversationId(conversationId);\n      if (!lead || !lead.email) {\n        console.warn(`[FollowUp Worker] No email found for lead in conversation ${conversationId}`);\n        return false;\n      }\n\n      const result = await sendEmail(lead.email, \"Follow-up from Rocketeerio\", messageContent);\n      if (!result.success) {\n        throw new Error(`Failed to send email: ${result.error}`);\n      }\n      console.log(`[FollowUp Worker] Sent Email follow-up for conversation ${conversationId}`);\n      return true;\n    }\n  } catch (err) {\n    console.error(`[FollowUp Worker] Error sending follow-up message:`, err);\n    return false;\n  }\n}\n\n/**\n * Background worker that processes pending follow-up messages.\n * Runs on an interval and sends follow-ups whose scheduled time has passed.\n * Respects Facebook's 24-hour messaging window rule.\n */\nexport async function processFollowUps(): Promise<void> {\n  try {\n    const pending = await getPendingFollowUps();\n    if (pending.length === 0) {\n      console.log(\"[FollowUp Worker] No pending follow-ups to process\");\n      return;\n    }\n\n    console.log(`[FollowUp Worker] Processing ${pending.length} pending follow-ups`);\n\n    for (const followUp of pending) {\n      try {\n        if (!followUp.messageContent) {\n          console.warn(`[FollowUp Worker] Follow-up ${followUp.id} has no message content, skipping`);\n          await updateFollowUp(followUp.id, { status: \"failed\" });\n          continue;\n        }\n\n        // Send the follow-up message via appropriate channel\n        const sent = await sendFollowUpMessage(\n          followUp.conversationId,\n          followUp.messageContent,\n          followUp.platform || \"messenger\",\n          followUp.delayMinutes\n        );\n\n        if (sent) {\n          // Create message record in conversation\n          await createMessage({\n            conversationId: followUp.conversationId,\n            sender: \"ai\",\n            content: followUp.messageContent,\n            messageType: \"text\",\n          });\n\n          // Update conversation with latest message\n          await updateConversation(followUp.conversationId, {\n            lastMessagePreview: followUp.messageContent.substring(0, 200),\n            lastMessageAt: new Date(),\n          });\n\n          // Mark follow-up as sent\n          await updateFollowUp(followUp.id, {\n            status: \"sent\",\n            sentAt: Date.now(),\n          });\n\n          console.log(`[FollowUp Worker] Successfully processed follow-up ${followUp.id}`);\n        } else {\n          // Mark as failed if message sending failed\n          await updateFollowUp(followUp.id, { status: \"failed\" });\n          console.error(`[FollowUp Worker] Failed to send follow-up ${followUp.id}`);\n        }\n      } catch (err) {\n        console.error(`[FollowUp Worker] Error processing follow-up ${followUp.id}:`, err);\n        await updateFollowUp(followUp.id, { status: \"failed\" });\n      }\n    }\n\n    console.log(\"[FollowUp Worker] Completed processing follow-ups\");\n  } catch (err) {\n    console.error(\"[FollowUp Worker] Fatal error:\", err);\n  }\n}\n\n/**\n * Health check endpoint for the worker\n */\nexport async function healthCheck(): Promise<{ status: string; timestamp: string }> {\n  return {\n    status: \"ok\",\n    timestamp: new Date().toISOString(),\n  };\n}\n
