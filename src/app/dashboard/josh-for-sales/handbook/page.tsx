import { AlertCircle, BookOpen } from "lucide-react";
import { JoshForSalesTabs } from "@/components/dashboard/josh-for-sales-tabs";
import { HandbookSections } from "@/components/dashboard/handbook-sections";

export const dynamic = "force-dynamic";

export default function JoshHandbookPage() {
  return (
    <div className="space-y-5">
      <header className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-brand-100 bg-white px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-brand-700 shadow-sm">
            <BookOpen className="h-3.5 w-3.5" />
            Josh handbook
          </div>
          <h1 className="mt-3 text-2xl font-bold tracking-tight text-ink-900 md:text-3xl">
            Josh&apos;s Handbook
          </h1>
          <p className="mt-1.5 max-w-2xl text-sm leading-relaxed text-ink-600">
            Josh&apos;s living playbook — a smart knowledge base that grows with your sales process.
          </p>
        </div>
      </header>

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

      <HandbookSections scope="josh" />
    </div>
  );
}
