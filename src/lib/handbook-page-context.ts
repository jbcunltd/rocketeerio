import { desc, eq } from "drizzle-orm";
import { getCurrentSession } from "@/lib/auth/cookies";
import { db } from "@/lib/db";
import { facebookPageTable } from "@/lib/db/schema";

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

    return {
      pageId: activePage?.pageId ?? null,
      pageName: activePage?.name ?? null,
      pagePictureUrl: activePage?.pictureUrl ?? null,
      dbUnavailable: false,
    };
  } catch (err) {
    console.error("[handbook] connected page load failed", err);
    return {
      pageId: null,
      pageName: null,
      pagePictureUrl: null,
      dbUnavailable: true,
    };
  }
}
