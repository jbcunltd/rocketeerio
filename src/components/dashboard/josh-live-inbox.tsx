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
  ArrowLeft,
  Bot,
  Check,
  CheckCheck,
  ChevronUp,
  Clock3,
  FileText,
  Flame,
  Inbox,
  MessageCircle,
  Search,
  ShieldCheck,
  SlidersHorizontal,
  Sparkles,
  Tags,
  UserRound,
  Users,
  X,
  type LucideIcon,
} from "lucide-react";
import { PushNotificationsButton } from "@/components/pwa/push-notifications-button";
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

const filters: Array<{ id: InboxFilter; label: string; description: string }> = [
  { id: "all", label: "All", description: "Every lead" },
  { id: "active", label: "Active", description: "New + qualifying" },
  { id: "hot", label: "Hot", description: "High-intent signals" },
  { id: "qualified", label: "Qualified", description: "Ready follow-up" },
];

const profileFields: Array<{ key: "need" | "budget" | "timeline" | "authority" | "location"; label: string }> = [
  { key: "need", label: "Need" },
  { key: "budget", label: "Budget" },
  { key: "timeline", label: "Timeline" },
  { key: "authority", label: "Authority" },
  { key: "location", label: "Location" },
];

const expectedProfileFieldKeys = profileFields.map((field) => field.key);

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

