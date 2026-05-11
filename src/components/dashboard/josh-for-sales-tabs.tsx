"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { BookOpen, Inbox, Settings } from "lucide-react";
import { cn } from "@/lib/utils";

const tabs = [
  {
    href: "/dashboard/josh-for-sales",
    label: "Live Inbox",
    icon: Inbox,
    exact: true,
  },
  {
    href: "/dashboard/josh-for-sales/handbook",
    label: "Handbook",
    icon: BookOpen,
    exact: false,
  },
  {
    href: "/dashboard/josh-for-sales/settings",
    label: "Settings",
    icon: Settings,
    exact: false,
  },
];

export function JoshForSalesTabs() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const selectedPageId = searchParams.get("pageId");

  return (
    <nav
      aria-label="Josh for Sales sections"
      className="flex w-full flex-col gap-2 rounded-2xl border border-ink-100 bg-white p-1 shadow-sm sm:w-auto sm:flex-row"
    >
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const active = tab.exact
          ? pathname === tab.href
          : pathname.startsWith(tab.href);

        const href = selectedPageId
          ? `${tab.href}?pageId=${encodeURIComponent(selectedPageId)}`
          : tab.href;

        return (
          <Link
            key={tab.href}
            href={href}
            className={cn(
              "inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition-all",
              active
                ? "bg-brand-600 text-white shadow-sm shadow-brand-500/25"
                : "text-ink-500 hover:bg-ink-50 hover:text-ink-900",
            )}
          >
            <Icon className="h-4 w-4" />
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}
