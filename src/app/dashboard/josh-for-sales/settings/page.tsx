import { JoshForSalesTabs } from "@/components/dashboard/josh-for-sales-tabs";

export const dynamic = "force-dynamic";

export default function JoshSettingsPage() {
  return (
    <div className="space-y-5">
      <header className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-brand-100 bg-white px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-brand-700 shadow-sm">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-mint opacity-60" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-mint" />
            </span>
            Josh settings
          </div>
          <h1 className="mt-3 text-2xl font-bold tracking-tight text-ink-900 md:text-3xl">
            Josh Settings
          </h1>
          <p className="mt-1.5 max-w-2xl text-sm leading-relaxed text-ink-600">
            Configure Josh-specific settings like business hours and integrations.
          </p>
        </div>
      </header>

      <JoshForSalesTabs />

      <div className="rounded-3xl border border-ink-100 bg-white p-8 text-center shadow-sm">
        <div className="mx-auto max-w-md">
          <h2 className="text-lg font-bold text-ink-900">Josh Settings</h2>
          <p className="mt-2 text-sm leading-6 text-ink-600">
            Josh-specific settings like business hours, integrations, and response preferences will be available here.
          </p>
        </div>
      </div>
    </div>
  );
}
