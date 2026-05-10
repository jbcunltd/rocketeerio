"use client";

/*
 * Design philosophy reminder: Soft Swiss SaaS Minimalism.
 * This inbox uses precise alignment, quiet dividers, generous whitespace,
 * pill-shaped signals, and calm panel transitions. Every visual choice should
 * reinforce a professional live-operations workspace grounded in real activity.
 */

import { useMemo, useState } from "react";
import {
  Bot,
  Contact,
  FileText,
  Flame,
  Inbox,
  MessageCircle,
  PanelLeft,
  Search,
  ShieldCheck,
  SlidersHorizontal,
  Tags,
  UserRound,
  Users,
  type LucideIcon,
} from "lucide-react";
import type { LeadTemperature, LiveConversation } from "@/lib/josh-live-inbox-types";
import { cn } from "@/lib/utils";

type InboxPanel = "list" | "thread" | "profile";
type InboxFilter = "all" | "active" | "hot" | "qualified";
type JoshLiveInboxProps = {
  pageName: string;
  pagePictureUrl?: string | null;
  conversations?: LiveConversation[];
  dbUnavailable?: boolean;
};

const panelTabs: Array<{ id: InboxPanel; label: string; icon: LucideIcon }> = [
  { id: "list", label: "Inbox", icon: PanelLeft },
  { id: "thread", label: "Thread", icon: MessageCircle },
  { id: "profile", label: "Profile", icon: Contact },
];

const filters: Array<{ id: InboxFilter; label: string }> = [
  { id: "all", label: "All" },
  { id: "active", label: "Active" },
  { id: "hot", label: "Hot" },
  { id: "qualified", label: "Qualified" },
];

type LiveStat = {
  label: string;
  value: string;
  detail: string;
  icon: LucideIcon;
  tone: "neutral" | "brand" | "hot" | "qualified";
};

function buildLiveStats(conversations: LiveConversation[]): LiveStat[] {
  const activeCount = conversations.filter((conversation) =>
    ["New", "Qualifying"].includes(conversation.qualificationStatus),
  ).length;
  const hotCount = conversations.filter((conversation) => conversation.isHot).length;
  const qualifiedCount = conversations.filter(
    (conversation) => conversation.qualificationStatus === "Qualified",
  ).length;

  return [
    {
      label: "Total Contacts",
      value: String(conversations.length),
      detail: "Everyone who has messaged",
      icon: Users,
      tone: "neutral",
    },
    {
      label: "Active Conversations",
      value: String(activeCount),
      detail: "Currently open threads",
      icon: MessageCircle,
      tone: "brand",
    },
    {
      label: "Hot Leads",
      value: String(hotCount),
      detail: "Pricing, timeline, budget, or call signals",
      icon: Flame,
      tone: "hot",
    },
    {
      label: "Qualified Leads",
      value: String(qualifiedCount),
      detail: "Ready for sales follow-up",
      icon: ShieldCheck,
      tone: "qualified",
    },
  ];
}

