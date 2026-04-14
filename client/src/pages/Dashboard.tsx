import { useAuth } from "@/_core/hooks/useAuth";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";
import {
  MessageCircle, Users, Flame, TrendingUp,
  Loader2, ArrowRight, Rocket, Zap, Facebook
} from "lucide-react";
import { useLocation } from "wouter";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { toast } from "sonner";

function StatCard({ icon: Icon, label, value, change, color }: {
  icon: any; label: string; value: string | number; change?: string; color: string;
}) {
  return (
    <div className="bg-white rounded-xl p-5 card-shadow border border-border/50">
      <div className="flex items-center justify-between mb-3">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${color}`}>
          <Icon className="w-5 h-5" />
        </div>
        {change && <span className="text-xs font-semibold text-success">{change}</span>}
      </div>
      <div className="text-2xl font-extrabold text-foreground">{value}</div>
      <div className="text-sm text-muted-foreground mt-0.5">{label}</div>
    </div>
  );
}

function DashboardContent() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const { data: stats, isLoading: statsLoading } = trpc.dashboard.stats.useQuery();
  const { data: activity, isLoading: activityLoading } = trpc.dashboard.activity.useQuery({ days: 7 });
  const { data: pages } = trpc.pages.list.useQuery();
  const { data: leads } = trpc.leads.list.useQuery();
  const seedMutation = trpc.seed.generate.useMutation();
  const utils = trpc.useUtils();

  const hasData = (stats?.totalConversations ?? 0) > 0;

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

  // Prepare chart data
  const chartData = activity?.map((d: any) => ({
    date: new Date(d.date).toLocaleDateString("en-US", { weekday: "short" }),
    hot: Number(d.hot) || 0,
    warm: Number(d.warm) || 0,
    cold: Number(d.cold) || 0,
  })) || [];

  // Lead distribution for pie chart
  const hotCount = leads?.filter((l: any) => l.classification === "hot").length || 0;
  const warmCount = leads?.filter((l: any) => l.classification === "warm").length || 0;
  const coldCount = leads?.filter((l: any) => l.classification === "cold").length || 0;
  const pieData = [
    { name: "Hot", value: hotCount, color: "#ef4444" },
    { name: "Warm", value: warmCount, color: "#f59e0b" },
    { name: "Cold", value: coldCount, color: "#94a3b8" },
  ].filter(d => d.value > 0);

  if (statsLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-messenger" />
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground">Welcome back{user?.name ? `, ${user.name}` : ""}! Here's your lead overview.</p>
        </div>
        {!hasData && (
          <Button onClick={handleSeedDemo} disabled={seedMutation.isPending} className="bg-messenger hover:bg-messenger-dark">
            {seedMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Zap className="w-4 h-4 mr-2" />}
            Load Demo Data
          </Button>
        )}
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard icon={MessageCircle} label="Total Conversations" value={stats?.totalConversations ?? 0} color="bg-messenger-light text-messenger" />
        <StatCard icon={Flame} label="Hot Leads Today" value={stats?.hotLeadsToday ?? 0} color="bg-red-50 text-red-500" />
        <StatCard icon={Users} label="Total Leads" value={stats?.totalLeads ?? 0} color="bg-amber-50 text-amber-600" />
        <StatCard icon={TrendingUp} label="Conversion Rate" value={`${stats?.conversionRate ?? 0}%`} color="bg-green-50 text-green-600" />
      </div>

      {!hasData ? (
        /* Empty State */
        <div className="bg-white rounded-xl p-12 card-shadow border border-border/50 text-center">
          <div className="w-16 h-16 bg-messenger-light rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Rocket className="w-8 h-8 text-messenger" />
          </div>
          <h2 className="text-xl font-bold mb-2">Get Started with Rocketeer</h2>
          <p className="text-muted-foreground max-w-md mx-auto mb-6">
            Connect your Facebook Page, add your business info, and let the AI start qualifying leads for you. Or load demo data to explore the dashboard.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Button onClick={handleSeedDemo} disabled={seedMutation.isPending} className="bg-messenger hover:bg-messenger-dark">
              {seedMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Zap className="w-4 h-4 mr-2" />}
              Load Demo Data
            </Button>
            <Button variant="outline" onClick={() => setLocation("/settings")}>
              <Facebook className="w-4 h-4 mr-2" /> Connect a Page
            </Button>
          </div>
        </div>
      ) : (
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Lead Activity Chart */}
          <div className="lg:col-span-2 bg-white rounded-xl p-6 card-shadow border border-border/50">
            <h3 className="text-lg font-bold mb-1">Lead Activity</h3>
            <p className="text-sm text-muted-foreground mb-4">New leads by classification over the last 7 days</p>
            {activityLoading ? (
              <div className="flex items-center justify-center h-64"><Loader2 className="w-6 h-6 animate-spin text-messenger" /></div>
            ) : chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={chartData} barGap={2}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} allowDecimals={false} />
                  <Tooltip />
                  <Bar dataKey="hot" fill="#ef4444" radius={[4, 4, 0, 0]} name="Hot" />
                  <Bar dataKey="warm" fill="#f59e0b" radius={[4, 4, 0, 0]} name="Warm" />
                  <Bar dataKey="cold" fill="#94a3b8" radius={[4, 4, 0, 0]} name="Cold" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-64 text-muted-foreground">
                No activity data for this period
              </div>
            )}
          </div>

          {/* Lead Distribution */}
          <div className="bg-white rounded-xl p-6 card-shadow border border-border/50">
            <h3 className="text-lg font-bold mb-1">Lead Distribution</h3>
            <p className="text-sm text-muted-foreground mb-4">Current lead classification breakdown</p>
            {pieData.length > 0 ? (
              <div>
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie data={pieData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} dataKey="value" stroke="none">
                      {pieData.map((entry, idx) => <Cell key={idx} fill={entry.color} />)}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
                <div className="flex justify-center gap-4 mt-2">
                  {pieData.map(d => (
                    <div key={d.name} className="flex items-center gap-1.5 text-sm">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: d.color }} />
                      <span className="text-muted-foreground">{d.name}: <span className="font-bold text-foreground">{d.value}</span></span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center h-48 text-muted-foreground">No leads yet</div>
            )}
          </div>

          {/* Connected Pages */}
          <div className="lg:col-span-2 bg-white rounded-xl p-6 card-shadow border border-border/50">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-bold">Connected Pages</h3>
                <p className="text-sm text-muted-foreground">Your Facebook Pages with active AI agents</p>
              </div>
              <Button variant="outline" size="sm" onClick={() => setLocation("/settings")}>
                Manage Pages
              </Button>
            </div>
            {pages?.length ? (
              <div className="space-y-3">
                {pages.map((page: any) => (
                  <div key={page.id} className="flex items-center justify-between p-3 rounded-lg border">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 bg-messenger-light rounded-lg flex items-center justify-center">
                        <Facebook className="w-4 h-4 text-messenger" />
                      </div>
                      <div>
                        <p className="text-sm font-medium">{page.pageName}</p>
                        <p className="text-xs text-muted-foreground">{page.category || "Business"}</p>
                      </div>
                    </div>
                    <span className={`text-xs font-bold px-2 py-1 rounded-full ${page.isActive ? "bg-green-50 text-green-600" : "bg-muted text-muted-foreground"}`}>
                      {page.isActive ? "Active" : "Paused"}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No pages connected.</p>
            )}
          </div>

          {/* Recent Hot Leads */}
          <div className="bg-white rounded-xl p-6 card-shadow border border-border/50">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold">Hot Leads</h3>
              <Button variant="ghost" size="sm" onClick={() => setLocation("/leads")} className="text-messenger">
                View All <ArrowRight className="w-3 h-3 ml-1" />
              </Button>
            </div>
            {leads?.filter((l: any) => l.classification === "hot").length ? (
              <div className="space-y-3">
                {leads.filter((l: any) => l.classification === "hot").slice(0, 5).map((lead: any) => (
                  <div key={lead.id} className="flex items-center justify-between p-3 rounded-lg border">
                    <div>
                      <p className="text-sm font-medium">{lead.name || "Unknown"}</p>
                      <p className="text-xs text-muted-foreground">{lead.email || "No email"}</p>
                    </div>
                    <span className="text-xs font-bold px-2 py-1 rounded-full bg-red-50 text-red-500">
                      {lead.score}/100
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No hot leads yet.</p>
            )}
          </div>
        </div>
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
