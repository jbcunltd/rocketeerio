import DashboardLayout from "@/components/DashboardLayout";
import { trpc } from "@/lib/trpc";
import { useActivePage } from "@/contexts/ActivePageContext";
import { Input } from "@/components/ui/input";
import { Loader2, Search, Flame, Thermometer, Snowflake, Users, Mail, Phone, Facebook } from "lucide-react";
import { useState, useMemo } from "react";
import { useLocation } from "wouter";

function ScoreBadge({ classification, score }: { classification: string; score: number }) {
  if (classification === "hot") return <span className="inline-flex items-center gap-1 text-xs font-bold px-2 py-1 rounded-full bg-red-50 text-red-500"><Flame className="w-3 h-3" /> Hot {score}</span>;
  if (classification === "warm") return <span className="inline-flex items-center gap-1 text-xs font-bold px-2 py-1 rounded-full bg-amber-50 text-amber-600"><Thermometer className="w-3 h-3" /> Warm {score}</span>;
  return <span className="inline-flex items-center gap-1 text-xs font-bold px-2 py-1 rounded-full bg-slate-100 text-slate-500"><Snowflake className="w-3 h-3" /> Cold {score}</span>;
}

function LeadsContent() {
  const { data: allLeads, isLoading } = trpc.leads.list.useQuery();
  const { data: conversations } = trpc.conversations.list.useQuery();
  const { activePageId, activePage } = useActivePage();
  const [, setLocation] = useLocation();
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<string>("all");

  // Filter leads by active page
  const leads = useMemo(() => {
    if (!allLeads) return undefined;
    if (!activePageId) return allLeads;
    return allLeads.filter((l: any) => l.pageId === activePageId);
  }, [allLeads, activePageId]);

  const filtered = useMemo(() => {
    if (!leads) return [];
    let list = [...leads];
    if (filter !== "all") list = list.filter(l => l.classification === filter);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(l => (l.name || "").toLowerCase().includes(q) || (l.email || "").toLowerCase().includes(q));
    }
    return list;
  }, [leads, filter, search]);

  // Map lead ID to conversation ID for navigation
  const leadConvMap = useMemo(() => {
    const map = new Map<number, number>();
    if (conversations) {
      for (const c of conversations) {
        if ((c as any).conversation?.leadId && (c as any).conversation?.id) {
          map.set((c as any).conversation.leadId, (c as any).conversation.id);
        }
      }
    }
    return map;
  }, [conversations]);

  if (isLoading) return <div className="flex items-center justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-messenger" /></div>;

  const hotCount = leads?.filter(l => l.classification === "hot").length || 0;
  const warmCount = leads?.filter(l => l.classification === "warm").length || 0;
  const coldCount = leads?.filter(l => l.classification === "cold").length || 0;

  return (
    <div>
      {/* Page context banner */}
      {activePage && (
        <div className="flex items-center gap-2 mb-4 px-4 py-2.5 bg-messenger-light border border-messenger-light rounded-lg">
          {activePage.avatarUrl ? (
            <img src={activePage.avatarUrl} alt={activePage.pageName} className="w-5 h-5 rounded" />
          ) : (
            <Facebook className="w-4 h-4 text-[#1877F2]" />
          )}
          <p className="text-sm text-messenger-dark">Showing leads for <strong>{activePage.pageName}</strong></p>
        </div>
      )}

      <div className="mb-6">
        <h1 className="text-xl sm:text-2xl font-bold">Leads</h1>
        <p className="text-sm text-muted-foreground">All qualified leads from your conversations.</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-3 gap-2 sm:gap-4 mb-6">
        <div className="bg-white rounded-xl p-3 sm:p-4 card-shadow border border-border/50 text-center">
          <Flame className="w-5 h-5 sm:w-6 sm:h-6 text-red-500 mx-auto mb-1" />
          <div className="text-xl sm:text-2xl font-extrabold text-foreground">{hotCount}</div>
          <div className="text-[10px] sm:text-xs text-muted-foreground">Hot (80-100)</div>
        </div>
        <div className="bg-white rounded-xl p-3 sm:p-4 card-shadow border border-border/50 text-center">
          <Thermometer className="w-5 h-5 sm:w-6 sm:h-6 text-amber-500 mx-auto mb-1" />
          <div className="text-xl sm:text-2xl font-extrabold text-foreground">{warmCount}</div>
          <div className="text-[10px] sm:text-xs text-muted-foreground">Warm (40-79)</div>
        </div>
        <div className="bg-white rounded-xl p-3 sm:p-4 card-shadow border border-border/50 text-center">
          <Snowflake className="w-5 h-5 sm:w-6 sm:h-6 text-slate-400 mx-auto mb-1" />
          <div className="text-xl sm:text-2xl font-extrabold text-foreground">{coldCount}</div>
          <div className="text-[10px] sm:text-xs text-muted-foreground">Cold (0-39)</div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 mb-4">
        <div className="relative w-full sm:flex-1 sm:max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Search leads..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
        </div>
        <div className="flex gap-2">
          {["all", "hot", "warm", "cold"].map(f => (
            <button key={f} onClick={() => setFilter(f)} className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-colors ${filter === f ? "bg-messenger text-white" : "bg-white text-muted-foreground border hover:bg-accent"}`}>
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Leads Table */}
      {!filtered.length ? (
        <div className="bg-white rounded-xl p-12 card-shadow border border-border/50 text-center">
          <Users className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
          <p className="text-muted-foreground">No leads found.</p>
        </div>
      ) : (
        <>
          {/* Desktop Table */}
          <div className="hidden sm:block bg-white rounded-xl card-shadow border border-border/50 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/30">
                    <th className="text-left p-3 font-semibold">Name</th>
                    <th className="text-left p-3 font-semibold">Contact</th>
                    <th className="text-left p-3 font-semibold">Score</th>
                    <th className="text-left p-3 font-semibold">Status</th>
                    <th className="text-left p-3 font-semibold">Source</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(lead => (
                    <tr
                      key={lead.id}
                      className="border-b last:border-0 hover:bg-accent/30 cursor-pointer transition-colors"
                      onClick={() => {
                        const convId = leadConvMap.get(lead.id);
                        if (convId) setLocation(`/conversations/${convId}`);
                        else setLocation("/conversations");
                      }}
                    >
                      <td className="p-3">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 bg-messenger-light rounded-full flex items-center justify-center shrink-0">
                            <span className="text-xs font-bold text-messenger">{(lead.name || "?").charAt(0).toUpperCase()}</span>
                          </div>
                          <span className="font-medium">{lead.name || "Unknown"}</span>
                        </div>
                      </td>
                      <td className="p-3">
                        <div className="space-y-0.5">
                          {lead.email && <div className="flex items-center gap-1 text-xs text-muted-foreground"><Mail className="w-3 h-3" />{lead.email}</div>}
                          {lead.phone && <div className="flex items-center gap-1 text-xs text-muted-foreground"><Phone className="w-3 h-3" />{lead.phone}</div>}
                        </div>
                      </td>
                      <td className="p-3"><ScoreBadge classification={lead.classification} score={lead.score} /></td>
                      <td className="p-3">
                        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                          lead.status === "converted" ? "bg-green-50 text-green-600" :
                          lead.status === "active" ? "bg-messenger-light text-messenger" :
                          "bg-muted text-muted-foreground"
                        }`}>{lead.status}</span>
                      </td>
                      <td className="p-3 text-xs text-muted-foreground">{lead.source}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Mobile Card Layout */}
          <div className="sm:hidden space-y-2">
            {filtered.map(lead => (
              <button
                key={lead.id}
                className="w-full text-left bg-white rounded-xl p-3 card-shadow border border-border/50 hover:border-messenger/30 transition-all"
                onClick={() => {
                  const convId = leadConvMap.get(lead.id);
                  if (convId) setLocation(`/conversations/${convId}`);
                  else setLocation("/conversations");
                }}
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-messenger-light rounded-full flex items-center justify-center shrink-0">
                    <span className="text-sm font-bold text-messenger">{(lead.name || "?").charAt(0).toUpperCase()}</span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="font-semibold text-sm truncate">{lead.name || "Unknown"}</span>
                      <ScoreBadge classification={lead.classification} score={lead.score} />
                    </div>
                    <div className="flex items-center gap-3 mt-1">
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                        lead.status === "converted" ? "bg-green-50 text-green-600" :
                        lead.status === "active" ? "bg-messenger-light text-messenger" :
                        "bg-muted text-muted-foreground"
                      }`}>{lead.status}</span>
                      {lead.source && <span className="text-xs text-muted-foreground">{lead.source}</span>}
                    </div>
                    {(lead.email || lead.phone) && (
                      <div className="flex items-center gap-3 mt-1.5">
                        {lead.email && <span className="text-xs text-muted-foreground flex items-center gap-1 truncate"><Mail className="w-3 h-3 shrink-0" />{lead.email}</span>}
                        {lead.phone && <span className="text-xs text-muted-foreground flex items-center gap-1"><Phone className="w-3 h-3 shrink-0" />{lead.phone}</span>}
                      </div>
                    )}
                  </div>
                </div>
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

export default function Leads() {
  return (
    <DashboardLayout>
      <LeadsContent />
    </DashboardLayout>
  );
}
