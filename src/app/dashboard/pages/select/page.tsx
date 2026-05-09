import Link from "next/link";
import { eq } from "drizzle-orm";
import { AlertTriangle, ArrowRight, RefreshCw, Rocket } from "lucide-react";
import { Logo } from "@/components/logo";
import { db } from "@/lib/db";
import {
  facebookPageTable,
  facebookUserTokenTable,
} from "@/lib/db/schema";
import { fetchUserPages } from "@/lib/auth/facebook";
import { getCurrentSession } from "@/lib/auth/cookies";
import {
  PageSelectionList,
  type SelectableFacebookPage,
} from "./page-selection-list";

export const dynamic = "force-dynamic";

const ERROR_MESSAGES: Record<string, string> = {
  invalid_state: "Your authorization expired. Please try connecting again.",
  missing_code: "Facebook didn't return a code. Please try again.",
  token_exchange: "We couldn't complete the Facebook authorization.",
  graph_failed: "We couldn't reach Facebook. Please try again in a moment.",
  facebook_unavailable:
    "We hit a snag connecting to Facebook. Please try again in a moment.",
};

function AutomationIllustration() {
  return (
    <div className="relative mt-10 hidden aspect-square max-w-sm overflow-hidden rounded-[2rem] border border-white/20 bg-white/10 p-8 shadow-2xl shadow-brand-900/20 backdrop-blur md:block">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_25%_20%,rgba(255,255,255,0.35),transparent_28%),radial-gradient(circle_at_80%_75%,rgba(255,255,255,0.18),transparent_30%)]" />
      <div className="absolute left-10 top-14 h-16 w-16 rounded-2xl bg-white/95 shadow-xl shadow-brand-900/20" />
      <div className="absolute right-10 top-24 h-12 w-12 rounded-full bg-cyan-100 shadow-lg" />
      <div className="absolute bottom-14 left-14 h-14 w-14 rounded-full bg-white/90 shadow-lg" />
      <div className="absolute inset-10 rounded-full border border-dashed border-white/40" />
      <div className="absolute inset-20 rounded-full border border-dashed border-white/30" />
      <div className="relative z-10 flex h-full items-center justify-center">
        <div className="flex h-28 w-28 items-center justify-center rounded-[2rem] bg-white text-brand-600 shadow-2xl shadow-brand-900/30">
          <Rocket className="h-12 w-12" aria-hidden="true" />
        </div>
      </div>
      <div className="absolute bottom-8 right-8 rounded-2xl bg-white px-4 py-3 text-sm font-semibold text-ink-900 shadow-xl">
        Messenger automation ready
      </div>
    </div>
  );
}

