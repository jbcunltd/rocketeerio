import { NextRequest, NextResponse } from "next/server";
import { getCurrentSession } from "@/lib/auth/cookies";
import { loadDashboardConnectedPages } from "@/lib/dashboard-data";
import { loadLiveInboxConversations } from "@/lib/josh-live-inbox-data";
import type { LiveConversation } from "@/lib/josh-live-inbox-types";

export const dynamic = "force-dynamic";

type JoshLiveInboxResponse = {
  pageId: string | null;
  pageName: string;
  pagePictureUrl: string | null;
  conversations: LiveConversation[];
  dbUnavailable: boolean;
};

export async function GET(request: NextRequest) {
  const { user } = await getCurrentSession();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const selectedPageId = request.nextUrl.searchParams.get("pageId");

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

  const payload: JoshLiveInboxResponse = {
    pageId,
    pageName,
    pagePictureUrl,
    conversations,
    dbUnavailable,
  };

  return NextResponse.json(payload, {
    headers: {
      "Cache-Control": "no-store, max-age=0",
    },
  });
}
