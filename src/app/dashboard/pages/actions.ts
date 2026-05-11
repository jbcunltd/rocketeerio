"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/lib/db";
import {
  facebookPageTable,
  facebookUserTokenTable,
} from "@/lib/db/schema";
import { fetchUserPages } from "@/lib/auth/facebook";
import { getCurrentSession } from "@/lib/auth/cookies";

export type ConnectPagesState =
  | { ok: true; connected: number }
  | { ok: false; error: string }
  | undefined;

export async function connectSelectedPagesAction(
  _prev: ConnectPagesState,
  formData: FormData,
): Promise<ConnectPagesState> {
  const { user } = await getCurrentSession();
  if (!user) redirect("/login");

  const pageIds = formData.getAll("pageIds").map((value) => String(value));
  const parse = z.array(z.string().min(1)).min(1).safeParse(pageIds);
  if (!parse.success) {
    return { ok: false, error: "Select at least one Page to connect." };
  }

  const tokenRows = await db
    .select()
    .from(facebookUserTokenTable)
    .where(eq(facebookUserTokenTable.userId, user.id))
    .limit(1);
  if (tokenRows.length === 0) {
    return {
      ok: false,
      error: "No Facebook authorization found. Please re-authorize.",
    };
  }

  let allPages;
  try {
    allPages = await fetchUserPages(tokenRows[0].accessToken);
  } catch (err) {
    console.error("[connect pages]", err);
    return {
      ok: false,
      error:
        "We couldn't reach Facebook to fetch your Pages. Please try again.",
    };
  }

  const selected = allPages.filter((page) => parse.data.includes(page.id));
  if (selected.length === 0) {
    return { ok: false, error: "Selected Pages were not found in your account." };
  }

  for (const page of selected) {
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
  }

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/pages");
  revalidatePath("/dashboard/pages/select");
  revalidatePath("/dashboard/settings");
  return { ok: true, connected: selected.length };
}

export async function disconnectPageAction(formData: FormData): Promise<void> {
  const { user } = await getCurrentSession();
  if (!user) redirect("/login");

  const pageId = String(formData.get("pageId") ?? "");
  if (!pageId) return;

  await db
    .delete(facebookPageTable)
    .where(
      and(
        eq(facebookPageTable.userId, user.id),
        eq(facebookPageTable.pageId, pageId),
      ),
    );

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/pages");
  revalidatePath("/dashboard/pages/select");
  revalidatePath("/dashboard/settings");
}
