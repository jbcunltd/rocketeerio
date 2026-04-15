import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { trpc } from "@/lib/trpc";
import {
  Loader2, Webhook, Plus, Trash2, Download, FileSpreadsheet,
  CheckCircle, XCircle, Copy, ExternalLink, Zap, Globe
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

const WEBHOOK_EVENTS = [
  { key: "lead.created", label: "New Lead Created", description: "When a new lead is captured" },
  { key: "lead.updated", label: "Lead Updated", description: "When a lead's info or score changes" },
  { key: "lead.classified", label: "Lead Classified", description: "When a lead is classified hot/warm/cold" },
  { key: "conversation.created", label: "New Conversation", description: "When a new conversation starts" },
  { key: "conversation.message", label: "New Message", description: "On every new message" },
  { key: "conversation.handoff", label: "Agent Handoff", description: "When AI hands off to human" },
  { key: "followup.sent", label: "Follow-Up Sent", description: "When a follow-up is sent" },
];

function WebhookForm({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
  const createWebhook = trpc.integrations.webhooks.create.useMutation();
  const [name, setName] = useState("");
  const [url, setUrl] = useState("");
  const [secret, setSecret] = useState("");
  const [selectedEvents, setSelectedEvents] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  const toggleEvent = (key: string) => {
    setSelectedEvents(prev => prev.includes(key) ? prev.filter(e => e !== key) : [...prev, key]);
  };

  const handleSubmit = async () => {
    if (!name || !url || selectedEvents.length === 0) {
      toast.error("Please fill in all required fields and select at least one event");
      return;
    }
    setSaving(true);
    try {
      await createWebhook.mutateAsync({ name, url, events: selectedEvents, secret: secret || undefined });
      toast.success("Webhook endpoint created!");
      onSuccess();
      onClose();
    } catch {
      toast.error("Failed to create webhook");
    }
    setSaving(false);
  };

  return (
    <div className="bg-white rounded-xl p-6 border border-gray-200 mb-6">
      <h3 className="font-bold mb-4">Add Webhook Endpoint</h3>
      <div className="space-y-4">
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <Label className="text-sm font-medium mb-1.5 block">Name</Label>
            <Input value={name} onChange={e => setName(e.target.value)} placeholder="e.g., Zapier - New Leads" />
          </div>
          <div>
            <Label className="text-sm font-medium mb-1.5 block">Webhook URL</Label>
            <Input value={url} onChange={e => setUrl(e.target.value)} placeholder="https://hooks.zapier.com/..." />
          </div>
        </div>
        <div>
          <Label className="text-sm font-medium mb-1.5 block">Signing Secret (optional)</Label>
          <Input value={secret} onChange={e => setSecret(e.target.value)} placeholder="Used to verify webhook authenticity" />
        </div>
        <div>
          <Label className="text-sm font-medium mb-2 block">Events to Subscribe</Label>
          <div className="grid sm:grid-cols-2 gap-2">
            {WEBHOOK_EVENTS.map(event => (
              <button
                key={event.key}
                onClick={() => toggleEvent(event.key)}
                className={`text-left p-3 rounded-lg border transition-colors ${
                  selectedEvents.includes(event.key)
                    ? "border-purple-300 bg-purple-50"
                    : "border-gray-200 hover:border-gray-300"
                }`}
              >
                <div className="flex items-center gap-2">
                  <div className={`w-4 h-4 rounded border flex items-center justify-center ${
                    selectedEvents.includes(event.key) ? "bg-purple-600 border-purple-600" : "border-gray-300"
                  }`}>
                    {selectedEvents.includes(event.key) && <CheckCircle className="w-3 h-3 text-white" />}
                  </div>
                  <span className="text-sm font-medium">{event.label}</span>
                </div>
                <p className="text-xs text-muted-foreground mt-1 ml-6">{event.description}</p>
              </button>
            ))}
          </div>
        </div>
        <div className="flex gap-2 justify-end">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={saving}>
            {saving ? <Loader2 className="w-4 h-4 animate-spin mr-1.5" /> : <Plus className="w-4 h-4 mr-1.5" />}
            Create Webhook
          </Button>
        </div>
      </div>
    </div>
  );
}

function GoogleSheetsAutoSync() {
  const settingsQuery = trpc.integrations.googleSheets.getSettings.useQuery();
  const updateMutation = trpc.integrations.googleSheets.updateSettings.useMutation({
    onSuccess: () => { settingsQuery.refetch(); toast.success("Google Sheets settings saved"); },
    onError: () => toast.error("Failed to save settings"),
  });
  const [sheetUrl, setSheetUrl] = useState("");
  const [enabled, setEnabled] = useState(false);
  const [loaded, setLoaded] = useState(false);

  if (settingsQuery.data && !loaded) {
    setSheetUrl(settingsQuery.data.googleSheetUrl || "");
    setEnabled(settingsQuery.data.googleSheetEnabled ?? false);
    setLoaded(true);
  }

  const handleSave = () => {
    updateMutation.mutate({ googleSheetUrl: sheetUrl, googleSheetEnabled: enabled });
  };

  return (
    <div className="mt-4 p-4 border border-green-200 bg-green-50 rounded-lg space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <p className="font-medium text-sm">Auto-Sync to Google Sheets</p>
          <p className="text-xs text-muted-foreground">Paste a Google Apps Script Web App URL to auto-populate leads.</p>
        </div>
        <Switch checked={enabled} onCheckedChange={setEnabled} />
      </div>
      {enabled && (
        <div className="space-y-2">
          <Label className="text-xs">Google Apps Script Web App URL</Label>
          <Input
            value={sheetUrl}
            onChange={e => setSheetUrl(e.target.value)}
            placeholder="https://script.google.com/macros/s/.../exec"
            className="text-sm"
          />
          <p className="text-xs text-muted-foreground">
            Deploy a Google Apps Script that accepts POST requests and appends rows to your sheet.
          </p>
          <Button onClick={handleSave} size="sm" disabled={updateMutation.isPending}>
            {updateMutation.isPending ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : null}
            Save
          </Button>
        </div>
      )}
    </div>
  );
}

function IntegrationsContent() {
  const { data: webhooks, isLoading } = trpc.integrations.webhooks.list.useQuery();
  const deleteWebhook = trpc.integrations.webhooks.delete.useMutation();
  const updateWebhook = trpc.integrations.webhooks.update.useMutation();
  const { data: csvExport, refetch: refetchCsv } = trpc.integrations.exportLeads.useQuery({ format: "csv" }, { enabled: false });
  const utils = trpc.useUtils();
  const [showForm, setShowForm] = useState(false);
  const [exporting, setExporting] = useState(false);

  const handleDeleteWebhook = async (id: number) => {
    try {
      await deleteWebhook.mutateAsync({ id });
      utils.integrations.webhooks.list.invalidate();
      toast.success("Webhook deleted");
    } catch { toast.error("Failed to delete webhook"); }
  };

  const handleToggleWebhook = async (id: number, isActive: boolean) => {
    try {
      await updateWebhook.mutateAsync({ id, isActive });
      utils.integrations.webhooks.list.invalidate();
      toast.success(isActive ? "Webhook enabled" : "Webhook disabled");
    } catch { toast.error("Failed to update webhook"); }
  };

  const handleExportCSV = async () => {
    setExporting(true);
    try {
      const result = await refetchCsv();
      if (result.data?.data) {
        const blob = new Blob([result.data.data as string], { type: "text/csv" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `rocketeer-leads-${new Date().toISOString().split("T")[0]}.csv`;
        a.click();
        URL.revokeObjectURL(url);
        toast.success("Leads exported as CSV!");
      }
    } catch { toast.error("Failed to export leads"); }
    setExporting(false);
  };

  if (isLoading) return <div className="flex items-center justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-messenger" /></div>;

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Integrations</h1>
        <p className="text-muted-foreground">Connect Rocketeer to Zapier, Google Sheets, and other tools via webhooks.</p>
      </div>

      {/* Zapier Guide */}
      <div className="bg-gradient-to-r from-orange-50 to-amber-50 border border-orange-200 rounded-xl p-6 mb-6">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center shrink-0">
            <Zap className="w-6 h-6 text-orange-600" />
          </div>
          <div>
            <h3 className="font-bold text-orange-900 mb-1">Connect with Zapier</h3>
            <p className="text-sm text-orange-800 mb-3">Send lead data to 5,000+ apps automatically. Create a Zap with a Webhook trigger and paste the URL below.</p>
            <div className="space-y-2 text-sm text-orange-700">
              <p>1. In Zapier, create a new Zap with <strong>"Webhooks by Zapier"</strong> as the trigger</p>
              <p>2. Choose <strong>"Catch Hook"</strong> as the trigger event</p>
              <p>3. Copy the webhook URL Zapier gives you</p>
              <p>4. Add it as a webhook endpoint below and select the events you want</p>
              <p>5. Connect any action app (Google Sheets, Slack, CRM, etc.)</p>
            </div>
          </div>
        </div>
      </div>

      {/* Google Sheets Export */}
      <div className="bg-white rounded-xl p-6 border border-gray-200 mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-50 rounded-xl flex items-center justify-center">
              <FileSpreadsheet className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <h3 className="font-bold">Google Sheets Integration</h3>
              <p className="text-sm text-muted-foreground">Export leads or auto-sync new leads to Google Sheets.</p>
            </div>
          </div>
          <Button onClick={handleExportCSV} disabled={exporting} variant="outline">
            {exporting ? <Loader2 className="w-4 h-4 animate-spin mr-1.5" /> : <Download className="w-4 h-4 mr-1.5" />}
            Export CSV
          </Button>
        </div>
        <GoogleSheetsAutoSync />
        <div className="mt-3 p-3 bg-gray-50 rounded-lg">
          <p className="text-xs text-muted-foreground">
            <strong>Tip:</strong> For automatic sync, set up a Zapier webhook with the "lead.created" event and connect it to Google Sheets as the action.
            This will add new leads to your spreadsheet in real-time.
          </p>
        </div>
      </div>

      {/* Webhook Endpoints */}
      <div className="bg-white rounded-xl p-6 border border-gray-200 mb-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Webhook className="w-5 h-5 text-purple-600" />
            <h3 className="font-bold">Webhook Endpoints</h3>
          </div>
          <Button onClick={() => setShowForm(!showForm)} size="sm">
            <Plus className="w-4 h-4 mr-1.5" />
            Add Endpoint
          </Button>
        </div>

        {showForm && (
          <WebhookForm
            onClose={() => setShowForm(false)}
            onSuccess={() => utils.integrations.webhooks.list.invalidate()}
          />
        )}

        {!webhooks?.length ? (
          <div className="text-center py-8">
            <Globe className="w-10 h-10 text-muted-foreground mx-auto mb-2" />
            <p className="text-muted-foreground text-sm">No webhook endpoints configured yet.</p>
            <p className="text-xs text-muted-foreground mt-1">Add an endpoint to start sending events to external services.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {webhooks.map(wh => (
              <div key={wh.id} className="p-4 rounded-lg border bg-gray-50/50">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <div className={`w-2 h-2 rounded-full ${wh.isActive ? "bg-green-500" : "bg-gray-300"}`} />
                    <span className="font-medium text-sm">{wh.name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={wh.isActive}
                      onCheckedChange={(val) => handleToggleWebhook(wh.id, val)}
                    />
                    <Button variant="ghost" size="sm" className="text-destructive" onClick={() => handleDeleteWebhook(wh.id)}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
                <div className="flex items-center gap-2 mb-2">
                  <code className="text-xs bg-white px-2 py-1 rounded border font-mono truncate flex-1">{wh.url}</code>
                  <button
                    onClick={() => { navigator.clipboard.writeText(wh.url); toast.success("URL copied"); }}
                    className="text-muted-foreground hover:text-foreground"
                  >
                    <Copy className="w-3.5 h-3.5" />
                  </button>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {wh.events.map(event => (
                    <span key={event} className="text-xs bg-purple-50 text-purple-700 px-2 py-0.5 rounded-full">{event}</span>
                  ))}
                </div>
                <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                  {wh.lastTriggeredAt && (
                    <span>Last triggered: {new Date(wh.lastTriggeredAt).toLocaleDateString()}</span>
                  )}
                  {wh.failCount > 0 && (
                    <span className="text-red-500 flex items-center gap-1">
                      <XCircle className="w-3 h-3" /> {wh.failCount} failures
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Webhook Payload Example */}
      <div className="bg-white rounded-xl p-6 border border-gray-200">
        <h3 className="font-bold mb-3">Webhook Payload Format</h3>
        <p className="text-sm text-muted-foreground mb-3">All webhook events are sent as POST requests with this JSON structure:</p>
        <pre className="bg-gray-900 text-green-400 p-4 rounded-lg text-xs overflow-x-auto">
{`{
  "event": "lead.created",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "data": {
    "id": 123,
    "name": "John Doe",
    "email": "john@example.com",
    "phone": "+639171234567",
    "classification": "hot",
    "score": 85,
    "platform": "messenger",
    "status": "new"
  }
}`}
        </pre>
        <p className="text-xs text-muted-foreground mt-3">
          If a signing secret is configured, requests include an <code className="bg-gray-100 px-1 rounded">X-Rocketeer-Signature</code> header with an HMAC-SHA256 signature.
        </p>
      </div>
    </div>
  );
}

export default function Integrations() {
  return (
    <DashboardLayout>
      <IntegrationsContent />
    </DashboardLayout>
  );
}
