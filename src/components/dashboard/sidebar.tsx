"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  BookOpen,
  Bot,
  LayoutDashboard,
  MessageCircleHeart,
  Menu,
  Settings,
  X,
} from "lucide-react";
import { Logo } from "@/components/logo";
import { UpgradeModal } from "@/components/dashboard/upgrade-modal";
import { SidebarPageSwitcher } from "@/components/dashboard/sidebar-page-switcher";
import { cn } from "@/lib/utils";

const NAV = [
  {
    href: "/dashboard/pages",
    label: "Connected Pages",
    icon: MessageCircleHeart,
    avatar: null,
  },
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard, avatar: null },
  {
    href: "/dashboard/handbook",
    label: "Company Handbook",
    icon: BookOpen,
    avatar: null,
  },
  {
    href: "/dashboard/josh-for-sales",
    label: "Josh for Sales",
    icon: Bot,
    avatar: "/josh-avatar.jpg?v=2",
  },
  { href: "/dashboard/settings", label: "Settings", icon: Settings, avatar: null },
];

function SidebarBrand({ pages }: { pages: DashboardPage[] }) {
  return (
    <div className="flex flex-col items-start gap-3">
      <Logo href="/dashboard" />
      {pages.length > 0 && <SidebarPageSwitcher pages={pages} />}
    </div>
  );
}

interface DashboardPage {
  id: number;
  pageId: string;
  name: string;
  pictureUrl: string | null;
  isActive: boolean;
}

interface SidebarProps {
  user: { name?: string | null; email?: string | null; avatarUrl?: string | null };
  activePageName?: string | null;
  pages: DashboardPage[];
  onLogout: () => Promise<void>;
}

function NavList({
  pathname,
  onClick,
}: {
  pathname: string;
  onClick?: () => void;
}) {
  return (
    <nav className="flex-1 space-y-1 px-3 py-4">
      {NAV.map((item) => {
        const active =
          pathname === item.href ||
          (item.href !== "/dashboard" && pathname.startsWith(item.href));
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onClick}
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
              active
                ? "bg-brand-50 text-brand-700"
                : "text-ink-600 hover:bg-ink-50 hover:text-ink-900",
            )}
          >
            {item.avatar ? (
              <Image
                src={item.avatar}
                alt={item.label}
                width={20}
                height={20}
                className="h-5 w-5 rounded-full object-cover"
              />
            ) : (
              <item.icon className="h-4 w-4" />
            )}
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}

function SidebarUpgradePrompt() {
  return (
    <div className="px-3 pb-4">
      <div className="rounded-2xl border border-brand-100 bg-brand-50/60 p-3">
        <p className="text-xs font-semibold uppercase tracking-wide text-brand-700">
          Premium feature
        </p>
        <p className="mt-1 text-sm font-medium leading-snug text-ink-900">
          Need Josh on another Page?
        </p>
        <p className="mt-1 text-xs leading-relaxed text-ink-600">
          Upgrade from Free to cover more inboxes.
        </p>
        <UpgradeModal
          triggerLabel="Connect Another Page"
          triggerVariant="sidebar"
          triggerClassName="mt-3"
        />
      </div>
    </div>
  );
}

function UserBlock({
  user,
  onLogout,
}: {
  user: SidebarProps["user"];
  onLogout: () => Promise<void>;
}) {
  const initials = (user.name ?? user.email ?? "U")
    .split(" ")
    .map((p) => p[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
  return (
    <form action={onLogout} className="border-t border-ink-100 p-3">
      <div className="flex items-center gap-3 px-2 py-2">
        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-100 text-sm font-semibold text-brand-700">
          {user.avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={user.avatarUrl}
              alt=""
              width={36}
              height={36}
              loading="lazy"
              decoding="async"
              className="h-9 w-9 rounded-full object-cover"
            />
          ) : (
            initials
          )}
        </div>
        <div className="min-w-0 flex-1">
          <div className="truncate text-sm font-medium text-ink-900">
            {user.name ?? user.email?.split("@")[0] ?? "User"}
          </div>
          {user.email && (
            <div className="truncate text-xs text-ink-500">{user.email}</div>
          )}
        </div>
      </div>
      <button
        type="submit"
        className="mt-2 w-full rounded-md px-3 py-2 text-left text-xs text-ink-500 hover:bg-ink-50 hover:text-ink-900"
      >
        Sign out
      </button>
    </form>
  );
}

export function Sidebar({ user, pages, onLogout }: SidebarProps) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <>
      {/* Mobile top bar */}
      <div className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-ink-100 bg-white px-4 md:hidden">
        <Logo href="/dashboard" />
        <button
          type="button"
          aria-label="Open menu"
          onClick={() => setOpen(true)}
          className="inline-flex h-9 w-9 items-center justify-center rounded-md hover:bg-ink-50"
        >
          <Menu className="h-5 w-5" />
        </button>
      </div>

      {/* Desktop sidebar */}
      <aside className="hidden h-screen w-64 shrink-0 flex-col border-r border-ink-100 bg-white md:sticky md:top-0 md:flex">
        <div className="flex min-h-20 items-center px-5 py-4">
          <SidebarBrand pages={pages} />
        </div>
        <NavList pathname={pathname} />
        <SidebarUpgradePrompt />
        <UserBlock user={user} onLogout={onLogout} />
      </aside>

      {/* Mobile drawer */}
      {open && (
        <div className="fixed inset-0 z-50 md:hidden" role="dialog">
          <div
            className="absolute inset-0 bg-ink-900/40"
            onClick={() => setOpen(false)}
          />
          <div className="absolute left-0 top-0 flex h-full w-72 flex-col bg-white shadow-xl">
            <div className="flex min-h-16 items-center justify-between border-b border-ink-100 px-4 py-3">
              <SidebarBrand pages={pages} />
              <button
                type="button"
                aria-label="Close menu"
                onClick={() => setOpen(false)}
                className="inline-flex h-9 w-9 items-center justify-center rounded-md hover:bg-ink-50"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <NavList pathname={pathname} onClick={() => setOpen(false)} />
            <SidebarUpgradePrompt />
            <UserBlock user={user} onLogout={onLogout} />
          </div>
        </div>
      )}
    </>
  );
}
