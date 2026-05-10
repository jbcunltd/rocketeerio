import { AlertCircle, BookOpen } from "lucide-react";
import Image from "next/image";
import { JoshForSalesTabs } from "@/components/dashboard/josh-for-sales-tabs";
import { HandbookSections } from "@/components/dashboard/handbook-sections";
import { getFirstConnectedFacebookPage } from "@/lib/handbook-page-context";

export const dynamic = "force-dynamic";

export default async function JoshHandbookPage() {
  const { pageId, pageName, dbUnavailable } = await getFirstConnectedFacebookPage();
  return (
    <div className="space-y-5">
      {/* Subtle Facebook-style profile header */}
      <div className="relative overflow-hidden rounded-2xl border border-ink-200 bg-white shadow-sm">
        {/* Cover photo - subtle, muted */}
        <div className="relative h-28 md:h-36 overflow-hidden">
          <Image
            src="/josh-cover.jpg"
            alt="Josh cover"
            fill
            className="object-cover object-center opacity-80"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-white/90" />
        </div>
        {/* Profile section overlapping cover */}
        <div className="relative px-5 pb-4 -mt-10 md:-mt-12 flex items-end gap-4">
          <div className="relative h-16 w-16 md:h-20 md:w-20 shrink-0 rounded-full border-[3px] border-white shadow-md overflow-hidden">
            <Image
              src="/josh-avatar.jpg"
              alt="Josh for Sales"
              fill
              className="object-cover"
            />
            <div className="absolute bottom-0.5 right-0.5 h-3 w-3 rounded-full border-2 border-white bg-green-500" />
          </div>
          <div className="pb-1">
            <div className="inline-flex items-center gap-2 rounded-full border border-brand-100 bg-white/80 backdrop-blur-sm px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-brand-700 shadow-sm">
              <BookOpen className="h-3.5 w-3.5" />
              Josh handbook
            </div>
            <h1 className="mt-1.5 text-xl font-bold tracking-tight text-ink-900 md:text-2xl">
              Josh&apos;s Handbook
            </h1>
            <p className="mt-0.5 max-w-2xl text-xs leading-relaxed text-ink-500">
              His living playbook — a smart knowledge base that grows with your sales process.
            </p>
          </div>
        </div>
      </div>

      <JoshForSalesTabs />

      <div className="flex items-start gap-3 rounded-2xl border border-brand-100 bg-brand-50 px-4 py-3">
        <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-brand-700" />
        <div>
          <p className="text-sm font-semibold text-brand-900">Josh also inherits from the General Handbook</p>
          <p className="mt-1 text-xs leading-5 text-brand-800">
            Any knowledge, personality, or qualification criteria you add to the Company Handbook will automatically apply to Josh. These settings are Josh-specific overrides and additions.
          </p>
        </div>
      </div>

      <HandbookSections scope="josh" pageId={pageId} pageName={pageName} dbUnavailable={dbUnavailable} />
    </div>
  );
}
