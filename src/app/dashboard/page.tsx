import Link from "next/link";
import { ArrowRight, MessageCircle, Sparkles, Users, Zap } from "lucide-react";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { facebookPageTable } from "@/lib/db/schema";
import { getCurrentSession } from "@/lib/auth/cookies";

export const dynamic = "force-dynamic";

const PLACEHOLDER_METRICS = [
  {
    icon: MessageCircle,
    label: "Conversations (24h)",
    value: "—",
    sub: "Connect a Page to start",
  },
  {
    icon: Users,
    label: "Qualified leads",
    value: "—",
    sub: "Tracked after first qualification",
  },
  {
    icon: Zap,
    label: "Avg. response time",
    value: "—",
    sub: "Measured live once a Page is connected",
  },
  {
    icon: Sparkles,
    label: "Booked calls",
    value: "—",
    sub: "Updates as bookings land",
  },
];

export default async function DashboardPage() {
  const { user } = await getCurrentSession();
  if (!user) return null;

  let pages: { id: number }[] = [];
  try {
    pages = await db
      .select({ id: facebookPageTable.id })
      .from(facebookPageTable)
      .where(eq(facebookPageTable.userId, user.id));
  } catch (err) {
    console.error("[dashboard] db unavailable", err);
  }

  const firstName = (user.name ?? user.email?.split("@")[0] ?? "there").split(" ")[0];

  return (
    <div className="space-y-8">
      <header className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-ink-900 md:text-3xl">
            Welcome back, {firstName}.
          </h1>
          <p className="text-sm text-ink-600">
            Here&apos;s a snapshot of your Messenger pipeline.
          </p>
        </div>
        <Link
          href="/dashboard/settings"
          className="inline-flex items-center gap-2 rounded-lg bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm shadow-brand-500/30 hover:bg-brand-700 focus:outline-none focus:ring-2 focus:ring-brand-500/40"
        >
          Connect a Facebook Page
          <ArrowRight className="h-4 w-4" />
        </Link>
      </header>

      {pages.length === 0 && (
        <div className="rounded-2xl border border-dashed border-ink-200 bg-white p-6">
          <h2 className="text-lg font-semibold text-ink-900">Get started</h2>
          <p className="mt-1.5 text-sm text-ink-600">
            You haven&apos;t connected any Facebook Pages yet. Connect a Page to
            begin qualifying Messenger leads automatically.
          </p>
          <Link
            href="/dashboard/settings"
            className="mt-4 inline-flex items-center gap-2 rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700 focus:outline-none focus:ring-2 focus:ring-brand-500/40"
          >
            Connect Facebook Page
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      )}

      <section className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {PLACEHOLDER_METRICS.map((m) => (
          <div
            key={m.label}
            className="rounded-2xl border border-ink-100 bg-white p-5 shadow-sm"
          >
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold uppercase tracking-wider text-ink-500">
                {m.label}
              </p>
              <m.icon className="h-4 w-4 text-brand-500" />
            </div>
            <p className="mt-3 text-3xl font-bold tracking-tight text-ink-900">
              {m.value}
            </p>
            <p className="mt-1 text-xs text-ink-500">{m.sub}</p>
          </div>
        ))}
      </section>

      <div className="rounded-2xl border border-ink-100 bg-white p-6 shadow-sm">
        <h3 className="text-base font-semibold text-ink-900">Activity feed</h3>
        <p className="mt-1 text-sm text-ink-600">
          Real-time conversations from your connected Pages will appear here.
        </p>
        <div className="mt-5 flex h-40 items-center justify-center rounded-lg border border-dashed border-ink-200 text-sm text-ink-500">
          No activity yet — connect a Page to get started.
        </div>
      </div>
    </div>
  );
}
