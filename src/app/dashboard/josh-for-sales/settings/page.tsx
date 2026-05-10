/*
 * Design philosophy reminder: Soft Swiss SaaS Minimalism with iOS Material controls.
 * This server page keeps the Josh Settings route quiet and data-scoped: it loads the
 * connected Facebook Page context, renders the existing Josh tabs, then lets the
 * client panel handle the tactile settings controls and handbook-proxy persistence.
 */

import { Settings } from "lucide-react";
import { JoshForSalesTabs } from "@/components/dashboard/josh-for-sales-tabs";
import { JoshSettingsPanel } from "@/components/dashboard/josh-settings-panel";
import { getFirstConnectedFacebookPage } from "@/lib/handbook-page-context";

export const dynamic = "force-dynamic";

export default async function JoshSettingsPage() {
  const { pageId, pageName, pagePictureUrl, dbUnavailable } = await getFirstConnectedFacebookPage();

  return (
    <div className="space-y-5">
      <header className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-brand-100 bg-white px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-brand-700 shadow-sm">
            <Settings className="h-3.5 w-3.5" />
            Josh settings
          </div>
          <h1 className="mt-3 text-2xl font-bold tracking-tight text-ink-900 md:text-3xl">
            Josh Settings
          </h1>
          <p className="mt-1.5 max-w-2xl text-sm leading-relaxed text-ink-600">
            Control Josh&apos;s live mode, business hours, response behavior, connected Page, and safety actions for sales conversations.
          </p>
        </div>
      </header>

      <JoshForSalesTabs />

      <JoshSettingsPanel
        pageId={pageId}
        pageName={pageName}
        pagePictureUrl={pagePictureUrl}
        dbUnavailable={dbUnavailable}
      />
    </div>
  );
}
