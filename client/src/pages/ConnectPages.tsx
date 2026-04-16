import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import {
  Facebook, Loader2, CheckCircle, ExternalLink, RefreshCw, AlertCircle
} from "lucide-react";
import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { toast } from "sonner";

interface AvailablePage {
  fbPageId: string;
  name: string;
  category: string;
  avatarUrl: string;
  fanCount: number;
  isConnected: boolean;
  accessToken: string;
}

export default function ConnectPages() {
  const { user, loading: authLoading } = useAuth({ redirectTo: "/" });
  const [, navigate] = useLocation();
  const [pages, setPages] = useState<AvailablePage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [connectingId, setConnectingId] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const fetchPages = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch("/api/facebook/available-pages", { credentials: "include" });
      const data = await res.json();
      if (!res.ok) {
        if (data.error === "no_token") {
          setError("no_token");
        } else {
          setError(data.message || "Failed to load pages");
        }
        return;
      }
      setPages(data.pages || []);
    } catch {
      setError("Failed to load pages. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchPages();
    }
  }, [user]);

  const handleConnect = async (page: AvailablePage) => {
    setConnectingId(page.fbPageId);
    try {
      const res = await fetch("/api/facebook/subscribe-page", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          fbPageId: page.fbPageId,
          name: page.name,
          category: page.category,
          avatarUrl: page.avatarUrl,
          fanCount: page.fanCount,
          accessToken: page.accessToken,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        if (data.error === "plan_limit") {
          toast.error(data.message || "Plan limit reached. Upgrade to connect more pages.");
        } else {
          toast.error(data.message || "Failed to connect page");
        }
        return;
      }
      toast.success(`${page.name} connected successfully!`);
      // Redirect to dashboard with the newly connected page
      navigate(`/dashboard?pageId=${data.pageId}`);
    } catch {
      toast.error("Failed to connect page. Please try again.");
    } finally {
      setConnectingId(null);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      const res = await fetch("/api/facebook/refresh-pages", {
        method: "POST",
        credentials: "include",
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.message || "Failed to refresh pages");
        return;
      }
      setPages(data.pages || []);
      toast.success("Page list refreshed!");
    } catch {
      toast.error("Failed to refresh. Please try again.");
    } finally {
      setRefreshing(false);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="w-8 h-8 animate-spin text-[#1877F2]" />
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center py-8 px-4">
      <div className="w-full max-w-2xl">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-[#1877F2]/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Facebook className="w-8 h-8 text-[#1877F2]" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Connect Your Facebook Pages</h1>
          {!loading && !error && (
            <p className="text-gray-500 mt-2">
              We found <strong>{pages.length}</strong> Facebook Page{pages.length !== 1 ? "s" : ""} managed by you.
              Select which ones to connect to Rocketeerio.
            </p>
          )}
        </div>

        {/* Loading */}
        {loading && (
          <div className="flex flex-col items-center justify-center py-16">
            <Loader2 className="w-8 h-8 animate-spin text-[#1877F2] mb-4" />
            <p className="text-gray-500">Loading your Facebook Pages...</p>
          </div>
        )}

        {/* Error: No token */}
        {error === "no_token" && !loading && (
          <div className="bg-white rounded-xl border p-8 text-center">
            <AlertCircle className="w-12 h-12 text-amber-500 mx-auto mb-4" />
            <h2 className="text-lg font-semibold mb-2">Session Expired</h2>
            <p className="text-gray-500 mb-6">
              Your Facebook authorization has expired. Please reconnect to continue.
            </p>
            <Button
              onClick={() => { window.location.href = "/api/auth/facebook"; }}
              className="bg-[#1877F2] hover:bg-[#166FE5] text-white"
            >
              <Facebook className="w-4 h-4 mr-2" />
              Reconnect Facebook
            </Button>
          </div>
        )}

        {/* Error: Generic */}
        {error && error !== "no_token" && !loading && (
          <div className="bg-white rounded-xl border p-8 text-center">
            <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-lg font-semibold mb-2">Something went wrong</h2>
            <p className="text-gray-500 mb-6">{error}</p>
            <Button onClick={fetchPages} variant="outline">
              Try Again
            </Button>
          </div>
        )}

        {/* Page List */}
        {!loading && !error && (
          <>
            <div className="bg-white rounded-xl border overflow-hidden divide-y">
              {pages.map((page) => (
                <div key={page.fbPageId} className="flex items-center gap-3 p-4">
                  {/* Avatar */}
                  <div className="w-12 h-12 rounded-full overflow-hidden bg-gray-100 shrink-0">
                    {page.avatarUrl ? (
                      <img src={page.avatarUrl} alt={page.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Facebook className="w-6 h-6 text-gray-400" />
                      </div>
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 truncate">{page.name}</p>
                    <p className="text-xs text-gray-500 truncate">
                      {page.category}{page.fanCount > 0 ? ` \u00b7 ${page.fanCount.toLocaleString()} followers` : ""}
                    </p>
                  </div>

                  {/* Action */}
                  <div className="shrink-0">
                    {page.isConnected ? (
                      <span className="inline-flex items-center gap-1.5 text-sm font-medium text-green-700 bg-green-50 px-3 py-1.5 rounded-lg">
                        <CheckCircle className="w-4 h-4" />
                        Connected
                      </span>
                    ) : (
                      <Button
                        size="sm"
                        onClick={() => handleConnect(page)}
                        disabled={connectingId === page.fbPageId}
                        className="bg-[#1877F2] hover:bg-[#166FE5] text-white"
                      >
                        {connectingId === page.fbPageId ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          "Connect"
                        )}
                      </Button>
                    )}
                  </div>
                </div>
              ))}

              {pages.length === 0 && (
                <div className="p-8 text-center">
                  <p className="text-gray-500">No Facebook Pages found. Make sure you are an admin of at least one Facebook Page.</p>
                </div>
              )}
            </div>

            {/* Footer Actions */}
            <div className="mt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex flex-wrap items-center gap-4 text-sm">
                <button
                  onClick={handleRefresh}
                  disabled={refreshing}
                  className="inline-flex items-center gap-1.5 text-[#1877F2] hover:underline font-medium cursor-pointer disabled:opacity-50"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? "animate-spin" : ""}`} />
                  Refresh Page List
                </button>
                <a
                  href="https://business.facebook.com/settings/pages"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-gray-500 hover:text-gray-700 hover:underline"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  {"I can't see the Page I want"}
                </a>
              </div>

              <Button
                onClick={() => navigate("/dashboard")}
                className="bg-[#1877F2] hover:bg-[#166FE5] text-white"
              >
                Done
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
