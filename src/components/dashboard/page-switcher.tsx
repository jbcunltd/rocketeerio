"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Check, ChevronDown, Plus } from "lucide-react";
import Link from "next/link";
import { usePageSelection } from "@/lib/page-selection-context";

interface PageItem {
  id: number;
  pageId: string;
  name: string;
  pictureUrl: string | null;
  isActive: boolean;
}

export function PageSwitcher({ pages }: { pages: PageItem[] }) {
  const [open, setOpen] = useState(false);
  const { selectedPageId, selectPage } = usePageSelection();
  const ref = useRef<HTMLDivElement>(null);

  const selected = useMemo(
    () => pages.find((page) => page.pageId === selectedPageId) ?? pages[0],
    [pages, selectedPageId],
  );

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  if (pages.length <= 1 || !selected) {
    return null;
  }

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="inline-flex items-center gap-2 rounded-lg border border-ink-200 bg-white px-3 py-2 text-sm font-medium text-ink-700 shadow-sm hover:bg-ink-50 transition-colors"
      >
        {selected.pictureUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={selected.pictureUrl}
            alt=""
            width={20}
            height={20}
            className="h-5 w-5 rounded-full object-cover"
          />
        ) : (
          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-brand-100 text-[10px] font-bold text-brand-700">
            {selected.name[0]}
          </span>
        )}
        <span className="max-w-[120px] truncate">{selected.name}</span>
        <ChevronDown className="h-3.5 w-3.5 text-ink-400" />
      </button>

      {open && (
        <div className="absolute right-0 top-full z-50 mt-1 w-64 rounded-xl border border-ink-100 bg-white py-1 shadow-lg">
          {pages.map((page) => (
            <button
              key={page.id}
              type="button"
              onClick={() => {
                selectPage(page.pageId);
                setOpen(false);
              }}
              className="flex w-full items-center gap-3 px-3 py-2.5 text-left hover:bg-ink-50 transition-colors"
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
              {selected.pageId === page.pageId && (
                <Check className="h-4 w-4 text-brand-600 shrink-0" />
              )}
            </button>
          ))}

          {/* Divider */}
          <div className="my-1 border-t border-ink-100" />

          {/* Add Another Page link */}
          <Link
            href="/api/facebook/pages"
            onClick={() => setOpen(false)}
            className="flex items-center gap-3 px-3 py-2.5 text-left text-sm font-medium text-ink-600 transition-colors hover:bg-ink-50 hover:text-ink-900"
          >
            <Plus className="h-4 w-4" />
            Add Another Page
          </Link>
        </div>
      )}
    </div>
  );
}
