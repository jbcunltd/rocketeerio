import React, { createContext, useContext, useEffect, useState, useCallback, useMemo } from "react";
import { trpc } from "@/lib/trpc";

const ACTIVE_PAGE_KEY = "rocketeer-active-page-id";

interface ActivePageContextType {
  /** The DB id of the currently selected page, or null if none / "all pages" */
  activePageId: number | null;
  /** Set the active page by DB id (persisted to localStorage) */
  setActivePageId: (id: number | null) => void;
  /** The full page object for the active page (from pages.list cache) */
  activePage: ActivePageRecord | null;
  /** All pages for the current user */
  pages: ActivePageRecord[];
  /** Whether the pages query is still loading */
  isLoading: boolean;
}

export interface ActivePageRecord {
  id: number;
  pageId: string;
  pageName: string;
  avatarUrl: string | null;
  category: string | null;
  isActive: boolean;
  aiMode: string;
  followerCount: number | null;
  createdAt: string;
}

const ActivePageContext = createContext<ActivePageContextType | undefined>(undefined);

export function ActivePageProvider({ children }: { children: React.ReactNode }) {
  const [activePageId, setActivePageIdRaw] = useState<number | null>(() => {
    const stored = localStorage.getItem(ACTIVE_PAGE_KEY);
    if (stored && stored !== "null") {
      const parsed = parseInt(stored, 10);
      return isNaN(parsed) ? null : parsed;
    }
    return null;
  });

  const { data: pages, isLoading } = trpc.pages.list.useQuery(undefined, {
    refetchOnWindowFocus: false,
  });

  const pagesList: ActivePageRecord[] = useMemo(() => {
    if (!pages) return [];
    return pages.map((p: any) => ({
      id: p.id,
      pageId: p.pageId,
      pageName: p.pageName,
      avatarUrl: p.avatarUrl ?? null,
      category: p.category ?? null,
      isActive: p.isActive,
      aiMode: p.aiMode ?? "testing",
      followerCount: p.followerCount ?? null,
      createdAt: p.createdAt,
    }));
  }, [pages]);

  // Auto-select first page if none selected or selected page no longer exists
  useEffect(() => {
    if (isLoading || pagesList.length === 0) return;
    const exists = pagesList.some(p => p.id === activePageId);
    if (!exists) {
      // Pick the first active page, or just the first page
      const firstActive = pagesList.find(p => p.isActive);
      const fallback = firstActive ?? pagesList[0];
      setActivePageIdRaw(fallback.id);
    }
  }, [pagesList, activePageId, isLoading]);

  // Persist to localStorage
  useEffect(() => {
    if (activePageId !== null) {
      localStorage.setItem(ACTIVE_PAGE_KEY, String(activePageId));
    } else {
      localStorage.removeItem(ACTIVE_PAGE_KEY);
    }
  }, [activePageId]);

  const setActivePageId = useCallback((id: number | null) => {
    setActivePageIdRaw(id);
  }, []);

  const activePage = useMemo(() => {
    if (activePageId === null) return null;
    return pagesList.find(p => p.id === activePageId) ?? null;
  }, [activePageId, pagesList]);

  return (
    <ActivePageContext.Provider
      value={{
        activePageId,
        setActivePageId,
        activePage,
        pages: pagesList,
        isLoading,
      }}
    >
      {children}
    </ActivePageContext.Provider>
  );
}

export function useActivePage() {
  const context = useContext(ActivePageContext);
  if (!context) {
    throw new Error("useActivePage must be used within ActivePageProvider");
  }
  return context;
}
