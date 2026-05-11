/*
 * Design philosophy reminder: Soft Swiss SaaS Minimalism.
 * The server page keeps the route calm and data-grounded: it fetches the
 * authenticated user's connected Page context, then hydrates the live inbox from
 * the middleware message tables that Josh writes to in production.
 */

import { redirect } from "next/navigation";
import { JoshLiveInbox } from "@/components/dashboard/josh-live-inbox";
import { getCurrentSession } from "@/lib/auth/cookies";
import { loadDashboardConnectedPages } from "@/lib/dashboard-data";
import { loadLiveInboxConversations } from "@/lib/josh-live-inbox-data";
import type { LiveConversation } from "@/lib/josh-live-inbox-types";

export const dynamic = "force-dynamic";

export default async function JoshForSalesPage(props: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { user } = await getCurrentSession();
  if (!user) redirect("/login");

  const searchParams = await props.searchParams;
  const selectedPageId =
    typeof searchParams.pageId === "string" ? searchParams.pageId : null;

  let pageId: string | null = null;
  let pageName = "your connected Page";
  let pagePictureUrl: string | null = null;
  let dbUnavailable = false;
  let conversations: LiveConversation[] = [];

  const pageLoad = await loadDashboardConnectedPages(user.id);
  dbUnavailable = pageLoad.unavailable;

  // Use selected page if available, otherwise fall back to first page
  let activePage = null;
  if (selectedPageId) {
    activePage = pageLoad.pages.find((p) => p.pageId === selectedPageId) ?? null;
  }
  if (!activePage) {
    activePage = pageLoad.pages[0] ?? null;
  }

  if (activePage) {
    pageId = activePage.pageId;
    pageName = activePage.name;
    pagePictureUrl = activePage.pictureUrl;
  }

  if (pageId) {
    const liveInbox = await loadLiveInboxConversations(pageId);
    conversations = liveInbox.conversations;
    dbUnavailable = dbUnavailable || liveInbox.unavailable;
  }

  return (
    <JoshLiveInbox
      pageId={pageId}
      pageName={pageName}
      pagePictureUrl={pagePictureUrl}
      conversations={conversations}
      dbUnavailable={dbUnavailable}
    />
  );
}
