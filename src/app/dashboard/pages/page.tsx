import Link from "next/link";
import { desc, eq } from "drizzle-orm";
import {
  AlertTriangle,
  CheckCircle2,
  Facebook,
  RefreshCw,
} from "lucide-react";
import { db } from "@/lib/db";
import {
  facebookPageTable,
  facebookUserTokenTable,
  type DbFacebookPage,
} from "@/lib/db/schema";
import { fetchUserPages } from "@/lib/auth/facebook";
import { getCurrentSession } from "@/lib/auth/cookies";
import {
  PageSelector,
  type AvailablePage,
} from "@/components/dashboard/page-selector";
import { ConnectedPagesList } from "@/components/dashboard/connected-pages-list";

export const dynamic = "force-dynamic";

const ERROR_MESSAGES: Record<string, string> = {
  invalid_state: "Your authorization expired. Please try connecting again.",
  missing_code: "Facebook didn't return a code. Please try again.",
  token_exchange: "We couldn't complete the Facebook authorization.",
  graph_failed: "We couldn't reach Facebook. Please try again in a moment.",
  facebook_unavailable:
    "We hit a snag connecting to Facebook. Please try again in a moment.",
};

export default async function ConnectedPagesPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; fb?: string }>;
}) {
  const sp = await searchParams;
  const { user } = await getCurrentSession();
  if (!user) return null;

  const errorMsg = sp.error ? ERROR_MESSAGES[sp.error] ?? sp.error : null;
  const justAuthorized = sp.fb === "authorized" || sp.fb === "connected";

  let tokenRow: typeof facebookUserTokenTable.$inferSelect | undefined;
  let pages: DbFacebookPage[] = [];
  let connectedSet = new Set<string>();
  let dbError: string | null = null;

  try {
    tokenRow = (
      await db
        .select()
        .from(facebookUserTokenTable)
        .where(eq(facebookUserTokenTable.userId, user.id))
        .limit(1)
    )[0];

    pages = await db
      .select()
      .from(facebookPageTable)
      .where(eq(facebookPageTable.userId, user.id))
      .orderBy(desc(facebookPageTable.connectedAt));
    connectedSet = new Set(pages.map((page) => page.pageId));
  } catch (err) {
    console.error("[dashboard/pages] db unavailable", err);
    dbError = "We couldn't load your connected Pages. Please try again.";
  }

  let availablePages: AvailablePage[] = [];
  let fetchError: string | null = null;
  if (tokenRow && !dbError) {
    try {
      const facebookPages = await fetchUserPages(tokenRow.accessToken);
      availablePages = facebookPages.map((page) => ({
        id: page.id,
        name: page.name,
        category: page.category ?? null,
        pictureUrl: page.picture?.data?.url ?? null,
        alreadyConnected: connectedSet.has(page.id),
      }));
    } catch (err) {
      console.error("[dashboard/pages] fetchUserPages", err);
      fetchError =
        "We couldn't load your Facebook Pages. Your authorization may have expired — please re-authorize.";
    }
  }

  return (
    <div className="space-y-8">
      <header className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-ink-900 md:text-3xl">
            Connected Pages
          </h1>
          <p className="text-sm text-ink-600">
            View connected Facebook Pages, connect new ones, and disconnect old
            ones from one place.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <a
            href="/api/facebook/pages"
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700 focus:outline-none focus:ring-2 focus:ring-brand-500/40"
          >
            <Facebook className="h-4 w-4" aria-hidden="true" />
            {tokenRow ? "Re-authorize Facebook" : "Connect Facebook"}
          </a>
          {tokenRow && (
            <Link
              href="/dashboard/pages"
              className="inline-flex items-center justify-center gap-2 rounded-lg border border-ink-200 bg-white px-4 py-2 text-sm font-semibold text-ink-800 hover:bg-ink-50"
            >
              <RefreshCw className="h-4 w-4" aria-hidden="true" />
              Refresh
            </Link>
          )}
        </div>
      </header>

      {errorMsg && (
        <div className="flex items-start gap-3 rounded-lg border border-rose/40 bg-rose/5 px-4 py-3 text-sm text-rose">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
          <p>{errorMsg}</p>
        </div>
      )}
      {justAuthorized && !errorMsg && (
        <div className="flex items-start gap-3 rounded-lg border border-brand-100 bg-brand-50 px-4 py-3 text-sm text-brand-700">
          <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
          <p>Facebook authorized. Select the Pages you&apos;d like to connect below.</p>
        </div>
      )}
      {dbError && (
        <div className="flex items-start gap-3 rounded-lg border border-rose/40 bg-rose/5 px-4 py-3 text-sm text-rose">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
          <p>{dbError}</p>
        </div>
      )}

      <section className="rounded-2xl border border-ink-100 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
          <div>
            <h2 className="flex items-center gap-2 text-lg font-semibold text-ink-900">
              <Facebook className="h-5 w-5 text-[#1877F2]" />
              Select Pages to connect
            </h2>
            <p className="mt-1 text-sm text-ink-600">
              Choose any Facebook Pages you want Josh to qualify Messenger leads
              for. Already-connected Pages stay available here for review.
            </p>
          </div>
        </div>

        <div className="mt-6">
          {!tokenRow && !dbError && (
            <div className="rounded-lg border border-dashed border-ink-200 bg-ink-50/50 p-5">
              <p className="text-sm text-ink-600">
                You haven&apos;t authorized Facebook yet. Click{" "}
                <strong>Connect Facebook</strong> to grant Rocketeerio access to
                your Pages and Messenger inbox.
              </p>
              <a
                href="/api/facebook/pages"
                className="mt-4 inline-flex items-center justify-center gap-2 rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700 focus:outline-none focus:ring-2 focus:ring-brand-500/40"
              >
                Connect Facebook
              </a>
            </div>
          )}

          {tokenRow && fetchError && (
            <div className="rounded-lg border border-rose/40 bg-rose/5 px-3 py-2 text-sm text-rose">
              <p>{fetchError}</p>
              <a
                href="/api/facebook/pages"
                className="mt-3 inline-flex items-center justify-center rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700"
              >
                Re-authorize Facebook
              </a>
            </div>
          )}

          {tokenRow && !fetchError && !dbError && (
            <PageSelector pages={availablePages} />
          )}
        </div>
      </section>

      <section>
        <div className="mb-4 flex items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-ink-900">
              Currently connected
            </h2>
            <p className="text-sm text-ink-600">
              Disconnect Pages Josh should no longer manage.
            </p>
          </div>
        </div>

        <ConnectedPagesList pages={pages} />
      </section>
    </div>
  );
}
