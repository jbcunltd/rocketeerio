import { useAuth } from "@/_core/hooks/useAuth";
import DashboardLayout from "@/components/DashboardLayout";
import { AiModeToggle } from "@/components/AiModeToggle";
import type { AiMode } from "@/components/AiModeToggle";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";
import { useActivePage } from "@/contexts/ActivePageContext";
import {
  MessageCircle, Users, Flame, Bot,
  Loader2, ArrowRight, Rocket, Zap, Facebook,
  Thermometer, Snowflake, AlertTriangle, Clock
} from "lucide-react";
import { useLocation } from "wouter";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";
import { toast } from "sonner";

/* ------------------------------------------------------------------ */
/*  Compact stat card — designed for 2x2 grid on mobile               */
/* ------------------------------------------------------------------ */
function StatCard({ icon: Icon, label, value, color }: {
  icon: any; label: string; value: string | number; color: string;
}) {
  return (
    <div className="bg-white rounded-xl p-4 border border-gray-200">
      <div className="flex items-center gap-2.5 mb-2">
        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${color}`}>
          <Icon className="w-4 h-4" />
        </div>
        <span className="text-xs font-medium text-muted-foreground leading-tight">{label}</span>
      </div>
      <div className="text-2xl font-extrabold text-foreground">{value}</div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Score badge for conversation list                                  */
/* ------------------------------------------------------------------ */
function ScoreBadge({ classification }: { classification: string }) {
  if (classification === "hot") {
    return (
      <span className="inline-flex items-center gap-0.5 text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-red-50 text-red-500">
        <Flame className="w-2.5 h-2.5" /> Hot
      </span>
    );
  }
  if (classification === "warm") {
    return (
      <span className="inline-flex items-center gap-0.5 text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-amber-50 text-amber-600">
        <Thermometer className="w-2.5 h-2.5" /> Warm
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-0.5 text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-slate-100 text-slate-500">
      <Snowflake className="w-2.5 h-2.5" /> Cold
    </span>
  );
}

/* ------------------------------------------------------------------ */
/*  Time-ago helper                                                    */
/* ------------------------------------------------------------------ */
function timeAgo(dateStr: string): string {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diff = Math.max(0, now - then);
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

/* ------------------------------------------------------------------ */
/*  Main dashboard content                                             */
/* ------------------------------------------------------------------ */
function DashboardContent() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const { activePageId, activePage } = useActivePage();
  const { data: stats, isLoading: statsLoading } = trpc.dashboard.stats.useQuery();
  const { data: activity, isLoading: activityLoading } = trpc.dashboard.activity.useQuery({ days: 7 });
  const { data: pages } = trpc.pages.list.useQuery();
  const { data: allLeads } = trpc.leads.list.useQuery();
  const { data: allConversations } = trpc.conversations.list.useQuery();
  const seedMutation = trpc.seed.generate.useMutation();
  const utils = trpc.useUtils();

  // Filter by active page
  const leads = allLeads?.filter((l: any) => !activePageId || l.pageId === activePageId);
  const conversations = allConversations
    ?.filter((c: any) => !activePageId || c.page?.id === activePageId)
    ?.sort((a: any, b: any) => {
      const aTime = a.conversation?.updatedAt || a.conversation?.createdAt || "";
      const bTime = b.conversation?.updatedAt || b.conversation?.createdAt || "";
      return bTime.localeCompare(aTime);
    });

  const hasData = (stats?.totalConversations ?? 0) > 0;
  const primaryPage = activePage || pages?.find((p: any) => p.isActive) || pages?.[0];

  // Compute AI response rate
  const totalMsgs = stats?.totalMessages ?? 0;
  const aiMsgs = stats?.aiMessages ?? 0;
  const aiRate = totalMsgs > 0 ? Math.round((aiMsgs / totalMsgs) * 100) : 0;

  const handleSeedDemo = async () => {
    try {
      await seedMutation.mutateAsync();
      utils.dashboard.stats.invalidate();
      utils.dashboard.activity.invalidate();
      utils.pages.list.invalidate();
      utils.leads.list.invalidate();
      utils.conversations.list.invalidate();
      utils.knowledgeBase.list.invalidate();
      toast.success("Demo data loaded! Explore the dashboard.");
    } catch { toast.error("Failed to generate demo data"); }
  };

  // Weekly trend data for area chart
  const trendData = activity?.map((d: any) => ({
    date: new Date(d.date).toLocaleDateString("en-US", { weekday: "short" }),
    conversations: (Number(d.hot) || 0) + (Number(d.warm) || 0) + (Number(d.cold) || 0),
  })) || [];

  if (statsLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-messenger" />
      </div>
    );
  }

  // Greeting with active page name
  const greeting = activePage
    ? `Here's your overview for ${activePage.pageName}.`
    : "Here's your lead overview.";

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
        <div className="min-w-0">
          <h1 className="text-xl sm:text-2xl font-bold">Dashboard</h1>
          <p className="text-sm text-muted-foreground truncate">
            Welcome back{user?.name ? `, ${user.name}` : ""}! {greeting}
          </p>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          {!hasData && (
            <Button onClick={handleSeedDemo} disabled={seedMutation.isPending} className="bg-messenger hover:bg-messenger-dark w-full sm:w-auto" size="sm">
              {seedMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-1.5" /> : <Zap className="w-4 h-4 mr-1.5" />}
              Load Demo Data
            </Button>
          )}
        </div>
      </div>

      {/* AI Mode Toggle — only for active page */}
      {primaryPage && (
        <div className="mb-5">
          <AiModeToggle
            pageId={primaryPage.id}
            currentMode={(primaryPage.aiMode as AiMode) || "testing"}
          />
        </div>
      )}

      {/* 2x2 Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
        <StatCard icon={MessageCircle} label="Conversations" value={stats?.totalConversations ?? 0} color="bg-blue-50 text-blue-600" />
        <StatCard icon={Flame} label="Hot Leads" value={stats?.hotLeadsToday ?? 0} color="bg-red-50 text-red-500" />
        <StatCard icon={Users} label="Total Leads" value={stats?.totalLeads ?? 0} color="bg-purple-50 text-purple-600" />
        <StatCard icon={Bot} label="AI Rate" value={`${aiRate}%`} color="bg-green-50 text-green-600" />
      </div>

      {!hasData ? (
        /* Empty State */
        <div className="bg-white rounded-xl p-8 sm:p-12 border border-gray-200 text-center">
          <div className="w-14 h-14 bg-blue-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Rocket className="w-7 h-7 text-blue-600" />
          </div>
          <h2 className="text-lg font-bold mb-2">Get Started with Rocketeerio</h2>
          <p className="text-sm text-muted-foreground max-w-md mx-auto mb-5">
            Connect your Facebook Page, add your business info, and let the AI start qualifying leads for you.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Button onClick={handleSeedDemo} disabled={seedMutation.isPending} className="bg-messenger hover:bg-messenger-dark" size="sm">
              {seedMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-1.5" /> : <Zap className="w-4 h-4 mr-1.5" />}
              Load Demo Data
            </Button>
            <Button variant="outline" size="sm" onClick={() => setLocation("/settings")}>
              <Facebook className="w-4 h-4 mr-1.5" /> Connect a Page
            </Button>
          </div>
        </div>
      ) : (
        <>
          {/* Weekly Conversations Trend */}
          <div className="bg-white rounded-xl p-4 sm:p-5 border border-gray-200 mb-5 overflow-hidden">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="text-sm font-bold">Weekly Activity</h3>
                <p className="text-xs text-muted-foreground">New leads over the last 7 days</p>
              </div>
            </div>
            {activityLoading ? (
              <div className="flex items-center justify-center h-32">
                <Loader2 className="w-5 h-5 animate-spin text-messenger" />
              </div>
            ) : trendData.length > 0 ? (
              <ResponsiveContainer width="100%" height={140}>
                <AreaChart data={trendData}>
                  <defs>
                    <linearGradient id="colorTrend" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6366f1" stopOpacity={0.25} />
                      <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="date" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis hide allowDecimals={false} />
                  <Tooltip
                    contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid #e5e7eb" }}
                    labelStyle={{ fontWeight: 600 }}
                  />
                  <Area
                    type="monotone"
                    dataKey="conversations"
                    stroke="#6366f1"
                    fill="url(#colorTrend)"
                    strokeWidth={2}
                    name="Leads"
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-32 text-sm text-muted-foreground">
                No activity data yet
              </div>
            )}
          </div>

          {/* Recent Conversations */}
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
              <h3 className="text-sm font-bold">Recent Conversations</h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setLocation("/conversations")}
                className="text-messenger h-7 px-2 text-xs"
              >
                View All <ArrowRight className="w-3 h-3 ml-1" />
              </Button>
            </div>

            {!conversations?.length ? (
              <div className="px-4 py-8 text-center">
                <MessageCircle className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">No conversations yet.</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {conversations.slice(0, 8).map((item: any) => {
                  const conv = item.conversation;
                  const lead = item.lead;
                  return (
                    <button
                      key={conv.id}
                      onClick={() => setLocation(`/conversations/${conv.id}`)}
                      className="w-full text-left flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors"
                    >
                      {/* Avatar */}
                      <div className="w-9 h-9 bg-blue-50 rounded-full flex items-center justify-center shrink-0">
                        <span className="text-sm font-bold text-blue-600">
                          {(lead?.name || "?").charAt(0).toUpperCase()}
                        </span>
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 mb-0.5">
                          <span className="text-sm font-semibold text-foreground truncate">
                            {lead?.name || "Unknown"}
                          </span>
                          {lead && <ScoreBadge classification={lead.classification} />}
                          {conv.needsHandoff && (
                            <span className="inline-flex items-center gap-0.5 text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-red-50 text-red-600">
                              <AlertTriangle className="w-2.5 h-2.5" />
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground truncate">
                          {conv.lastMessagePreview || "No messages yet"}
                        </p>
                      </div>

                      {/* Time + count */}
                      <div className="text-right shrink-0">
                        <p className="text-[10px] text-muted-foreground">
                          {conv.updatedAt ? timeAgo(conv.updatedAt) : ""}
                        </p>
                        <div className="flex items-center gap-1 justify-end mt-0.5">
                          <MessageCircle className="w-2.5 h-2.5 text-muted-foreground" />
                          <span className="text-[10px] text-muted-foreground">{conv.messageCount || 0}</span>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Hot Leads Quick List */}
          {(leads?.filter((l: any) => l.classification === "hot").length ?? 0) > 0 && (
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden mt-5">
              <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
                <div className="flex items-center gap-2">
                  <Flame className="w-4 h-4 text-red-500" />
                  <h3 className="text-sm font-bold">Hot Leads</h3>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setLocation("/leads")}
                  className="text-messenger h-7 px-2 text-xs"
                >
                  View All <ArrowRight className="w-3 h-3 ml-1" />
                </Button>
              </div>
              <div className="divide-y divide-gray-100">
                {leads!.filter((l: any) => l.classification === "hot").slice(0, 5).map((lead: any) => (
                  <div key={lead.id} className="flex items-center justify-between px-4 py-3">
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">{lead.name || "Unknown"}</p>
                      <p className="text-xs text-muted-foreground truncate">{lead.email || "No email"}</p>
                    </div>
                    <span className="text-xs font-bold px-2 py-1 rounded-full bg-red-50 text-red-500 shrink-0 ml-2">
                      {lead.score}/100
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default function Dashboard() {
  return (
    <DashboardLayout>
      <DashboardContent />
    </DashboardLayout>
  );
}
