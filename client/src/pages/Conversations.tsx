import DashboardLayout from "@/components/DashboardLayout";
import { trpc } from "@/lib/trpc";
import { MessageCircle, Loader2, Search, Flame, Thermometer, Snowflake, AlertTriangle } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useState, useMemo } from "react";
import { useLocation } from "wouter";

function ScoreBadge({ classification, score }: { classification: string; score: number }) {
  if (classification === "hot") {
    return (
      <span className="inline-flex items-center gap-1 text-xs font-bold px-2 py-1 rounded-full bg-red-50 text-red-500">
        <Flame className="w-3 h-3" /> Hot {score}
      </span>
    );
  }
  if (classification === "warm") {
    return (
      <span className="inline-flex items-center gap-1 text-xs font-bold px-2 py-1 rounded-full bg-amber-50 text-amber-600">
        <Thermometer className="w-3 h-3" /> Warm {score}
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 text-xs font-bold px-2 py-1 rounded-full bg-slate-100 text-slate-500">
      <Snowflake className="w-3 h-3" /> Cold {score}
    </span>
  );
}

function ConversationsContent() {
  const { data: conversations, isLoading } = trpc.conversations.list.useQuery();
  const [, setLocation] = useLocation();
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<string>("all");

  const filtered = useMemo(() => {
    if (!conversations) return [];
    let list = conversations;
    if (filter === "handoff") {
      list = list.filter((c: any) => c.conversation?.needsHandoff);
    } else if (filter !== "all") {
      list = list.filter((c: any) => c.lead?.classification === filter);
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((c: any) =>
        (c.lead?.name || "").toLowerCase().includes(q) ||
        (c.conversation?.lastMessagePreview || "").toLowerCase().includes(q) ||
        (c.page?.pageName || "").toLowerCase().includes(q)
      );
    }
    return list;
  }, [conversations, filter, search]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-messenger" />
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Conversations</h1>
        <p className="text-muted-foreground">All lead conversations from your connected Facebook Pages.</p>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 mb-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search conversations..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex gap-2">
          {[
            { key: "all", label: "All" },
            { key: "hot", label: "Hot" },
            { key: "warm", label: "Warm" },
            { key: "cold", label: "Cold" },
            { key: "handoff", label: "Needs Agent" },
          ].map(f => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-colors ${
                filter === f.key
                  ? "bg-messenger text-white"
                  : "bg-white text-muted-foreground border hover:bg-accent"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Conversation List */}
      {!filtered.length ? (
        <div className="bg-white rounded-xl p-12 card-shadow border border-border/50 text-center">
          <MessageCircle className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
          <p className="text-muted-foreground">
            {conversations?.length ? "No conversations match your filters." : "No conversations yet. Connect a Facebook Page to start receiving leads."}
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((item: any) => {
            const conv = item.conversation;
            const lead = item.lead;
            const page = item.page;
            return (
              <button
                key={conv.id}
                onClick={() => setLocation(`/conversations/${conv.id}`)}
                className="w-full text-left bg-white rounded-xl p-4 card-shadow border border-border/50 hover:border-messenger/30 hover:shadow-md transition-all"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3 min-w-0 flex-1">
                    <div className="w-10 h-10 bg-messenger-light rounded-full flex items-center justify-center shrink-0 mt-0.5">
                      <span className="text-sm font-bold text-messenger">
                        {(lead?.name || "?").charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="font-semibold text-foreground truncate">{lead?.name || "Unknown Lead"}</span>
                        {lead && <ScoreBadge classification={lead.classification} score={lead.score} />}
                        {conv.needsHandoff && (
                          <span className="inline-flex items-center gap-1 text-xs font-bold px-2 py-1 rounded-full bg-red-50 text-red-600">
                            <AlertTriangle className="w-3 h-3" /> Handoff
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground truncate">{conv.lastMessagePreview || "No messages yet"}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs text-muted-foreground">{page?.pageName || "Unknown Page"}</span>
                        <span className="text-xs text-muted-foreground">·</span>
                        <span className="text-xs text-muted-foreground">{conv.messageCount || 0} messages</span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-xs text-muted-foreground">
                      {conv.lastMessageAt ? new Date(conv.lastMessageAt).toLocaleDateString("en-US", { month: "short", day: "numeric" }) : ""}
                    </p>
                    <span className={`inline-block mt-1 text-xs font-medium px-2 py-0.5 rounded-full ${
                      conv.status === "open" ? "bg-green-50 text-green-600" : conv.status === "closed" ? "bg-muted text-muted-foreground" : "bg-amber-50 text-amber-600"
                    }`}>
                      {conv.status}
                    </span>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default function Conversations() {
  return (
    <DashboardLayout>
      <ConversationsContent />
    </DashboardLayout>
  );
}