export function JoshLiveInbox({
  pageName,
  pagePictureUrl,
  conversations = [],
  dbUnavailable = false,
}: JoshLiveInboxProps) {
  const [activePanel, setActivePanel] = useState<InboxPanel>("list");
  const [activeFilter, setActiveFilter] = useState<InboxFilter>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [filtersOpen, setFiltersOpen] = useState(true);

  const liveStats = useMemo(() => buildLiveStats(conversations), [conversations]);

  const visibleConversations = useMemo(() => {
    const sortedConversations = [...conversations].sort((a, b) =>
      Number(Boolean(b.isHot)) - Number(Boolean(a.isHot)),
    );
    const normalizedQuery = searchQuery.trim().toLowerCase();
    const searchedConversations = normalizedQuery
      ? sortedConversations.filter((conversation) =>
          [
            conversation.leadName,
            conversation.lastMessagePreview,
            conversation.qualificationStatus,
            conversation.leadTemperature ?? "",
          ]
            .join(" ")
            .toLowerCase()
            .includes(normalizedQuery),
        )
      : sortedConversations;

    if (activeFilter === "active") {
      return searchedConversations.filter((conversation) =>
        ["New", "Qualifying"].includes(conversation.qualificationStatus),
      );
    }

    if (activeFilter === "hot") {
      return searchedConversations.filter((conversation) => conversation.isHot);
    }

    if (activeFilter === "qualified") {
      return searchedConversations.filter(
        (conversation) => conversation.qualificationStatus === "Qualified",
      );
    }

    return searchedConversations;
  }, [activeFilter, conversations, searchQuery]);

  const hasConversations = visibleConversations.length > 0;
  const hasAnyConversations = conversations.length > 0;
  const isSearchActive = searchQuery.trim().length > 0;

  return (
    <div className="space-y-5">
      <header className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-brand-100 bg-white px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-brand-700 shadow-sm">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-mint opacity-60" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-mint" />
            </span>
            Josh live inbox
          </div>
          <h1 className="mt-3 text-2xl font-bold tracking-tight text-ink-900 md:text-3xl">
            Josh for Sales
          </h1>
          <p className="mt-1.5 max-w-2xl text-sm leading-relaxed text-ink-600">
            Monitor Messenger conversations from your connected Facebook Page as Josh qualifies leads in real time.
          </p>
        </div>

        <div className="flex items-center gap-3 rounded-2xl border border-ink-100 bg-white px-4 py-3 shadow-sm">
          {pagePictureUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={pagePictureUrl}
              alt=""
              className="h-10 w-10 rounded-full object-cover ring-2 ring-white"
            />
          ) : (
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-50 text-brand-700 ring-2 ring-white">
              <MessageCircle className="h-4 w-4" />
            </div>
          )}
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-ink-900">
              {pageName}
            </p>
            <p className="text-xs text-ink-500">Connected Page · Live-ready</p>
          </div>
        </div>
      </header>

      {dbUnavailable ? (
        <div className="rounded-2xl border border-amber/30 bg-amber/10 px-4 py-3 text-sm text-ink-700">
          We could not confirm the connected Page from the database. Josh can still show the live inbox shell, but the Page name may use a fallback until the database is reachable.
        </div>
      ) : null}

      <div className="grid grid-cols-3 gap-2 rounded-2xl border border-ink-100 bg-white p-1 shadow-sm lg:hidden">
        {panelTabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActivePanel(tab.id)}
              className={cn(
                "inline-flex items-center justify-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold transition-all",
                activePanel === tab.id
                  ? "bg-brand-600 text-white shadow-sm shadow-brand-500/25"
                  : "text-ink-500 hover:bg-ink-50 hover:text-ink-800",
              )}
            >
              <Icon className="h-3.5 w-3.5" />
              {tab.label}
            </button>
          );
        })}
      </div>

      <section className="overflow-hidden rounded-3xl border border-ink-100 bg-white shadow-sm shadow-ink-100/60">
        <div className="grid grid-cols-2 gap-px border-b border-ink-100 bg-ink-100 lg:grid-cols-4">
          {liveStats.map((stat) => {
            const Icon = stat.icon;
            return (
              <div key={stat.label} className="bg-white p-4">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-ink-500">
                    {stat.label}
                  </p>
                  <span
                    className={cn(
                      "flex h-8 w-8 items-center justify-center rounded-xl",
                      stat.tone === "hot"
                        ? "bg-amber/15 text-orange-600"
                        : stat.tone === "qualified"
                          ? "bg-mint/10 text-emerald-700"
                          : stat.tone === "brand"
                            ? "bg-brand-50 text-brand-700"
                            : "bg-ink-50 text-ink-500",
                    )}
                  >
                    <Icon className="h-4 w-4" />
                  </span>
                </div>
                <p
                  className={cn(
                    "mt-3 text-2xl font-bold tracking-tight text-ink-900",
                    stat.tone === "hot" && "text-orange-600",
                  )}
                >
                  {stat.value}
                </p>
                <p className="mt-1 text-xs leading-5 text-ink-500">
                  {stat.detail}
                </p>
              </div>
            );
          })}
        </div>

        <div className="grid min-h-[680px] grid-cols-1 lg:grid-cols-[300px_minmax(0,1fr)_300px] xl:grid-cols-[320px_minmax(0,1fr)_320px]">
          <aside
            className={cn(
              "border-ink-100 bg-white lg:block lg:border-r",
              activePanel === "list" ? "block" : "hidden",
            )}
          >
            <div className="border-b border-ink-100 p-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h2 className="text-sm font-semibold text-ink-900">
                    Conversations
                  </h2>
                  <p className="text-xs text-ink-500">Real leads only</p>
                </div>
                <button
                  type="button"
                  aria-label={filtersOpen ? "Hide conversation filters" : "Show conversation filters"}
                  aria-expanded={filtersOpen}
                  aria-controls="live-inbox-filters"
                  onClick={() => setFiltersOpen((open) => !open)}
                  className={cn(
                    "rounded-xl border p-2 transition-colors",
                    filtersOpen || activeFilter !== "all"
                      ? "border-brand-100 bg-brand-50 text-brand-700"
                      : "border-ink-100 text-ink-500 hover:border-brand-100 hover:bg-brand-50 hover:text-brand-700",
                  )}
                >
                  <SlidersHorizontal className="h-4 w-4" />
                </button>
              </div>

              <label className="mt-4 flex items-center gap-2 rounded-2xl border border-ink-100 bg-ink-50 px-3 py-2.5 text-sm text-ink-500 focus-within:border-brand-200 focus-within:bg-white focus-within:ring-2 focus-within:ring-brand-500/10">
                <Search className="h-4 w-4" />
                <input
                  type="search"
                  placeholder="Search live conversations"
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                  className="w-full bg-transparent text-sm text-ink-900 outline-none placeholder:text-ink-400"
                  aria-label="Search live conversations"
                />
              </label>

              {filtersOpen ? (
                <div id="live-inbox-filters" className="mt-3 grid grid-cols-4 gap-1 rounded-2xl bg-ink-50 p-1">
                  {filters.map((filter) => (
                    <button
                      key={filter.id}
                      type="button"
                      onClick={() => setActiveFilter(filter.id)}
                      className={cn(
                        "rounded-xl px-2 py-1.5 text-xs font-semibold transition-all",
                        activeFilter === filter.id
                          ? filter.id === "hot"
                            ? "bg-amber/20 text-orange-700 shadow-sm"
                            : "bg-white text-ink-900 shadow-sm"
                          : filter.id === "hot"
                            ? "text-orange-600 hover:bg-amber/10"
                            : "text-ink-500 hover:text-ink-800",
                      )}
                    >
                      {filter.label}
                    </button>
                  ))}
                </div>
              ) : null}
            </div>

            <div
              className={cn(
                "min-h-[498px]",
                hasConversations
                  ? "divide-y divide-ink-100"
                  : "flex flex-col items-center justify-center px-5 py-10 text-center",
              )}
            >
              {hasConversations ? (
                visibleConversations.map((conversation) => (
                  <button
                    key={conversation.id}
                    type="button"
                    onClick={() => setActivePanel("thread")}
                    className={cn(
                      "flex w-full items-start gap-3 border-l-4 px-4 py-4 text-left transition-colors hover:bg-ink-50",
                      conversation.isHot
                        ? "border-orange-400 bg-amber/10 hover:bg-amber/15"
                        : "border-transparent",
                    )}
                  >
                    {conversation.leadAvatarUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={conversation.leadAvatarUrl}
                        alt=""
                        className="h-10 w-10 rounded-full object-cover"
                      />
                    ) : (
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-ink-50 text-ink-400">
                        <UserRound className="h-4 w-4" />
                      </div>
                    )}
                    <span className="min-w-0 flex-1">
                      <span className="flex items-center justify-between gap-3">
                        <span className="flex min-w-0 items-center gap-2">
                          <span className="truncate text-sm font-semibold text-ink-900">
                            {conversation.leadName}
                          </span>
                          {conversation.isHot ? (
                            <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-amber/20 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-[0.1em] text-orange-700">
                              <Flame className="h-3 w-3" />
                              Hot
                            </span>
                          ) : null}
                        </span>
                        <span className="shrink-0 text-[11px] text-ink-400">
                          {conversation.timestampLabel}
                        </span>
                      </span>
                      <span className="mt-1 line-clamp-2 text-xs leading-5 text-ink-500">
                        {conversation.lastMessagePreview}
                      </span>
                      <span
                        className={cn(
                          "mt-2 inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.12em]",
                          statusBadgeClass(conversation.qualificationStatus),
                        )}
                      >
                        {conversation.qualificationStatus}
                      </span>
                    </span>
                  </button>
                ))
              ) : (
                <div className="animate-fade-in">
                  <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-ink-50 text-ink-400">
                    <Inbox className="h-5 w-5" />
                  </div>
                  <p className="mt-4 text-sm font-semibold text-ink-900">
                    {hasAnyConversations ? "No conversations match" : "No live conversations yet"}
                  </p>
                  <p className="mt-1.5 text-xs leading-relaxed text-ink-500">
                    {hasAnyConversations
                      ? isSearchActive
                        ? "Try searching another name or message, or clear the current search."
                        : "Try a different conversation filter to see more leads."
                      : "Real Messenger conversations will appear here as the webhook receives them. Hot leads will be pinned to the top automatically."}
                  </p>
                </div>
              )}
            </div>
          </aside>

          <main
            className={cn(
              "min-h-[680px] bg-gradient-to-b from-white to-ink-50/60 lg:block",
              activePanel === "thread" ? "block" : "hidden",
            )}
          >
            <div className="flex h-full min-h-[680px] flex-col">
              <div className="border-b border-ink-100 bg-white/90 px-5 py-4 backdrop-blur">
                <div className="flex items-center justify-between gap-4">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-ink-900">
                      Waiting for first lead
                    </p>
                    <p className="text-xs text-ink-500">
                      Josh is handling incoming conversations automatically.
                    </p>
                  </div>
                  <div className="hidden items-center gap-2 rounded-full bg-brand-50 px-3 py-1.5 text-xs font-semibold text-brand-700 sm:inline-flex">
                    <Bot className="h-3.5 w-3.5" />
                    Josh is online
                  </div>
                </div>
              </div>

              <div className="flex flex-1 items-center justify-center p-6 md:p-10">
                <div className="mx-auto max-w-md text-center animate-pop-in">
                  <div className="relative mx-auto h-24 w-24">
                    <div className="absolute inset-0 rounded-full bg-brand-100 blur-2xl" />
                    <div className="relative flex h-24 w-24 items-center justify-center rounded-full border-4 border-white bg-brand-50 shadow-xl shadow-brand-900/10">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src="/josh-avatar.jpg?v=3"
                        alt="Josh for Sales"
                        className="h-full w-full rounded-full object-cover"
                      />
                      <span className="absolute bottom-1 right-1 flex h-6 w-6 items-center justify-center rounded-full border-4 border-white bg-mint">
                        <span className="absolute h-4 w-4 animate-ping rounded-full bg-mint opacity-60" />
                      </span>
                    </div>
                  </div>

                  <h2 className="mt-6 text-xl font-bold tracking-tight text-ink-900">
                    Josh is online and waiting for leads on {pageName}.
                  </h2>
                  <p className="mt-3 text-sm leading-6 text-ink-600">
                    Conversations will appear here in real-time as they come in.
                  </p>

                  <div className="mt-7 inline-flex items-center gap-2 rounded-full border border-ink-100 bg-white px-4 py-2 text-xs font-semibold text-ink-500 shadow-sm">
                    <span className="relative flex h-2 w-2">
                      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-mint opacity-60" />
                      <span className="relative inline-flex h-2 w-2 rounded-full bg-mint" />
                    </span>
                    Listening for webhook events
                  </div>
                </div>
              </div>

              <div className="border-t border-ink-100 bg-white/80 px-5 py-4">
                <div className="rounded-2xl border border-dashed border-ink-200 bg-white px-4 py-3 text-sm text-ink-500">
                  The reply composer will activate when a real conversation is selected.
                </div>
              </div>
            </div>
          </main>

          <aside
            className={cn(
              "border-ink-100 bg-white lg:block lg:border-l",
              activePanel === "profile" ? "block" : "hidden",
            )}
          >
            <div className="border-b border-ink-100 p-5">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-ink-50 text-ink-300">
                  <UserRound className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-sm font-semibold text-ink-900">
                    Lead profile
                  </h2>
                  <p className="text-xs text-ink-500">No conversation selected</p>
                </div>
              </div>
            </div>

            <div className="space-y-5 p-5">
              <div className="rounded-2xl border border-dashed border-ink-200 bg-ink-50/70 p-4 text-sm text-ink-500">
                Real lead details will appear here after Josh receives a Messenger conversation.
              </div>

              <div className="rounded-2xl border border-ink-100 bg-white p-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.14em] text-ink-400">
                      Lead Temperature
                    </p>
                    <p className="mt-1 text-xs leading-5 text-ink-500">
                      Based on pricing, timeline, budget, and call-request signals.
                    </p>
                  </div>
                  <Flame className="h-4 w-4 text-orange-500" />
                </div>
                <div className="mt-4 grid grid-cols-3 gap-2">
                  {(["Cold", "Warm", "Hot"] as LeadTemperature[]).map((temperature) => (
                    <div
                      key={temperature}
                      className={cn(
                        "rounded-xl border px-2 py-2 text-center text-[11px] font-semibold",
                        temperatureClass(temperature),
                      )}
                    >
                      {temperature === "Hot" ? (
                        <Flame className="mx-auto mb-1 h-3.5 w-3.5" />
                      ) : null}
                      {temperature}
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-3">
                <ProfilePlaceholder icon={ShieldCheck} label="Qualification score" />
                <ProfilePlaceholder icon={FileText} label="Key info collected" />
                <ProfilePlaceholder icon={Tags} label="Tags" />
              </div>

              <button
                type="button"
                disabled
                className="w-full rounded-xl bg-ink-100 px-4 py-3 text-sm font-semibold text-ink-400"
              >
                Take over conversation
              </button>

              <div>
                <label className="text-xs font-semibold uppercase tracking-[0.16em] text-ink-400">
                  Notes
                </label>
                <textarea
                  disabled
                  placeholder="Notes become available once a real lead is selected."
                  className="mt-2 h-28 w-full resize-none rounded-2xl border border-ink-100 bg-ink-50 px-3 py-3 text-sm text-ink-500 outline-none placeholder:text-ink-400"
                />
              </div>
            </div>
          </aside>
        </div>
      </section>
    </div>
  );
}

function statusBadgeClass(status: LiveConversation["qualificationStatus"]) {
  switch (status) {
    case "Qualified":
      return "bg-mint/10 text-emerald-700";
    case "Qualifying":
      return "bg-brand-50 text-brand-700";
    case "Unqualified":
      return "bg-rose/10 text-rose";
    case "New":
    default:
      return "bg-amber/15 text-amber";
  }
}

function temperatureClass(temperature: LeadTemperature) {
  switch (temperature) {
    case "Hot":
      return "border-orange-200 bg-amber/15 text-orange-700";
    case "Warm":
      return "border-amber/30 bg-amber/10 text-amber";
    case "Cold":
    default:
      return "border-ink-100 bg-ink-50 text-ink-500";
  }
}

function ProfilePlaceholder({
  icon: Icon,
  label,
}: {
  icon: LucideIcon;
  label: string;
}) {
  return (
    <div className="rounded-2xl border border-ink-100 bg-white p-4">
      <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-ink-400">
        <Icon className="h-3.5 w-3.5" />
        {label}
      </div>
      <div className="mt-3 h-2 w-2/3 rounded-full bg-ink-100" />
      <div className="mt-2 h-2 w-1/2 rounded-full bg-ink-50" />
    </div>
  );
}