export default async function SelectFacebookPagePage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const sp = await searchParams;
  const { user } = await getCurrentSession();
  if (!user) return null;

  const errorMsg = sp.error ? ERROR_MESSAGES[sp.error] ?? sp.error : null;
  let tokenRow: typeof facebookUserTokenTable.$inferSelect | undefined;
  let connectedSet = new Set<string>();
  let pages: SelectableFacebookPage[] = [];
  let fetchError: string | null = null;

  try {
    tokenRow = (
      await db
        .select()
        .from(facebookUserTokenTable)
        .where(eq(facebookUserTokenTable.userId, user.id))
        .limit(1)
    )[0];

    const connectedRows = await db
      .select({ pageId: facebookPageTable.pageId })
      .from(facebookPageTable)
      .where(eq(facebookPageTable.userId, user.id));
    connectedSet = new Set(connectedRows.map((row) => row.pageId));
  } catch (err) {
    console.error("[dashboard/pages/select] db unavailable", err);
    fetchError = "We couldn't load your Facebook connection. Please try again.";
  }

  if (tokenRow && !fetchError) {
    try {
      const facebookPages = await fetchUserPages(tokenRow.accessToken);
      pages = facebookPages.map((page) => ({
        id: page.id,
        name: page.name,
        category: page.category ?? null,
        pictureUrl: page.picture?.data?.url ?? null,
        alreadyConnected: connectedSet.has(page.id),
      }));
    } catch (err) {
      console.error("[dashboard/pages/select] fetchUserPages", err);
      fetchError =
        "We couldn't load your Facebook Pages. Your authorization may have expired — please reconnect Facebook.";
    }
  }

  return (
    <div className="-mx-6 -my-6 min-h-[calc(100vh-5rem)] bg-ink-50/60 md:-mx-10 md:-my-10 md:grid md:min-h-screen md:grid-cols-[0.92fr_1.08fr] md:bg-white">
      <aside className="hidden overflow-hidden bg-brand-600 px-10 py-12 text-white md:flex md:flex-col md:justify-between lg:px-14">
        <div>
          <Logo className="[&_span:first-child]:bg-white [&_span:first-child]:text-brand-600 [&_span:last-child]:text-white" />
          <div className="mt-16 max-w-md">
            <p className="mb-4 inline-flex rounded-full bg-white/15 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-white/80">
              Facebook setup
            </p>
            <h1 className="text-4xl font-bold tracking-tight text-white lg:text-5xl">
              Connect Facebook Page
            </h1>
            <p className="mt-5 text-base leading-7 text-white/80">
              Follow the instruction to connect your first Messenger automation.
              Pick the Page Rocketeerio should use to qualify leads and manage
              Messenger conversations.
            </p>
          </div>
          <AutomationIllustration />
        </div>
        <p className="text-sm text-white/65">
          Your Page token is stored securely and can be disconnected from your
          dashboard at any time.
        </p>
      </aside>

      <main className="px-4 py-4 sm:px-6 md:px-10 md:py-12 lg:px-16">
        <div className="mx-auto w-full max-w-2xl md:max-w-3xl">
          <div className="mb-5 flex items-center justify-between md:hidden">
            <Logo className="scale-90 origin-left" />
          </div>

          <header className="mb-5 rounded-2xl border border-ink-100 bg-white p-4 shadow-sm md:mb-8 md:border-0 md:bg-transparent md:p-0 md:shadow-none">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-brand-600 md:hidden">
              Connect Facebook Page
            </p>
            <h2 className="mt-1 text-2xl font-bold tracking-tight text-ink-900 md:mt-0 md:text-3xl">
              We found {pages.length} Facebook Page{pages.length === 1 ? "" : "s"} managed by you.
            </h2>
            <p className="mt-2 text-sm leading-6 text-ink-600 md:text-base">
              Select the Page you want to connect to Rocketeerio Messenger
              automation.
            </p>
          </header>

          {errorMsg && (
            <div className="mb-4 flex items-start gap-3 rounded-2xl border border-rose/30 bg-rose/5 px-4 py-3 text-sm text-rose">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
              <p>{errorMsg}</p>
            </div>
          )}

          {!tokenRow && !fetchError ? (
            <div className="rounded-2xl border border-ink-100 bg-white p-5 shadow-sm md:p-8">
              <h2 className="text-lg font-semibold text-ink-900">
                Facebook authorization is required
              </h2>
              <p className="mt-2 text-sm leading-6 text-ink-600">
                Reconnect Facebook so Rocketeerio can read the Pages you manage
                and show them here.
              </p>
              <Link
                href="/api/facebook/pages"
                className="mt-5 inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-brand-600 px-5 text-base font-semibold text-white shadow-sm shadow-brand-500/30 hover:bg-brand-700 md:w-auto md:text-sm"
              >
                Reconnect Facebook
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>
            </div>
          ) : fetchError ? (
            <div className="rounded-2xl border border-rose/30 bg-white p-5 text-sm leading-6 text-rose shadow-sm md:p-8">
              {fetchError}
              <div className="mt-5">
                <Link
                  href="/api/facebook/pages"
                  className="inline-flex h-12 w-full items-center justify-center rounded-xl bg-brand-600 px-5 text-base font-semibold text-white hover:bg-brand-700 md:w-auto md:text-sm"
                >
                  Reconnect Facebook
                </Link>
              </div>
            </div>
          ) : (
            <PageSelectionList pages={pages} />
          )}

          <div className="mt-5 flex flex-col gap-3 text-center text-sm font-medium text-ink-500 sm:flex-row sm:items-center sm:justify-center md:mt-6">
            <Link
              href="/api/facebook/pages"
              className="rounded-lg px-3 py-2 transition hover:bg-white hover:text-brand-700 md:hover:bg-brand-50"
            >
              I can&apos;t see the Page I want
            </Link>
            <span className="hidden text-ink-300 sm:inline">|</span>
            <Link
              href="/dashboard/pages/select"
              className="inline-flex items-center justify-center gap-2 rounded-lg px-3 py-2 transition hover:bg-white hover:text-brand-700 md:hover:bg-brand-50"
            >
              <RefreshCw className="h-4 w-4" aria-hidden="true" />
              Refresh Page list
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
