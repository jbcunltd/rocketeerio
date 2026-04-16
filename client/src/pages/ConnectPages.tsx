import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import {
  CheckCircle, ExternalLink, Facebook, Loader2, RefreshCw, Rocket, AlertCircle
} from "lucide-react";
import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { toast } from "sonner";

interface AvailablePage {
  facebookPageId: string;
  name: string;
  category: string;
  avatarUrl: string;
  followerCount: number;
  isConnected: boolean;
}

export default function ConnectPages() {
  const { user, loading: authLoading } = useAuth({ redirectOnUnauthenticated: true });
  const [, setLocation] = useLocation();
  const [pages, setPages] = useState<AvailablePage[]>([]);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [loadingPages, setLoadingPages] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [connectingPageId, setConnectingPageId] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const connectPage = trpc.pages.connectSinglePage.useMutation();
  const utils = trpc.useUtils();

  // Extract session from URL
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const sid = params.get("session");
    if (sid) {
      setSessionId(sid);
      fetchAvailablePages(sid);
    } else {
      setError("No session found. Please start the Facebook connection flow again.");
      setLoadingPages(false);
    }
  }, []);

  async function fetchAvailablePages(sid: string) {
    try {
      setLoadingPages(true);
      setError(null);
      const res = await fetch(`/api/facebook/available-pages?session=${sid}`);
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to load pages");
      }
      const data = await res.json();
      setPages(data.pages || []);
    } catch (err: any) {
      setError(err.message || "Failed to load available pages");
    } finally {
      setLoadingPages(false);
    }
  }

  async function handleConnectPage(page: AvailablePage) {
    if (!sessionId) return;
    setConnectingPageId(page.facebookPageId);
    try {
      // First subscribe the page to webhooks and get the access token
      const subRes = await fetch("/api/facebook/subscribe-page", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          oauthSessionId: sessionId,
          facebookPageId: page.facebookPageId,
        }),
      });
      if (!subRes.ok) {
        const data = await subRes.json().catch(() => ({}));
        throw new Error(data.error || "Failed to subscribe page");
      }
      const subData = await subRes.json();

      // Now save the page via tRPC
      await connectPage.mutateAsync({
        facebookPageId: page.facebookPageId,
        pageName: subData.pageName,
        pageAccessToken: subData.pageAccessToken,
        category: subData.category || undefined,
        avatarUrl: subData.avatarUrl || undefined,
        followerCount: subData.followerCount || 0,
      });

      // Update local state
      setPages(prev =>
        prev.map(p =>
          p.facebookPageId === page.facebookPageId
            ? { ...p, isConnected: true }
            : p
        )
      );

      // Invalidate pages query so sidebar updates
      utils.pages.list.invalidate();
      toast.success(`${page.name} connected successfully!`);
    } catch (err: any) {
      const msg = err.message || "Failed to connect page";
      if (msg.includes("limit") || msg.includes("FORBIDDEN")) {
        toast.error("You've reached your plan's page limit. Upgrade to connect more pages.");
      } else {
        toast.error(msg);
      }
    } finally {
      setConnectingPageId(null);
    }
  }

  async function handleRefresh() {
    if (!sessionId) return;
    setRefreshing(true);
    try {
      const res = await fetch("/api/facebook/refresh-pages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ oauthSessionId: sessionId }),
      });
      if (!res.ok) {
        throw new Error("Failed to refresh pages");
      }
      const data = await res.json();
      setPages(data.pages || []);
      toast.success("Page list refreshed!");
    } catch (err: any) {
      toast.error(err.message || "Failed to refresh pages");
    } finally {
      setRefreshing(false);
    }
  }

  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <Loader2 className="w-8 h-8 animate-spin text-messenger" />
      </div>
    );
  }

  const connectedCount = pages.filter(p => p.isConnected).length;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-2xl mx-auto px-4 py-6 sm:px-6">
          <div className="flex items-center gap-3 mb-1">
            <div className="w-10 h-10 bg-messenger rounded-xl flex items-center justify-center">
              <Rocket className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-xl font-bold tracking-tight">Connect Your Pages</h1>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-2xl mx-auto px-4 py-8 sm:px-6">
        {loadingPages ? (
          <div className="flex flex-col items-center justify-center py-16 gap-4">
            <Loader2 className="w-8 h-8 animate-spin text-messenger" />
            <p className="text-muted-foreground">Loading your Facebook Pages...</p>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-16 gap-4">
            <AlertCircle className="w-10 h-10 text-destructive" />
            <p className="text-muted-foreground text-center max-w-md">{error}</p>
            <Button variant="outline" onClick={() => setLocation("/settings?tab=accounts")}>
              Back to Settings
            </Button>
          </div>
        ) : (
          <>
            {/* Summary banner */}
            <div className="bg-white rounded-xl border p-5 mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-[#1877F2]/10 rounded-lg flex items-center justify-center">
                  <Facebook className="w-5 h-5 text-[#1877F2]" />
                </div>
                <div>
                  <p className="font-semibold text-foreground">
                    We found {pages.length} Facebook Page{pages.length !== 1 ? "s" : ""} managed by you
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {connectedCount > 0
                      ? `${connectedCount} already connected. Select additional pages to connect with Rocketeer.`
                      : "Select the pages you want to connect with Rocketeer."
                    }
                  </p>
                </div>
              </div>
            </div>

            {/* Page list */}
            <div className="space-y-3 mb-8">
              {pages.map(page => (
                <div
                  key={page.facebookPageId}
                  className={`bg-white rounded-xl border p-4 flex items-center gap-4 transition-all ${
                    page.isConnected ? "border-green-200 bg-green-50/30" : "hover:border-messenger/30"
                  }`}
                >
                  {/* Avatar */}
                  {page.avatarUrl ? (
                    <img
                      src={page.avatarUrl}
                      alt={page.name}
                      className="w-12 h-12 rounded-lg object-cover shrink-0"
                    />
                  ) : (
                    <div className="w-12 h-12 bg-[#1877F2]/10 rounded-lg flex items-center justify-center shrink-0">
                      <Facebook className="w-6 h-6 text-[#1877F2]" />
                    </div>
                  )}

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-foreground truncate">{page.name}</p>
                    <p className="text-xs text-muted-foreground truncate">
                      {page.category || "Facebook Page"}
                      {page.followerCount > 0 && ` \u00b7 ${page.followerCount.toLocaleString()} followers`}
                    </p>
                  </div>

                  {/* Action */}
                  {page.isConnected ? (
                    <span className="inline-flex items-center gap-1.5 text-sm font-medium text-green-700 bg-green-100 px-3 py-1.5 rounded-lg shrink-0">
                      <CheckCircle className="w-4 h-4" />
                      Connected
                    </span>
                  ) : (
                    <Button
                      size="sm"
                      className="bg-messenger hover:bg-messenger-dark shrink-0"
                      disabled={connectingPageId === page.facebookPageId}
                      onClick={() => handleConnectPage(page)}
                    >
                      {connectingPageId === page.facebookPageId ? (
                        <Loader2 className="w-4 h-4 animate-spin mr-1" />
                      ) : null}
                      Connect
                    </Button>
                  )}
                </div>
              ))}
            </div>

            {/* Footer actions */}
            <div className="bg-white rounded-xl border p-5 space-y-4">
              <div className="flex flex-col sm:flex-row gap-3">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleRefresh}
                  disabled={refreshing}
                  className="gap-2"
                >
                  <RefreshCw className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`} />
                  Refresh Page List
                </Button>
                <a
                  href="https://www.facebook.com/settings?tab=business_tools"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors px-3 py-2"
                >
                  <ExternalLink className="w-4 h-4" />
                  I can't see the Page I want
                </a>
              </div>
              <div className="border-t pt-4">
                <Button
                  onClick={() => setLocation("/settings?tab=accounts")}
                  className="bg-messenger hover:bg-messenger-dark"
                >
                  Done \u2014 Go to Settings
                </Button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