type ConversationSection = {
  id: string;
  title: string;
  count: number;
  conversations: LiveConversation[];
};

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
            ...Object.values(conversation.decision?.qualificationFields ?? {}).map((value) => value ?? ""),
            ...(conversation.decision?.missingFields ?? []),
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

  const conversationSections = useMemo(
    () => buildConversationSections(visibleConversations),
    [visibleConversations],
  );

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

        <div className="flex min-h-14 items-center gap-3 rounded-2xl border border-ink-100 bg-white px-4 py-3 shadow-sm">
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

      <PushNotificationsButton pageId={pollingPageId ?? null} pageName={livePageName} />

      {liveDbUnavailable ? (
        <div className="rounded-2xl border border-amber/30 bg-amber/10 px-4 py-3 text-sm text-ink-700">
          We could not confirm the connected Page from the database. Josh can still show live conversations returned by the inbox endpoint, but Page metadata may use a fallback until the database is reachable.
        </div>
      ) : null}

      <section className="overflow-hidden rounded-[28px] border border-ink-100 bg-white shadow-sm shadow-ink-100/60">
        <div className="grid grid-cols-2 gap-px border-b border-ink-100 bg-ink-100 lg:grid-cols-4">
          {liveStats.map((stat) => {
            const Icon = stat.icon;
            return (
              <div key={stat.label} className="bg-white p-3.5 sm:p-4">
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

        <div className="relative grid h-[calc(100svh-230px)] min-h-[680px] grid-cols-1 overflow-hidden lg:h-[760px] lg:grid-cols-[minmax(280px,340px)_minmax(0,1fr)_minmax(300px,360px)] xl:grid-cols-[360px_minmax(0,1fr)_360px]">
          <aside
            className={cn(
              "min-h-0 flex-col border-ink-100 bg-white lg:flex lg:border-r",
              activePanel === "list" ? "flex" : "hidden",
            )}
          >
            <ConversationListPanel
              activeConversationId={activeConversation?.id ?? null}
              activeFilter={activeFilter}
              conversationSections={conversationSections}
              filtersOpen={filtersOpen}
              hasAnyConversations={hasAnyConversations}
              hasConversations={hasConversations}
              isSearchActive={isSearchActive}
              searchQuery={searchQuery}
              onFilterChange={setActiveFilter}
              onFiltersToggle={() => setFiltersOpen((open) => !open)}
              onSearchChange={setSearchQuery}
              onSelectConversation={selectConversation}
            />
          </aside>

          <main
            className={cn(
              "min-h-0 bg-gradient-to-b from-white to-ink-50/70 lg:flex",
              activePanel === "thread" ? "flex" : "hidden",
            )}
          >
            <ThreadPanel
              activeConversation={activeConversation}
              activeThreadItems={activeThreadItems}
              joshIsTyping={joshIsTyping}
              livePageName={livePageName}
              onBackToList={() => setActivePanel("list")}
              onOpenProfile={() => setActivePanel("profile")}
            />
          </main>

          <aside className="hidden min-h-0 border-l border-ink-100 bg-white lg:flex lg:flex-col">
            {activeConversation ? (
              <LeadProfilePanel conversation={activeConversation} />
            ) : (
              <EmptyProfilePanel />
            )}
          </aside>

          {activePanel === "profile" ? (
            <div className="absolute inset-0 z-40 flex items-end bg-ink-900/30 backdrop-blur-[2px] lg:hidden" role="dialog" aria-modal="true" aria-label="Lead profile">
              <button
                type="button"
                aria-label="Close lead profile"
                className="absolute inset-0 cursor-default"
                onClick={() => setActivePanel(activeConversation ? "thread" : "list")}
              />
              <aside className="relative flex max-h-[88%] w-full animate-pop-in flex-col overflow-hidden rounded-t-[28px] border border-ink-100 bg-white shadow-2xl shadow-ink-900/20">
                <div className="flex min-h-12 items-center justify-center border-b border-ink-100 bg-white px-4 py-2">
                  <span className="h-1.5 w-12 rounded-full bg-ink-200" />
                  <button
                    type="button"
                    aria-label="Close lead profile"
                    onClick={() => setActivePanel(activeConversation ? "thread" : "list")}
                    className="absolute right-3 top-2 flex h-10 w-10 items-center justify-center rounded-full text-ink-500 hover:bg-ink-50 hover:text-ink-900"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
                {activeConversation ? (
                  <LeadProfilePanel conversation={activeConversation} compact />
                ) : (
                  <EmptyProfilePanel />
                )}
              </aside>
            </div>
          ) : null}
        </div>
      </section>
    </div>
  );
}

function ConversationListPanel({
  activeConversationId,
  activeFilter,
  conversationSections,
  filtersOpen,
  hasAnyConversations,
  hasConversations,
  isSearchActive,
  searchQuery,
  onFilterChange,
  onFiltersToggle,
  onSearchChange,
  onSelectConversation,
}: {
  activeConversationId: string | null;
  activeFilter: InboxFilter;
  conversationSections: ConversationSection[];
  filtersOpen: boolean;
  hasAnyConversations: boolean;
  hasConversations: boolean;
  isSearchActive: boolean;
  searchQuery: string;
  onFilterChange: (filter: InboxFilter) => void;
  onFiltersToggle: () => void;
  onSearchChange: (query: string) => void;
  onSelectConversation: (conversation: LiveConversation, panel?: InboxPanel) => void;
}) {
  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="border-b border-ink-100 bg-white p-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="text-sm font-semibold text-ink-900">Conversations</h2>
            <p className="text-xs text-ink-500">Live Messenger leads only</p>
          </div>
          <button
            type="button"
            aria-label={filtersOpen ? "Hide conversation filters" : "Show conversation filters"}
            aria-expanded={filtersOpen}
            aria-controls="live-inbox-filters"
            onClick={onFiltersToggle}
            className={cn(
              "flex h-11 w-11 items-center justify-center rounded-2xl border transition-colors",
              filtersOpen || activeFilter !== "all"
                ? "border-brand-100 bg-brand-50 text-brand-700"
                : "border-ink-100 text-ink-500 hover:border-brand-100 hover:bg-brand-50 hover:text-brand-700",
            )}
          >
            <SlidersHorizontal className="h-4 w-4" />
          </button>
        </div>

        <label className="mt-4 flex min-h-11 items-center gap-2 rounded-2xl border border-ink-100 bg-ink-50 px-3 text-sm text-ink-500 focus-within:border-brand-200 focus-within:bg-white focus-within:ring-2 focus-within:ring-brand-500/10">
          <Search className="h-4 w-4" />
          <input
            type="search"
            placeholder="Search by name, message, field, or tag"
            value={searchQuery}
            onChange={(event) => onSearchChange(event.target.value)}
            className="w-full bg-transparent text-sm text-ink-900 outline-none placeholder:text-ink-400"
            aria-label="Search live conversations"
          />
        </label>

        {filtersOpen ? (
          <div id="live-inbox-filters" className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-2 xl:grid-cols-4">
            {filters.map((filter) => (
              <button
                key={filter.id}
                type="button"
                onClick={() => onFilterChange(filter.id)}
                className={cn(
                  "min-h-11 rounded-2xl border px-3 py-2 text-left transition-all",
                  activeFilter === filter.id
                    ? filter.id === "hot"
                      ? "border-amber/30 bg-amber/15 text-orange-700 shadow-sm"
                      : "border-brand-100 bg-brand-50 text-brand-700 shadow-sm"
                    : "border-ink-100 bg-white text-ink-500 hover:border-brand-100 hover:bg-brand-50/60 hover:text-ink-900",
                )}
              >
                <span className="block text-xs font-bold">{filter.label}</span>
                <span className="mt-0.5 hidden text-[10px] leading-4 opacity-80 xl:block">{filter.description}</span>
              </button>
            ))}
          </div>
        ) : null}
      </div>

      <div
        className={cn(
          "min-h-0 flex-1 overflow-y-auto bg-white",
          hasConversations
            ? "pb-3"
            : "flex flex-col items-center justify-center px-5 py-10 text-center",
        )}
      >
        {hasConversations ? (
          <div className="space-y-2 py-3">
            {conversationSections.map((section) => (
              <div key={section.id}>
                <div className="sticky top-0 z-10 flex items-center justify-between border-y border-ink-100 bg-ink-50/95 px-4 py-2 backdrop-blur">
                  <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-ink-500">{section.title}</p>
                  <p className="text-[10px] font-semibold text-ink-400">{section.count}</p>
                </div>
                <div className="divide-y divide-ink-100">
                  {section.conversations.map((conversation) => (
                    <ConversationListRow
                      key={conversation.id}
                      conversation={conversation}
                      selected={activeConversationId === conversation.id}
                      onSelect={() => onSelectConversation(conversation)}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <EmptyConversationState
            hasAnyConversations={hasAnyConversations}
            isSearchActive={isSearchActive}
          />
        )}
      </div>
    </div>
  );
}

function ConversationListRow({
  conversation,
  selected,
  onSelect,
}: {
  conversation: LiveConversation;
  selected: boolean;
  onSelect: () => void;
}) {
  const latestMessage = conversation.messages.at(-1);
  const needsResponse = latestMessage?.direction === "inbound";
  const preview = latestMessage?.direction === "outbound"
    ? `Josh: ${stripExistingJoshPrefix(conversation.lastMessagePreview)}`
    : conversation.lastMessagePreview;
  const statusTags = buildCompactTags(conversation).slice(0, 3);

  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        "group flex min-h-[84px] w-full items-start gap-3 px-3 py-3 text-left transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/30",
        selected ? "bg-brand-50/90" : conversation.isHot ? "bg-amber/10 hover:bg-amber/15" : "bg-white hover:bg-ink-50",
      )}
    >
      <span className="relative shrink-0 pt-0.5">
        <LeadAvatar conversation={conversation} className="h-12 w-12 ring-2 ring-white shadow-sm" />
        {needsResponse ? <span className="absolute -right-0.5 -top-0.5 h-3.5 w-3.5 rounded-full border-2 border-white bg-brand-500" /> : null}
      </span>
      <span className="min-w-0 flex-1">
        <span className="flex min-w-0 items-start justify-between gap-3">
          <span className="min-w-0">
            <span className={cn("block truncate text-sm text-ink-900", needsResponse ? "font-extrabold" : "font-semibold")}>
              {conversation.leadName}
            </span>
            <span className="mt-0.5 flex flex-wrap items-center gap-1.5">
              {conversation.isHot ? (
                <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-amber/20 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-[0.1em] text-orange-700">
                  <Flame className="h-3 w-3" />
                  Hot
                </span>
              ) : null}
              <span className={cn("inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.12em]", statusBadgeClass(conversation.qualificationStatus))}>
                {conversation.qualificationStatus}
              </span>
            </span>
          </span>
          <span className={cn("shrink-0 pt-0.5 text-[11px]", needsResponse ? "font-bold text-brand-600" : "text-ink-400")}>
            {conversation.timestampLabel}
          </span>
        </span>
        <span className={cn("mt-1.5 flex min-w-0 items-start gap-1.5 text-xs leading-5", needsResponse ? "font-semibold text-ink-700" : "text-ink-500")}>
          {latestMessage?.direction === "outbound" ? <CheckCheck className="mt-0.5 h-3.5 w-3.5 shrink-0 text-brand-500" /> : null}
          <span className="line-clamp-2 break-words">{preview}</span>
        </span>
        <span className="mt-2 flex flex-wrap items-center gap-1.5">
          {statusTags.map((tag) => (
            <span key={tag} className="rounded-full border border-ink-100 bg-white/80 px-2 py-0.5 text-[10px] font-semibold text-ink-500">
              {tag}
            </span>
          ))}
        </span>
      </span>
    </button>
  );
}

function EmptyConversationState({ hasAnyConversations, isSearchActive }: { hasAnyConversations: boolean; isSearchActive: boolean }) {
  return (
    <div className="animate-fade-in max-w-xs">
      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-ink-50 text-ink-400">
        <Inbox className="h-5 w-5" />
      </div>
      <p className="mt-4 text-sm font-semibold text-ink-900">
        {hasAnyConversations ? "No conversations match" : "No live conversations yet"}
      </p>
      <p className="mt-1.5 text-xs leading-relaxed text-ink-500">
        {hasAnyConversations
          ? isSearchActive
            ? "Try searching another name, message, qualification field, or tag."
            : "Try a different conversation filter to see more leads."
          : "Real Messenger conversations will appear here as the webhook receives them. Hot leads are promoted automatically."}
      </p>
    </div>
  );
}

function ThreadPanel({
  activeConversation,
  activeThreadItems,
  joshIsTyping,
  livePageName,
  onBackToList,
  onOpenProfile,
}: {
  activeConversation: LiveConversation | null;
  activeThreadItems: ThreadItem[];
  joshIsTyping: boolean;
  livePageName: string;
  onBackToList: () => void;
  onOpenProfile: () => void;
}) {
  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="sticky top-0 z-20 border-b border-ink-100 bg-white/95 px-3 py-3 backdrop-blur sm:px-5 lg:static">
        <div className="flex min-h-12 items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-2 sm:gap-3">
            <button
              type="button"
              aria-label="Back to conversations"
              onClick={onBackToList}
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl text-ink-500 hover:bg-ink-50 hover:text-ink-900 lg:hidden"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            {activeConversation ? <LeadAvatar conversation={activeConversation} className="h-11 w-11" /> : null}
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-ink-900">
                {activeConversation ? activeConversation.leadName : "Waiting for first lead"}
              </p>
              <p className="truncate text-xs text-ink-500">
                {activeConversation
                  ? `${activeConversation.messages.length} Messenger message${activeConversation.messages.length === 1 ? "" : "s"} · ${activeConversation.qualificationStatus}`
                  : `Josh is listening on ${livePageName}.`}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="hidden items-center gap-2 rounded-full bg-brand-50 px-3 py-1.5 text-xs font-semibold text-brand-700 sm:inline-flex">
              <Bot className="h-3.5 w-3.5" />
              Josh online
            </div>
            {activeConversation ? (
              <button
                type="button"
                onClick={onOpenProfile}
                className="flex min-h-11 items-center gap-1.5 rounded-2xl border border-ink-100 bg-white px-3 text-xs font-bold text-ink-700 shadow-sm hover:border-brand-100 hover:bg-brand-50 hover:text-brand-700 lg:hidden"
              >
                <ChevronUp className="h-4 w-4" />
                Lead
              </button>
            ) : null}
          </div>
        </div>
      </div>

      {activeConversation ? (
        <>
          <div className="min-h-0 flex-1 space-y-4 overflow-y-auto overscroll-contain px-3 py-5 sm:px-5 md:px-8">
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
                    Conversation selected
                  </h2>
                  <p className="mt-2 text-sm leading-6 text-ink-600">
                    This lead exists in the live inbox, but the endpoint did not return stored message bodies for this thread.
                  </p>
                </div>
              </div>
            )}
          </div>
          <JoshStatusBar conversation={activeConversation} />
        </>
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
              Conversations appear here in real time as they arrive from the webhook.
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
    </div>
  );
}

function JoshStatusBar({ conversation }: { conversation: LiveConversation }) {
  const nextAction = conversation.decision?.nextAction ? humanize(conversation.decision.nextAction) : null;
  const missingCount = getMissingFieldLabels(conversation).length;
  const lastInbound = conversation.messages.at(-1)?.direction === "inbound";

  return (
    <div className="sticky bottom-0 z-20 border-t border-ink-100 bg-white/95 px-3 py-3 backdrop-blur sm:px-5">
      <div className="flex min-h-14 items-center gap-3 rounded-2xl border border-ink-100 bg-ink-50/80 px-3 py-2.5">
        <JoshAvatar className="h-9 w-9 shadow-sm ring-2 ring-white" />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-ink-900">
            {lastInbound ? "Josh is qualifying this lead" : "Josh sent the latest reply"}
          </p>
          <p className="truncate text-xs leading-5 text-ink-500">
            {nextAction ?? (missingCount > 0 ? `${missingCount} qualification field${missingCount === 1 ? "" : "s"} still missing` : "Live thread is synchronized from the middleware database")}
          </p>
        </div>
        <span className="hidden rounded-full bg-brand-50 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.12em] text-brand-700 sm:inline-flex">
          Auto
        </span>
      </div>
    </div>
  );
}

function LeadProfilePanel({ conversation, compact = false }: { conversation: LiveConversation; compact?: boolean }) {
  const decision = conversation.decision;
  const confidence = decision?.confidence ?? null;
  const availableFields = profileFields.filter(({ key }) => decision?.qualificationFields[key]);
  const missingFields = getMissingFieldLabels(conversation);
  const tags = buildProfileTags(conversation);

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className={cn("border-b border-ink-100", compact ? "p-4" : "p-5")}>
        <div className="flex items-start gap-3">
          <LeadAvatar conversation={conversation} className="h-12 w-12" />
          <div className="min-w-0 flex-1">
            <h2 className="truncate text-sm font-semibold text-ink-900">
              {conversation.leadName}
            </h2>
            <p className="mt-0.5 text-xs text-ink-500">
              {decision?.leadStage ? humanize(decision.leadStage) : conversation.qualificationStatus}
            </p>
            <div className="mt-2 flex flex-wrap gap-1.5">
              <span className={cn("rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.12em]", statusBadgeClass(conversation.qualificationStatus))}>
                {conversation.qualificationStatus}
              </span>
              {conversation.leadTemperature ? (
                <span className={cn("rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.12em]", temperatureClass(conversation.leadTemperature))}>
                  {conversation.leadTemperature}
                </span>
              ) : null}
            </div>
          </div>
        </div>
      </div>

      <div className={cn("min-h-0 flex-1 space-y-4 overflow-y-auto", compact ? "p-4 pb-6" : "p-5")}>
        <div className="rounded-2xl border border-ink-100 bg-white p-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-ink-400">
                Lead Temperature
              </p>
              <p className="mt-1 text-xs leading-5 text-ink-500">
                Based on real qualification status, confidence, owner alert, and hot-lead signals.
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
                No structured qualification fields have been saved for this lead in the current decision record.
              </p>
            )}
          </div>
        </div>

        <div className="rounded-2xl border border-ink-100 bg-white p-4">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-ink-400">
            <Clock3 className="h-3.5 w-3.5" />
            Missing fields
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            {missingFields.length > 0 ? (
              missingFields.map((field) => (
                <span key={field} className="rounded-full border border-amber/30 bg-amber/10 px-2.5 py-1 text-[11px] font-semibold text-amber">
                  {field}
                </span>
              ))
            ) : (
              <span className="rounded-full border border-mint/20 bg-mint/10 px-2.5 py-1 text-[11px] font-semibold text-emerald-700">
                No missing qualification fields detected
              </span>
            )}
          </div>
        </div>

        <div className="rounded-2xl border border-ink-100 bg-white p-4">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-ink-400">
            <Tags className="h-3.5 w-3.5" />
            Tags
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            {tags.map((tag) => (
              <span key={tag} className="rounded-full border border-ink-100 bg-ink-50 px-2.5 py-1 text-[11px] font-semibold text-ink-600">
                {tag}
              </span>
            ))}
          </div>
        </div>

        {decision?.nextAction ? (
          <div className="rounded-2xl border border-brand-100 bg-brand-50 p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-brand-700">Next action</p>
            <p className="mt-2 text-sm font-medium leading-6 text-ink-800">{humanize(decision.nextAction)}</p>
          </div>
        ) : null}

        {decision?.ownerAlert || decision?.riskFlags.length ? (
          <div className="rounded-2xl border border-rose/15 bg-rose/5 p-4">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-rose">
              <Sparkles className="h-3.5 w-3.5" />
              Attention signals
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              {decision.ownerAlert ? (
                <span className="rounded-full border border-rose/20 bg-white px-2.5 py-1 text-[11px] font-semibold text-rose">Owner alert</span>
              ) : null}
              {decision.riskFlags.map((flag) => (
                <span key={flag} className="rounded-full border border-rose/20 bg-white px-2.5 py-1 text-[11px] font-semibold text-rose">
                  {humanize(flag)}
                </span>
              ))}
            </div>
          </div>
        ) : null}

        {decision?.updatedAtLabel ? (
          <p className="px-1 text-[11px] font-medium text-ink-400">
            Decision updated {decision.updatedAtLabel}
          </p>
        ) : null}
      </div>
    </div>
  );
}

