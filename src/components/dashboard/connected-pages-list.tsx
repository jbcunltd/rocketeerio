"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  CheckCircle2,
  MessageCircleHeart,
  MoreVertical,
  PauseCircle,
} from "lucide-react";
import { disconnectPageAction } from "@/app/dashboard/pages/actions";
import { usePageSelection } from "@/lib/page-selection-context";
import { cn } from "@/lib/utils";
import { DisconnectPageModal } from "./disconnect-page-modal";

interface ConnectedPage {
  id: number;
  pageId: string;
  name: string;
  pictureUrl: string | null;
  category: string | null;
  isActive: boolean;
  connectedAt: Date;
}

interface ConnectedPagesListProps {
  pages: ConnectedPage[];
}

export function ConnectedPagesList({ pages }: ConnectedPagesListProps) {
  const router = useRouter();
  const { selectedPageId, selectPage } = usePageSelection();
  const [selectedPage, setSelectedPage] = useState<ConnectedPage | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [openMenuId, setOpenMenuId] = useState<number | null>(null);

  const activePageId = useMemo(
    () => selectedPageId ?? pages[0]?.pageId ?? null,
    [pages, selectedPageId],
  );

  const handleSwitchPage = (page: ConnectedPage) => {
    if (activePageId === page.pageId) return;
    setOpenMenuId(null);
    selectPage(page.pageId);
  };

  const handleDisconnectClick = (page: ConnectedPage) => {
    setSelectedPage(page);
    setIsModalOpen(true);
    setOpenMenuId(null);
  };

  const handleConfirmDisconnect = async (pageId: string) => {
    const formData = new FormData();
    formData.append("pageId", pageId);
    await disconnectPageAction(formData);
    router.refresh();
  };

  if (pages.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-ink-200 bg-white p-6">
        <h3 className="flex items-center gap-2 text-base font-semibold text-ink-900">
          <MessageCircleHeart className="h-5 w-5 text-brand-500" />
          No Pages connected yet
        </h3>
        <p className="mt-1 text-sm text-ink-600">
          Authorize Facebook and pick the Pages you want Rocketeerio to
          qualify leads for.
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="mb-3 rounded-2xl border border-brand-100 bg-brand-50/70 p-4 text-sm text-brand-800 shadow-sm">
        <p className="font-semibold text-brand-900">Switch the whole dashboard from here</p>
        <p className="mt-1 leading-relaxed">
          Tap any connected Page below to make it the active Page for the sidebar,
          Dashboard, Josh for Sales inbox, handbook, and settings.
        </p>
      </div>

      <ul className="grid gap-4 md:grid-cols-2">
        {pages.map((page) => {
          const isSelected = activePageId === page.pageId;

          return (
            <li key={page.id} className="relative">
              <div
                className={cn(
                  "group relative overflow-visible rounded-2xl border bg-white shadow-sm transition-all duration-200",
                  isSelected
                    ? "border-brand-300 ring-2 ring-brand-100"
                    : "border-ink-100 hover:border-brand-200 hover:shadow-md",
                )}
              >
                <button
                  type="button"
                  onClick={() => handleSwitchPage(page)}
                  aria-current={isSelected ? "true" : undefined}
                  className="flex min-h-[132px] w-full items-start gap-4 rounded-2xl p-5 pr-14 text-left focus:outline-none focus:ring-2 focus:ring-brand-500/40 focus:ring-offset-2"
                >
                  {page.pictureUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={page.pictureUrl}
                      alt=""
                      width={56}
                      height={56}
                      loading="lazy"
                      decoding="async"
                      className="h-14 w-14 shrink-0 rounded-full object-cover"
                    />
                  ) : (
                    <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-brand-100 text-brand-700">
                      <MessageCircleHeart className="h-6 w-6" />
                    </div>
                  )}

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="min-w-0 truncate text-base font-semibold text-ink-900">
                        {page.name}
                      </h3>
                      {isSelected ? (
                        <span className="inline-flex min-h-6 items-center gap-1 rounded-full bg-mint/15 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide text-emerald-700">
                          <CheckCircle2 className="h-3.5 w-3.5" />
                          Current dashboard Page
                        </span>
                      ) : page.isActive ? (
                        <span className="inline-flex min-h-6 items-center gap-1 rounded-full bg-ink-100 px-2.5 py-1 text-[11px] font-semibold text-ink-600">
                          <CheckCircle2 className="h-3.5 w-3.5" />
                          Connected
                        </span>
                      ) : (
                        <span className="inline-flex min-h-6 items-center gap-1 rounded-full bg-amber/15 px-2.5 py-1 text-[11px] font-semibold text-amber-700">
                          <PauseCircle className="h-3.5 w-3.5" />
                          Inactive
                        </span>
                      )}
                    </div>

                    <p className="mt-1 text-xs text-ink-500">
                      {page.category ?? "Facebook Page"} · ID {page.pageId}
                    </p>
                    <p className="mt-1 text-xs text-ink-500">
                      Connected{" "}
                      {new Date(page.connectedAt).toLocaleDateString(undefined, {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                      })}
                    </p>

                    <div
                      className={cn(
                        "mt-4 inline-flex min-h-11 items-center justify-center gap-2 rounded-xl px-3 text-sm font-semibold transition-colors",
                        isSelected
                          ? "bg-brand-600 text-white"
                          : "bg-ink-50 text-ink-700 group-hover:bg-brand-50 group-hover:text-brand-700",
                      )}
                    >
                      {isSelected ? "Active everywhere now" : "Switch dashboard to this Page"}
                      {!isSelected && <ArrowRight className="h-4 w-4" />}
                    </div>
                  </div>
                </button>

                <div className="absolute right-3 top-3">
                  <button
                    type="button"
                    aria-label={`More actions for ${page.name}`}
                    onClick={(event) => {
                      event.stopPropagation();
                      setOpenMenuId(openMenuId === page.id ? null : page.id);
                    }}
                    className="inline-flex h-11 w-11 items-center justify-center rounded-xl text-ink-500 transition-colors hover:bg-ink-50 hover:text-ink-700 focus:outline-none focus:ring-2 focus:ring-brand-500/40"
                  >
                    <MoreVertical className="h-5 w-5" />
                  </button>

                  {openMenuId === page.id && (
                    <div className="absolute right-0 top-full z-40 mt-1 min-w-36 rounded-lg border border-ink-100 bg-white py-1 shadow-lg">
                      <button
                        type="button"
                        onClick={() => handleDisconnectClick(page)}
                        className="block min-h-11 w-full px-4 py-2 text-left text-sm font-semibold text-rose hover:bg-rose/5"
                      >
                        Disconnect
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </li>
          );
        })}
      </ul>

      {selectedPage && (
        <DisconnectPageModal
          pageName={selectedPage.name}
          pageId={selectedPage.pageId}
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            setSelectedPage(null);
          }}
          onConfirm={handleConfirmDisconnect}
        />
      )}
    </>
  );
}
