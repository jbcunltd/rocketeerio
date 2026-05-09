/*
 * Design philosophy reminder: Soft Swiss SaaS Minimalism.
 * The server page keeps the route calm and data-grounded: it fetches only the
 * authenticated user's connected Page context, passes an empty live conversation
 * list, and lets the client shell render a polished live-ready empty state.
 */

import { desc, eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { JoshLiveInbox } from "@/components/dashboard/josh-live-inbox";
import { getCurrentSession } from "@/lib/auth/cookies";
import { db } from "@/lib/db";
import { facebookPageTable } from "@/lib/db/schema";

export const dynamic = "force-dynamic";

export default async function JoshForSalesPage() {
  const { user } = await getCurrentSession();
  if (!user) redirect("/login");

  let pageName = "your connected Page";
  let pagePictureUrl: string | null = null;
  let dbUnavailable = false;

  try {
    const activePage = (
      await db
        .select({
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
      pageName = activePage.name;
      pagePictureUrl = activePage.pictureUrl;
    }
  } catch (err) {
    console.error("[josh inbox] connected page load failed", err);
    dbUnavailable = true;
  }

  return (
    <JoshLiveInbox
      pageName={pageName}
      pagePictureUrl={pagePictureUrl}
      conversations={[]}
      dbUnavailable={dbUnavailable}
    />
  );
}