function EmptyProfilePanel() {
  return (
    <div className="flex min-h-0 flex-1 flex-col">
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
          Select a lead to view qualification details from Josh&apos;s live decision records.
        </div>
      </div>
    </div>
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

            <div className={cn("flex max-w-[78%] flex-col sm:max-w-[72%]", isOutbound ? "items-end" : "items-start")}>
              <div
                className={cn(
                  "px-3.5 py-2.5 text-[15px] leading-6 shadow-sm transition-transform duration-200 group-hover/message:-translate-y-0.5",
                  bubbleRadiusClass(group.direction, position),
                  isOutbound
                    ? "bg-brand-500 text-white shadow-brand-900/10"
                    : "border border-ink-100 bg-white text-ink-800 shadow-ink-200/40",
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
      <span>{read ? `Lead replied after this Josh message` : "Sent by Josh"}</span>
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
    <div className={cn("flex shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-brand-50 to-ink-50 text-sm font-bold text-brand-700", className)} aria-hidden="true">
      {getInitials(conversation.leadName)}
    </div>
  );
}

function buildConversationSections(conversations: LiveConversation[]): ConversationSection[] {
  const usedIds = new Set<string>();
  const createSection = (id: string, title: string, predicate: (conversation: LiveConversation) => boolean): ConversationSection | null => {
    const sectionConversations = conversations.filter((conversation) => {
      if (usedIds.has(conversation.id) || !predicate(conversation)) return false;
      usedIds.add(conversation.id);
      return true;
    });

    if (sectionConversations.length === 0) return null;
    return {
      id,
      title,
      count: sectionConversations.length,
      conversations: sectionConversations,
    };
  };

  return [
    createSection("hot", "Hot leads", (conversation) => Boolean(conversation.isHot)),
    createSection("active", "Active conversations", (conversation) => ["New", "Qualifying"].includes(conversation.qualificationStatus)),
    createSection("qualified", "Qualified", (conversation) => conversation.qualificationStatus === "Qualified"),
    createSection("other", "Other conversations", () => true),
  ].filter((section): section is ConversationSection => Boolean(section));
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

function buildCompactTags(conversation: LiveConversation) {
  const tags = new Set<string>();
  if (conversation.leadTemperature) tags.add(conversation.leadTemperature);
  if (conversation.decision?.leadStage) tags.add(humanize(conversation.decision.leadStage));
  if (conversation.decision?.missingFields.length) tags.add(`${conversation.decision.missingFields.length} missing`);
  if (conversation.decision?.ownerAlert) tags.add("Owner alert");
  return [...tags];
}

function getMissingFieldLabels(conversation: LiveConversation) {
  const fields = conversation.decision?.qualificationFields ?? {};
  const explicitMissing = conversation.decision?.missingFields ?? [];
  const missing = new Set<string>();

  for (const field of explicitMissing) {
    const normalized = field.trim();
    if (normalized) missing.add(humanize(normalized));
  }

  for (const fieldKey of expectedProfileFieldKeys) {
    if (!fields[fieldKey]) missing.add(humanize(fieldKey));
  }

  return [...missing];
}

function stripExistingJoshPrefix(value: string) {
  return value.replace(/^\s*josh\s*:\s*/i, "");
}

function getInitials(name: string) {
  const parts = name
    .split(/\s+/)
    .map((part) => part.trim())
    .filter(Boolean);

  if (parts.length === 0) return "?";
  return parts
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("");
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
