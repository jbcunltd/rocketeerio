import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { trpc } from "@/lib/trpc";
import { useActivePage } from "@/contexts/ActivePageContext";
import { Loader2, Clock, Zap, MessageCircle, Save, Settings2, ArrowRight, MessageSquare, Mail, Smartphone, AlertCircle, Facebook } from "lucide-react";
import { useLocation } from "wouter";
import { useState, useEffect, useMemo } from "react";
import { toast } from "sonner";

const DELAY_PRESETS = [
  { label: "30 min", value: 30 },
  { label: "1 hour", value: 60 },
  { label: "2 hours", value: 120 },
  { label: "6 hours", value: 360 },
  { label: "12 hours", value: 720 },
  { label: "24 hours", value: 1440 },
  { label: "48 hours", value: 2880 },
  { label: "3 days", value: 4320 },
  { label: "7 days", value: 10080 },
];

function formatDelay(minutes: number): string {
  if (minutes < 60) return `${minutes} min`;
  if (minutes < 1440) return `${Math.round(minutes / 60)} hour${minutes >= 120 ? "s" : ""}`;
  return `${Math.round(minutes / 1440)} day${minutes >= 2880 ? "s" : ""}`;
}

function FollowUpsContent() {
  const { data: allConversations, isLoading: convsLoading } = trpc.conversations.list.useQuery();
  const { activePageId, activePage } = useActivePage();

  // Filter conversations by active page
  const conversations = useMemo(() => {
    if (!allConversations) return undefined;
    if (!activePageId) return allConversations;
    return allConversations.filter((c: any) => c.page?.id === activePageId);
  }, [allConversations, activePageId]);
  const { data: settings, isLoading: settingsLoading } = trpc.followUps.getSettings.useQuery(
    { pageId: activePageId ?? undefined },
    { enabled: !!activePageId }
  );
  const updateSettings = trpc.followUps.updateSettings.useMutation();
  const utils = trpc.useUtils();
  const [, setLocation] = useLocation();
  const [showSettings, setShowSettings] = useState(false);
  const [saving, setSaving] = useState(false);

  // Local state for settings form
  const [isEnabled, setIsEnabled] = useState(true);
  const [step1Delay, setStep1Delay] = useState(30);
  const [step1Message, setStep1Message] = useState("");
  const [step1Enabled, setStep1Enabled] = useState(true);
  const [step2Delay, setStep2Delay] = useState(120);
  const [step2Message, setStep2Message] = useState("");
  const [step2Enabled, setStep2Enabled] = useState(true);
  const [step3Delay, setStep3Delay] = useState(720);
  const [step3Message, setStep3Message] = useState("");
  const [step3Enabled, setStep3Enabled] = useState(true);
  const [step4Delay, setStep4Delay] = useState(2880);
  const [step4Message, setStep4Message] = useState("");
  const [step4Enabled, setStep4Enabled] = useState(true);
  const [step5Delay, setStep5Delay] = useState(10080);
  const [step5Message, setStep5Message] = useState("");
  const [step5Enabled, setStep5Enabled] = useState(true);
  const [useOneTimeNotification, setUseOneTimeNotification] = useState(false);

  useEffect(() => {
    if (settings) {
      setIsEnabled(settings.isEnabled);
      setStep1Delay(settings.step1DelayMinutes || 30);
      setStep1Message(settings.step1Message || "");
      setStep1Enabled(settings.step1Enabled);
      setStep2Delay(settings.step2DelayMinutes || 120);
      setStep2Message(settings.step2Message || "");
      setStep2Enabled(settings.step2Enabled);
      setStep3Delay(settings.step3DelayMinutes || 720);
      setStep3Message(settings.step3Message || "");
      setStep3Enabled(settings.step3Enabled);
      // Add steps 4 and 5 if they exist in settings, otherwise use defaults
      setStep4Delay((settings as any).step4DelayMinutes || 2880);
      setStep4Message((settings as any).step4Message || "");
      setStep4Enabled((settings as any).step4Enabled ?? true);
      setStep5Delay((settings as any).step5DelayMinutes || 10080);
      setStep5Message((settings as any).step5Message || "");
      setStep5Enabled((settings as any).step5Enabled ?? true);
      setUseOneTimeNotification((settings as any).useOneTimeNotification ?? false);
    }
  }, [settings]);

  const handleSaveSettings = async () => {
    setSaving(true);
    try {
      await updateSettings.mutateAsync({
        pageId: activePageId ?? undefined,
        isEnabled,
        step1DelayMinutes: step1Delay,
        step1Message: step1Message || undefined,
        step1Enabled,
        step2DelayMinutes: step2Delay,
        step2Message: step2Message || undefined,
        step2Enabled,
        step3DelayMinutes: step3Delay,
        step3Message: step3Message || undefined,
        step3Enabled,
        // Add extra fields to the mutation payload
        ...({
          step4DelayMinutes: step4Delay,
          step4Message: step4Message || undefined,
          step4Enabled,
          step5DelayMinutes: step5Delay,
          step5Message: step5Message || undefined,
          step5Enabled,
          useOneTimeNotification,
        } as any)
      });
      utils.followUps.getSettings.invalidate();
      toast.success("Follow-up settings saved!");
    } catch {
      toast.error("Failed to save settings");
    }
    setSaving(false);
  };

  if (convsLoading || settingsLoading) return <div className="flex items-center justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-messenger" /></div>;

  const steps = [
    { num: 1, delay: step1Delay, message: step1Message, enabled: step1Enabled, icon: MessageSquare, color: "text-messenger bg-messenger-light", setDelay: setStep1Delay, setMessage: setStep1Message, setEnabled: setStep1Enabled },
    { num: 2, delay: step2Delay, message: step2Message, enabled: step2Enabled, icon: MessageSquare, color: "text-messenger bg-messenger-light", setDelay: setStep2Delay, setMessage: setStep2Message, setEnabled: setStep2Enabled },
    { num: 3, delay: step3Delay, message: step3Message, enabled: step3Enabled, icon: MessageSquare, color: "text-messenger bg-messenger-light", setDelay: setStep3Delay, setMessage: setStep3Message, setEnabled: setStep3Enabled },
    { num: 4, delay: step4Delay, message: step4Message, enabled: step4Enabled, icon: Mail, color: "text-orange-600 bg-orange-50", setDelay: setStep4Delay, setMessage: setStep4Message, setEnabled: setStep4Enabled },
    { num: 5, delay: step5Delay, message: step5Message, enabled: step5Enabled, icon: Mail, color: "text-orange-600 bg-orange-50", setDelay: setStep5Delay, setMessage: setStep5Message, setEnabled: setStep5Enabled },
  ];

  const within24hSteps = steps.filter(s => s.delay <= 1440);
  const after24hSteps = steps.filter(s => s.delay > 1440);

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
          <p className="text-sm text-blue-800">Showing follow-ups for <strong>{activePage.pageName}</strong></p>
        </div>
      )}

      <div className="mb-6">
        <div className="mb-4">
          <h1 className="text-xl sm:text-2xl font-bold">Follow-Up Sequences</h1>
          <p className="text-sm text-muted-foreground">Automatically re-engage leads who haven't responded.</p>
        </div>
        
        {/* Mobile-friendly toggle card */}
        <div className={`p-4 rounded-lg border transition-all ${
          isEnabled 
            ? "bg-green-50 border-green-200" 
            : "bg-gray-50 border-gray-200"
        }`}>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <div className={`w-3 h-3 rounded-full ${
                isEnabled ? "bg-green-500" : "bg-gray-400"
              }`}></div>
              <span className={`text-sm font-semibold ${
                isEnabled ? "text-green-700" : "text-gray-600"
              }`}>
                {isEnabled ? "Follow-Ups Enabled" : "Follow-Ups Disabled"}
              </span>
            </div>
            <Switch checked={isEnabled} onCheckedChange={(val) => { setIsEnabled(val); }} />
          </div>
          <p className={`text-xs ${
            isEnabled ? "text-green-700" : "text-gray-600"
          }`}>
            {isEnabled 
              ? "Automatic follow-ups are active. Leads will receive messages according to your sequence." 
              : "Follow-ups are disabled. Enable to start re-engaging leads."}
          </p>
        </div>
        
        {/* Configure button - full width on mobile */}
        <Button 
          onClick={() => setShowSettings(!showSettings)} 
          className="w-full mt-3 bg-messenger hover:bg-messenger-dark"
        >
          <Settings2 className="w-4 h-4 mr-2" />
          {showSettings ? "Hide Settings" : "Configure Sequence"}
        </Button>
      </div>

      {/* Sequence Timeline */}
      <div className="bg-white rounded-xl p-4 sm:p-6 card-shadow border border-border/50 mb-6 overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-4">
          <h3 className="font-bold">Follow-Up Timeline</h3>
          <div className="hidden sm:flex items-center gap-2 text-xs bg-blue-50 text-blue-700 px-3 py-1.5 rounded-full border border-blue-100 shrink-0">
            <AlertCircle className="w-3.5 h-3.5" />
            <span>Facebook 24-Hour Rule Compliant</span>
          </div>
        </div>
        
        {/* Desktop: Horizontal layout */}
        <div className="hidden sm:flex flex-col gap-6">
          {/* Within 24 Hours Zone */}
          <div className="relative">
            <div className="absolute left-0 top-0 bottom-0 w-1 bg-green-400 rounded-full"></div>
            <div className="pl-4">
              <h4 className="text-sm font-semibold text-green-700 mb-3 flex items-center gap-2">
                Within 24 Hours
                <span className="text-xs font-normal text-muted-foreground bg-gray-100 px-2 py-0.5 rounded">Sent via Messenger</span>
              </h4>
              <div className="flex items-center gap-2 flex-wrap overflow-x-auto pb-2">
                <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-green-50 border border-green-200 shrink-0">
                  <div className="w-2 h-2 rounded-full bg-green-500" />
                  <span className="text-sm font-medium text-green-700">Last User Message</span>
                </div>
                {within24hSteps.map((step) => (
                  <div key={step.num} className="flex items-center gap-2 shrink-0">
                    <ArrowRight className="w-4 h-4 text-muted-foreground" />
                    <div className={`flex items-center gap-2 px-3 py-2 rounded-lg border ${step.enabled ? "bg-white border-border" : "bg-gray-50 border-gray-200 opacity-50"}`}>
                      <MessageSquare className={`w-4 h-4 ${step.enabled ? "text-messenger" : "text-gray-400"}`} />
                      <div>
                        <span className="text-sm font-medium">{formatDelay(step.delay)}</span>
                        <span className="text-xs text-muted-foreground ml-1">Step {step.num}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* After 24 Hours Zone */}
          <div className="relative">
            <div className="absolute left-0 top-0 bottom-0 w-1 bg-orange-400 rounded-full"></div>
            <div className="pl-4">
              <h4 className="text-sm font-semibold text-orange-700 mb-1 flex items-center gap-2">
                After 24 Hours
                <span className="text-xs font-normal text-muted-foreground bg-gray-100 px-2 py-0.5 rounded">Sent via Email/SMS</span>
              </h4>
              <p className="text-xs text-muted-foreground mb-3 max-w-2xl">
                Facebook only allows Messenger messages within 24 hours of the last user message. Follow-ups after 24 hours are automatically sent via email or SMS instead.
              </p>
              <div className="flex items-center gap-2 flex-wrap overflow-x-auto pb-2">
                <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-orange-50 border border-orange-200 shrink-0">
                  <Clock className="w-4 h-4 text-orange-500" />
                  <span className="text-sm font-medium text-orange-700">24h Window Closes</span>
                </div>
                {after24hSteps.map((step) => (
                  <div key={step.num} className="flex items-center gap-2 shrink-0">
                    <ArrowRight className="w-4 h-4 text-muted-foreground" />
                    <div className={`flex items-center gap-2 px-3 py-2 rounded-lg border ${step.enabled ? "bg-white border-border" : "bg-gray-50 border-gray-200 opacity-50"}`}>
                      <Mail className={`w-4 h-4 ${step.enabled ? "text-orange-500" : "text-gray-400"}`} />
                      <div>
                        <span className="text-sm font-medium">{formatDelay(step.delay)}</span>
                        <span className="text-xs text-muted-foreground ml-1">Step {step.num}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Mobile: Vertical timeline */}
        <div className="sm:hidden space-y-3">
          <div className="flex items-center gap-2 text-xs bg-blue-50 text-blue-700 px-3 py-1.5 rounded-full border border-blue-100 w-fit">
            <AlertCircle className="w-3.5 h-3.5" />
            <span>24-Hour Compliant</span>
          </div>
          
          {/* Start marker */}
          <div className="flex gap-3">
            <div className="flex flex-col items-center">
              <div className="w-3 h-3 rounded-full bg-green-500"></div>
              <div className="w-0.5 h-8 bg-green-200"></div>
            </div>
            <div className="pb-8">
              <p className="text-sm font-medium text-green-700">Last User Message</p>
              <p className="text-xs text-muted-foreground">Start of 24-hour window</p>
            </div>
          </div>

          {/* Messenger steps */}
          {within24hSteps.map((step, idx) => (
            <div key={step.num} className="flex gap-3">
              <div className="flex flex-col items-center">
                <div className={`w-3 h-3 rounded-full ${
                  step.enabled ? "bg-messenger" : "bg-gray-300"
                }`}></div>
                {idx < within24hSteps.length - 1 && (
                  <div className="w-0.5 h-20 bg-green-200"></div>
                )}
                {idx === within24hSteps.length - 1 && (
                  <div className="w-0.5 h-12 bg-orange-200"></div>
                )}
              </div>
              <div className={`pb-8 flex-1 border-l-4 ${
                step.enabled ? "border-green-400 bg-green-50" : "border-gray-300 bg-gray-50"
              } p-3 rounded`}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-semibold">Step {step.num}</span>
                  <MessageSquare className={`w-4 h-4 ${
                    step.enabled ? "text-messenger" : "text-gray-400"
                  }`} />
                </div>
                <p className="text-xs font-medium text-green-700 mb-1">{formatDelay(step.delay)}</p>
                <p className="text-xs text-muted-foreground line-clamp-2">
                  {step.message || "AI-generated follow-up"}
                </p>
              </div>
            </div>
          ))}

          {/* 24-hour divider */}
          <div className="flex gap-3 py-2">
            <div className="flex flex-col items-center">
              <div className="w-2 h-2 rounded-full bg-orange-500"></div>
              <div className="w-0.5 h-6 bg-orange-300"></div>
            </div>
            <div className="text-xs font-semibold text-orange-700 bg-orange-50 px-3 py-1.5 rounded border border-orange-200">
              24-Hour Window Closes
            </div>
          </div>

          {/* Email steps */}
          {after24hSteps.map((step, idx) => (
            <div key={step.num} className="flex gap-3">
              <div className="flex flex-col items-center">
                <div className={`w-3 h-3 rounded-full ${
                  step.enabled ? "bg-orange-500" : "bg-gray-300"
                }`}></div>
                {idx < after24hSteps.length - 1 && (
                  <div className="w-0.5 h-20 bg-orange-200"></div>
                )}
              </div>
              <div className={`pb-8 flex-1 border-l-4 ${
                step.enabled ? "border-orange-400 bg-orange-50" : "border-gray-300 bg-gray-50"
              } p-3 rounded`}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-semibold">Step {step.num}</span>
                  <Mail className={`w-4 h-4 ${
                    step.enabled ? "text-orange-500" : "text-gray-400"
                  }`} />
                </div>
                <p className="text-xs font-medium text-orange-700 mb-1">{formatDelay(step.delay)}</p>
                <p className="text-xs text-muted-foreground line-clamp-2">
                  {step.message || "AI-generated follow-up"}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Settings Panel */}
      {showSettings && (
        <div className="bg-white rounded-xl p-4 sm:p-6 card-shadow border border-border/50 mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
            <h3 className="font-bold">Sequence Configuration</h3>
            <Button onClick={handleSaveSettings} disabled={saving} size="sm" className="w-full sm:w-auto">
              {saving ? <Loader2 className="w-4 h-4 animate-spin mr-1.5" /> : <Save className="w-4 h-4 mr-1.5" />}
              Save Settings
            </Button>
          </div>

          <div className="space-y-6">
            {/* One-Time Notification Option */}
            <div className="p-4 rounded-lg border bg-blue-50/50 border-blue-100">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <Zap className="w-4 h-4 text-blue-600" />
                    <h4 className="font-semibold text-blue-900">One-Time Notification (OTN)</h4>
                  </div>
                  <p className="text-sm text-blue-800/80">
                    Allow the AI to ask the lead "Can we follow up with you?" before the 24-hour window closes. 
                    If they say yes, you get permission to send one more Messenger message after 24 hours.
                  </p>
                </div>
                <Switch checked={useOneTimeNotification} onCheckedChange={setUseOneTimeNotification} />
              </div>
            </div>

            {steps.map(step => (
              <div key={step.num} className={`p-4 rounded-lg border ${step.enabled ? "bg-white" : "bg-gray-50 opacity-70"}`}>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${step.color}`}>
                      <step.icon className="w-4 h-4" />
                    </div>
                    <span className="font-semibold">Step {step.num}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${step.delay <= 1440 ? "bg-green-100 text-green-700" : "bg-orange-100 text-orange-700"}`}>
                      {step.delay <= 1440 ? "Messenger" : "Email/SMS"}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch checked={step.enabled} onCheckedChange={step.setEnabled} />
                    <span className="text-xs text-muted-foreground">{step.enabled ? "Active" : "Disabled"}</span>
                  </div>
                </div>

                <div className="grid sm:grid-cols-[200px_1fr] gap-4">
                  <div>
                    <Label className="text-xs font-medium text-muted-foreground mb-1.5 block">Delay After Last Message</Label>
                    <select
                      value={step.delay}
                      onChange={(e) => step.setDelay(Number(e.target.value))}
                      className="w-full border rounded-md px-3 py-2 text-sm bg-white"
                      disabled={!step.enabled}
                    >
                      {DELAY_PRESETS.map(p => (
                        <option key={p.value} value={p.value}>{p.label}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <Label className="text-xs font-medium text-muted-foreground mb-1.5 block">Message Template</Label>
                    <Textarea
                      value={step.message}
                      onChange={(e) => step.setMessage(e.target.value)}
                      placeholder="Leave empty to use AI-generated follow-up message"
                      className="text-sm resize-none"
                      rows={2}
                      disabled={!step.enabled}
                    />
                    <p className="text-xs text-muted-foreground mt-1">Leave blank to let the AI generate a contextual follow-up.</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Active Conversations */}
      <div className="bg-white rounded-xl p-4 sm:p-6 card-shadow border border-border/50">
        <h3 className="font-bold mb-3">Active Conversations</h3>
        <p className="text-sm text-muted-foreground mb-4">Follow-ups are automatically scheduled when a new conversation starts.</p>
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
                      <div className="flex items-center gap-2">
                        <p className="text-xs text-muted-foreground">{conv.messageCount || 0} messages</p>
                        {conv.platform === "instagram" && (
                          <span className="text-xs bg-purple-50 text-purple-600 px-1.5 py-0.5 rounded">IG</span>
                        )}
                      </div>
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
