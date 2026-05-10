/*
 * Design philosophy reminder: Soft Swiss SaaS Minimalism.
 * The server page keeps the route calm and data-grounded: it fetches the
 * authenticated user's connected Page context, then hydrates the live inbox from
 * the middleware message tables that Josh writes to in production.
 */

import { desc, eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { JoshLiveInbox } from "@/components/dashboard/josh-live-inbox";
import { getCurrentSession } from "@/lib/auth/cookies";
import { db } from "@/lib/db";
import { facebookPageTable } from "@/lib/db/schema";
import { loadLiveInboxConversations } from "@/lib/josh-live-inbox-data";
import type { LiveConversation } from "@/lib/josh-live-inbox-types";

export const dynamic = "force-dynamic";

export default async function JoshForSalesPage() {
  const { user } = await getCurrentSession();
  if (!user) redirect("/login");

  let pageId: string | null = null;
  let pageName = "your connected Page";
  let pagePictureUrl: string | null = null;
  let dbUnavailable = false;
  let conversations: LiveConversation[] = [];

  try {
    const activePage = (
      await db
        .select({
          pageId: facebookPageTable.pageId,
          name: facebookPageTable.name,
          pictureUrl: facebookPageTable.pictureUrl,
          connectedAt: facebookPageTable.connectedAt,
        })
        .from(facebookPageTable)
        .where(eq(facebookPageTable.userId, user.id))
        .orderBy(desc(facebookPageTable.connectedAt))
        .limit(1)
    )[0];

    if (activePage) {
      pageId = activePage.pageId;
      pageName = activePage.name;
      pagePictureUrl = activePage.pictureUrl;
    }
  } catch (err) {
    console.error("[josh inbox] connected page load failed", err);
    dbUnavailable = true;
  }

  if (pageId) {
    const liveInbox = await loadLiveInboxConversations(pageId);
    conversations = liveInbox.conversations;
    dbUnavailable = dbUnavailable || liveInbox.unavailable;
  }

  return (
    <JoshLiveInbox
      pageName={pageName}
      pagePictureUrl={pagePictureUrl}
      conversations={conversations}
      dbUnavailable={dbUnavailable}
    />
  );
}
