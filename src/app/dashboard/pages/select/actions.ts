"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { and, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import {
  facebookPageTable,
  facebookUserTokenTable,
} from "@/lib/db/schema";
import { fetchUserPages } from "@/lib/auth/facebook";
import { getCurrentSession } from "@/lib/auth/cookies";

export type ConnectPageState =
  | {
      ok: false;
      error: string;
    }
  | undefined;

export async function connectSinglePageAction(
  _prevState: ConnectPageState,
  formData: FormData,
): Promise<ConnectPageState> {
  const { user } = await getCurrentSession();
  if (!user) redirect("/login");

  const pageId = String(formData.get("pageId") ?? "").trim();
  if (!pageId) {
    return { ok: false, error: "Choose a Facebook Page to connect." };
  }

  const tokenRows = await db
    .select()
    .from(facebookUserTokenTable)
    .where(eq(facebookUserTokenTable.userId, user.id))
    .limit(1);

  if (tokenRows.length === 0) {
    return {
      ok: false,
      error: "No Facebook authorization found. Please reconnect Facebook.",
    };
  }

  let allPages;
  try {
    allPages = await fetchUserPages(tokenRows[0].accessToken);
  } catch (err) {
    console.error("[connect single page] fetchUserPages", err);
    return {
      ok: false,
      error: "We couldn't refresh your Facebook Pages. Please try again.",
    };
  }

  const page = allPages.find((candidate) => candidate.id === pageId);
  if (!page) {
    return {
      ok: false,
      error: "That Page was not found in your Facebook account. Refresh the list and try again.",
    };
  }

  const existing = await db
    .select({ id: facebookPageTable.id })
    .from(facebookPageTable)
    .where(
      and(
        eq(facebookPageTable.userId, user.id),
        eq(facebookPageTable.pageId, page.id),
      ),
    )
    .limit(1);

  const values = {
    name: page.name,
    category: page.category ?? null,
    pictureUrl: page.picture?.data?.url ?? null,
    pageAccessToken: page.access_token,
    tasks: page.tasks ? JSON.stringify(page.tasks) : null,
    isActive: true,
    updatedAt: new Date(),
  };

  if (existing.length > 0) {
    await db
      .update(facebookPageTable)
      .set(values)
      .where(eq(facebookPageTable.id, existing[0].id));
  } else {
    await db.insert(facebookPageTable).values({
      userId: user.id,
      pageId: page.id,
      ...values,
    });
  }

  revalidatePath("/dashboard/pages");
  revalidatePath("/dashboard/pages/select");
  revalidatePath("/dashboard/settings");

  redirect("/dashboard/pages");
}
