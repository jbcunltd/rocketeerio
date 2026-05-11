"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { and, eq, inArray } from "drizzle-orm";
import { db } from "@/lib/db";
import {
  facebookPageTable,
  facebookUserTokenTable,
} from "@/lib/db/schema";
import { getCurrentSession } from "@/lib/auth/cookies";

export async function disconnectFacebookAction(): Promise<void> {
  const { user } = await getCurrentSession();
  if (!user) redirect("/login");

  await db
    .delete(facebookUserTokenTable)
    .where(eq(facebookUserTokenTable.userId, user.id));

  // Keep linked Pages in the dashboard history, but mark them inactive after the
  // account-level Facebook authorization is removed.
  const pageIds = await db
    .select({ id: facebookPageTable.id })
    .from(facebookPageTable)
    .where(eq(facebookPageTable.userId, user.id));
  if (pageIds.length > 0) {
    await db
      .update(facebookPageTable)
      .set({ isActive: false, updatedAt: new Date() })
      .where(
        and(
          eq(facebookPageTable.userId, user.id),
          inArray(
            facebookPageTable.id,
            pageIds.map((page) => page.id),
          ),
        ),
      );
  }

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/pages");
  revalidatePath("/dashboard/settings");
}
