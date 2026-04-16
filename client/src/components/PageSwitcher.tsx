import { useActivePage } from "@/contexts/ActivePageContext";
import { UpgradeModal } from "@/components/UpgradeModal";
import { trpc } from "@/lib/trpc";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from "@/_core/hooks/useAuth";
import { ChevronsUpDown, Plus, Check, Facebook, Settings } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { useLocation } from "wouter";

export function PageSwitcher({ collapsed }: { collapsed?: boolean }) {
  const { activePage, pages, setActivePageId, isLoading } = useActivePage();
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [showUpgrade, setShowUpgrade] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [, navigate] = useLocation();

  // Fetch plan limit check
  const { data: canAddData } = trpc.pages.checkCanAdd.useQuery(undefined, {
    enabled: !!user,
  });

  // Close on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [open]);

  // Close on Escape
  useEffect(() => {
    function handleEsc(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    if (open) {
      document.addEventListener("keydown", handleEsc);
      return () => document.removeEventListener("keydown", handleEsc);
    }
  }, [open]);

  const handleAddPage = () => {
    setOpen(false);
    if (canAddData && !canAddData.allowed) {
      setShowUpgrade(true);
    } else {
      // Start Facebook OAuth flow to connect account / add pages
      window.location.href = "/api/auth/facebook";
    }
  };

  const handleSelectPage = (pageId: number) => {
    setActivePageId(pageId);
    setOpen(false);
  };

  const handlePageSettings = (e: React.MouseEvent) => {
    e.stopPropagation();
    setOpen(false);
    navigate("/settings");
  };

  if (isLoading) {
    return (
      <div className="px-2">
        <div className="h-10 bg-muted/50 rounded-lg animate-pulse" />
      </div>
    );
  }

  if (pages.length === 0) {
    return (
      <div className="px-2">
        <button
          onClick={handleAddPage}
          className="flex items-center gap-2 w-full rounded-lg px-2.5 py-2 text-sm text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
        >
          <div className="w-7 h-7 rounded-full bg-blue-500/10 flex items-center justify-center shrink-0">
            <Plus className="w-3.5 h-3.5 text-blue-500" />
          </div>
          {!collapsed && <span className="truncate">Connect a Page</span>}
        </button>
      </div>
    );
  }

  // Collapsed state: just show avatar
  if (collapsed) {
    return (
      <div className="flex justify-center px-2">
        <button
          onClick={() => setOpen(!open)}
          className="relative"
        >
          <Avatar className="h-8 w-8 border">
            {activePage?.avatarUrl ? (
              <AvatarImage src={activePage.avatarUrl} alt={activePage.pageName} />
            ) : null}
            <AvatarFallback className="text-xs bg-blue-500/10 text-blue-600">
              {activePage?.pageName?.charAt(0)?.toUpperCase() || <Facebook className="w-3.5 h-3.5" />}
            </AvatarFallback>
          </Avatar>
          {open && (
            <div
              ref={dropdownRef}
              className="absolute left-full top-0 ml-2 z-50 w-64 bg-popover border rounded-lg shadow-lg py-1 animate-in fade-in-0 zoom-in-95"
            >
              <DropdownContent
                pages={pages}
                activePageId={activePage?.id ?? null}
                onSelect={handleSelectPage}
                onAddPage={handleAddPage}
                onPageSettings={handlePageSettings}
              />
            </div>
          )}
        </button>
      </div>
    );
  }

  // Expanded state: full switcher
  return (
    <div className="px-2 relative" ref={dropdownRef}>
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2.5 w-full rounded-lg px-2.5 py-2 hover:bg-accent transition-colors text-left group"
      >
        <Avatar className="h-8 w-8 border shrink-0">
          {activePage?.avatarUrl ? (
            <AvatarImage src={activePage.avatarUrl} alt={activePage.pageName} />
          ) : null}
          <AvatarFallback className="text-xs bg-blue-500/10 text-blue-600">
            {activePage?.pageName?.charAt(0)?.toUpperCase() || <Facebook className="w-3.5 h-3.5" />}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium truncate leading-none">
            {activePage?.pageName || "Select Page"}
          </p>
          {activePage?.category && (
            <p className="text-[11px] text-muted-foreground truncate mt-1">
              {activePage.category}
            </p>
          )}
        </div>
        <ChevronsUpDown className="w-4 h-4 text-muted-foreground shrink-0 opacity-50 group-hover:opacity-100 transition-opacity" />
      </button>

      {open && (
        <div className="absolute left-2 right-2 top-full mt-1 z-50 bg-popover border rounded-lg shadow-lg py-1 animate-in fade-in-0 zoom-in-95">
          <DropdownContent
            pages={pages}
            activePageId={activePage?.id ?? null}
            onSelect={handleSelectPage}
            onAddPage={handleAddPage}
            onPageSettings={handlePageSettings}
          />
        </div>
      )}

      <UpgradeModal
        open={showUpgrade}
        onClose={() => setShowUpgrade(false)}
        resourceName="Facebook Pages"
        currentPlan={user?.plan || "free"}
        nextPlan={canAddData?.nextPlan ?? undefined}
        currentCount={canAddData?.currentCount}
        limit={canAddData?.limit}
      />
    </div>
  );
}

function DropdownContent({
  pages,
  activePageId,
  onSelect,
  onAddPage,
  onPageSettings,
}: {
  pages: Array<{
    id: number;
    pageName: string;
    avatarUrl: string | null;
    category: string | null;
  }>;
  activePageId: number | null;
  onSelect: (id: number) => void;
  onAddPage: () => void;
  onPageSettings: (e: React.MouseEvent) => void;
}) {
  return (
    <>
      <div className="px-3 py-1.5">
        <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
          Your Pages
        </p>
      </div>
      <div className="max-h-[240px] overflow-y-auto">
        {pages.map(page => {
          const isActive = page.id === activePageId;
          return (
            <button
              key={page.id}
              onClick={() => onSelect(page.id)}
              className={`flex items-center gap-2.5 w-full px-3 py-2 text-left hover:bg-accent transition-colors ${
                isActive ? "bg-accent/50" : ""
              }`}
            >
              <Avatar className="h-7 w-7 border shrink-0">
                {page.avatarUrl ? (
                  <AvatarImage src={page.avatarUrl} alt={page.pageName} />
                ) : null}
                <AvatarFallback className="text-[10px] bg-blue-500/10 text-blue-600">
                  {page.pageName?.charAt(0)?.toUpperCase() || "P"}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate leading-none">
                  {page.pageName}
                </p>
                {page.category && (
                  <p className="text-[11px] text-muted-foreground truncate mt-0.5">
                    {page.category}
                  </p>
                )}
              </div>
              {isActive && (
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    onClick={onPageSettings}
                    className="p-1 rounded hover:bg-background/80 text-muted-foreground hover:text-foreground transition-colors"
                    title="Page Settings"
                  >
                    <Settings className="w-3.5 h-3.5" />
                  </button>
                  <Check className="w-4 h-4 text-messenger" />
                </div>
              )}
            </button>
          );
        })}
      </div>
      <div className="border-t mt-1 pt-1">
        <button
          onClick={onAddPage}
          className="flex items-center gap-2.5 w-full px-3 py-2 text-left hover:bg-accent transition-colors text-blue-600"
        >
          <div className="w-7 h-7 rounded-full bg-blue-500/10 flex items-center justify-center shrink-0">
            <Plus className="w-3.5 h-3.5" />
          </div>
          <span className="text-sm font-medium">+ Add Page</span>
        </button>
      </div>
    </>
  );
}
