import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { trpc } from "@/lib/trpc";
import { Loader2, Clock, Zap, MessageCircle, Save, Settings2, ArrowRight } from "lucide-react";
import { useLocation } from "wouter";
import { useState, useEffect } from "react";
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
  const { data: conversations, isLoading: convsLoading } = trpc.conversations.list.useQuery();
  const { data: settings, isLoading: settingsLoading } = trpc.followUps.getSettings.useQuery();
  const updateSettings = trpc.followUps.updateSettings.useMutation();
  const utils = trpc.useUtils();
  const [, setLocation] = useLocation();
  const [showSettings, setShowSettings] = useState(false);
  const [saving, setSaving] = useState(false);

  // Local state for settings form
  const [isEnabled, setIsEnabled] = useState(true);
  const [step1Delay, setStep1Delay] = useState(1440);
  const [step1Message, setStep1Message] = useState("");
  const [step1Enabled, setStep1Enabled] = useState(true);
  const [step2Delay, setStep2Delay] = useState(2880);
  const [step2Message, setStep2Message] = useState("");
  const [step2Enabled, setStep2Enabled] = useState(true);
  const [step3Delay, setStep3Delay] = useState(10080);
  const [step3Message, setStep3Message] = useState("");
  const [step3Enabled, setStep3Enabled] = useState(true);

  useEffect(() => {
    if (settings) {
      setIsEnabled(settings.isEnabled);
      setStep1Delay(settings.step1DelayMinutes);
      setStep1Message(settings.step1Message || "");
      setStep1Enabled(settings.step1Enabled);
      setStep2Delay(settings.step2DelayMinutes);
      setStep2Message(settings.step2Message || "");
      setStep2Enabled(settings.step2Enabled);
      setStep3Delay(settings.step3DelayMinutes);
      setStep3Message(settings.step3Message || "");
      setStep3Enabled(settings.step3Enabled);
    }
  }, [settings]);

  const handleSaveSettings = async () => {
    setSaving(true);
    try {
      await updateSettings.mutateAsync({
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
    { num: 1, delay: step1Delay, message: step1Message, enabled: step1Enabled, icon: Zap, color: "text-blue-600 bg-blue-50", setDelay: setStep1Delay, setMessage: setStep1Message, setEnabled: setStep1Enabled },
    { num: 2, delay: step2Delay, message: step2Message, enabled: step2Enabled, icon: Clock, color: "text-purple-600 bg-purple-50", setDelay: setStep2Delay, setMessage: setStep2Message, setEnabled: setStep2Enabled },
    { num: 3, delay: step3Delay, message: step3Message, enabled: step3Enabled, icon: MessageCircle, color: "text-orange-600 bg-orange-50", setDelay: setStep3Delay, setMessage: setStep3Message, setEnabled: setStep3Enabled },
  ];

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <div className="min-w-0">
          <h1 className="text-xl sm:text-2xl font-bold">Follow-Up Sequences</h1>
          <p className="text-sm text-muted-foreground">Automatically re-engage leads who haven't responded.</p>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <div className="flex items-center gap-2">
            <Switch checked={isEnabled} onCheckedChange={(val) => { setIsEnabled(val); }} />
            <span className="text-sm font-medium">{isEnabled ? "Enabled" : "Disabled"}</span>
          </div>
          <Button variant="outline" size="sm" onClick={() => setShowSettings(!showSettings)} className="w-full sm:w-auto">
            <Settings2 className="w-4 h-4 mr-1.5" />
            {showSettings ? "Hide Settings" : "Configure"}
          </Button>
        </div>
      </div>

      {/* Sequence Timeline */}
      <div className="bg-white rounded-xl p-4 sm:p-6 card-shadow border border-border/50 mb-6 overflow-hidden">
        <h3 className="font-bold mb-4">Follow-Up Timeline</h3>
        <div className="flex items-center gap-2 flex-wrap overflow-x-auto">
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-green-50 border border-green-200">
            <div className="w-2 h-2 rounded-full bg-green-500" />
            <span className="text-sm font-medium text-green-700">First Contact</span>
          </div>
          {steps.map((step, i) => (
            <div key={step.num} className="flex items-center gap-2">
              <ArrowRight className="w-4 h-4 text-muted-foreground" />
              <div className={`flex items-center gap-2 px-3 py-2 rounded-lg border ${step.enabled ? "bg-white border-border" : "bg-gray-50 border-gray-200 opacity-50"}`}>
                <step.icon className={`w-4 h-4 ${step.enabled ? "text-messenger" : "text-gray-400"}`} />
                <div>
                  <span className="text-sm font-medium">{formatDelay(step.delay)}</span>
                  <span className="text-xs text-muted-foreground ml-1">Step {step.num}</span>
                </div>
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
            {steps.map(step => (
              <div key={step.num} className={`p-4 rounded-lg border ${step.enabled ? "bg-white" : "bg-gray-50 opacity-70"}`}>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${step.color}`}>
                      <step.icon className="w-4 h-4" />
                    </div>
                    <span className="font-semibold">Step {step.num}</span>
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
