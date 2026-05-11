"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  CheckCircle2,
  MessageCircleHeart,
  MoreVertical,
  PauseCircle,
} from "lucide-react";
import { disconnectPageAction } from "@/app/dashboard/pages/actions";
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
  const [selectedPage, setSelectedPage] = useState<ConnectedPage | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [openMenuId, setOpenMenuId] = useState<number | null>(null);

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
      <ul className="grid gap-4 md:grid-cols-2">
        {pages.map((page) => (
          <li
            key={page.id}
            className="rounded-2xl border border-ink-100 bg-white p-5 shadow-sm"
          >
            <div className="flex items-start gap-4">
              {page.pictureUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={page.pictureUrl}
                  alt=""
                  width={56}
                  height={56}
                  loading="lazy"
                  decoding="async"
                  className="h-14 w-14 rounded-full object-cover"
                />
              ) : (
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-brand-100 text-brand-700">
                  <MessageCircleHeart className="h-6 w-6" />
                </div>
              )}
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="truncate text-base font-semibold text-ink-900">
                    {page.name}
                  </h3>
                  {page.isActive ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-mint/15 px-2 py-0.5 text-[10px] font-medium text-emerald-700">
                      <CheckCircle2 className="h-3 w-3" />
                      Active
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 rounded-full bg-amber/15 px-2 py-0.5 text-[10px] font-medium text-amber-700">
                      <PauseCircle className="h-3 w-3" />
                      Inactive
                    </span>
                  )}
                </div>
                <p className="text-xs text-ink-500">
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

                {/* Menu button */}
                <div className="relative mt-3">
                  <button
                    onClick={() =>
                      setOpenMenuId(openMenuId === page.id ? null : page.id)
                    }
                    className="inline-flex items-center gap-2 rounded-lg p-1 text-xs font-medium text-ink-500 hover:bg-ink-50 hover:text-ink-700"
                  >
                    <MoreVertical className="h-4 w-4" />
                  </button>

                  {/* Dropdown menu */}
                  {openMenuId === page.id && (
                    <div className="absolute left-0 top-full z-40 mt-1 rounded-lg border border-ink-100 bg-white shadow-lg">
                      <button
                        onClick={() => handleDisconnectClick(page)}
                        className="block w-full px-4 py-2 text-left text-xs font-medium text-rose hover:bg-rose/5"
                      >
                        Disconnect
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </li>
        ))}
      </ul>

      {/* Disconnect modal */}
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
