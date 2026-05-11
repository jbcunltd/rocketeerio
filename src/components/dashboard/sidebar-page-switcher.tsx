"use client";

import { useState, useRef, useEffect } from "react";
import { ChevronDown, Check, Plus } from "lucide-react";
import { usePageSelection } from "@/lib/page-selection-context";

interface PageItem {
  id: number;
  pageId: string;
  name: string;
  pictureUrl: string | null;
  isActive: boolean;
}

export function SidebarPageSwitcher({ pages }: { pages: PageItem[] }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const { selectedPageId, selectPage } = usePageSelection();

  // Find the currently selected page, or fall back to the first page
  const currentPage =
    pages.find((p) => p.pageId === selectedPageId) || pages[0];

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  if (!pages.length) {
    return null;
  }

  return (
    <div ref={ref} className="relative w-full">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex w-full items-center gap-2 rounded-lg border border-ink-200 bg-white px-3 py-2 text-sm font-medium text-ink-700 shadow-sm transition-colors hover:bg-ink-50"
      >
        {currentPage.pictureUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={currentPage.pictureUrl}
            alt=""
            width={20}
            height={20}
            className="h-5 w-5 rounded-full object-cover"
          />
        ) : (
          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-brand-100 text-[10px] font-bold text-brand-700">
            {currentPage.name[0]}
          </span>
        )}
        <span className="min-w-0 flex-1 truncate text-left">
          {currentPage.name}
        </span>
        <ChevronDown className="h-3.5 w-3.5 shrink-0 text-ink-400" />
      </button>

      {open && (
        <div className="absolute left-0 right-0 top-full z-50 mt-1 rounded-xl border border-ink-100 bg-white py-1 shadow-lg">
          {pages.map((page) => (
            <button
              key={page.id}
              type="button"
              onClick={() => {
                selectPage(page.pageId);
                setOpen(false);
              }}
              className="flex w-full items-center gap-3 px-3 py-2.5 text-left transition-colors hover:bg-ink-50"
            >
              {page.pictureUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={page.pictureUrl}
                  alt=""
                  width={28}
                  height={28}
                  className="h-7 w-7 rounded-full object-cover"
                />
              ) : (
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-brand-100 text-xs font-bold text-brand-700">
                  {page.name[0]}
                </span>
              )}
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-ink-900">
                  {page.name}
                </p>
              </div>
              {currentPage.pageId === page.pageId && (
                <div className="flex items-center gap-1.5 shrink-0">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                  <Check className="h-4 w-4 text-brand-600" />
                </div>
              )}
            </button>
          ))}

          {/* Divider */}
          <div className="my-1 border-t border-ink-100" />

          {/* Connect Page link */}
          <a
            href="/dashboard/pages"
            onClick={() => setOpen(false)}
            className="flex items-center gap-3 px-3 py-2.5 text-left text-sm font-medium text-ink-600 transition-colors hover:bg-ink-50 hover:text-ink-900"
          >
            <Plus className="h-4 w-4" />
            Connect Page
          </a>
        </div>
      )}
    </div>
  );
}
