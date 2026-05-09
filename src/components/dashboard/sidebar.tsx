"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  Bot,
  LayoutDashboard,
  MessageCircleHeart,
  Menu,
  Settings,
  X,
} from "lucide-react";
import { Logo } from "@/components/logo";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard, avatar: null },
  {
    href: "/dashboard/pages",
    label: "Connected Pages",
    icon: MessageCircleHeart,
    avatar: null,
  },
  {
    href: "/dashboard/josh-for-sales",
    label: "Josh for Sales",
    icon: Bot,
    avatar: "/josh-avatar.jpg",
  },
  { href: "/dashboard/settings", label: "Settings", icon: Settings, avatar: null },
];

interface SidebarProps {
  user: { name?: string | null; email: string; avatarUrl?: string | null };
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

function UserBlock({
  user,
  onLogout,
}: {
  user: SidebarProps["user"];
  onLogout: () => Promise<void>;
}) {
  const initials = (user.name ?? user.email)
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
            {user.name ?? user.email.split("@")[0]}
          </div>
          <div className="truncate text-xs text-ink-500">{user.email}</div>
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

export function Sidebar({ user, onLogout }: SidebarProps) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <>
      {/* Mobile top bar */}
      <div className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-ink-100 bg-white px-4 md:hidden">
        <Link href="/dashboard">
          <Logo />
        </Link>
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
        <div className="flex h-16 items-center px-5">
          <Link href="/dashboard">
            <Logo />
          </Link>
        </div>
        <NavList pathname={pathname} />
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
            <div className="flex h-14 items-center justify-between border-b border-ink-100 px-4">
              <Link href="/dashboard" onClick={() => setOpen(false)}>
                <Logo />
              </Link>
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
            <UserBlock user={user} onLogout={onLogout} />
          </div>
        </div>
      )}
    </>
  );
}
