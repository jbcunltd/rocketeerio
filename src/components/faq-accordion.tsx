"use client";

import { useState } from "react";
import { Plus, Minus } from "lucide-react";

export type FAQItem = { q: string; a: string };

export function FAQAccordion({ items }: { items: FAQItem[] }) {
  const [open, setOpen] = useState<number | null>(0);
  return (
    <div className="divide-y divide-ink-100 rounded-2xl border border-ink-100 bg-white">
      {items.map((item, i) => {
        const isOpen = open === i;
        return (
          <div key={i} className="px-5 sm:px-7">
            <button
              type="button"
              onClick={() => setOpen(isOpen ? null : i)}
              className="flex w-full items-center justify-between gap-4 py-5 text-left"
              aria-expanded={isOpen}
            >
              <span className="text-base font-medium text-ink-900 sm:text-lg">
                {item.q}
              </span>
              <span
                className={`grid h-8 w-8 flex-none place-items-center rounded-full transition-colors ${
                  isOpen ? "bg-brand-500 text-white" : "bg-ink-50 text-ink-700"
                }`}
              >
                {isOpen ? <Minus className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
              </span>
            </button>
            <div
              className={`grid overflow-hidden transition-all duration-300 ${
                isOpen ? "grid-rows-[1fr] opacity-100 pb-5" : "grid-rows-[0fr] opacity-0"
              }`}
            >
              <div className="min-h-0">
                <p className="pr-12 text-[0.975rem] leading-relaxed text-ink-600">
                  {item.a}
                </p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
