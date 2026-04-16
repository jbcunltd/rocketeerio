import DashboardLayout from "@/components/DashboardLayout";
import { trpc } from "@/lib/trpc";
import { useActivePage } from "@/contexts/ActivePageContext";
import {
  Loader2, MessageCircle, Users, Flame, TrendingUp,
  BarChart3, PieChart as PieChartIcon, Activity, Target, Bot, UserCheck, Facebook
} from "lucide-react";
import { useState } from "react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, AreaChart, Area, Legend
} from "recharts";

const CLASSIFICATION_COLORS: Record<string, string> = {
  hot: "#ef4444",
  warm: "#f59e0b",
  cold: "#3b82f6",
  unscored: "#9ca3af",
};

const STATUS_COLORS: Record<string, string> = {
  new: "#3b82f6",
  engaged: "#8b5cf6",
  qualified: "#10b981",
  converted: "#22c55e",
  lost: "#ef4444",
};

const PLATFORM_COLORS: Record<string, string> = {
  messenger: "#1877F2",
  instagram: "#E1306C",
  unknown: "#9ca3af",
};

function StatCard({ icon: Icon, label, value, subtitle, color }: {
  icon: any; label: string; value: string | number; subtitle?: string; color: string;
}) {
  return (
    <div className="bg-white rounded-xl p-5 border border-gray-200 hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between mb-3">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${color}`}>
          <Icon className="w-5 h-5" />
        </div>
      </div>
      <div className="text-2xl font-extrabold text-foreground">{value}</div>
      <div className="text-sm text-muted-foreground mt-0.5">{label}</div>
      {subtitle && <div className="text-xs text-muted-foreground mt-1">{subtitle}</div>}
    </div>
  );
}

function AnalyticsContent() {
  const { activePage } = useActivePage();
  const [timeRange, setTimeRange] = useState(30);
  const { data: overview, isLoading: overviewLoading } = trpc.analytics.overview.useQuery();
  const { data: convsOverTime, isLoading: convsLoading } = trpc.analytics.conversationsOverTime.useQuery({ days: timeRange });
  const { data: leadClassification } = trpc.analytics.leadsByClassification.useQuery();
  const { data: leadStatus } = trpc.analytics.leadsByStatus.useQuery();
  const { data: platformData } = trpc.analytics.conversationsByPlatform.useQuery();
  const { data: leadActivity } = trpc.analytics.leadActivity.useQuery({ days: timeRange });

  if (overviewLoading) {
    return <div className="flex items-center justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-messenger" /></div>;
  }

  const classificationData = (leadClassification || []).map((item: any) => ({
    name: (item.classification || "unscored").charAt(0).toUpperCase() + (item.classification || "unscored").slice(1),
    value: Number(item.count),
    color: CLASSIFICATION_COLORS[item.classification || "unscored"] || "#9ca3af",
  }));

  const statusData = (leadStatus || []).map((item: any) => ({
    name: (item.status || "new").charAt(0).toUpperCase() + (item.status || "new").slice(1),
    value: Number(item.count),
    color: STATUS_COLORS[item.status || "new"] || "#9ca3af",
  }));

  const platformChartData = (platformData || []).map((item: any) => ({
    name: (item.platform || "unknown") === "messenger" ? "Messenger" : (item.platform || "unknown") === "instagram" ? "Instagram" : "Other",
    value: Number(item.count),
    color: PLATFORM_COLORS[item.platform || "unknown"] || "#9ca3af",
  }));

  const activityData = (leadActivity || []).map((item: any) => ({
    date: new Date(item.date).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
    total: Number(item.total),
    hot: Number(item.hot || 0),
    warm: Number(item.warm || 0),
    cold: Number(item.cold || 0),
  }));

  const convsTimeData = (convsOverTime || []).map((item: any) => ({
    date: new Date(item.date).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
    conversations: Number(item.total),
  }));

  const responseRate = overview && overview.totalConversations > 0
    ? Math.round((overview.aiMessages / Math.max(overview.totalMessages, 1)) * 100)
    : 0;

  return (
    <div>
      {/* Page context banner */}
      {activePage && (
        <div className="flex items-center gap-2 mb-4 px-4 py-2.5 bg-blue-50 border border-blue-200 rounded-lg">
          {activePage.avatarUrl ? (
            <img src={activePage.avatarUrl} alt={activePage.pageName} className="w-5 h-5 rounded" />
          ) : (
            <Facebook className="w-4 h-4 text-[#1877F2]" />
          )}
          <p className="text-sm text-blue-800">Showing analytics for <strong>{activePage.pageName}</strong></p>
        </div>
      )}

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <div className="min-w-0">
          <h1 className="text-xl sm:text-2xl font-bold">Analytics</h1>
          <p className="text-sm text-muted-foreground">Track your lead generation and conversation performance.</p>
        </div>
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          {[7, 14, 30, 90].map(days => (
            <button
              key={days}
              onClick={() => setTimeRange(days)}
              className={`px-2.5 sm:px-3 py-1.5 text-sm rounded-lg transition-colors ${
                timeRange === days
                  ? "bg-purple-600 text-white"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              {days}d
            </button>
          ))}
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4 mb-6">
        <StatCard icon={MessageCircle} label="Conversations" value={overview?.totalConversations || 0} color="bg-blue-50 text-blue-600" />
        <StatCard icon={Users} label="Total Leads" value={overview?.totalLeads || 0} color="bg-purple-50 text-purple-600" />
        <StatCard icon={Flame} label="Hot Leads" value={overview?.hotLeads || 0} color="bg-red-50 text-red-600" />
        <StatCard icon={Target} label="Conversion Rate" value={`${overview?.conversionRate || 0}%`} color="bg-green-50 text-green-600" />
        <StatCard icon={Bot} label="AI Response Rate" value={`${responseRate}%`} subtitle={`${overview?.aiMessages || 0} AI msgs`} color="bg-indigo-50 text-indigo-600" />
        <StatCard icon={TrendingUp} label="Avg Lead Score" value={overview?.avgScore || 0} subtitle="out of 100" color="bg-amber-50 text-amber-600" />
      </div>

      {/* Conversations Over Time */}
      <div className="bg-white rounded-xl p-4 sm:p-6 border border-gray-200 mb-6 overflow-hidden">
        <div className="flex items-center gap-2 mb-4">
          <Activity className="w-5 h-5 text-purple-600" />
          <h3 className="font-bold">Conversations Over Time</h3>
        </div>
        {convsTimeData.length > 0 ? (
          <ResponsiveContainer width="100%" height={280}>
            <AreaChart data={convsTimeData}>
              <defs>
                <linearGradient id="colorConvs" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="date" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} allowDecimals={false} />
              <Tooltip />
              <Area type="monotone" dataKey="conversations" stroke="#8b5cf6" fill="url(#colorConvs)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        ) : (
          <div className="text-center py-12 text-muted-foreground text-sm">No conversation data for this period.</div>
        )}
      </div>

      {/* Lead Activity Chart */}
      <div className="bg-white rounded-xl p-4 sm:p-6 border border-gray-200 mb-6 overflow-hidden">
        <div className="flex items-center gap-2 mb-4">
          <BarChart3 className="w-5 h-5 text-blue-600" />
          <h3 className="font-bold">Lead Activity by Day</h3>
        </div>
        {activityData.length > 0 ? (
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={activityData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="date" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} allowDecimals={false} />
              <Tooltip />
              <Legend />
              <Bar dataKey="hot" stackId="a" fill="#ef4444" name="Hot" radius={[0, 0, 0, 0]} />
              <Bar dataKey="warm" stackId="a" fill="#f59e0b" name="Warm" radius={[0, 0, 0, 0]} />
              <Bar dataKey="cold" stackId="a" fill="#3b82f6" name="Cold" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="text-center py-12 text-muted-foreground text-sm">No lead activity data for this period.</div>
        )}
      </div>

      {/* Pie Charts Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6 mb-6">
        {/* Lead Classification */}
        <div className="bg-white rounded-xl p-4 sm:p-6 border border-gray-200">
          <div className="flex items-center gap-2 mb-4">
            <PieChartIcon className="w-5 h-5 text-red-500" />
            <h3 className="font-bold text-sm">Lead Classification</h3>
          </div>
          {classificationData.length > 0 ? (
            <>
              <ResponsiveContainer width="100%" height={180}>
                <PieChart>
                  <Pie data={classificationData} cx="50%" cy="50%" innerRadius={45} outerRadius={70} dataKey="value" paddingAngle={2}>
                    {classificationData.map((entry: any, i: number) => (
                      <Cell key={i} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex flex-wrap gap-3 justify-center mt-2">
                {classificationData.map((item: any) => (
                  <div key={item.name} className="flex items-center gap-1.5">
                    <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                    <span className="text-xs text-muted-foreground">{item.name} ({item.value})</span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="text-center py-8 text-muted-foreground text-sm">No data</div>
          )}
        </div>

        {/* Lead Status */}
        <div className="bg-white rounded-xl p-4 sm:p-6 border border-gray-200">
          <div className="flex items-center gap-2 mb-4">
            <UserCheck className="w-5 h-5 text-green-500" />
            <h3 className="font-bold text-sm">Lead Status</h3>
          </div>
          {statusData.length > 0 ? (
            <>
              <ResponsiveContainer width="100%" height={180}>
                <PieChart>
                  <Pie data={statusData} cx="50%" cy="50%" innerRadius={45} outerRadius={70} dataKey="value" paddingAngle={2}>
                    {statusData.map((entry: any, i: number) => (
                      <Cell key={i} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex flex-wrap gap-3 justify-center mt-2">
                {statusData.map((item: any) => (
                  <div key={item.name} className="flex items-center gap-1.5">
                    <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                    <span className="text-xs text-muted-foreground">{item.name} ({item.value})</span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="text-center py-8 text-muted-foreground text-sm">No data</div>
          )}
        </div>

        {/* Platform Distribution */}
        <div className="bg-white rounded-xl p-4 sm:p-6 border border-gray-200">
          <div className="flex items-center gap-2 mb-4">
            <MessageCircle className="w-5 h-5 text-blue-500" />
            <h3 className="font-bold text-sm">Platform Distribution</h3>
          </div>
          {platformChartData.length > 0 ? (
            <>
              <ResponsiveContainer width="100%" height={180}>
                <PieChart>
                  <Pie data={platformChartData} cx="50%" cy="50%" innerRadius={45} outerRadius={70} dataKey="value" paddingAngle={2}>
                    {platformChartData.map((entry: any, i: number) => (
                      <Cell key={i} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex flex-wrap gap-3 justify-center mt-2">
                {platformChartData.map((item: any) => (
                  <div key={item.name} className="flex items-center gap-1.5">
                    <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                    <span className="text-xs text-muted-foreground">{item.name} ({item.value})</span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="text-center py-8 text-muted-foreground text-sm">No data</div>
          )}
        </div>
      </div>

      {/* Summary Stats */}
      <div className="bg-white rounded-xl p-6 border border-gray-200">
        <h3 className="font-bold mb-4">Message Breakdown</h3>
        <div className="grid sm:grid-cols-3 gap-4">
          <div className="p-4 rounded-lg bg-gray-50 border">
            <p className="text-2xl font-bold">{overview?.totalMessages || 0}</p>
            <p className="text-sm text-muted-foreground">Total Messages</p>
          </div>
          <div className="p-4 rounded-lg bg-indigo-50 border border-indigo-100">
            <p className="text-2xl font-bold text-indigo-700">{overview?.aiMessages || 0}</p>
            <p className="text-sm text-indigo-600">AI Messages</p>
          </div>
          <div className="p-4 rounded-lg bg-blue-50 border border-blue-100">
            <p className="text-2xl font-bold text-blue-700">{overview?.humanMessages || 0}</p>
            <p className="text-sm text-blue-600">Lead Messages</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Analytics() {
  return (
    <DashboardLayout>
      <AnalyticsContent />
    </DashboardLayout>
  );
}
