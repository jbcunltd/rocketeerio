import Link from "next/link";
import Image from "next/image";
import {
  ArrowRight,
  ChevronRight,
  MessageCircle,
  Sparkles,
  Users,
  Zap,
} from "lucide-react";
import { eq, desc } from "drizzle-orm";
import { db } from "@/lib/db";
import { facebookPageTable, type DbFacebookPage } from "@/lib/db/schema";
import { getCurrentSession } from "@/lib/auth/cookies";
import { PageSwitcher } from "@/components/dashboard/page-switcher";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
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
    console.error("[dashboard] db unavailable", err);
  }

  const firstName = (user.name ?? user.email?.split("@")[0] ?? "there").split(
    " ",
  )[0];
  const activePage = pages[0] ?? null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <header className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-ink-900 md:text-3xl">
            Welcome back, {firstName}.
          </h1>
          <p className="text-sm text-ink-600">
            Here&apos;s a snapshot of your Messenger pipeline.
          </p>
        </div>
        {pages.length === 0 ? (
          <Link
            href="/api/facebook/pages"
            className="inline-flex items-center gap-2 rounded-lg bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm shadow-brand-500/30 hover:bg-brand-700 focus:outline-none focus:ring-2 focus:ring-brand-500/40 transition-all"
          >
            Connect a Facebook Page
            <ArrowRight className="h-4 w-4" />
          </Link>
        ) : (
          <PageSwitcher
            pages={pages.map((p) => ({
              id: p.id,
              pageId: p.pageId,
              name: p.name,
              pictureUrl: p.pictureUrl,
              isActive: p.isActive,
            }))}
          />
        )}
      </header>

      {/* No pages connected — onboarding CTA */}
      {pages.length === 0 && (
        <div className="rounded-2xl border border-dashed border-ink-200 bg-white p-6">
          <h2 className="text-lg font-semibold text-ink-900">Get started</h2>
          <p className="mt-1.5 text-sm text-ink-600">
            You haven&apos;t connected any Facebook Pages yet. Connect a Page to
            begin qualifying Messenger leads automatically.
          </p>
          <Link
            href="/api/facebook/pages"
            className="mt-4 inline-flex items-center gap-2 rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700 focus:outline-none focus:ring-2 focus:ring-brand-500/40 transition-all"
          >
            Connect Facebook Page
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      )}

      {/* Active page context bar */}
      {activePage && (
        <div className="flex items-center gap-3 rounded-xl border border-ink-100 bg-white px-4 py-3 shadow-sm">
          {activePage.pictureUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={activePage.pictureUrl}
              alt=""
              width={36}
              height={36}
              className="h-9 w-9 rounded-full object-cover"
            />
          ) : (
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-100 text-brand-700">
              <MessageCircle className="h-4 w-4" />
            </div>
          )}
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-ink-900">
              {activePage.name}
            </p>
            <p className="text-xs text-ink-500">
              {activePage.category ?? "Facebook Page"} ·{" "}
              <span className="text-emerald-600 font-medium">Active</span>
            </p>
          </div>
          <Link
            href="/dashboard/pages"
            className="text-xs font-medium text-brand-600 hover:text-brand-700 transition-colors"
          >
            Manage
          </Link>
        </div>
      )}

      {/* KPI Metrics */}
      <section className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        {[
          {
            icon: MessageCircle,
            label: "Conversations (24h)",
            value: activePage ? "0" : "—",
            sub: activePage
              ? "Waiting for first message"
              : "Connect a Page to start",
          },
          {
            icon: Users,
            label: "Qualified leads",
            value: activePage ? "0" : "—",
            sub: activePage
              ? "Josh will track qualifications"
              : "Tracked after first qualification",
          },
          {
            icon: Zap,
            label: "Avg. response time",
            value: activePage ? "<1s" : "—",
            sub: activePage
              ? "Josh responds instantly"
              : "Measured live once a Page is connected",
          },
          {
            icon: Sparkles,
            label: "Booked calls",
            value: activePage ? "0" : "—",
            sub: activePage
              ? "Updates as bookings land"
              : "Updates as bookings land",
          },
        ].map((m) => (
          <div
            key={m.label}
            className="rounded-2xl border border-ink-100 bg-white p-5 shadow-sm transition-shadow hover:shadow-md"
          >
            <div className="flex items-center justify-between">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-ink-500 sm:text-xs">
                {m.label}
              </p>
              <m.icon className="h-4 w-4 text-brand-500" />
            </div>
            <p className="mt-3 text-2xl font-bold tracking-tight text-ink-900 sm:text-3xl">
              {m.value}
            </p>
            <p className="mt-1 text-[10px] text-ink-500 sm:text-xs">{m.sub}</p>
          </div>
        ))}
      </section>

      {/* Josh for Sales — Activity Summary Card */}
      <Link
        href="/dashboard/josh-for-sales"
        className="group block rounded-2xl border border-ink-100 bg-white p-6 shadow-sm transition-all hover:shadow-md hover:border-brand-200"
      >
        <div className="flex items-start gap-4">
          <div className="relative shrink-0">
            <Image
              src="/josh-avatar.jpg?v=3"
              alt="Josh for Sales"
              width={48}
              height={48}
              className="h-12 w-12 rounded-full object-cover ring-2 ring-white shadow-sm"
            />
            <span className="absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 rounded-full border-2 border-white bg-emerald-400" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-semibold text-ink-900">
                  Josh for Sales
                </h3>
                <p className="text-xs text-emerald-600 font-medium">
                  Online · Ready to qualify leads
                </p>
              </div>
              <ChevronRight className="h-5 w-5 text-ink-300 transition-transform group-hover:translate-x-0.5 group-hover:text-brand-500" />
            </div>

            {/* Mini stats row */}
            <div className="mt-4 grid grid-cols-3 gap-3">
              <div className="rounded-lg bg-ink-50 px-3 py-2">
                <p className="text-lg font-bold text-ink-900">
                  {activePage ? "0" : "—"}
                </p>
                <p className="text-[10px] text-ink-500">Chats today</p>
              </div>
              <div className="rounded-lg bg-ink-50 px-3 py-2">
                <p className="text-lg font-bold text-ink-900">
                  {activePage ? "0" : "—"}
                </p>
                <p className="text-[10px] text-ink-500">Qualified</p>
              </div>
              <div className="rounded-lg bg-ink-50 px-3 py-2">
                <p className="text-lg font-bold text-emerald-600">
                  {activePage ? "<1s" : "—"}
                </p>
                <p className="text-[10px] text-ink-500">Avg reply</p>
              </div>
            </div>

            {/* Activity preview */}
            <div className="mt-4 rounded-lg border border-dashed border-ink-200 px-4 py-3">
              {activePage ? (
                <p className="text-sm text-ink-500 italic">
                  Josh is online and ready. Waiting for the first lead on{" "}
                  <span className="font-medium text-ink-700">
                    {activePage.name}
                  </span>
                  …
                </p>
              ) : (
                <p className="text-sm text-ink-500 italic">
                  Connect a Facebook Page to activate Josh.
                </p>
              )}
            </div>
          </div>
        </div>
        <div className="mt-4 flex items-center justify-end">
          <span className="text-xs font-medium text-brand-600 group-hover:text-brand-700 transition-colors">
            View live conversations →
          </span>
        </div>
      </Link>

      {/* Activity Feed */}
      <div className="rounded-2xl border border-ink-100 bg-white p-6 shadow-sm">
        <h3 className="text-base font-semibold text-ink-900">Activity feed</h3>
        <p className="mt-1 text-sm text-ink-600">
          Real-time conversations from your connected Pages will appear here.
        </p>
        <div className="mt-5 flex h-32 items-center justify-center rounded-lg border border-dashed border-ink-200 text-sm text-ink-500">
          {activePage
            ? "Waiting for first conversation…"
            : "No activity yet — connect a Page to get started."}
        </div>
      </div>
    </div>
  );
}
