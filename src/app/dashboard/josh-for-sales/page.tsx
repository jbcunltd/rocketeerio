import { eq } from "drizzle-orm";
import { Sparkles } from "lucide-react";
import { redirect } from "next/navigation";
import { JoshSettingsForm } from "@/components/dashboard/josh-settings-form";
import { getCurrentSession } from "@/lib/auth/cookies";
import { db } from "@/lib/db";
import { joshAgentSettingsTable } from "@/lib/db/schema";
import { toJoshSettingsValue } from "@/lib/josh-agent-settings";

export const dynamic = "force-dynamic";

export default async function JoshForSalesPage() {
  const { user } = await getCurrentSession();
  if (!user) redirect("/login");

  let settings = toJoshSettingsValue();
  let dbUnavailable = false;

  try {
    const row = (
      await db
        .select()
        .from(joshAgentSettingsTable)
        .where(eq(joshAgentSettingsTable.userId, user.id))
        .limit(1)
    )[0];
    settings = toJoshSettingsValue(row);
  } catch (err) {
    console.error("[josh settings] load failed", err);
    dbUnavailable = true;
  }

  return (
    <div className="space-y-8">
      <header className="relative overflow-hidden rounded-3xl border border-brand-100 bg-white shadow-sm">
        {/* Cover photo */}
        <div className="h-40 w-full overflow-hidden md:h-52">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/josh-cover.jpg"
            alt="Josh cover"
            className="h-full w-full object-cover"
          />
        </div>
        {/* Profile section overlapping the cover */}
        <div className="relative px-6 pb-5 pt-0">
          <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
            <div className="flex items-end gap-5">
              {/* Avatar overlapping cover — Facebook page size */}
              <div className="-mt-16 flex h-[120px] w-[120px] shrink-0 items-center justify-center overflow-hidden rounded-full border-[5px] border-white bg-brand-50 shadow-lg">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/josh-avatar.jpg"
                  alt="Josh"
                  className="h-full w-full object-cover"
                />
              </div>
              <div className="pb-2">
                <p className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-brand-600">
                  <Sparkles className="h-3.5 w-3.5" />
                  AI agent settings
                </p>
                <h1 className="mt-1.5 text-2xl font-bold tracking-tight text-ink-900 md:text-3xl">
                  Josh for Sales
                </h1>
                <p className="mt-1.5 max-w-2xl text-sm leading-relaxed text-ink-600">
                  Configure Josh&apos;s sales identity, capabilities, knowledge base, and behavior rules.
                </p>
              </div>
            </div>
            <div className="mb-2 rounded-2xl border border-ink-100 bg-ink-50 px-4 py-3 text-sm text-ink-700 md:max-w-xs">
              <span className="font-semibold text-ink-900">Current owner:</span>{" "}
              {user.name ?? user.email}
            </div>
          </div>
        </div>
      </header>

      {dbUnavailable ? (
        <div className="rounded-lg border border-rose/40 bg-rose/5 px-4 py-3 text-sm text-rose">
          We could not load saved Josh settings because the database is unavailable. You can still review the default form, but saving may fail until the database connection is restored.
        </div>
      ) : null}

      <JoshSettingsForm initialSettings={settings} />
    </div>
  );
}
