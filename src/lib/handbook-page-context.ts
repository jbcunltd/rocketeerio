import { getCurrentSession } from "@/lib/auth/cookies";
import { loadDashboardConnectedPages } from "@/lib/dashboard-data";

export type HandbookPageContext = {
  pageId: string | null;
  pageName: string | null;
  pagePictureUrl: string | null;
  dbUnavailable: boolean;
};

export async function getFirstConnectedFacebookPage(): Promise<HandbookPageContext> {
  const { user } = await getCurrentSession();
  if (!user) {
    return {
      pageId: null,
      pageName: null,
      pagePictureUrl: null,
      dbUnavailable: false,
    };
  }

  const pageLoad = await loadDashboardConnectedPages(user.id);
  const activePage = pageLoad.pages[0] ?? null;

  return {
    pageId: activePage?.pageId ?? null,
    pageName: activePage?.name ?? null,
    pagePictureUrl: activePage?.pictureUrl ?? null,
    dbUnavailable: pageLoad.unavailable,
  };
}
