"use client";

import Link from "next/link";
import { useId, useState } from "react";
import { ArrowRight, CheckCircle2, Lock, Sparkles, X } from "lucide-react";
import { cn } from "@/lib/utils";

const PLANS = [
  {
    name: "Free",
    pages: "1 Page",
    price: "Current plan",
    description: "Perfect for hiring Josh on one Facebook Page while you test the workflow.",
    current: true,
  },
  {
    name: "Pro",
    pages: "Up to 3 Pages",
    price: "Upgrade",
    description: "Add Josh to multiple locations, brands, or campaign-specific Pages.",
    current: false,
  },
  {
    name: "Business",
    pages: "Up to 10 Pages",
    price: "Scale",
    description: "Cover a larger Page portfolio with one subscription per active Page.",
    current: false,
  },
];

interface UpgradeModalProps {
  triggerLabel?: string;
  triggerClassName?: string;
  triggerVariant?: "primary" | "sidebar" | "subtle";
  onOpenChange?: (open: boolean) => void;
}

export function UpgradeModal({
  triggerLabel = "Connect Another Page",
  triggerClassName,
  triggerVariant = "primary",
  onOpenChange,
}: UpgradeModalProps) {
  const [open, setOpen] = useState(false);
  const titleId = useId();
  const descriptionId = useId();

  function updateOpen(nextOpen: boolean) {
    setOpen(nextOpen);
    onOpenChange?.(nextOpen);
  }

  const triggerClasses = cn(
    "inline-flex items-center justify-center gap-2 rounded-lg text-sm font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-brand-500/40",
    triggerVariant === "primary" &&
      "bg-brand-600 px-4 py-2.5 text-white shadow-sm shadow-brand-500/30 hover:bg-brand-700",
    triggerVariant === "sidebar" &&
      "w-full border border-brand-200 bg-brand-50 px-3 py-2 text-brand-700 hover:border-brand-300 hover:bg-brand-100",
    triggerVariant === "subtle" &&
      "border border-ink-200 bg-white px-4 py-2.5 text-ink-900 hover:border-brand-300 hover:bg-brand-50",
    triggerClassName,
  );

  return (
    <>
      <button
        type="button"
        className={triggerClasses}
        onClick={() => updateOpen(true)}
      >
        <Lock className="h-4 w-4" aria-hidden />
        {triggerLabel}
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center px-4 py-6"
          role="dialog"
          aria-modal="true"
          aria-labelledby={titleId}
          aria-describedby={descriptionId}
        >
          <div
            className="absolute inset-0 bg-ink-900/50 backdrop-blur-sm"
            onClick={() => updateOpen(false)}
          />

          <div className="relative max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-3xl border border-ink-100 bg-white p-6 shadow-2xl shadow-ink-900/20 sm:p-8">
            <button
              type="button"
              aria-label="Close upgrade options"
              onClick={() => updateOpen(false)}
              className="absolute right-4 top-4 inline-flex h-9 w-9 items-center justify-center rounded-full text-ink-500 transition-colors hover:bg-ink-50 hover:text-ink-900"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="pr-10">
              <span className="inline-flex items-center gap-2 rounded-full bg-brand-50 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-brand-700">
                <Sparkles className="h-3.5 w-3.5" aria-hidden />
                Premium Page capacity
              </span>
              <h2
                id={titleId}
                className="mt-4 text-2xl font-bold tracking-tight text-ink-900 sm:text-3xl"
              >
                Hire Josh for each Page that needs lead coverage.
              </h2>
              <p
                id={descriptionId}
                className="mt-3 max-w-2xl text-sm leading-relaxed text-ink-600 sm:text-base"
              >
                Your current Free plan includes 1 Facebook Page. Rocketeerio follows the ManyChat-style model: one Page equals one active subscription seat, so every inbox gets its own Josh-powered coverage.
              </p>
            </div>

            <div className="mt-6 grid gap-4 md:grid-cols-3">
              {PLANS.map((plan) => (
                <div
                  key={plan.name}
                  className={cn(
                    "rounded-2xl border p-5 transition-all",
                    plan.current
                      ? "border-brand-200 bg-brand-50/70"
                      : "border-ink-100 bg-white shadow-sm hover:border-brand-200 hover:shadow-md",
                  )}
                >
                  <div className="flex items-center justify-between gap-3">
                    <h3 className="text-base font-bold text-ink-900">{plan.name}</h3>
                    {plan.current && (
                      <span className="rounded-full bg-white px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-brand-700 shadow-sm">
                        Current
                      </span>
                    )}
                  </div>
                  <p className="mt-3 text-2xl font-bold text-brand-700">{plan.pages}</p>
                  <p className="mt-1 text-xs font-semibold uppercase tracking-wide text-ink-500">
                    {plan.price}
                  </p>
                  <p className="mt-3 text-sm leading-relaxed text-ink-600">
                    {plan.description}
                  </p>
                </div>
              ))}
            </div>

            <div className="mt-7 rounded-2xl border border-ink-100 bg-ink-50/70 p-5">
              <h3 className="text-sm font-bold text-ink-900">
                Why additional Pages require an upgrade
              </h3>
              <div className="mt-3 grid gap-3 text-sm text-ink-700 sm:grid-cols-2">
                <p className="flex gap-2">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 flex-none text-brand-600" />
                  Each Page has its own audience, inbox context, and qualification rules.
                </p>
                <p className="flex gap-2">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 flex-none text-brand-600" />
                  Josh needs a dedicated seat for every Page he answers and qualifies.
                </p>
              </div>
            </div>

            <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm font-medium text-ink-600">
                Ready to cover more Pages? Choose the plan that matches your Page count.
              </p>
              <Link
                href="/pricing"
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-brand-600 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-brand-500/25 transition-colors hover:bg-brand-700 focus:outline-none focus:ring-2 focus:ring-brand-500/40"
              >
                Hire Josh for more Pages
                <ArrowRight className="h-4 w-4" aria-hidden />
              </Link>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
