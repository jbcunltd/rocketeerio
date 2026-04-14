import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { trpc } from "@/lib/trpc";
import {
  ArrowLeft, Loader2, Send, Flame, Thermometer, Snowflake,
  CheckCircle2, Archive, Clock, User, Mail, Phone, Bot, Zap
} from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { useLocation, useParams } from "wouter";
import { toast } from "sonner";

function BANTBar({ label, score, maxScore, notes }: { label: string; score: number; maxScore: number; notes: string }) {
  const pct = Math.round((score / maxScore) * 100);
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-foreground">{label}</span>
        <span className="text-xs font-bold text-muted-foreground">{score}/{maxScore}</span>
      </div>
      <div className="h-2 bg-muted rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all ${pct >= 80 ? "bg-red-500" : pct >= 50 ? "bg-amber-500" : "bg-slate-400"}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      {notes && <p className="text-xs text-muted-foreground">{notes}</p>}
    </div>
  );
}

function ConversationDetailContent() {
  const params = useParams<{ id: string }>();
  const convId = parseInt(params.id || "0");
  const [, setLocation] = useLocation();
  const [newMessage, setNewMessage] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { data: convData, isLoading: convLoading } = trpc.conversations.get.useQuery({ id: convId });
  const { data: messages, isLoading: msgsLoading, refetch: refetchMessages } = trpc.messages.list.useQuery({ conversationId: convId });
  const { data: followUps } = trpc.followUps.list.useQuery({ conversationId: convId });

  const sendMessage = trpc.messages.send.useMutation();
  const aiReply = trpc.messages.aiReply.useMutation();
  const updateLead = trpc.leads.update.useMutation();
  const updateConv = trpc.conversations.updateStatus.useMutation();
  const scheduleFollowUps = trpc.followUps.schedule.useMutation();
  const utils = trpc.useUtils();

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendMessage = async () => {
    if (!newMessage.trim()) return;
    try {
      await sendMessage.mutateAsync({ conversationId: convId, content: newMessage.trim(), sender: "human" });
      setNewMessage("");
      refetchMessages();
    } catch { toast.error("Failed to send message"); }
  };

  const handleAIReply = async () => {
    if (!newMessage.trim()) { toast.error("Enter a lead message to simulate"); return; }
    try {
      const result = await aiReply.mutateAsync({ conversationId: convId, leadMessage: newMessage.trim() });
      setNewMessage("");
      refetchMessages();
      utils.conversations.get.invalidate({ id: convId });
      utils.leads.list.invalidate();
      toast.success(`AI replied. Lead score: ${result.score.score}/100 (${result.score.classification})`);
    } catch { toast.error("AI reply failed"); }
  };

  const handleMarkConverted = async () => {
    if (!convData?.lead) return;
    try {
      await updateLead.mutateAsync({ id: convData.lead.id, status: "converted" });
      utils.conversations.get.invalidate({ id: convId });
      utils.leads.list.invalidate();
      toast.success("Lead marked as converted!");
    } catch { toast.error("Failed to update lead"); }
  };

  const handleArchive = async () => {
    try {
      await updateConv.mutateAsync({ id: convId, status: "archived" });
      utils.conversations.list.invalidate();
      toast.success("Conversation archived");
      setLocation("/conversations");
    } catch { toast.error("Failed to archive"); }
  };

  const handleScheduleFollowUps = async () => {
    if (!convData?.lead) return;
    try {
      await scheduleFollowUps.mutateAsync({ conversationId: convId, leadId: convData.lead.id });
      utils.followUps.list.invalidate({ conversationId: convId });
      toast.success("Follow-up sequence scheduled (30m, 2h, 12h)");
    } catch { toast.error("Failed to schedule follow-ups"); }
  };

  if (convLoading || msgsLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-messenger" />
      </div>
    );
  }

  if (!convData) {
    return (
      <div className="text-center py-20">
        <p className="text-muted-foreground">Conversation not found.</p>
        <Button variant="outline" className="mt-4" onClick={() => setLocation("/conversations")}>
          <ArrowLeft className="w-4 h-4 mr-2" /> Back to Conversations
        </Button>
      </div>
    );
  }

  const { conversation: conv, lead, page } = convData;

  return (
    <div className="flex flex-col lg:flex-row gap-6 h-[calc(100vh-8rem)]">
      {/* Chat Thread */}
      <div className="flex-1 flex flex-col bg-white rounded-xl card-shadow border border-border/50 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={() => setLocation("/conversations")}>
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <div className="w-9 h-9 bg-messenger-light rounded-full flex items-center justify-center">
              <span className="text-sm font-bold text-messenger">{(lead?.name || "?").charAt(0).toUpperCase()}</span>
            </div>
            <div>
              <p className="font-semibold text-sm">{lead?.name || "Unknown Lead"}</p>
              <p className="text-xs text-muted-foreground">{page?.pageName || "Unknown Page"}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={handleMarkConverted} disabled={lead?.status === "converted"}>
              <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
              {lead?.status === "converted" ? "Converted" : "Mark Converted"}
            </Button>
            <Button variant="outline" size="sm" onClick={handleArchive}>
              <Archive className="w-3.5 h-3.5 mr-1" /> Archive
            </Button>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {messages?.map((msg: any) => (
            <div key={msg.id} className={`flex ${msg.sender === "lead" ? "justify-start" : "justify-end"}`}>
              <div className={`max-w-[75%] rounded-2xl px-4 py-2.5 ${
                msg.sender === "lead"
                  ? "bg-muted text-foreground rounded-bl-md"
                  : msg.sender === "ai"
                  ? "bg-messenger text-white rounded-br-md"
                  : "bg-green-500 text-white rounded-br-md"
              }`}>
                <div className="flex items-center gap-1.5 mb-0.5">
                  {msg.sender === "ai" && <Bot className="w-3 h-3" />}
                  {msg.sender === "human" && <User className="w-3 h-3" />}
                  <span className="text-[10px] font-semibold opacity-75">
                    {msg.sender === "lead" ? lead?.name || "Lead" : msg.sender === "ai" ? "AI Agent" : "You"}
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
        <div className="p-4 border-t">
          <div className="flex gap-2">
            <Input
              placeholder="Type a message or simulate a lead message..."
              value={newMessage}
              onChange={e => setNewMessage(e.target.value)}
              onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSendMessage(); } }}
              className="flex-1"
            />
            <Button onClick={handleSendMessage} disabled={sendMessage.isPending || !newMessage.trim()} size="sm" variant="outline">
              <Send className="w-4 h-4" />
            </Button>
            <Button onClick={handleAIReply} disabled={aiReply.isPending || !newMessage.trim()} size="sm" className="bg-messenger hover:bg-messenger-dark">
              {aiReply.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Bot className="w-4 h-4 mr-1" />}
              AI Reply
            </Button>
          </div>
          <p className="text-[10px] text-muted-foreground mt-1.5">
            "Send" adds a manual message. "AI Reply" simulates a lead message and generates an AI response with scoring.
          </p>
        </div>
      </div>

      {/* Lead Info Sidebar */}
      <div className="w-full lg:w-80 space-y-4 shrink-0">
        {/* Lead Score Card */}
        <div className="bg-white rounded-xl p-5 card-shadow border border-border/50">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold">Lead Score</h3>
            {lead && (
              <span className={`inline-flex items-center gap-1 text-sm font-bold px-3 py-1 rounded-full ${
                lead.classification === "hot" ? "bg-red-50 text-red-500" :
                lead.classification === "warm" ? "bg-amber-50 text-amber-600" :
                "bg-slate-100 text-slate-500"
              }`}>
                {lead.classification === "hot" && <Flame className="w-3.5 h-3.5" />}
                {lead.classification === "warm" && <Thermometer className="w-3.5 h-3.5" />}
                {lead.classification === "cold" && <Snowflake className="w-3.5 h-3.5" />}
                {lead.score}/100
              </span>
            )}
          </div>
          {lead && (
            <div className="space-y-3">
              <BANTBar label="Budget" score={lead.budgetScore} maxScore={25} notes={lead.budgetNotes || ""} />
              <BANTBar label="Authority" score={lead.authorityScore} maxScore={25} notes={lead.authorityNotes || ""} />
              <BANTBar label="Need" score={lead.needScore} maxScore={25} notes={lead.needNotes || ""} />
              <BANTBar label="Timeline" score={lead.timelineScore} maxScore={25} notes={lead.timelineNotes || ""} />
            </div>
          )}
        </div>

        {/* Contact Info */}
        <div className="bg-white rounded-xl p-5 card-shadow border border-border/50">
          <h3 className="font-bold mb-3">Contact Info</h3>
          <div className="space-y-2.5">
            <div className="flex items-center gap-2 text-sm">
              <User className="w-4 h-4 text-muted-foreground" />
              <span>{lead?.name || "Unknown"}</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Mail className="w-4 h-4 text-muted-foreground" />
              <span>{lead?.email || "No email"}</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Phone className="w-4 h-4 text-muted-foreground" />
              <span>{lead?.phone || "No phone"}</span>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="bg-white rounded-xl p-5 card-shadow border border-border/50">
          <h3 className="font-bold mb-3">Actions</h3>
          <div className="space-y-2">
            <Button variant="outline" className="w-full justify-start" onClick={handleScheduleFollowUps} disabled={scheduleFollowUps.isPending}>
              <Clock className="w-4 h-4 mr-2" /> Schedule Follow-Ups
            </Button>
            <Button variant="outline" className="w-full justify-start" onClick={handleMarkConverted} disabled={lead?.status === "converted"}>
              <CheckCircle2 className="w-4 h-4 mr-2" /> {lead?.status === "converted" ? "Already Converted" : "Mark as Converted"}
            </Button>
          </div>
        </div>

        {/* Follow-Up Status */}
        {followUps && followUps.length > 0 && (
          <div className="bg-white rounded-xl p-5 card-shadow border border-border/50">
            <h3 className="font-bold mb-3">Follow-Up Sequence</h3>
            <div className="space-y-2">
              {followUps.map((fu: any) => (
                <div key={fu.id} className="flex items-center justify-between text-sm p-2 rounded-lg border">
                  <div className="flex items-center gap-2">
                    <Zap className={`w-3.5 h-3.5 ${fu.status === "sent" ? "text-green-500" : fu.status === "pending" ? "text-amber-500" : "text-muted-foreground"}`} />
                    <span>{fu.delayMinutes < 60 ? `${fu.delayMinutes}m` : `${fu.delayMinutes / 60}h`}</span>
                  </div>
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                    fu.status === "sent" ? "bg-green-50 text-green-600" :
                    fu.status === "pending" ? "bg-amber-50 text-amber-600" :
                    "bg-muted text-muted-foreground"
                  }`}>{fu.status}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function ConversationDetail() {
  return (
    <DashboardLayout>
      <ConversationDetailContent />
    </DashboardLayout>
  );
}
