import { useAuth } from "@/_core/hooks/useAuth";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";

import { AiModeToggle, AiModeBadge } from "@/components/AiModeToggle";
import type { AiMode } from "@/components/AiModeToggle";
import { PageSwitcher } from "@/components/PageSwitcher";
import { useActivePage } from "@/contexts/ActivePageContext";
import { useIsMobile } from "@/hooks/useMobile";
import {
  LayoutDashboard, MessageCircle, Users,
  LogOut, PanelLeft, Rocket, BookOpen, Zap, CreditCard, BarChart3, Headphones,
  User, Bell, Settings
} from "lucide-react";
import { CSSProperties, useEffect, useRef, useState } from "react";
import { useLocation } from "wouter";
import { DashboardLayoutSkeleton } from './DashboardLayoutSkeleton';
import { Button } from "./ui/button";

// Page-level nav items (change per active page)
const pageNavItems = [
  { icon: LayoutDashboard, label: "Dashboard", path: "/dashboard" },
  { icon: MessageCircle, label: "Conversations", path: "/conversations" },
  { icon: Headphones, label: "Agent Inbox", path: "/agent-inbox" },
  { icon: Users, label: "Leads", path: "/leads" },
  { icon: BookOpen, label: "Knowledge Base", path: "/knowledge-base" },
  { icon: Zap, label: "Follow-Ups", path: "/follow-ups" },
  { icon: BarChart3, label: "Analytics", path: "/analytics" },
  { icon: Settings, label: "Page Settings", path: "/settings" },
];

const SIDEBAR_WIDTH_KEY = "sidebar-width";
const DEFAULT_WIDTH = 260;
const MIN_WIDTH = 200;
const MAX_WIDTH = 400;

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sidebarWidth, setSidebarWidth] = useState(() => {
    const saved = localStorage.getItem(SIDEBAR_WIDTH_KEY);
    return saved ? parseInt(saved, 10) : DEFAULT_WIDTH;
  });
  const { loading, user } = useAuth();

  useEffect(() => {
    localStorage.setItem(SIDEBAR_WIDTH_KEY, sidebarWidth.toString());
  }, [sidebarWidth]);

  if (loading) {
    return <DashboardLayoutSkeleton />;
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="flex flex-col items-center gap-8 p-8 max-w-md w-full">
          <div className="w-16 h-16 bg-messenger rounded-2xl flex items-center justify-center shadow-lg shadow-messenger/20">
            <Rocket className="w-9 h-9 text-white" />
          </div>
          <div className="flex flex-col items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight text-center">
              Welcome to Rocketeer
            </h1>
            <p className="text-sm text-muted-foreground text-center max-w-sm">
              Sign in to access your AI sales dashboard and start qualifying leads automatically.
            </p>
          </div>
          <Button
            onClick={() => { window.location.href = "/"; }}
            size="lg"
            className="w-full bg-messenger hover:bg-messenger-dark shadow-lg"
          >
            Sign In to Continue
          </Button>
        </div>
      </div>
    );
  }

  return (
    <SidebarProvider
      style={{ "--sidebar-width": `${sidebarWidth}px` } as CSSProperties}
    >
      <DashboardLayoutContent setSidebarWidth={setSidebarWidth}>
        {children}
      </DashboardLayoutContent>
    </SidebarProvider>
  );
}

type DashboardLayoutContentProps = {
  children: React.ReactNode;
  setSidebarWidth: (width: number) => void;
};

