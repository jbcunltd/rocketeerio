import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { trpc } from "@/lib/trpc";
import { useActivePage } from "@/contexts/ActivePageContext";
import {
  Loader2, Headphones, AlertTriangle, Send, Bot, User,
  ArrowLeft, CheckCircle, Flame, Thermometer, Snowflake,
  MessageCircle, Clock, Phone, Mail, Facebook
} from "lucide-react";
import { useState, useRef, useEffect, useMemo } from "react";
import { toast } from "sonner";

function AgentInboxContent() {
  const { data: allQueue, isLoading } = trpc.conversations.handoffQueue.useQuery(undefined, { refetchInterval: 10000 });
  const { data: handoffCount } = trpc.conversations.handoffCount.useQuery(undefined, { refetchInterval: 10000 });
  const { activePageId, activePage } = useActivePage();
  const [selectedConvId, setSelectedConvId] = useState<number | null>(null);

  // Filter handoff queue by active page
  const queue = useMemo(() => {
    if (!allQueue) return undefined;
    if (!activePageId) return allQueue;
    return allQueue.filter((item: any) => item.page?.id === activePageId);
  }, [allQueue, activePageId]);

  if (isLoading) {
    return <div className="flex items-center justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-purple-600" /></div>;
  }

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
          <p className="text-sm text-messenger-dark">Showing agent inbox for <strong>{activePage.pageName}</strong></p>
        </div>
      )}

      <div className="flex items-center justify-between mb-6">
        <div>
          <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
            <h1 className="text-xl sm:text-2xl font-bold">Agent Inbox</h1>
            {(handoffCount ?? 0) > 0 && (
              <span className="bg-red-500 text-white text-xs font-bold px-2.5 py-1 rounded-full animate-pulse">
                {handoffCount} pending
              </span>
            )}
          </div>
          <p className="text-sm text-muted-foreground">Conversations that need human attention. AI has been paused on these.</p>
        </div>
      </div>

      {!queue?.length ? (
        <div className="bg-white rounded-xl p-12 border border-gray-200 text-center">
          <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-3" />
          <h3 className="font-bold text-lg mb-1">All Clear!</h3>
          <p className="text-muted-foreground">No conversations need human attention right now. The AI is handling everything.</p>
        </div>
      ) : (
        <div className="flex flex-col lg:flex-row gap-4 h-auto lg:h-[calc(100vh-12rem)]">
          {/* Queue List */}
          <div className="w-full lg:w-96 shrink-0 lg:overflow-y-auto space-y-2 max-h-[40vh] lg:max-h-none overflow-y-auto">
            {queue.map((item: any) => {
              const conv = item.conversation;
              const lead = item.lead;
              const page = item.page;
              const isSelected = selectedConvId === conv.id;
              return (
                <button
                  key={conv.id}
                  onClick={() => setSelectedConvId(conv.id)}
                  className={`w-full text-left rounded-xl p-4 border transition-all ${
                    isSelected
                      ? "bg-purple-50 border-purple-300 shadow-md"
                      : "bg-white border-gray-200 hover:border-purple-200 hover:shadow-sm"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className="relative">
                      <div className="w-10 h-10 bg-red-50 rounded-full flex items-center justify-center">
                        <AlertTriangle className="w-5 h-5 text-red-500" />
                      </div>
                      <div className="absolute -top-0.5 -right-0.5 w-3 h-3 bg-red-500 rounded-full border-2 border-white" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="font-semibold text-sm truncate">{lead?.name || "Unknown Lead"}</span>
                        {lead && (
                          <span className={`inline-flex items-center gap-0.5 text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                            lead.classification === "hot" ? "bg-red-50 text-red-500" :
                            lead.classification === "warm" ? "bg-amber-50 text-amber-600" :
                            "bg-slate-100 text-slate-500"
                          }`}>
                            {lead.classification === "hot" && <Flame className="w-2.5 h-2.5" />}
                            {lead.classification === "warm" && <Thermometer className="w-2.5 h-2.5" />}
                            {lead.classification === "cold" && <Snowflake className="w-2.5 h-2.5" />}
                            {lead.score}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-red-600 font-medium mb-1">{conv.handoffReason || "Needs human attention"}</p>
                      <p className="text-xs text-muted-foreground truncate">{conv.lastMessagePreview || "No preview"}</p>
                      <div className="flex items-center gap-2 mt-1.5">
                        <span className="text-[10px] text-muted-foreground">{page?.pageName}</span>
                        <span className="text-[10px] text-muted-foreground">·</span>
                        <span className="text-[10px] text-muted-foreground flex items-center gap-0.5">
                          <Clock className="w-2.5 h-2.5" />
                          {conv.handoffAt ? new Date(conv.handoffAt).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" }) : ""}
                        </span>
                      </div>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Conversation Panel */}
          <div className="flex-1 min-w-0">
            {selectedConvId ? (
              <ConversationPanel convId={selectedConvId} onResolved={() => setSelectedConvId(null)} />
            ) : (
              <div className="h-full flex items-center justify-center bg-white rounded-xl border border-gray-200">
                <div className="text-center">
                  <Headphones className="w-10 h-10 text-muted-foreground mx-auto mb-2" />
                  <p className="text-muted-foreground text-sm">Select a conversation from the queue to start responding.</p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function ConversationPanel({ convId, onResolved }: { convId: number; onResolved: () => void }) {
  const { data: convData } = trpc.conversations.get.useQuery({ id: convId });
  const { data: messages, refetch: refetchMessages } = trpc.messages.list.useQuery({ conversationId: convId });
  const sendMessage = trpc.messages.send.useMutation();
  const resolveHandoff = trpc.conversations.resolveHandoff.useMutation();
  const utils = trpc.useUtils();
  const [newMessage, setNewMessage] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async () => {
    if (!newMessage.trim()) return;
    try {
      await sendMessage.mutateAsync({ conversationId: convId, content: newMessage.trim(), sender: "human" });
      setNewMessage("");
      refetchMessages();
    } catch { toast.error("Failed to send message"); }
  };

  const handleResolve = async () => {
    try {
      await resolveHandoff.mutateAsync({ id: convId });
      utils.conversations.handoffQueue.invalidate();
      utils.conversations.handoffCount.invalidate();
      toast.success("Handoff resolved. AI re-enabled for this conversation.");
      onResolved();
    } catch { toast.error("Failed to resolve handoff"); }
  };

  if (!convData) return null;
  const { conversation: conv, lead, page } = convData;

  return (
    <div className="flex flex-col h-full bg-white rounded-xl border border-gray-200 overflow-hidden">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 sm:p-4 border-b bg-red-50/50">
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          <div className="w-9 h-9 bg-red-100 rounded-full flex items-center justify-center shrink-0">
            <AlertTriangle className="w-4 h-4 text-red-500" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <p className="font-semibold text-sm truncate">{lead?.name || "Unknown Lead"}</p>
              <span className="text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded-full font-medium">Handoff Active</span>
            </div>
            <p className="text-xs text-muted-foreground truncate">{page?.pageName} · {conv.platform || "messenger"}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-wrap pl-11 sm:pl-0">
          {lead?.phone && (
            <span className="text-xs text-muted-foreground flex items-center gap-1"><Phone className="w-3 h-3" />{lead.phone}</span>
          )}
          {lead?.email && (
            <span className="text-xs text-muted-foreground flex items-center gap-1 truncate"><Mail className="w-3 h-3" />{lead.email}</span>
          )}
          <Button onClick={handleResolve} size="sm" className="bg-green-600 hover:bg-green-700 text-white w-full sm:w-auto">
            <CheckCircle className="w-3.5 h-3.5 mr-1" /> Resolve & Re-enable AI
          </Button>
        </div>
      </div>

      {/* Handoff Reason Banner */}
      {conv.handoffReason && (
        <div className="px-4 py-2 bg-amber-50 border-b border-amber-200 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
          <p className="text-sm text-amber-800"><strong>Reason:</strong> {conv.handoffReason}</p>
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages?.map((msg: any) => (
          <div key={msg.id} className={`flex ${msg.sender === "lead" ? "justify-start" : "justify-end"}`}>
            <div className={`max-w-[75%] rounded-2xl px-4 py-2.5 ${
              msg.sender === "lead"
                ? "bg-gray-100 text-foreground rounded-bl-md"
                : msg.sender === "ai"
                ? "bg-messenger-light0 text-white rounded-br-md"
                : "bg-green-500 text-white rounded-br-md"
            }`}>
              <div className="flex items-center gap-1.5 mb-0.5">
                {msg.sender === "ai" && <Bot className="w-3 h-3" />}
                {msg.sender === "human" && <User className="w-3 h-3" />}
                <span className="text-[10px] font-semibold opacity-75">
                  {msg.sender === "lead" ? lead?.name || "Lead" : msg.sender === "ai" ? "AI Agent" : "You (Agent)"}
                </span>
              </div>
              <p className="text-sm leading-relaxed">{msg.content}</p>
              <p className={`text-[10px] mt-1 ${msg.sender === "lead" ? "text-muted-foreground" : "opacity-60"}`}>
                {new Date(msg.createdAt).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}
              </p>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-3 sm:p-4 border-t">
        <div className="flex gap-1.5 sm:gap-2">
          <Input
            placeholder="Type a message as the human agent..."
            value={newMessage}
            onChange={e => setNewMessage(e.target.value)}
            onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
            className="flex-1"
          />
          <Button onClick={handleSend} disabled={sendMessage.isPending || !newMessage.trim()} className="bg-green-600 hover:bg-green-700">
            <Send className="w-4 h-4 mr-1" /> Send as Agent
          </Button>
        </div>
        <p className="text-[10px] text-muted-foreground mt-1.5">
          Messages are sent directly to the lead via {conv.platform || "Messenger"}. AI is paused until you resolve the handoff.
        </p>
      </div>
    </div>
  );
}

export default function AgentInbox() {
  return (
    <DashboardLayout>
      <AgentInboxContent />
    </DashboardLayout>
  );
}
