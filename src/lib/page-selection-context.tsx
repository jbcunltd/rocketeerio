"use client";

import React, { createContext, useContext, useState, useCallback } from "react";
import { useSearchParams, useRouter } from "next/navigation";

export type PageSelectionContextType = {
  selectedPageId: string | null;
  selectPage: (pageId: string) => void;
};

const PageSelectionContext = createContext<
  PageSelectionContextType | undefined
>(undefined);

export function PageSelectionProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [selectedPageId, setSelectedPageId] = useState<string | null>(
    searchParams.get("pageId"),
  );

  const selectPage = useCallback(
    (pageId: string) => {
      setSelectedPageId(pageId);
      // Update URL to persist selection across navigation
      const params = new URLSearchParams(searchParams);
      params.set("pageId", pageId);
      router.push(`?${params.toString()}`);
    },
    [searchParams, router],
  );

  return (
    <PageSelectionContext.Provider value={{ selectedPageId, selectPage }}>
      {children}
    </PageSelectionContext.Provider>
  );
}

export function usePageSelection(): PageSelectionContextType {
  const context = useContext(PageSelectionContext);
  if (!context) {
    throw new Error(
      "usePageSelection must be used within PageSelectionProvider",
    );
  }
  return context;
}