function DashboardLayoutContent({
  children,
  setSidebarWidth,
}: DashboardLayoutContentProps) {
  const { user, logout } = useAuth();
  const [location, setLocation] = useLocation();
  const { state, toggleSidebar } = useSidebar();
  const isCollapsed = state === "collapsed";
  const [isResizing, setIsResizing] = useState(false);
  const sidebarRef = useRef<HTMLDivElement>(null);
  const activeMenuItem = pageNavItems.find(item => location.startsWith(item.path))
    || (location.startsWith("/billing") ? { label: "Billing & Plans" } : null)
    || (location.startsWith("/integrations") ? { label: "Integrations" } : null);
  const isMobile = useIsMobile();

  // Use active page from context for AI mode indicator
  const { activePage } = useActivePage();
  const primaryMode: AiMode = (activePage?.aiMode as AiMode) || "testing";

  useEffect(() => {
    if (isCollapsed) setIsResizing(false);
  }, [isCollapsed]);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing) return;
      const sidebarLeft = sidebarRef.current?.getBoundingClientRect().left ?? 0;
      const newWidth = e.clientX - sidebarLeft;
      if (newWidth >= MIN_WIDTH && newWidth <= MAX_WIDTH) setSidebarWidth(newWidth);
    };
    const handleMouseUp = () => setIsResizing(false);
    if (isResizing) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
      document.body.style.cursor = "col-resize";
      document.body.style.userSelect = "none";
    }
    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    };
  }, [isResizing, setSidebarWidth]);

  return (
    <>
      <div className="relative" ref={sidebarRef}>
        <Sidebar collapsible="icon" className="border-r-0" disableTransition={isResizing}>
          <SidebarHeader className="justify-center">
            {/* Logo + collapse toggle */}
            <div className="flex items-center gap-3 px-2 transition-all w-full h-10">
              <button
                onClick={toggleSidebar}
                className="h-8 w-8 flex items-center justify-center hover:bg-accent rounded-lg transition-colors focus:outline-none shrink-0"
                aria-label="Toggle navigation"
              >
                {isCollapsed ? (
                  <div className="w-7 h-7 bg-messenger rounded-lg flex items-center justify-center">
                    <Rocket className="w-4 h-4 text-white" />
                  </div>
                ) : (
                  <PanelLeft className="h-4 w-4 text-muted-foreground" />
                )}
              </button>
              {!isCollapsed && (
                <div className="flex items-center gap-2 min-w-0">
                  <div className="w-7 h-7 bg-messenger rounded-lg flex items-center justify-center shrink-0">
                    <Rocket className="w-4 h-4 text-white" />
                  </div>
                  <span className="font-bold tracking-tight truncate text-foreground">Rocketeer</span>
                </div>
              )}
            </div>

            {/* Page Switcher Dropdown */}
            <div className="mt-1">
              <PageSwitcher collapsed={isCollapsed} />
            </div>
          </SidebarHeader>

          <SidebarContent className="gap-0">
            {/* AI Mode Indicator in Sidebar */}
            {activePage && !isCollapsed && (
              <div className="px-3 py-2">
                <AiModeToggle
                  pageId={activePage.id}
                  currentMode={primaryMode}
                  compact
                />
              </div>
            )}
            {activePage && isCollapsed && (
              <div className="flex justify-center py-2">
                <AiModeBadge mode={primaryMode} />
              </div>
            )}

            {/* Page-level navigation */}
            <SidebarMenu className="px-2 py-1">
              {pageNavItems.map(item => {
                const isActive = location.startsWith(item.path);
                return (
                  <SidebarMenuItem key={item.path}>
                    <SidebarMenuButton
                      isActive={isActive}
                      onClick={() => setLocation(item.path)}
                      tooltip={item.label}
                      className="h-10 transition-all font-normal"
                    >
                      <item.icon className={`h-4 w-4 ${isActive ? "text-messenger" : ""}`} />
                      <span className={isActive ? "font-semibold" : ""}>{item.label}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarContent>

          <SidebarFooter className="p-3">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-3 rounded-lg px-1 py-1 hover:bg-accent/50 transition-colors w-full text-left group-data-[collapsible=icon]:justify-center focus:outline-none">
                  <Avatar className="h-9 w-9 border shrink-0">
                    <AvatarFallback className="text-xs font-medium bg-messenger text-white">
                      {user?.name?.charAt(0).toUpperCase() || "U"}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0 group-data-[collapsible=icon]:hidden">
                    <p className="text-sm font-medium truncate leading-none">{user?.name || "User"}</p>
                    <p className="text-xs text-muted-foreground truncate mt-1.5">{user?.email || ""}</p>
                  </div>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <div className="px-2 py-1.5">
                  <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">Account</p>
                </div>
                <DropdownMenuItem onClick={() => setLocation("/settings?tab=profile")} className="cursor-pointer">
                  <User className="mr-2 h-4 w-4" />
                  <span>Account Settings</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setLocation("/billing")} className="cursor-pointer">
                  <CreditCard className="mr-2 h-4 w-4" />
                  <span>Billing & Plans</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setLocation("/settings?tab=notifications")} className="cursor-pointer">
                  <Bell className="mr-2 h-4 w-4" />
                  <span>Notifications</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={logout} className="cursor-pointer text-destructive focus:text-destructive">
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Sign out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarFooter>
        </Sidebar>
        <div
          className={`absolute top-0 right-0 w-1 h-full cursor-col-resize hover:bg-messenger/20 transition-colors ${isCollapsed ? "hidden" : ""}`}
          onMouseDown={() => { if (!isCollapsed) setIsResizing(true); }}
          style={{ zIndex: 50 }}
        />
      </div>

      <SidebarInset className="flex flex-col overflow-hidden h-svh">
        {isMobile && (
          <div className="flex border-b h-14 items-center justify-between bg-white/95 px-2 backdrop-blur sticky top-0 z-40">
            <div className="flex items-center gap-2">
              <SidebarTrigger className="h-9 w-9 rounded-lg bg-background" />
              <span className="tracking-tight text-foreground font-semibold">
                {activeMenuItem?.label ?? "Rocketeer"}
              </span>
            </div>
            {activePage && (
              <AiModeBadge mode={primaryMode} />
            )}
          </div>
        )}
        <main className="flex-1 overflow-y-auto overflow-x-hidden p-3 sm:p-4 md:p-6">{children}</main>
      </SidebarInset>
    </>
  );
}
