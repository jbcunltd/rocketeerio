import Image from "next/image";
import { Bot } from "lucide-react";
import { JoshForSalesTabs } from "@/components/dashboard/josh-for-sales-tabs";

export default function JoshForSalesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-5">
      <section className="overflow-hidden rounded-3xl border border-ink-200 bg-white shadow-sm shadow-ink-100/70">
        <div className="relative h-36 overflow-hidden bg-ink-100 sm:h-44 md:h-56">
          <Image
            src="/josh-cover.jpg"
            alt="Josh timeline cover"
            fill
            className="object-cover object-center"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/5 via-transparent to-black/35" />
        </div>

        <div className="relative px-4 pb-4 pt-0 sm:px-6 md:px-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:gap-5">
              <div className="relative -mt-12 h-24 w-24 shrink-0 overflow-hidden rounded-full border-4 border-white bg-white shadow-lg sm:-mt-14 sm:h-28 sm:w-28 md:-mt-16 md:h-32 md:w-32">
                <Image
                  src="/josh-avatar.jpg"
                  alt="Josh for Sales profile"
                  fill
                  className="object-cover"
                  sizes="(max-width: 640px) 96px, (max-width: 768px) 112px, 128px"
                />
                <span className="absolute bottom-2 right-2 h-4 w-4 rounded-full border-2 border-white bg-green-500 shadow-sm md:h-5 md:w-5" />
              </div>

              <div className="pb-1">
                <div className="inline-flex items-center gap-2 rounded-full border border-brand-100 bg-brand-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-brand-700">
                  <Bot className="h-3.5 w-3.5" />
                  Sales agent
                </div>
                <h1 className="mt-2 text-2xl font-bold tracking-tight text-ink-900 sm:text-3xl">
                  Josh for Sales
                </h1>
                <p className="mt-1 max-w-2xl text-sm leading-6 text-ink-600">
                  Keep Josh&apos;s live inbox, handbook, and settings in one profile-style workspace.
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="border-t border-ink-100 px-4 py-3 sm:px-6 md:px-8">
          <JoshForSalesTabs />
        </div>
      </section>

      {children}
    </div>
  );
}
