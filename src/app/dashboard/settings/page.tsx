import Link from "next/link";
import { eq } from "drizzle-orm";
import { AlertTriangle, CheckCircle2, Facebook } from "lucide-react";
import { db } from "@/lib/db";
import {
  facebookPageTable,
  facebookUserTokenTable,
} from "@/lib/db/schema";
import { fetchUserPages } from "@/lib/auth/facebook";
import { getCurrentSession } from "@/lib/auth/cookies";
import {
  PageSelector,
  type AvailablePage,
} from "@/components/dashboard/page-selector";
import { disconnectFacebookAction } from "./actions";

export const dynamic = "force-dynamic";

const ERROR_MESSAGES: Record<string, string> = {
  invalid_state: "Your authorization expired. Please try connecting again.",
  missing_code: "Facebook didn't return a code. Please try again.",
  token_exchange: "We couldn't complete the Facebook authorization.",
  graph_failed: "We couldn't reach Facebook. Please try again in a moment.",
  facebook_unavailable: "Facebook integration is not configured yet.",
};

export default async function SettingsPage({
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
  let connectedSet = new Set<string>();
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
    connectedSet = new Set(connectedRows.map((r) => r.pageId));
  } catch (err) {
    console.error("[settings] db unavailable", err);
  }

  let availablePages: AvailablePage[] = [];
  let fetchError: string | null = null;
  if (tokenRow) {
    try {
      const pages = await fetchUserPages(tokenRow.accessToken);
      availablePages = pages.map((p) => ({
        id: p.id,
        name: p.name,
        category: p.category ?? null,
        pictureUrl: p.picture?.data?.url ?? null,
        alreadyConnected: connectedSet.has(p.id),
      }));
    } catch (err) {
      console.error("[settings] fetchUserPages", err);
      fetchError =
        "We couldn't load your Facebook Pages. Your token may have expired — please re-authorize.";
    }
  }

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-2xl font-bold tracking-tight text-ink-900 md:text-3xl">
          Settings
        </h1>
        <p className="text-sm text-ink-600">
          Manage your Facebook integration and account preferences.
        </p>
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
          <p>
            Facebook authorized. Pick the Pages you&apos;d like to connect
            below.
          </p>
        </div>
      )}

      <div className="rounded-2xl border border-ink-100 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
          <div>
            <h2 className="flex items-center gap-2 text-lg font-semibold text-ink-900">
              <Facebook className="h-5 w-5 text-[#1877F2]" />
              Facebook integration
            </h2>
            <p className="mt-1 text-sm text-ink-600">
              Authorize Rocketeerio to manage your Facebook Pages and Messenger
              inbox.
            </p>
          </div>
          {!tokenRow ? (
            <a
              href="/api/facebook/pages"
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-brand-500 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-600"
            >
              Connect Facebook
            </a>
          ) : (
            <div className="flex flex-wrap gap-2">
              <a
                href="/api/facebook/pages"
                className="inline-flex items-center justify-center gap-2 rounded-lg border border-ink-200 bg-white px-4 py-2 text-sm font-semibold text-ink-800 hover:bg-ink-50"
              >
                Re-authorize
              </a>
              <form action={disconnectFacebookAction}>
                <button
                  type="submit"
                  className="rounded-lg px-3 py-2 text-sm font-medium text-ink-500 hover:bg-ink-50 hover:text-ink-900"
                >
                  Disconnect
                </button>
              </form>
            </div>
          )}
        </div>

        <div className="mt-6">
          {!tokenRow && (
            <p className="text-sm text-ink-600">
              You haven&apos;t authorized Facebook yet. Click{" "}
              <strong>Connect Facebook</strong> to grant Rocketeerio access to
              your Pages and Messenger inbox.
            </p>
          )}

          {tokenRow && fetchError && (
            <p className="rounded-lg border border-rose/40 bg-rose/5 px-3 py-2 text-sm text-rose">
              {fetchError}
            </p>
          )}

          {tokenRow && !fetchError && (
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-semibold text-ink-900">
                  Select Pages to connect
                </h3>
                <p className="text-xs text-ink-500">
                  Choose any Pages you&apos;d like Rocketeerio to qualify
                  Messenger leads for.
                </p>
              </div>
              <PageSelector pages={availablePages} />
            </div>
          )}
        </div>
      </div>

      <div className="rounded-2xl border border-ink-100 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-ink-900">Account</h2>
        <p className="mt-1 text-sm text-ink-600">Basic profile information.</p>
        <dl className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <dt className="text-xs uppercase tracking-wider text-ink-500">
              Name
            </dt>
            <dd className="mt-1 text-sm font-medium text-ink-900">
              {user.name ?? "—"}
            </dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-wider text-ink-500">
              Email
            </dt>
            <dd className="mt-1 text-sm font-medium text-ink-900">
              {user.email}
            </dd>
          </div>
        </dl>
        <p className="mt-4 text-xs text-ink-500">
          <Link
            href="/dashboard/pages"
            className="text-brand-600 hover:text-brand-700"
          >
            View your Connected Pages →
          </Link>
        </p>
      </div>
    </div>
  );
}
