import DashboardLayout from "@/components/DashboardLayout";
import { trpc } from "@/lib/trpc";
import { Loader2, Clock, Zap, MessageCircle } from "lucide-react";
import { useLocation } from "wouter";

function FollowUpsContent() {
  const { data: conversations, isLoading } = trpc.conversations.list.useQuery();
  const [, setLocation] = useLocation();

  if (isLoading) return <div className="flex items-center justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-messenger" /></div>;

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Follow-Up Sequences</h1>
        <p className="text-muted-foreground">Automated follow-up messages are sent at 30 minutes, 2 hours, and 12 hours after first contact.</p>
      </div>

      <div className="bg-white rounded-xl p-6 card-shadow border border-border/50 mb-6">
        <h3 className="font-bold mb-3">How Follow-Ups Work</h3>
        <div className="grid sm:grid-cols-3 gap-4">
          {[
            { delay: "30 min", desc: "Quick check-in after initial conversation", icon: Zap },
            { delay: "2 hours", desc: "Follow-up to re-engage the lead", icon: Clock },
            { delay: "12 hours", desc: "Final nudge to move the conversation forward", icon: MessageCircle },
          ].map(item => (
            <div key={item.delay} className="flex items-start gap-3 p-3 rounded-lg border">
              <div className="w-9 h-9 bg-messenger-light rounded-lg flex items-center justify-center shrink-0">
                <item.icon className="w-4 h-4 text-messenger" />
              </div>
              <div>
                <p className="text-sm font-bold">{item.delay}</p>
                <p className="text-xs text-muted-foreground">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-xl p-6 card-shadow border border-border/50">
        <h3 className="font-bold mb-3">Active Conversations</h3>
        <p className="text-sm text-muted-foreground mb-4">Schedule follow-ups from any conversation's detail view.</p>
        {!conversations?.length ? (
          <p className="text-sm text-muted-foreground">No conversations yet.</p>
        ) : (
          <div className="space-y-2">
            {conversations.slice(0, 10).map((item: any) => {
              const conv = item.conversation;
              const lead = item.lead;
              return (
                <button
                  key={conv.id}
                  onClick={() => setLocation(`/conversations/${conv.id}`)}
                  className="w-full text-left flex items-center justify-between p-3 rounded-lg border hover:bg-accent/30 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-messenger-light rounded-full flex items-center justify-center">
                      <span className="text-xs font-bold text-messenger">{(lead?.name || "?").charAt(0).toUpperCase()}</span>
                    </div>
                    <div>
                      <p className="text-sm font-medium">{lead?.name || "Unknown"}</p>
                      <p className="text-xs text-muted-foreground">{conv.messageCount || 0} messages</p>
                    </div>
                  </div>
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                    conv.status === "open" ? "bg-green-50 text-green-600" : "bg-muted text-muted-foreground"
                  }`}>{conv.status}</span>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

export default function FollowUps() {
  return (
    <DashboardLayout>
      <FollowUpsContent />
    </DashboardLayout>
  );
}
