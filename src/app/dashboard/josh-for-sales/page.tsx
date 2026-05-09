import { eq } from "drizzle-orm";
import { Bot, Sparkles } from "lucide-react";
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
      <header className="flex flex-col gap-5 rounded-3xl border border-brand-100 bg-white p-6 shadow-sm md:flex-row md:items-center md:justify-between">
        <div className="flex items-start gap-4">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-brand-50 text-brand-600 ring-1 ring-brand-100">
            <Bot className="h-7 w-7" />
          </div>
          <div>
            <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-brand-600">
              <Sparkles className="h-3.5 w-3.5" />
              AI agent settings
            </p>
            <h1 className="mt-2 text-2xl font-bold tracking-tight text-ink-900 md:text-3xl">
              Josh for Sales
            </h1>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-ink-600">
              Configure Josh&apos;s sales identity, capabilities, knowledge base, and behavior rules directly from your dashboard. These settings are saved per user in PostgreSQL and are ready for the middleware to consume later.
            </p>
          </div>
        </div>
        <div className="rounded-2xl border border-ink-100 bg-ink-50 px-4 py-3 text-sm text-ink-700 md:max-w-xs">
          <span className="font-semibold text-ink-900">Current owner:</span>{" "}
          {user.name ?? user.email}
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
