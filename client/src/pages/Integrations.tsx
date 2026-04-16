import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { trpc } from "@/lib/trpc";
import {
  Loader2, Webhook, Plus, Trash2, Download, FileSpreadsheet,
  CheckCircle, XCircle, Copy, ExternalLink, Zap, Globe, Info, ChevronDown, ChevronUp
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
  
  // State for collapsible instructions
  const [showZapierGuide, setShowZapierGuide] = useState(false);
  const [showSheetsGuide, setShowSheetsGuide] = useState(false);
  const [showWebhookGuide, setShowWebhookGuide] = useState(false);

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
        <p className="text-muted-foreground">Connect Rocketeerio to Zapier, Google Sheets, and other tools via webhooks.</p>
      </div>

      {/* Zapier Guide */}
      <div className="bg-gradient-to-r from-orange-50 to-amber-50 border border-orange-200 rounded-xl p-4 sm:p-6 mb-6">
        <div className="flex flex-col sm:flex-row items-start gap-4">
          <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center shrink-0">
            <Zap className="w-6 h-6 text-orange-600" />
          </div>
          <div className="flex-1">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 mb-1 w-full">
              <h3 className="font-bold text-orange-900">Connect with Zapier</h3>
              <Button variant="ghost" size="sm" onClick={() => setShowZapierGuide(!showZapierGuide)} className="text-orange-700 hover:text-orange-900 hover:bg-orange-100 w-full sm:w-auto justify-start sm:justify-center">
                {showZapierGuide ? "Hide Instructions" : "Show Instructions"}
                {showZapierGuide ? <ChevronUp className="w-4 h-4 ml-1" /> : <ChevronDown className="w-4 h-4 ml-1" />}
              </Button>
            </div>
            <p className="text-sm text-orange-800 mb-3">
              <strong>What this does:</strong> Automatically send your new leads from Rocketeerio to over 5,000+ other apps like Gmail, Slack, Mailchimp, or your CRM.
            </p>
            
            {showZapierGuide && (
              <div className="space-y-4 text-sm text-orange-800 bg-white/60 p-4 rounded-lg border border-orange-100 mt-4">
                <h4 className="font-semibold text-orange-900">Step-by-Step Setup Guide:</h4>
                <ol className="list-decimal list-inside space-y-3 ml-1">
                  <li><strong>Log into Zapier</strong> and click the "Create a Zap" button.</li>
                  <li><strong>Set up the Trigger:</strong> Search for and select <strong>"Webhooks by Zapier"</strong> as your trigger app.</li>
                  <li><strong>Choose Event:</strong> Select <strong>"Catch Hook"</strong> from the event dropdown and click Continue.</li>
                  <li><strong>Copy the URL:</strong> Zapier will give you a unique "Webhook URL". Copy this link.</li>
                  <li><strong>Add to Rocketeerio:</strong> Scroll down to the "Webhook Endpoints" section on this page, click "Add Endpoint", and paste the URL you copied. Select the events you want to send (like "New Lead Created").</li>
                  <li><strong>Test the Trigger:</strong> Go back to Zapier and click "Test trigger". (Make sure you have at least one lead in Rocketeerio first!)</li>
                  <li><strong>Set up the Action:</strong> Now choose where you want the data to go (e.g., Google Sheets, Slack) and map the fields.</li>
                </ol>
                <div className="flex items-start gap-2 bg-orange-100/50 p-3 rounded-md mt-2">
                  <Info className="w-4 h-4 text-orange-600 mt-0.5 shrink-0" />
                  <p className="text-xs"><strong>Tip:</strong> You can create multiple Zaps for different events. Just create a new Webhook in Zapier and add it as a new endpoint here.</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Google Sheets Export */}
      <div className="bg-white rounded-xl p-4 sm:p-6 border border-gray-200 mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 bg-green-50 rounded-xl flex items-center justify-center">
              <FileSpreadsheet className="w-5 h-5 text-green-600" />
            </div>
            <div className="min-w-0">
              <h3 className="font-bold break-words">Google Sheets Integration</h3>
              <p className="text-sm text-muted-foreground">Export leads or auto-sync new leads to Google Sheets.</p>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
            <Button variant="ghost" size="sm" onClick={() => setShowSheetsGuide(!showSheetsGuide)} className="text-gray-600 w-full sm:w-auto justify-start sm:justify-center">
              {showSheetsGuide ? "Hide Instructions" : "Show Instructions"}
              {showSheetsGuide ? <ChevronUp className="w-4 h-4 ml-1" /> : <ChevronDown className="w-4 h-4 ml-1" />}
            </Button>
            <Button onClick={handleExportCSV} disabled={exporting} variant="outline" className="w-full sm:w-auto">
              {exporting ? <Loader2 className="w-4 h-4 animate-spin mr-1.5" /> : <Download className="w-4 h-4 mr-1.5" />}
              Export CSV
            </Button>
          </div>
        </div>
        
        {showSheetsGuide && (
          <div className="mb-6 space-y-4 text-sm text-gray-700 bg-gray-50 p-3 sm:p-4 rounded-lg border border-gray-100 overflow-hidden">
            <p><strong>What this does:</strong> Allows you to either download a one-time file of all your leads (CSV Export) or set up a system where new leads are automatically added to a Google Sheet as they come in (Auto-Sync).</p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">Option 1: Manual Export (Easy)</h4>
                <ol className="list-decimal list-inside space-y-2 ml-1">
                  <li>Click the <strong>"Export CSV"</strong> button above.</li>
                  <li>A file will download to your computer.</li>
                  <li>Open Google Sheets, click <strong>File &gt; Import</strong>.</li>
                  <li>Upload the downloaded file to view your leads.</li>
                </ol>
              </div>
              
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">Option 2: Auto-Sync (Advanced)</h4>
                <ol className="list-decimal list-inside space-y-2 ml-1">
                  <li>Create a new Google Sheet.</li>
                  <li>Go to <strong>Extensions &gt; Apps Script</strong>.</li>
                  <li>Paste a script that accepts POST requests (you can find templates online).</li>
                  <li>Click <strong>Deploy &gt; New deployment</strong>.</li>
                  <li>Select "Web app", set access to "Anyone", and copy the Web App URL.</li>
                  <li>Toggle the switch below and paste the URL.</li>
                </ol>
              </div>
            </div>
            
            <div className="flex items-start gap-2 bg-messenger-light p-3 rounded-md mt-2 border border-messenger-light">
              <Info className="w-4 h-4 text-messenger mt-0.5 shrink-0" />
              <p className="text-xs text-messenger-dark"><strong>Easier Alternative:</strong> If Option 2 seems too technical, we highly recommend using the <strong>Zapier Integration</strong> (above) to connect to Google Sheets. It's much simpler and requires no coding!</p>
            </div>
          </div>
        )}
        
        <GoogleSheetsAutoSync />
      </div>

      {/* Webhook Endpoints */}
      <div className="bg-white rounded-xl p-4 sm:p-6 border border-gray-200 mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
          <div className="flex items-center gap-2">
            <Webhook className="w-5 h-5 text-purple-600" />
            <h3 className="font-bold">Webhook Endpoints</h3>
          </div>
          <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
            <Button variant="ghost" size="sm" onClick={() => setShowWebhookGuide(!showWebhookGuide)} className="text-gray-600 w-full sm:w-auto justify-start sm:justify-center">
              {showWebhookGuide ? "Hide Instructions" : "Show Instructions"}
              {showWebhookGuide ? <ChevronUp className="w-4 h-4 ml-1" /> : <ChevronDown className="w-4 h-4 ml-1" />}
            </Button>
            <Button onClick={() => setShowForm(!showForm)} size="sm" className="w-full sm:w-auto">
              <Plus className="w-4 h-4 mr-1.5" />
              Add Endpoint
            </Button>
          </div>
        </div>

        {showWebhookGuide && (
          <div className="mb-6 space-y-4 text-sm text-gray-700 bg-purple-50/50 p-3 sm:p-4 rounded-lg border border-purple-100 overflow-hidden">
            <p><strong>What this does:</strong> Webhooks are like instant notifications for other apps. When something happens in Rocketeerio (like a new lead), we instantly send a message (a "webhook") to another app's URL to let them know.</p>
            
            <h4 className="font-semibold text-gray-900">How to set up a Webhook:</h4>
            <ol className="list-decimal list-inside space-y-2 ml-1">
              <li>Get a "Webhook URL" from the app you want to send data to (like Zapier, Make.com, or your own custom server).</li>
              <li>Click the <strong>"Add Endpoint"</strong> button above.</li>
              <li>Give it a name you'll remember (e.g., "Send to Make.com").</li>
              <li>Paste the Webhook URL you got in step 1.</li>
              <li>Select which events should trigger this webhook (e.g., check "New Lead Created").</li>
              <li>Click <strong>"Create Webhook"</strong>.</li>
            </ol>
            
            <div className="flex items-start gap-2 bg-white p-3 rounded-md mt-2 border border-gray-200">
              <Info className="w-4 h-4 text-gray-500 mt-0.5 shrink-0" />
              <p className="text-xs text-gray-600"><strong>Note on Signing Secrets:</strong> This is an optional security feature for developers to verify that the data really came from Rocketeerio. If you're using Zapier or Make.com, you can usually leave this blank.</p>
            </div>
          </div>
        )}

        {showForm && (
          <div className="overflow-x-hidden">
            <WebhookForm
              onClose={() => setShowForm(false)}
              onSuccess={() => utils.integrations.webhooks.list.invalidate()}
            />
          </div>
        )}

        {!webhooks?.length ? (
          <div className="text-center py-8">
            <Globe className="w-10 h-10 text-muted-foreground mx-auto mb-2" />
            <p className="text-muted-foreground text-sm">No webhook endpoints configured yet.</p>
            <p className="text-xs text-muted-foreground mt-1">Add an endpoint to start sending events to external services.</p>
          </div>
        ) : (
          <div className="space-y-3 overflow-x-hidden">
            {webhooks.map(wh => (
              <div key={wh.id} className="p-3 sm:p-4 rounded-lg border bg-gray-50/50 overflow-hidden">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-2">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={`w-2 h-2 rounded-full ${wh.isActive ? "bg-green-500" : "bg-gray-300"}`} />
                    <span className="font-medium text-sm break-words">{wh.name}</span>
                  </div>
                  <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                    <Switch
                      checked={wh.isActive}
                      onCheckedChange={(val) => handleToggleWebhook(wh.id, val)}
                    />
                    <Button variant="ghost" size="sm" className="text-destructive" onClick={() => handleDeleteWebhook(wh.id)}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
                <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-2 overflow-hidden">
                  <code className="text-xs bg-white px-2 py-1 rounded border font-mono truncate flex-1 overflow-x-auto">{wh.url}</code>
                  <button
                    onClick={() => { navigator.clipboard.writeText(wh.url); toast.success("URL copied"); }}
                    className="text-muted-foreground hover:text-foreground"
                  >
                    <Copy className="w-3.5 h-3.5" />
                  </button>
                </div>
                <div className="flex flex-wrap gap-1.5 overflow-hidden">
                  {wh.events.map(event => (
                    <span key={event} className="text-xs bg-purple-50 text-purple-700 px-2 py-0.5 rounded-full break-words">{event}</span>
                  ))}
                </div>
                <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 mt-2 text-xs text-muted-foreground overflow-hidden">
                  {wh.lastTriggeredAt && (
                    <span className="break-words">Last triggered: {new Date(wh.lastTriggeredAt).toLocaleDateString()}</span>
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
      <div className="bg-white rounded-xl p-4 sm:p-6 border border-gray-200 overflow-hidden">
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
          If a signing secret is configured, requests include an <code className="bg-gray-100 px-1 rounded">X-Rocketeerio-Signature</code> header with an HMAC-SHA256 signature.
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
