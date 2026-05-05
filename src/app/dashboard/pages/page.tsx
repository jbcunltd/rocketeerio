import Link from "next/link";
import { desc, eq } from "drizzle-orm";
import { CheckCircle2, MessageCircleHeart, PauseCircle } from "lucide-react";
import { db } from "@/lib/db";
import { facebookPageTable, type DbFacebookPage } from "@/lib/db/schema";
import { getCurrentSession } from "@/lib/auth/cookies";
import { disconnectPageAction } from "../settings/actions";

export const dynamic = "force-dynamic";

export default async function ConnectedPagesPage() {
  const { user } = await getCurrentSession();
  if (!user) return null;

  let pages: DbFacebookPage[] = [];
  try {
    pages = await db
      .select()
      .from(facebookPageTable)
      .where(eq(facebookPageTable.userId, user.id))
      .orderBy(desc(facebookPageTable.connectedAt));
  } catch (err) {
    console.error("[dashboard/pages] db unavailable", err);
  }

  return (
    <div className="space-y-8">
      <header className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-ink-900 md:text-3xl">
            Connected Pages
          </h1>
          <p className="text-sm text-ink-600">
            Facebook Pages currently connected to Rocketeerio.
          </p>
        </div>
        <Link
          href="/dashboard/settings"
          className="inline-flex items-center gap-2 rounded-lg bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm shadow-brand-500/30 hover:bg-brand-700 focus:outline-none focus:ring-2 focus:ring-brand-500/40"
        >
          Connect another Page
        </Link>
      </header>

      {pages.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-ink-200 bg-white p-6">
          <h2 className="flex items-center gap-2 text-base font-semibold text-ink-900">
            <MessageCircleHeart className="h-5 w-5 text-brand-500" />
            No Pages connected yet
          </h2>
          <p className="mt-1 text-sm text-ink-600">
            Head over to Settings to authorize Facebook and pick the Pages you
            want Rocketeerio to qualify leads for.
          </p>
          <Link
            href="/dashboard/settings"
            className="mt-4 inline-flex items-center gap-2 rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700 focus:outline-none focus:ring-2 focus:ring-brand-500/40"
          >
            Go to Settings
          </Link>
        </div>
      ) : (
        <ul className="grid gap-4 md:grid-cols-2">
          {pages.map((page) => (
            <li
              key={page.id}
              className="rounded-2xl border border-ink-100 bg-white p-5 shadow-sm"
            >
              <div className="flex items-start gap-4">
                {page.pictureUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={page.pictureUrl}
                    alt=""
                    width={56}
                    height={56}
                    loading="lazy"
                    decoding="async"
                    className="h-14 w-14 rounded-full object-cover"
                  />
                ) : (
                  <div className="flex h-14 w-14 items-center justify-center rounded-full bg-brand-100 text-brand-700">
                    <MessageCircleHeart className="h-6 w-6" />
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="truncate text-base font-semibold text-ink-900">
                      {page.name}
                    </h3>
                    {page.isActive ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-mint/15 px-2 py-0.5 text-[10px] font-medium text-emerald-700">
                        <CheckCircle2 className="h-3 w-3" />
                        Active
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 rounded-full bg-amber/15 px-2 py-0.5 text-[10px] font-medium text-amber-700">
                        <PauseCircle className="h-3 w-3" />
                        Inactive
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-ink-500">
                    {page.category ?? "Facebook Page"} · ID {page.pageId}
                  </p>
                  <p className="mt-1 text-xs text-ink-500">
                    Connected{" "}
                    {new Date(page.connectedAt).toLocaleDateString(undefined, {
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                    })}
                  </p>
                  <form action={disconnectPageAction} className="mt-3">
                    <input type="hidden" name="pageId" value={page.pageId} />
                    <button
                      type="submit"
                      className="text-xs font-medium text-ink-500 hover:text-rose"
                    >
                      Disconnect
                    </button>
                  </form>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
