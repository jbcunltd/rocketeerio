import { useAuth } from "@/_core/hooks/useAuth";
import DashboardLayout from "@/components/DashboardLayout";
import { AiModeToggle, AiModeBadge } from "@/components/AiModeToggle";
import type { AiMode } from "@/components/AiModeToggle";
import { TesterManager } from "@/components/TesterManager";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectSeparator, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { trpc } from "@/lib/trpc";
import { User, Bell, CreditCard, Facebook, Loader2, Save, Trash2, CheckCircle, AlertCircle, ExternalLink, Bot, Instagram, Headphones } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

function ProfileTab() {
  const { user } = useAuth();
  const [name, setName] = useState(user?.name || "");
  const [email, setEmail] = useState(user?.email || "");
  const [phone, setPhone] = useState("");
  const [company, setCompany] = useState("");
  const updateProfile = trpc.user.updateProfile.useMutation();

  const handleSave = async () => {
    try {
      await updateProfile.mutateAsync({ name, email, phone, company });
      toast.success("Profile updated");
    } catch { toast.error("Failed to update profile"); }
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-bold mb-1">Profile Information</h3>
        <p className="text-sm text-muted-foreground">Update your personal details.</p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div><Label>Full Name</Label><Input value={name} onChange={e => setName(e.target.value)} className="mt-1.5" /></div>
        <div><Label>Email</Label><Input value={email} onChange={e => setEmail(e.target.value)} className="mt-1.5" /></div>
        <div><Label>Phone</Label><Input value={phone} onChange={e => setPhone(e.target.value)} placeholder="+1 (555) 000-0000" className="mt-1.5" /></div>
        <div><Label>Company</Label><Input value={company} onChange={e => setCompany(e.target.value)} placeholder="Your business name" className="mt-1.5" /></div>
      </div>
      <Button onClick={handleSave} disabled={updateProfile.isPending} className="bg-messenger hover:bg-messenger-dark">
        {updateProfile.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
        Save Changes
      </Button>
    </div>
  );
}

function NotificationsTab() {
  const { data: prefs, isLoading } = trpc.notifications.get.useQuery();
  const updateNotifs = trpc.notifications.update.useMutation();
  const utils = trpc.useUtils();

  const [smsEnabled, setSmsEnabled] = useState(false);
  const [emailEnabled, setEmailEnabled] = useState(true);
  const [hotLeadSms, setHotLeadSms] = useState(true);
  const [hotLeadEmail, setHotLeadEmail] = useState(true);
  const [warmLeadEmail, setWarmLeadEmail] = useState(false);
  const [dailyDigest, setDailyDigest] = useState(true);
  const [smsPhone, setSmsPhone] = useState("");
  const [notifEmail, setNotifEmail] = useState("");

  useEffect(() => {
    if (prefs) {
      setSmsEnabled(prefs.smsEnabled);
      setEmailEnabled(prefs.emailEnabled);
      setHotLeadSms(prefs.hotLeadSms);
      setHotLeadEmail(prefs.hotLeadEmail);
      setWarmLeadEmail(prefs.warmLeadEmail);
      setDailyDigest(prefs.dailyDigest);
      setSmsPhone(prefs.smsPhone || "");
      setNotifEmail(prefs.notificationEmail || "");
    }
  }, [prefs]);

  const handleSave = async () => {
    try {
      await updateNotifs.mutateAsync({ smsEnabled, emailEnabled, hotLeadSms, hotLeadEmail, warmLeadEmail, dailyDigest, smsPhone, notificationEmail: notifEmail });
      utils.notifications.get.invalidate();
      toast.success("Notification preferences saved");
    } catch { toast.error("Failed to save preferences"); }
  };

  if (isLoading) return <div className="flex items-center justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-messenger" /></div>;

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-bold mb-1">Notification Preferences</h3>
        <p className="text-sm text-muted-foreground">Configure how and when you receive alerts about leads.</p>
      </div>
      <div className="space-y-4">
        <div className="flex items-center justify-between p-4 bg-white rounded-lg border">
          <div><p className="font-medium">SMS Notifications</p><p className="text-sm text-muted-foreground">Receive text messages for alerts</p></div>
          <Switch checked={smsEnabled} onCheckedChange={setSmsEnabled} />
        </div>
        {smsEnabled && (
          <div className="ml-4"><Label>Phone Number</Label><Input value={smsPhone} onChange={e => setSmsPhone(e.target.value)} placeholder="+1 (555) 000-0000" className="mt-1.5 max-w-xs" /></div>
        )}
        <div className="flex items-center justify-between p-4 bg-white rounded-lg border">
          <div><p className="font-medium">Email Notifications</p><p className="text-sm text-muted-foreground">Receive email alerts</p></div>
          <Switch checked={emailEnabled} onCheckedChange={setEmailEnabled} />
        </div>
        {emailEnabled && (
          <div className="ml-4"><Label>Email Address</Label><Input value={notifEmail} onChange={e => setNotifEmail(e.target.value)} placeholder="you@example.com" className="mt-1.5 max-w-xs" /></div>
        )}
        <div className="border-t pt-4 mt-4">
          <p className="font-medium mb-3">Alert Types</p>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 rounded-lg border">
              <div><p className="text-sm font-medium">Hot Lead SMS Alert</p><p className="text-xs text-muted-foreground">SMS when score reaches 80+</p></div>
              <Switch checked={hotLeadSms} onCheckedChange={setHotLeadSms} />
            </div>
            <div className="flex items-center justify-between p-3 rounded-lg border">
              <div><p className="text-sm font-medium">Hot Lead Email Alert</p><p className="text-xs text-muted-foreground">Email when score reaches 80+</p></div>
              <Switch checked={hotLeadEmail} onCheckedChange={setHotLeadEmail} />
            </div>
            <div className="flex items-center justify-between p-3 rounded-lg border">
              <div><p className="text-sm font-medium">Warm Lead Email</p><p className="text-xs text-muted-foreground">Email for leads scoring 40-79</p></div>
              <Switch checked={warmLeadEmail} onCheckedChange={setWarmLeadEmail} />
            </div>
            <div className="flex items-center justify-between p-3 rounded-lg border">
              <div><p className="text-sm font-medium">Daily Digest</p><p className="text-xs text-muted-foreground">Summary of all leads each morning</p></div>
              <Switch checked={dailyDigest} onCheckedChange={setDailyDigest} />
            </div>
          </div>
        </div>
      </div>
      <Button onClick={handleSave} disabled={updateNotifs.isPending} className="bg-messenger hover:bg-messenger-dark">
        {updateNotifs.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
        Save Preferences
      </Button>
    </div>
  );
}

function PagesTab() {
  const { data: pages, isLoading } = trpc.pages.list.useQuery();
  const deletePage = trpc.pages.delete.useMutation();
  const utils = trpc.useUtils();
  const [connecting, setConnecting] = useState(false);
  const [expandedPageId, setExpandedPageId] = useState<number | null>(null);

  // Check URL params for success/error from OAuth callback
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("success") === "connected") {
      toast.success("Facebook Page connected successfully!");
      utils.pages.list.invalidate();
      // Clean URL
      window.history.replaceState({}, "", "/settings?tab=pages");
    }
    const error = params.get("error");
    if (error) {
      const errorMessages: Record<string, string> = {
        not_authenticated: "Please log in first",
        oauth_failed: "Facebook authentication failed",
        missing_code: "Authorization was cancelled",
        token_exchange_failed: "Failed to get access token from Facebook",
        pages_fetch_failed: "Failed to fetch your Facebook pages",
        no_pages: "No Facebook Pages found on your account. You need to be an admin of at least one Page.",
        callback_failed: "Something went wrong during connection",
      };
      toast.error(errorMessages[error] || "Connection failed");
      window.history.replaceState({}, "", "/settings?tab=pages");
    }
  }, []);

  const handleConnect = async () => {
    setConnecting(true);
    try {
      // Redirect to our Facebook OAuth endpoint
      window.location.href = "/api/auth/facebook";
    } catch {
      toast.error("Failed to start Facebook connection");
      setConnecting(false);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await deletePage.mutateAsync({ id });
      utils.pages.list.invalidate();
      toast.success("Page disconnected");
    } catch { toast.error("Failed to disconnect page"); }
  };

  if (isLoading) return <div className="flex items-center justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-messenger" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-bold mb-1">Connected Facebook Pages</h3>
          <p className="text-sm text-muted-foreground">Connect your Facebook Pages to enable AI-powered Messenger responses.</p>
        </div>
        <Button onClick={handleConnect} disabled={connecting} className="bg-[#1877F2] hover:bg-[#166FE5] text-white">
          {connecting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Facebook className="w-4 h-4 mr-2" />}
          Connect a Page
        </Button>
      </div>

      {/* Setup Guide */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h4 className="font-semibold text-blue-900 mb-2 flex items-center gap-2">
          <AlertCircle className="w-4 h-4" /> Setup Requirements
        </h4>
        <ul className="text-sm text-blue-800 space-y-1.5">
          <li>1. You must be an admin of the Facebook Page you want to connect</li>
          <li>2. Grant <strong>pages_messaging</strong>, <strong>pages_manage_metadata</strong>, and <strong>pages_read_engagement</strong> permissions</li>
          <li>3. After connecting, the AI agent will automatically respond to new Messenger conversations</li>
          <li>4. Make sure your Knowledge Base has business info so the AI gives accurate answers</li>
        </ul>
      </div>

      {!pages?.length ? (
        <div className="text-center py-12 bg-white rounded-lg border">
          <Facebook className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
          <p className="text-muted-foreground mb-2">No pages connected yet.</p>
          <p className="text-sm text-muted-foreground">Click "Connect a Page" to link your Facebook Page and start capturing leads.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {pages.map(page => {
            const isExpanded = expandedPageId === page.id;
            return (
              <div key={page.id} className="bg-white rounded-xl border overflow-hidden">
                {/* Page Header */}
                <div className="flex items-center justify-between p-4">
                  <div className="flex items-center gap-3">
                    {page.avatarUrl ? (
                      <img src={page.avatarUrl} alt={page.pageName} className="w-10 h-10 rounded-lg object-cover" />
                    ) : (
                      <div className="w-10 h-10 bg-messenger-light rounded-lg flex items-center justify-center">
                        <Facebook className="w-5 h-5 text-messenger" />
                      </div>
                    )}
                    <div>
                      <p className="font-medium">{page.pageName}</p>
                      <div className="flex items-center gap-2">
                        <p className="text-xs text-muted-foreground">{page.category || "Business"}</p>
                        {page.followerCount ? (
                          <p className="text-xs text-muted-foreground">{page.followerCount.toLocaleString()} followers</p>
                        ) : null}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <AiModeToggle
                      pageId={page.id}
                      currentMode={(page.aiMode as AiMode) || "testing"}
                      compact
                    />
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setExpandedPageId(isExpanded ? null : page.id)}
                      className="text-xs"
                    >
                      {isExpanded ? "Hide Testers" : "Manage Testers"}
                    </Button>
                    <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive" onClick={() => handleDelete(page.id)}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                {/* Tester Management (Expandable) */}
                {isExpanded && (
                  <div className="border-t bg-gray-50/50 p-4">
                    <TesterManager pageId={page.id} />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Webhook Info */}
      {pages && pages.length > 0 && (
        <div className="bg-gray-50 border rounded-lg p-4">
          <h4 className="font-semibold text-sm mb-2">Webhook Configuration</h4>
          <p className="text-xs text-muted-foreground mb-2">These are automatically configured when you connect a page. For reference:</p>
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-muted-foreground w-24">Callback URL:</span>
              <code className="text-xs bg-white px-2 py-1 rounded border font-mono">https://rocketeerio.vercel.app/api/webhook/messenger</code>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-muted-foreground w-24">Verify Token:</span>
              <code className="text-xs bg-white px-2 py-1 rounded border font-mono">rocketeer_verify_token_2024</code>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function AiPersonalityTab() {
  const { data: pages, isLoading: pagesLoading } = trpc.pages.list.useQuery();
  const [selectedPageId, setSelectedPageId] = useState<number | null>(null);
  const utils = trpc.useUtils();

  // Auto-select first page
  useEffect(() => {
    if (pages && pages.length > 0 && selectedPageId === null) {
      setSelectedPageId(pages[0].id);
    }
  }, [pages, selectedPageId]);

  if (pagesLoading) return <div className="flex items-center justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-messenger" /></div>;

  if (!pages || pages.length === 0) {
    return (
      <div className="space-y-6">
        <div>
          <h3 className="text-lg font-bold mb-1">AI Personality</h3>
          <p className="text-sm text-muted-foreground">Configure how your AI sales agent communicates.</p>
        </div>
        <div className="text-center py-12 bg-white rounded-lg border">
          <Bot className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
          <p className="text-muted-foreground mb-2">No pages connected yet.</p>
          <p className="text-sm text-muted-foreground">Connect a Facebook Page first, then configure your AI agent's personality here.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-bold mb-1">AI Personality</h3>
        <p className="text-sm text-muted-foreground">Configure how your AI sales agent communicates for each connected page.</p>
      </div>

      {/* Page Selector */}
      {pages.length > 1 && (
        <div className="flex gap-2 flex-wrap">
          {pages.map(page => (
            <button
              key={page.id}
              onClick={() => setSelectedPageId(page.id)}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors border ${
                selectedPageId === page.id
                  ? "bg-messenger text-white border-messenger"
                  : "bg-white text-foreground border-border hover:bg-gray-50"
              }`}
            >
              {page.avatarUrl ? (
                <img src={page.avatarUrl} alt={page.pageName} className="w-5 h-5 rounded" />
              ) : (
                <Facebook className="w-4 h-4" />
              )}
              {page.pageName}
            </button>
          ))}
        </div>
      )}

      {selectedPageId && <AiSettingsForm pageId={selectedPageId} key={selectedPageId} />}
    </div>
  );
}

function AiSettingsForm({ pageId }: { pageId: number }) {
  const { data: settings, isLoading } = trpc.aiSettings.get.useQuery({ pageId });
  const updateSettings = trpc.aiSettings.update.useMutation();
  const utils = trpc.useUtils();

  const [agentName, setAgentName] = useState("");
  const [tone, setTone] = useState("casual_taglish");
  const [responseLength, setResponseLength] = useState("short");
  const [useEmojis, setUseEmojis] = useState(true);
  const [primaryGoal, setPrimaryGoal] = useState("site_visit");
  const [customGoal, setCustomGoal] = useState("");
  const [customInstructions, setCustomInstructions] = useState("");
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    if (settings) {
      setAgentName(settings.agentName || "");
      setTone(settings.tone);
      setResponseLength(settings.responseLength);
      setUseEmojis(settings.useEmojis);
      setPrimaryGoal(settings.primaryGoal);
      setCustomGoal(settings.customGoal || "");
      setCustomInstructions(settings.customInstructions || "");
      setInitialized(true);
    } else if (settings === null && !isLoading) {
      // No settings yet — use defaults
      setAgentName("");
      setTone("casual_taglish");
      setResponseLength("short");
      setUseEmojis(true);
      setPrimaryGoal("site_visit");
      setCustomGoal("");
      setCustomInstructions("");
      setInitialized(true);
    }
  }, [settings, isLoading]);

  const handleSave = async () => {
    try {
      await updateSettings.mutateAsync({
        pageId,
        agentName: agentName.trim() || undefined,
        tone: tone as any,
        responseLength: responseLength as any,
        useEmojis,
        primaryGoal: primaryGoal as any,
        customGoal: customGoal.trim() || undefined,
        customInstructions: customInstructions.trim() || undefined,
      });
      utils.aiSettings.get.invalidate({ pageId });
      toast.success("AI personality settings saved");
    } catch {
      toast.error("Failed to save AI settings");
    }
  };

  if (isLoading || !initialized) {
    return <div className="flex items-center justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-messenger" /></div>;
  }

  return (
    <div className="space-y-5">
      {/* Agent Name */}
      <div className="bg-white rounded-lg border p-5">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center">
            <Bot className="w-4 h-4 text-messenger" />
          </div>
          <div>
            <p className="font-bold text-sm">Agent Name</p>
            <p className="text-xs text-muted-foreground">The name your AI uses when chatting (e.g. "Kat" instead of generic agent)</p>
          </div>
        </div>
        <Input
          value={agentName}
          onChange={e => setAgentName(e.target.value)}
          placeholder="Leave empty for natural chat (no name)"
          className="max-w-sm"
        />
      </div>

      {/* Tone & Response Length */}
      <div className="grid gap-5 sm:grid-cols-2">
        <div className="bg-white rounded-lg border p-5">
          <Label className="font-bold text-sm">Tone</Label>
          <p className="text-xs text-muted-foreground mb-2">How the AI communicates with leads</p>
          <Select value={tone} onValueChange={setTone}>
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectLabel className="text-xs font-semibold text-muted-foreground uppercase tracking-wide px-2 py-1">Filipino</SelectLabel>
                <SelectItem value="casual_taglish">Casual Taglish</SelectItem>
                <SelectItem value="pure_tagalog">Pure Tagalog</SelectItem>
                <SelectItem value="professional_filipino">Professional Filipino</SelectItem>
              </SelectGroup>
              <SelectSeparator />
              <SelectGroup>
                <SelectLabel className="text-xs font-semibold text-muted-foreground uppercase tracking-wide px-2 py-1">English</SelectLabel>
                <SelectItem value="casual_english">Casual English</SelectItem>
                <SelectItem value="formal_english">Formal English</SelectItem>
                <SelectItem value="professional_english">Professional English</SelectItem>
              </SelectGroup>
            </SelectContent>
          </Select>
        </div>

        <div className="bg-white rounded-lg border p-5">
          <Label className="font-bold text-sm">Response Length</Label>
          <p className="text-xs text-muted-foreground mb-2">How long the AI's messages should be</p>
          <Select value={responseLength} onValueChange={setResponseLength}>
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="short">Short & Punchy</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="detailed">Detailed</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Emojis & Primary Goal */}
      <div className="grid gap-5 sm:grid-cols-2">
        <div className="bg-white rounded-lg border p-5">
          <div className="flex items-center justify-between">
            <div>
              <Label className="font-bold text-sm">Use Emojis</Label>
              <p className="text-xs text-muted-foreground mt-0.5">Allow the AI to use emojis in messages</p>
            </div>
            <Switch checked={useEmojis} onCheckedChange={setUseEmojis} />
          </div>
        </div>

        <div className="bg-white rounded-lg border p-5">
          <Label className="font-bold text-sm">Primary Goal</Label>
          <p className="text-xs text-muted-foreground mb-2">What the AI should push conversations toward</p>
          <Select value={primaryGoal} onValueChange={setPrimaryGoal}>
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="site_visit">Push toward Site Visit</SelectItem>
              <SelectItem value="booking">Push toward Booking</SelectItem>
              <SelectItem value="quote_request">Push toward Quote Request</SelectItem>
              <SelectItem value="general_support">General Support</SelectItem>
              <SelectItem value="order_purchase">Push toward Order / Purchase</SelectItem>
              <SelectItem value="reservation">Push toward Reservation</SelectItem>
              <SelectItem value="appointment">Push toward Appointment</SelectItem>
              <SelectItem value="collect_lead_info">Collect Lead Info</SelectItem>
              <SelectItem value="signup_registration">Push toward Sign-Up / Registration</SelectItem>
              <SelectItem value="custom_goal">Custom Goal</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Custom Goal (conditionally shown) */}
      {primaryGoal === "custom_goal" && (
        <div className="bg-white rounded-lg border p-5 border-blue-200 bg-blue-50">
          <Label className="font-bold text-sm">Custom Goal Description</Label>
          <p className="text-xs text-muted-foreground mt-0.5 mb-2">
            Describe what you want the AI to push conversations toward
          </p>
          <Textarea
            value={customGoal}
            onChange={e => setCustomGoal(e.target.value)}
            placeholder="e.g., 'Push customers to schedule a free consultation call'"
            className="min-h-[100px] resize-y"
          />
        </div>
      )}

      {/* Custom Instructions */}
      <div className="bg-white rounded-lg border p-5">
        <Label className="font-bold text-sm">Custom Instructions</Label>
        <p className="text-xs text-muted-foreground mt-0.5 mb-2">
          Free-form instructions for the AI (e.g. "never discount, always reframe toward value", "always end with a question")
        </p>
        <Textarea
          value={customInstructions}
          onChange={e => setCustomInstructions(e.target.value)}
          placeholder="Add any special instructions for your AI agent..."
          className="min-h-[120px] resize-y"
        />
      </div>

      {/* Save Button */}
      <Button onClick={handleSave} disabled={updateSettings.isPending} className="bg-messenger hover:bg-messenger-dark">
        {updateSettings.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
        Save AI Settings
      </Button>
    </div>
  );
}

function InstagramTab() {
  const { data: igAccounts, isLoading } = trpc.instagram.list.useQuery();
  const deleteAccount = trpc.instagram.delete.useMutation();
  const updateMode = trpc.instagram.updateMode.useMutation();
  const utils = trpc.useUtils();
  const [connecting, setConnecting] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("tab") === "instagram") {
      if (params.get("success") === "connected") {
        toast.success("Instagram account connected successfully!");
        utils.instagram.list.invalidate();
        window.history.replaceState({}, "", "/settings?tab=instagram");
      }
      const error = params.get("error");
      if (error) {
        const errorMessages: Record<string, string> = {
          not_authenticated: "Please log in first",
          oauth_failed: "Instagram authentication failed",
          missing_code: "Authorization was cancelled",
          token_exchange_failed: "Failed to get access token",
          pages_fetch_failed: "Failed to fetch your accounts",
          no_ig_accounts: "No Instagram Business accounts found. Make sure your Instagram is connected to a Facebook Page.",
          callback_failed: "Something went wrong during connection",
        };
        toast.error(errorMessages[error] || "Connection failed");
        window.history.replaceState({}, "", "/settings?tab=instagram");
      }
    }
  }, []);

  const handleConnect = async () => {
    setConnecting(true);
    try {
      window.location.href = "/api/auth/instagram";
    } catch {
      toast.error("Failed to start Instagram connection");
      setConnecting(false);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await deleteAccount.mutateAsync({ id });
      utils.instagram.list.invalidate();
      toast.success("Instagram account disconnected");
    } catch { toast.error("Failed to disconnect account"); }
  };

  const handleModeChange = async (id: number, mode: "paused" | "testing" | "live") => {
    try {
      await updateMode.mutateAsync({ id, aiMode: mode });
      utils.instagram.list.invalidate();
      toast.success(`AI mode updated to ${mode}`);
    } catch { toast.error("Failed to update AI mode"); }
  };

  if (isLoading) return <div className="flex items-center justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-messenger" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-bold mb-1">Connected Instagram Accounts</h3>
          <p className="text-sm text-muted-foreground">Connect your Instagram Business accounts to enable AI-powered DM responses.</p>
        </div>
        <Button onClick={handleConnect} disabled={connecting} className="bg-gradient-to-r from-purple-600 to-pink-500 hover:from-purple-700 hover:to-pink-600 text-white">
          {connecting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Instagram className="w-4 h-4 mr-2" />}
          Connect Instagram
        </Button>
      </div>

      <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
        <h4 className="font-semibold text-purple-900 mb-2 flex items-center gap-2">
          <AlertCircle className="w-4 h-4" /> Setup Requirements
        </h4>
        <ul className="text-sm text-purple-800 space-y-1.5">
          <li>1. Your Instagram account must be a <strong>Business</strong> or <strong>Creator</strong> account</li>
          <li>2. It must be linked to a <strong>Facebook Page</strong></li>
          <li>3. Grant <strong>instagram_basic</strong> and <strong>instagram_manage_messages</strong> permissions</li>
          <li>4. After connecting, the AI agent will automatically respond to new Instagram DMs</li>
          <li>5. The same Knowledge Base is used for both Messenger and Instagram responses</li>
        </ul>
      </div>

      {!igAccounts?.length ? (
        <div className="text-center py-12 bg-white rounded-lg border">
          <Instagram className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
          <p className="text-muted-foreground mb-2">No Instagram accounts connected yet.</p>
          <p className="text-sm text-muted-foreground">Click \"Connect Instagram\" to link your Instagram Business account.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {igAccounts.map(account => (
            <div key={account.id} className="bg-white rounded-xl border overflow-hidden">
              <div className="flex items-center justify-between p-4">
                <div className="flex items-center gap-3">
                  {account.profilePicUrl ? (
                    <img src={account.profilePicUrl} alt={account.igUsername} className="w-10 h-10 rounded-lg object-cover" />
                  ) : (
                    <div className="w-10 h-10 bg-gradient-to-br from-purple-100 to-pink-100 rounded-lg flex items-center justify-center">
                      <Instagram className="w-5 h-5 text-purple-600" />
                    </div>
                  )}
                  <div>
                    <p className="font-medium">@{account.igUsername}</p>
                    <div className="flex items-center gap-2">
                      {account.igName && <p className="text-xs text-muted-foreground">{account.igName}</p>}
                      {account.followerCount ? (
                        <p className="text-xs text-muted-foreground">{account.followerCount.toLocaleString()} followers</p>
                      ) : null}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <select
                    value={account.aiMode}
                    onChange={(e) => handleModeChange(account.id, e.target.value as any)}
                    className="text-xs border rounded-md px-2 py-1.5 bg-white"
                  >
                    <option value="paused">Paused</option>
                    <option value="testing">Testing</option>
                    <option value="live">Live</option>
                  </select>
                  <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive" onClick={() => handleDelete(account.id)}>
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {igAccounts && igAccounts.length > 0 && (
        <div className="bg-gray-50 border rounded-lg p-4">
          <h4 className="font-semibold text-sm mb-2">Webhook Configuration</h4>
          <p className="text-xs text-muted-foreground mb-2">These are automatically configured when you connect an account. For reference:</p>
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-muted-foreground w-24">Callback URL:</span>
              <code className="text-xs bg-white px-2 py-1 rounded border font-mono">https://rocketeerio.vercel.app/api/webhook/instagram</code>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-muted-foreground w-24">Verify Token:</span>
              <code className="text-xs bg-white px-2 py-1 rounded border font-mono">rocketeer_verify_token_2024</code>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function BillingTab() {
  const { user } = useAuth();
  const plans = [
    { key: "starter", name: "Starter", price: "$49/mo", desc: "1 Page, 500 conversations" },
    { key: "growth", name: "Growth", price: "$149/mo", desc: "5 Pages, unlimited conversations" },
    { key: "scale", name: "Scale", price: "$299/mo", desc: "Unlimited pages & conversations" },
  ];
  const currentPlan = (user as any)?.plan || "starter";

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-bold mb-1">Billing & Plan</h3>
        <p className="text-sm text-muted-foreground">Manage your subscription and billing details.</p>
      </div>
      <div className="grid gap-4 sm:grid-cols-3">
        {plans.map(plan => (
          <div key={plan.key} className={`p-4 rounded-lg border-2 transition-colors ${currentPlan === plan.key ? "border-messenger bg-messenger-light/30" : "border-border bg-white"}`}>
            <p className="font-bold">{plan.name}</p>
            <p className="text-2xl font-extrabold text-foreground mt-1">{plan.price}</p>
            <p className="text-xs text-muted-foreground mt-1">{plan.desc}</p>
            {currentPlan === plan.key ? (
              <div className="mt-3 text-xs font-bold text-messenger">Current Plan</div>
            ) : (
              <Button variant="outline" size="sm" className="mt-3 w-full" onClick={() => toast.info("Billing integration coming soon")}>
                {currentPlan === "scale" ? "Downgrade" : "Upgrade"}
              </Button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function HandoffTab() {
  const settingsQuery = trpc.handoffs.getSettings.useQuery();
  const updateMutation = trpc.handoffs.updateSettings.useMutation({
    onSuccess: () => { settingsQuery.refetch(); toast.success("Handoff settings saved"); },
    onError: () => toast.error("Failed to save handoff settings"),
  });

  const [autoEnabled, setAutoEnabled] = useState(true);
  const [notifyOnHandoff, setNotifyOnHandoff] = useState(true);
  const [sentimentThreshold, setSentimentThreshold] = useState(0.3);
  const [keywords, setKeywords] = useState("speak to a human\ntalk to someone\nreal person\nhuman agent\nmanager");

  useEffect(() => {
    if (settingsQuery.data) {
      const s = settingsQuery.data;
      setAutoEnabled(s.autoHandoffEnabled ?? true);
      setNotifyOnHandoff(s.notifyOnHandoff ?? true);
      setSentimentThreshold(parseFloat(s.sentimentThreshold as string) || 0.3);
      const kw = (s.handoffKeywords as string[]) || ["speak to a human", "talk to someone", "real person"];
      setKeywords(kw.join("\n"));
    }
  }, [settingsQuery.data]);

  const handleSave = () => {
    updateMutation.mutate({
      autoHandoffEnabled: autoEnabled,
      notifyOnHandoff,
      sentimentThreshold,
      handoffKeywords: keywords.split("\n").map(k => k.trim()).filter(Boolean),
    });
  };

  if (settingsQuery.isLoading) {
    return <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin" /></div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-bold mb-1">Live Agent Handoff</h3>
        <p className="text-sm text-muted-foreground">Configure when the AI should hand conversations to a human agent.</p>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
          <div>
            <p className="font-medium">Auto-Handoff</p>
            <p className="text-sm text-muted-foreground">Automatically detect when a human agent should take over</p>
          </div>
          <Switch checked={autoEnabled} onCheckedChange={setAutoEnabled} />
        </div>

        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
          <div>
            <p className="font-medium">Notify on Handoff</p>
            <p className="text-sm text-muted-foreground">Send a notification when a handoff occurs</p>
          </div>
          <Switch checked={notifyOnHandoff} onCheckedChange={setNotifyOnHandoff} />
        </div>

        <div>
          <Label>Sentiment Threshold</Label>
          <p className="text-xs text-muted-foreground mb-2">Lower values trigger handoff more easily (0.0 = very sensitive, 1.0 = never)</p>
          <Input
            type="number"
            min={0}
            max={1}
            step={0.1}
            value={sentimentThreshold}
            onChange={e => setSentimentThreshold(parseFloat(e.target.value) || 0.3)}
            className="w-32"
          />
        </div>

        <div>
          <Label>Handoff Keywords</Label>
          <p className="text-xs text-muted-foreground mb-2">One keyword/phrase per line. If a lead says any of these, handoff is triggered.</p>
          <Textarea
            value={keywords}
            onChange={e => setKeywords(e.target.value)}
            rows={5}
            placeholder={"speak to a human\ntalk to someone\nreal person"}
          />
        </div>
      </div>

      <Button onClick={handleSave} disabled={updateMutation.isPending} className="bg-messenger hover:bg-messenger-dark">
        {updateMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
        Save Handoff Settings
      </Button>
    </div>
  );
}

export default function Settings() {
  // Check URL for tab param
  const params = new URLSearchParams(window.location.search);
  const defaultTab = params.get("tab") || "profile";

  return (
    <DashboardLayout>
      <div className="max-w-3xl">
        <div className="mb-6">
          <h1 className="text-2xl font-bold">Settings</h1>
          <p className="text-muted-foreground">Manage your account, notifications, and integrations.</p>
        </div>
        <Tabs defaultValue={defaultTab}>
          <TabsList className="mb-6">
            <TabsTrigger value="profile"><User className="w-4 h-4 mr-1.5" />Profile</TabsTrigger>
            <TabsTrigger value="notifications"><Bell className="w-4 h-4 mr-1.5" />Notifications</TabsTrigger>
            <TabsTrigger value="pages"><Facebook className="w-4 h-4 mr-1.5" />Pages</TabsTrigger>
            <TabsTrigger value="instagram"><Instagram className="w-4 h-4 mr-1.5" />Instagram</TabsTrigger>
            <TabsTrigger value="ai-personality"><Bot className="w-4 h-4 mr-1.5" />AI Personality</TabsTrigger>
            <TabsTrigger value="billing"><CreditCard className="w-4 h-4 mr-1.5" />Billing</TabsTrigger>
            <TabsTrigger value="handoff"><Headphones className="w-4 h-4 mr-1.5" />Handoff</TabsTrigger>
          </TabsList>
          <TabsContent value="profile"><ProfileTab /></TabsContent>
          <TabsContent value="notifications"><NotificationsTab /></TabsContent>
          <TabsContent value="pages"><PagesTab /></TabsContent>
          <TabsContent value="instagram"><InstagramTab /></TabsContent>
          <TabsContent value="ai-personality"><AiPersonalityTab /></TabsContent>
          <TabsContent value="billing"><BillingTab /></TabsContent>
          <TabsContent value="handoff"><HandoffTab /></TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
