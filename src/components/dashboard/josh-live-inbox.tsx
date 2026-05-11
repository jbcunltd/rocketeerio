"use client";

/*
 * Design philosophy reminder: Soft Swiss SaaS Minimalism.
 * This inbox uses precise alignment, quiet dividers, generous whitespace,
 * pill-shaped signals, and calm panel transitions. Every visual choice should
 * reinforce a professional live-operations workspace grounded in real activity.
 */

import { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  Bot,
  Check,
  CheckCheck,
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
import type { LeadTemperature, LiveConversation, LiveConversationMessage, MessageDirection } from "@/lib/josh-live-inbox-types";
import { cn } from "@/lib/utils";

type InboxPanel = "list" | "thread" | "profile";
type InboxFilter = "all" | "active" | "hot" | "qualified";
type JoshLiveInboxProps = {
  pageId?: string | null;
  pageName: string;
  pagePictureUrl?: string | null;
  conversations?: LiveConversation[];
  dbUnavailable?: boolean;
};

type JoshLiveInboxPollResponse = {
  pageId?: string | null;
  pageName: string;
  pagePictureUrl: string | null;
  conversations: LiveConversation[];
  dbUnavailable: boolean;
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

const profileFields: Array<{ key: "budget" | "authority" | "need" | "timeline" | "location"; label: string }> = [
  { key: "budget", label: "Budget" },
  { key: "authority", label: "Authority" },
  { key: "need", label: "Need" },
  { key: "timeline", label: "Timeline" },
  { key: "location", label: "Location" },
];

type LiveStat = {
  label: string;
  value: string;
  detail: string;
  icon: LucideIcon;
  tone: "neutral" | "brand" | "hot" | "qualified";
};

type ThreadDateItem = {
  type: "date";
  id: string;
  label: string;
};

type ThreadMessageGroup = {
  type: "group";
  id: string;
  direction: MessageDirection;
  messages: LiveConversationMessage[];
};

type ThreadItem = ThreadDateItem | ThreadMessageGroup;

type BubblePosition = "solo" | "first" | "middle" | "last";

function areConversationsEqual(
  currentConversations: LiveConversation[],
  nextConversations: LiveConversation[],
) {
  return JSON.stringify(currentConversations) === JSON.stringify(nextConversations);
}


function getConversationSortTime(conversation: LiveConversation) {
  const lastMessage = conversation.messages.at(-1);
  const candidate = lastMessage?.timestampIso;
  const time = candidate ? Date.parse(candidate) : 0;
  return Number.isFinite(time) ? time : 0;
}

function getLatestMessageSignature(conversations: LiveConversation[]) {
  let latest: { signature: string; time: number } | null = null;

  for (const conversation of conversations) {
    const message = conversation.messages.at(-1);
    if (!message) continue;
    const time = message.timestampIso ? Date.parse(message.timestampIso) : 0;
    const safeTime = Number.isFinite(time) ? time : 0;
    const signature = `${conversation.id}:${message.id}:${message.direction}:${message.timestampIso ?? message.timestampLabel}`;

    if (!latest || safeTime >= latest.time) latest = { signature, time: safeTime };
  }

  return latest?.signature ?? null;
}

function playNewMessageSound() {
  try {
    const AudioContextConstructor = window.AudioContext || (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextConstructor) return;

    const audioContext = new AudioContextConstructor();
    const oscillator = audioContext.createOscillator();
    const gain = audioContext.createGain();

    oscillator.type = "sine";
    oscillator.frequency.setValueAtTime(740, audioContext.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(980, audioContext.currentTime + 0.08);
    gain.gain.setValueAtTime(0.0001, audioContext.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.055, audioContext.currentTime + 0.015);
    gain.gain.exponentialRampToValueAtTime(0.0001, audioContext.currentTime + 0.18);

    oscillator.connect(gain);
    gain.connect(audioContext.destination);
    oscillator.start();
    oscillator.stop(audioContext.currentTime + 0.2);
    window.setTimeout(() => void audioContext.close().catch(() => undefined), 260);
  } catch {
    // Browsers can block audio until user interaction; notification sound is progressive enhancement.
  }
}

function buildThreadItems(messages: LiveConversationMessage[]): ThreadItem[] {
  const items: ThreadItem[] = [];
  let activeGroup: ThreadMessageGroup | null = null;
  let currentDateLabel: string | null = null;

  for (const message of messages) {
    const dateLabel = getMessageDateLabel(message);
    if (dateLabel !== currentDateLabel) {
      activeGroup = null;
      currentDateLabel = dateLabel;
      items.push({ type: "date", id: `date-${dateLabel}-${message.id}`, label: dateLabel });
    }

    if (!activeGroup || activeGroup.direction !== message.direction) {
      activeGroup = {
        type: "group",
        id: `group-${message.id}`,
        direction: message.direction,
        messages: [message],
      };
      items.push(activeGroup);
    } else {
      activeGroup.messages.push(message);
    }
  }

  return items;
}

function getMessageDateLabel(message: LiveConversationMessage) {
  if (!message.timestampIso) return "Recent";
  const date = new Date(message.timestampIso);
  if (Number.isNaN(date.getTime())) return "Recent";

  const today = new Date();
  const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime();
  const startOfMessageDay = new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
  const dayDelta = Math.round((startOfToday - startOfMessageDay) / 86_400_000);

  if (dayDelta === 0) return "Today";
  if (dayDelta === 1) return "Yesterday";
  if (dayDelta > 1 && dayDelta < 7) return date.toLocaleDateString(undefined, { weekday: "long" });
  return date.toLocaleDateString(undefined, { month: "short", day: "numeric", year: date.getFullYear() === today.getFullYear() ? undefined : "numeric" });
}

function shouldShowJoshTyping(conversation: LiveConversation) {
  const lastMessage = conversation.messages.at(-1);
  if (!lastMessage || lastMessage.direction !== "inbound") return false;
  if (!lastMessage.timestampIso) return ["New", "Qualifying"].includes(conversation.qualificationStatus);

  const lastMessageTime = Date.parse(lastMessage.timestampIso);
  if (!Number.isFinite(lastMessageTime)) return true;
  return Date.now() - lastMessageTime < 3 * 60 * 1000;
}

function getBubblePosition(index: number, total: number): BubblePosition {
  if (total === 1) return "solo";
  if (index === 0) return "first";
  if (index === total - 1) return "last";
  return "middle";
}

function bubbleRadiusClass(direction: MessageDirection, position: BubblePosition) {
  if (direction === "outbound") {
    switch (position) {
      case "solo":
      case "first":
        return "rounded-[20px_20px_6px_20px]";
      case "middle":
        return "rounded-[20px_6px_6px_20px]";
      case "last":
        return "rounded-[20px_6px_20px_20px]";
    }
  }

  switch (position) {
    case "solo":
    case "first":
      return "rounded-[20px_20px_20px_6px]";
    case "middle":
      return "rounded-[6px_20px_20px_6px]";
    case "last":
      return "rounded-[6px_20px_20px_20px]";
  }
}

function isLastOutboundMessage(conversation: LiveConversation, messageId: string) {
  const lastOutbound = [...conversation.messages].reverse().find((message) => message.direction === "outbound");
  return lastOutbound?.id === messageId;
}

function hasInboundAfterMessage(conversation: LiveConversation, message: LiveConversationMessage) {
  const messageIndex = conversation.messages.findIndex((candidate) => candidate.id === message.id);
  if (messageIndex === -1) return false;
  return conversation.messages.slice(messageIndex + 1).some((candidate) => candidate.direction === "inbound");
}

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
  pageId = null,
  pageName,
  pagePictureUrl,
  conversations = [],
  dbUnavailable = false,
}: JoshLiveInboxProps) {
  const [activePanel, setActivePanel] = useState<InboxPanel>("list");
  const [activeFilter, setActiveFilter] = useState<InboxFilter>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [filtersOpen, setFiltersOpen] = useState(true);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [livePageName, setLivePageName] = useState(pageName);
  const [livePagePictureUrl, setLivePagePictureUrl] = useState<string | null>(pagePictureUrl ?? null);
  const [liveConversations, setLiveConversations] = useState(conversations);
  const [liveDbUnavailable, setLiveDbUnavailable] = useState(dbUnavailable);
  const latestMessageSignatureRef = useRef(getLatestMessageSignature(conversations));

  useEffect(() => {
    setLivePageName(pageName);
  }, [pageName]);

  useEffect(() => {
    setLivePagePictureUrl(pagePictureUrl ?? null);
  }, [pagePictureUrl]);

  useEffect(() => {
    setLiveConversations((currentConversations) =>
      areConversationsEqual(currentConversations, conversations) ? currentConversations : conversations,
    );
  }, [conversations]);

  useEffect(() => {
    setLiveDbUnavailable((currentDbUnavailable) =>
      currentDbUnavailable === dbUnavailable ? currentDbUnavailable : dbUnavailable,
    );
  }, [dbUnavailable]);

  useEffect(() => {
    const nextSignature = getLatestMessageSignature(liveConversations);
    if (latestMessageSignatureRef.current && nextSignature && nextSignature !== latestMessageSignatureRef.current) {
      playNewMessageSound();
    }
    latestMessageSignatureRef.current = nextSignature;
  }, [liveConversations]);

  const searchParams = useSearchParams();
  const selectedPageId = searchParams.get("pageId");
  const pollingPageId = selectedPageId ?? pageId;

  useEffect(() => {
    let cancelled = false;
    let refreshInFlight = false;

    async function refreshLiveInbox() {
      if (refreshInFlight) return;
      refreshInFlight = true;

      try {
        const url = new URL("/api/dashboard/josh-live-inbox", window.location.origin);
        if (pollingPageId) {
          url.searchParams.set("pageId", pollingPageId);
        }
        const response = await fetch(url.toString(), {
          cache: "no-store",
        });

        if (!response.ok) return;

        const data = (await response.json()) as JoshLiveInboxPollResponse;
        if (cancelled) return;

        setLivePageName((currentPageName) =>
          currentPageName === data.pageName ? currentPageName : data.pageName,
        );
        setLivePagePictureUrl((currentPagePictureUrl) =>
          currentPagePictureUrl === data.pagePictureUrl ? currentPagePictureUrl : data.pagePictureUrl,
        );
        setLiveDbUnavailable((currentDbUnavailable) =>
          currentDbUnavailable === data.dbUnavailable ? currentDbUnavailable : data.dbUnavailable,
        );
        setLiveConversations((currentConversations) =>
          areConversationsEqual(currentConversations, data.conversations)
            ? currentConversations
            : data.conversations,
        );
      } catch (error) {
        console.warn("[josh inbox] live inbox polling failed", error);
      } finally {
        refreshInFlight = false;
      }
    }

    void refreshLiveInbox();
    const pollingInterval = window.setInterval(refreshLiveInbox, 5000);

    return () => {
      cancelled = true;
      window.clearInterval(pollingInterval);
    };
  }, [pollingPageId]);

  const liveStats = useMemo(() => buildLiveStats(liveConversations), [liveConversations]);

  const visibleConversations = useMemo(() => {
    const sortedConversations = [...liveConversations].sort((a, b) => {
      const hotDelta = Number(Boolean(b.isHot)) - Number(Boolean(a.isHot));
      if (hotDelta !== 0) return hotDelta;
      return getConversationSortTime(b) - getConversationSortTime(a);
    });
    const normalizedQuery = searchQuery.trim().toLowerCase();
    const searchedConversations = normalizedQuery
      ? sortedConversations.filter((conversation) =>
          [
            conversation.leadName,
            conversation.lastMessagePreview,
            conversation.qualificationStatus,
            conversation.leadTemperature ?? "",
            conversation.decision?.leadStage ?? "",
            conversation.decision?.nextAction ?? "",
            ...(conversation.decision?.riskFlags ?? []),
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
  }, [activeFilter, liveConversations, searchQuery]);

  const activeConversation = useMemo(() => {
    if (activeConversationId) {
      const selected = liveConversations.find((conversation) => conversation.id === activeConversationId);
      if (selected) return selected;
    }

    return visibleConversations[0] ?? null;
  }, [activeConversationId, liveConversations, visibleConversations]);

  const activeThreadItems = useMemo(
    () => (activeConversation ? buildThreadItems(activeConversation.messages) : []),
    [activeConversation],
  );
  const joshIsTyping = activeConversation ? shouldShowJoshTyping(activeConversation) : false;
  const hasConversations = visibleConversations.length > 0;
  const hasAnyConversations = liveConversations.length > 0;
  const isSearchActive = searchQuery.trim().length > 0;

  function selectConversation(conversation: LiveConversation, panel: InboxPanel = "thread") {
    setActiveConversationId(conversation.id);
    setActivePanel(panel);
  }

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
          {livePagePictureUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={livePagePictureUrl}
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
              {livePageName}
            </p>
            <p className="text-xs text-ink-500">Connected Page · Live-ready</p>
          </div>
        </div>
      </header>

      {liveDbUnavailable ? (
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
                visibleConversations.map((conversation) => {
                  const selected = activeConversation?.id === conversation.id;
                  const latestMessage = conversation.messages.at(-1);
                  const unreadStyle = latestMessage?.direction === "inbound";

                  return (
                    <button
                      key={conversation.id}
                      type="button"
                      onClick={() => selectConversation(conversation)}
                      className={cn(
                        "group flex w-full items-start gap-3 px-3 py-3 text-left transition-all hover:bg-ink-50",
                        selected ? "bg-brand-50/80" : conversation.isHot ? "bg-amber/10 hover:bg-amber/15" : "bg-white",
                      )}
                    >
                      <span className="relative shrink-0">
                        <LeadAvatar conversation={conversation} className="h-11 w-11 ring-2 ring-white shadow-sm" />
                        {unreadStyle ? <span className="absolute -right-0.5 -top-0.5 h-3 w-3 rounded-full border-2 border-white bg-brand-500" /> : null}
                      </span>
                      <span className={cn("min-w-0 flex-1 rounded-2xl px-2 py-1 transition", selected && "bg-white shadow-sm ring-1 ring-brand-100")}>
                        <span className="flex items-center justify-between gap-3">
                          <span className="flex min-w-0 items-center gap-2">
                            <span className={cn("truncate text-sm text-ink-900", unreadStyle ? "font-extrabold" : "font-semibold")}>
                              {conversation.leadName}
                            </span>
                            {conversation.isHot ? (
                              <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-amber/20 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-[0.1em] text-orange-700">
                                <Flame className="h-3 w-3" />
                                Hot
                              </span>
                            ) : null}
                          </span>
                          <span className={cn("shrink-0 text-[11px]", unreadStyle ? "font-bold text-brand-600" : "text-ink-400")}>
                            {conversation.timestampLabel}
                          </span>
                        </span>
                        <span className={cn("mt-1 flex items-center gap-1.5 text-xs leading-5", unreadStyle ? "font-semibold text-ink-700" : "text-ink-500")}>
                          {latestMessage?.direction === "outbound" ? <CheckCheck className="h-3.5 w-3.5 shrink-0 text-brand-500" /> : null}
                          <span className="line-clamp-2">{conversation.lastMessagePreview}</span>
                        </span>
                        <span className="mt-2 flex flex-wrap items-center gap-1.5">
                          <span
                            className={cn(
                              "inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.12em]",
                              statusBadgeClass(conversation.qualificationStatus),
                            )}
                          >
                            {conversation.qualificationStatus}
                          </span>
                          {conversation.leadTemperature ? (
                            <span className={cn("inline-flex rounded-full border px-2 py-0.5 text-[10px] font-semibold", temperatureClass(conversation.leadTemperature))}>
                              {conversation.leadTemperature}
                            </span>
                          ) : null}
                        </span>
                      </span>
                    </button>
                  );
                })
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
                  <div className="flex min-w-0 items-center gap-3">
                    {activeConversation ? <LeadAvatar conversation={activeConversation} className="h-10 w-10" /> : null}
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-ink-900">
                        {activeConversation ? activeConversation.leadName : "Waiting for first lead"}
                      </p>
                      <p className="text-xs text-ink-500">
                        {activeConversation
                          ? `${activeConversation.messages.length} Messenger message${activeConversation.messages.length === 1 ? "" : "s"} · ${activeConversation.qualificationStatus}`
                          : "Josh is handling incoming conversations automatically."}
                      </p>
                    </div>
                  </div>
                  <div className="hidden items-center gap-2 rounded-full bg-brand-50 px-3 py-1.5 text-xs font-semibold text-brand-700 sm:inline-flex">
                    <Bot className="h-3.5 w-3.5" />
                    Josh is online
                  </div>
                </div>
              </div>

              {activeConversation ? (
                <div className="max-h-[calc(100vh-300px)] min-h-0 flex-1 space-y-4 overflow-y-auto px-5 py-6 md:px-8">
                  {activeConversation.messages.length > 0 ? (
                    <>
                      {activeThreadItems.map((item) =>
                        item.type === "date" ? (
                          <MessageDateSeparator key={item.id} label={item.label} />
                        ) : (
                          <ConversationMessageGroup
                            key={item.id}
                            conversation={activeConversation}
                            group={item}
                          />
                        ),
                      )}
                      {joshIsTyping ? <JoshTypingIndicator /> : null}
                    </>
                  ) : (
                    <div className="flex h-full items-center justify-center p-6 md:p-10">
                      <div className="mx-auto max-w-md text-center animate-pop-in">
                        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-ink-50 text-ink-400">
                          <MessageCircle className="h-6 w-6" />
                        </div>
                        <h2 className="mt-5 text-lg font-bold tracking-tight text-ink-900">
                          No stored messages for this lead yet
                        </h2>
                        <p className="mt-2 text-sm leading-6 text-ink-600">
                          The conversation exists, but the middleware did not return message bodies for this thread.
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
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
                      Josh is online and waiting for leads on {livePageName}.
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
              )}

              <div className="border-t border-ink-100 bg-white/80 px-5 py-4">
                <div className="rounded-2xl border border-dashed border-ink-200 bg-white px-4 py-3 text-sm text-ink-500">
                  {activeConversation
                    ? "Josh sends replies through the middleware. Manual takeover controls can be enabled when the owner handoff flow is ready."
                    : "The reply composer will activate when a real conversation is selected."}
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
            {activeConversation ? (
              <LeadProfilePanel conversation={activeConversation} />
            ) : (
              <EmptyProfilePanel />
            )}
          </aside>
        </div>
      </section>
    </div>
  );
}

function LeadProfilePanel({ conversation }: { conversation: LiveConversation }) {
  const decision = conversation.decision;
  const confidence = decision?.confidence ?? null;
  const availableFields = profileFields.filter(({ key }) => decision?.qualificationFields[key]);
  const tags = buildProfileTags(conversation);

  return (
    <>
      <div className="border-b border-ink-100 p-5">
        <div className="flex items-center gap-3">
          <LeadAvatar conversation={conversation} className="h-12 w-12" />
          <div className="min-w-0">
            <h2 className="truncate text-sm font-semibold text-ink-900">
              {conversation.leadName}
            </h2>
            <p className="text-xs text-ink-500">
              {decision?.leadStage ? humanize(decision.leadStage) : conversation.qualificationStatus}
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-5 p-5">
        {!decision ? (
          <div className="rounded-2xl border border-dashed border-ink-200 bg-ink-50/70 p-4 text-sm leading-6 text-ink-500">
            Structured decision data has not been recorded for this lead yet. The profile is using message-derived status until Josh writes an agent decision.
          </div>
        ) : null}

        <div className="rounded-2xl border border-ink-100 bg-white p-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-ink-400">
                Lead Temperature
              </p>
              <p className="mt-1 text-xs leading-5 text-ink-500">
                Based on structured confidence, stage, owner alert, and qualification signals.
              </p>
            </div>
            <Flame className="h-4 w-4 text-orange-500" />
          </div>
          <div className="mt-4 grid grid-cols-3 gap-2">
            {(["Cold", "Warm", "Hot"] as LeadTemperature[]).map((temperature) => {
              const selected = conversation.leadTemperature === temperature;
              return (
                <div
                  key={temperature}
                  className={cn(
                    "rounded-xl border px-2 py-2 text-center text-[11px] font-semibold transition-all",
                    selected ? temperatureClass(temperature) : "border-ink-100 bg-white text-ink-300",
                    selected && "ring-2 ring-offset-1",
                    selected && temperature === "Hot" && "ring-orange-100",
                    selected && temperature === "Warm" && "ring-amber/20",
                    selected && temperature === "Cold" && "ring-ink-100",
                  )}
                >
                  {temperature === "Hot" ? (
                    <Flame className="mx-auto mb-1 h-3.5 w-3.5" />
                  ) : null}
                  {temperature}
                </div>
              );
            })}
          </div>
        </div>

        <div className="rounded-2xl border border-ink-100 bg-white p-4">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-ink-400">
            <ShieldCheck className="h-3.5 w-3.5" />
            Qualification score
          </div>
          <div className="mt-4 flex items-end justify-between gap-3">
            <div>
              <p className="text-3xl font-bold tracking-tight text-ink-900">
                {confidence !== null ? `${Math.round(confidence * 100)}%` : scoreFallback(conversation.qualificationStatus)}
              </p>
              <p className="mt-1 text-xs text-ink-500">
                {confidence !== null ? "Josh structured-decision confidence" : "Derived from current conversation status"}
              </p>
            </div>
            <span className={cn("rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.12em]", statusBadgeClass(conversation.qualificationStatus))}>
              {conversation.qualificationStatus}
            </span>
          </div>
          <div className="mt-4 h-2 rounded-full bg-ink-50">
            <div
              className="h-2 rounded-full bg-brand-600"
              style={{ width: `${confidence !== null ? Math.round(confidence * 100) : scoreFallbackPercent(conversation.qualificationStatus)}%` }}
            />
          </div>
        </div>

        <div className="rounded-2xl border border-ink-100 bg-white p-4">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-ink-400">
            <FileText className="h-3.5 w-3.5" />
            Key info collected
          </div>
          <div className="mt-4 space-y-2">
            {availableFields.length > 0 ? (
              availableFields.map(({ key, label }) => (
                <div key={key} className="rounded-xl bg-ink-50 px-3 py-2">
                  <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-ink-400">{label}</p>
                  <p className="mt-0.5 text-sm font-medium leading-5 text-ink-800">{decision?.qualificationFields[key]}</p>
                </div>
              ))
            ) : (
              <p className="rounded-xl bg-ink-50 px-3 py-3 text-sm leading-6 text-ink-500">
                Josh has not collected budget, authority, need, timeline, or location yet.
              </p>
            )}
          </div>
          {decision?.missingFields.length ? (
            <div className="mt-3 rounded-xl border border-amber/20 bg-amber/10 px-3 py-2">
              <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-amber">Missing</p>
              <p className="mt-1 text-xs leading-5 text-ink-600">
                {decision.missingFields.map(humanize).join(", ")}
              </p>
            </div>
          ) : null}
        </div>

        <div className="rounded-2xl border border-ink-100 bg-white p-4">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-ink-400">
            <Tags className="h-3.5 w-3.5" />
            Tags
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            {tags.length > 0 ? (
              tags.map((tag) => (
                <span key={tag} className="rounded-full border border-ink-100 bg-ink-50 px-2.5 py-1 text-[11px] font-semibold text-ink-600">
                  {tag}
                </span>
              ))
            ) : (
              <p className="text-sm text-ink-500">No structured tags yet.</p>
            )}
          </div>
        </div>

        {decision?.nextAction ? (
          <div className="rounded-2xl border border-brand-100 bg-brand-50 p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-brand-700">Next action</p>
            <p className="mt-2 text-sm font-medium leading-6 text-ink-800">{humanize(decision.nextAction)}</p>
          </div>
        ) : null}

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
            placeholder="Notes become available once manual owner handoff is enabled."
            className="mt-2 h-28 w-full resize-none rounded-2xl border border-ink-100 bg-ink-50 px-3 py-3 text-sm text-ink-500 outline-none placeholder:text-ink-400"
          />
        </div>
      </div>
    </>
  );
}

function EmptyProfilePanel() {
  return (
    <>
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
      <div className="p-5">
        <div className="rounded-2xl border border-dashed border-ink-200 bg-ink-50/70 p-4 text-sm text-ink-500">
          Select a lead to view profile details from Josh&apos;s structured decisions.
        </div>
      </div>
    </>
  );
}


function MessageDateSeparator({ label }: { label: string }) {
  return (
    <div className="my-5 flex items-center gap-4">
      <div className="h-px flex-1 bg-ink-100" />
      <span className="rounded-full border border-ink-100 bg-white px-3 py-1 text-[11px] font-bold uppercase tracking-[0.12em] text-ink-400 shadow-sm">
        {label}
      </span>
      <div className="h-px flex-1 bg-ink-100" />
    </div>
  );
}

function ConversationMessageGroup({
  conversation,
  group,
}: {
  conversation: LiveConversation;
  group: ThreadMessageGroup;
}) {
  const isOutbound = group.direction === "outbound";

  return (
    <div className={cn("animate-fade-in flex flex-col", isOutbound ? "items-end" : "items-start")}>
      {group.messages.map((message, index) => {
        const position = getBubblePosition(index, group.messages.length);
        const showAvatar = position === "solo" || position === "last";
        const showReceipt = isOutbound && isLastOutboundMessage(conversation, message.id) && showAvatar;

        return (
          <div
            key={message.id}
            className={cn(
              "group/message flex w-full items-end gap-2 py-0.5 transition-all duration-300 ease-out",
              isOutbound ? "justify-end animate-[fade-in_0.18s_ease-out_both]" : "justify-start animate-[fade-in_0.18s_ease-out_both]",
            )}
          >
            {!isOutbound ? (
              <div className="w-8 shrink-0">
                {showAvatar ? <LeadAvatar conversation={conversation} className="h-8 w-8 shadow-sm ring-2 ring-white" /> : null}
              </div>
            ) : null}

            <div className={cn("flex max-w-[78%] flex-col", isOutbound ? "items-end" : "items-start")}>
              <div
                className={cn(
                  "px-3.5 py-2.5 text-[15px] leading-6 shadow-sm transition-transform duration-200 group-hover/message:-translate-y-0.5",
                  bubbleRadiusClass(group.direction, position),
                  isOutbound
                    ? "bg-brand-500 text-white shadow-brand-900/10"
                    : "border border-ink-100 bg-ink-100 text-ink-800 shadow-ink-200/40",
                )}
              >
                <p className="whitespace-pre-wrap break-words">{message.content}</p>
                <p className={cn("mt-1.5 text-[10px] font-medium uppercase tracking-[0.12em]", isOutbound ? "text-white/70" : "text-ink-400")}>
                  {message.timestampLabel}
                </p>
              </div>
              {showReceipt ? (
                <OutboundReceipt
                  conversation={conversation}
                  message={message}
                />
              ) : null}
            </div>

            {isOutbound ? (
              <div className="w-8 shrink-0">
                {showAvatar ? <JoshAvatar className="h-8 w-8 shadow-sm ring-2 ring-white" /> : null}
              </div>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}

function OutboundReceipt({ conversation, message }: { conversation: LiveConversation; message: LiveConversationMessage }) {
  const read = hasInboundAfterMessage(conversation, message);

  return (
    <div className="mt-1 flex items-center gap-1.5 pr-1 text-[11px] font-medium text-ink-400">
      {read ? <CheckCheck className="h-3.5 w-3.5 text-brand-500" /> : <Check className="h-3.5 w-3.5" />}
      <span>{read ? `Read by ${conversation.leadName.split(" ")[0] || conversation.leadName}` : "Delivered"}</span>
    </div>
  );
}

function JoshTypingIndicator() {
  return (
    <div className="animate-fade-in mt-4 flex items-end gap-2">
      <JoshAvatar className="h-8 w-8 shadow-sm ring-2 ring-white" />
      <div className="flex flex-col">
        <span className="mb-1 ml-3 text-[12px] font-medium text-ink-400">Josh is typing</span>
        <div className="flex w-16 items-center justify-center gap-1 rounded-[20px_20px_20px_6px] border border-ink-100 bg-white px-4 py-3 shadow-sm">
          <span className="dot-1 h-1.5 w-1.5 rounded-full bg-ink-400" />
          <span className="dot-2 h-1.5 w-1.5 rounded-full bg-ink-400" />
          <span className="dot-3 h-1.5 w-1.5 rounded-full bg-ink-400" />
        </div>
      </div>
    </div>
  );
}

function JoshAvatar({ className }: { className?: string }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src="/josh-avatar.jpg?v=3"
      alt="Josh for Sales"
      className={cn("shrink-0 rounded-full object-cover", className)}
    />
  );
}

function LeadAvatar({ conversation, className }: { conversation: LiveConversation; className?: string }) {
  return conversation.leadAvatarUrl ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={conversation.leadAvatarUrl}
      alt=""
      className={cn("shrink-0 rounded-full object-cover", className)}
    />
  ) : (
    <div className={cn("flex shrink-0 items-center justify-center rounded-full bg-ink-50 text-ink-400", className)}>
      <UserRound className="h-4 w-4" />
    </div>
  );
}

function buildProfileTags(conversation: LiveConversation) {
  const tags = new Set<string>();
  tags.add(conversation.qualificationStatus);
  if (conversation.leadTemperature) tags.add(conversation.leadTemperature);
  if (conversation.decision?.leadStage) tags.add(humanize(conversation.decision.leadStage));
  if (conversation.decision?.ownerAlert) tags.add("Owner alert");
  for (const flag of conversation.decision?.riskFlags ?? []) tags.add(`Risk: ${humanize(flag)}`);
  return [...tags];
}

function scoreFallback(status: LiveConversation["qualificationStatus"]) {
  switch (status) {
    case "Qualified":
      return "80%";
    case "Qualifying":
      return "55%";
    case "Unqualified":
      return "20%";
    case "New":
    default:
      return "10%";
  }
}

function scoreFallbackPercent(status: LiveConversation["qualificationStatus"]) {
  return Number(scoreFallback(status).replace("%", ""));
}

function humanize(value: string) {
  return value
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
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
