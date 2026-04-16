import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { trpc } from "@/lib/trpc";
import { useActivePage } from "@/contexts/ActivePageContext";
import {
  User, Bell, CreditCard, Facebook, Loader2, Save, Trash2, CheckCircle,
  AlertCircle, ExternalLink, Bot, Instagram, Headphones, MessageSquare,
  Smartphone, Mail, Radio, BellRing, CheckCircle2, Hash, Zap, Globe,
  Settings2, Lock, MessageCircle, Clock, RefreshCw, Crown, ArrowUpCircle
} from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useAuth } from "@/_core/hooks/useAuth";

// ═══════════════════════════════════════════════════════════════════════
// ACCOUNT-LEVEL TABS (same for all pages)
// ═══════════════════════════════════════════════════════════════════════

function NotificationsTab() {
  const { data: settings } = trpc.account.getNotificationSettings.useQuery();
  const updateNotifs = trpc.account.updateNotificationSettings.useMutation();
  const [hotLeadEmail, setHotLeadEmail] = useState(false);
  const [warmLeadEmail, setWarmLeadEmail] = useState(false);
  const [dailyDigest, setDailyDigest] = useState(false);

  useEffect(() => {
    if (settings) {
      setHotLeadEmail(settings.hotLeadEmail);
      setWarmLeadEmail(settings.warmLeadEmail);
      setDailyDigest(settings.dailyDigest);
    }
  }, [settings]);

  const handleSave = async () => {
    try {
      await updateNotifs.mutateAsync({
        hotLeadEmail,
        warmLeadEmail,
        dailyDigest,
      });
      toast.success("Notification preferences saved!");
    } catch {
      toast.error("Failed to save preferences");
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-bold mb-1">Notifications</h3>
        <p className="text-sm text-muted-foreground">Manage when you receive email notifications.</p>
      </div>
      <div className="space-y-3">
        <div className="bg-white rounded-lg border p-4">
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 rounded-lg border">
              <div><p className="text-sm font-medium">Hot Lead Email</p><p className="text-xs text-muted-foreground">Email for leads scoring 80-100</p></div>
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

function ConnectedAccountsTab() {
  const { data: pages, isLoading } = trpc.pages.list.useQuery();
  const [connecting, setConnecting] = useState(false);
  const [showDisconnectDialog, setShowDisconnectDialog] = useState(false);
  const disconnectFb = trpc.pages.disconnectFacebook.useMutation();
  const utils = trpc.useUtils();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("success") === "connected") {
      toast.success("Facebook account connected successfully!");
      window.history.replaceState({}, "", "/settings?tab=accounts");
    }
    const error = params.get("error");
    if (error) {
      const errorMessages: Record<string, string> = {
        not_authenticated: "Please log in first",
        oauth_failed: "Facebook authentication failed",
        missing_code: "Authorization was cancelled",
        token_exchange_failed: "Failed to get access token from Facebook",
        pages_fetch_failed: "Failed to fetch your Facebook pages",
        no_pages: "No Facebook Pages found on your account.",
        callback_failed: "Something went wrong during connection",
      };
      toast.error(errorMessages[error] || "Connection failed");
      window.history.replaceState({}, "", "/settings?tab=accounts");
    }
  }, []);

  const handleConnect = () => {
    setConnecting(true);
    window.location.href = "/api/auth/facebook";
  };

  const handleReconnect = () => {
    setConnecting(true);
    window.location.href = "/api/auth/facebook";
  };

  const handleDisconnect = async () => {
    try {
      await disconnectFb.mutateAsync();
      utils.pages.list.invalidate();
      toast.success("Facebook disconnected. Your page data has been preserved.");
      setShowDisconnectDialog(false);
    } catch {
      toast.error("Failed to disconnect Facebook");
    }
  };

  if (isLoading) return <div className="flex items-center justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-messenger" /></div>;

  const hasFacebookConnected = pages && pages.length > 0;

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-bold mb-1">Connected Accounts</h3>
        <p className="text-sm text-muted-foreground">Manage your connected Facebook and Instagram accounts.</p>
      </div>

      {/* Facebook Account */}
      <div className="bg-white rounded-xl border overflow-hidden">
        {/* Top row: Icon, name, pages count, Connected badge */}
        <div className="flex items-center justify-between p-4 flex-wrap gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 bg-[#1877F2]/10 rounded-lg flex items-center justify-center shrink-0">
              <Facebook className="w-5 h-5 text-[#1877F2]" />
            </div>
            <div className="min-w-0">
              <p className="font-medium">Facebook</p>
              <p className="text-xs text-muted-foreground">
                {hasFacebookConnected
                  ? `${pages.length} page${pages.length > 1 ? "s" : ""} connected`
                  : "Not connected"}
              </p>
            </div>
          </div>
          {hasFacebookConnected && (
            <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded inline-flex items-center gap-1 shrink-0">
              <CheckCircle className="w-3 h-3" /> Connected
            </span>
          )}
        </div>

        {/* Bottom row (mobile): Action buttons */}
        {hasFacebookConnected && (
          <div className="flex items-center gap-2 px-4 pb-4 flex-wrap">
            <Button onClick={handleReconnect} disabled={connecting} variant="outline" size="sm" className="gap-1.5">
              {connecting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
              Reconnect
            </Button>
            <button
              onClick={() => setShowDisconnectDialog(true)}
              className="text-xs text-muted-foreground hover:text-destructive transition-colors px-3 py-2 rounded hover:bg-gray-100"
            >
              Disconnect
            </button>
          </div>
        )}

        {/* Connect button (not connected) */}
        {!hasFacebookConnected && (
          <div className="px-4 pb-4">
            <Button onClick={handleConnect} disabled={connecting} size="sm" className="w-full bg-[#1877F2] hover:bg-[#166FE5] text-white">
              {connecting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Facebook className="w-4 h-4 mr-2" />}
              Connect Facebook
            </Button>
          </div>
        )}
      </div>

      {hasFacebookConnected && (
        <div className="border-t px-4 py-3 bg-gray-50/50 rounded-lg">
          <p className="text-xs text-muted-foreground">
            Click <strong>Reconnect</strong> to re-authorize and pick up new pages.
            To connect Instagram for a specific page, go to that page's <strong>Channels</strong> settings.
          </p>
        </div>
      )}

      {/* Disconnect Confirmation Dialog */}
      {showDisconnectDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="fixed inset-0 bg-black/50" onClick={() => setShowDisconnectDialog(false)} />
          <div className="relative bg-white rounded-xl border shadow-lg p-6 max-w-md w-full mx-4 z-10">
            <h3 className="text-lg font-bold mb-2">Disconnect Facebook?</h3>
            <p className="text-sm text-muted-foreground mb-1">
              This will remove your Facebook access tokens. Your page data, conversations, and leads will be preserved.
            </p>
            <p className="text-sm text-muted-foreground mb-6">
              You can reconnect anytime to restore full functionality.
            </p>
            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => setShowDisconnectDialog(false)}>
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={handleDisconnect}
                disabled={disconnectFb.isPending}
              >
                {disconnectFb.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                Disconnect
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Setup Guide */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h4 className="font-semibold text-blue-900 mb-2 flex items-center gap-2">
          <AlertCircle className="w-4 h-4" /> How It Works
        </h4>
        <ul className="text-sm text-blue-800 space-y-1.5">
          <li>1. Connect your Facebook account above (grants access to your Pages)</li>
          <li>2. Select which pages to connect from the page picker</li>
          <li>3. Each page gets its own AI personality, knowledge base, leads, and conversations</li>
          <li>4. Connect Instagram per-page under each page's <strong>Channels</strong> settings</li>
          <li>5. Click <strong>Reconnect</strong> anytime to add new pages or refresh permissions</li>
        </ul>
      </div>
    </div>
  );
}

function BillingTab() {
  const { user } = useAuth();
  const PLAN_ORDER = ["free", "growth", "pro", "scale", "custom"] as const;
  const plans = [
    { key: "free", name: "Free", price: "$0", period: "/mo", pages: "1 page", conversations: "100 conversations/mo", highlight: false },
    { key: "growth", name: "Growth", price: "$29", period: "/mo", pages: "3 pages", conversations: "1,000 conversations/mo", highlight: false },
    { key: "pro", name: "Pro", price: "$79", period: "/mo", pages: "10 pages", conversations: "2,500 conversations/mo", highlight: true },
    { key: "scale", name: "Scale", price: "$149", period: "/mo", pages: "25 pages", conversations: "10,000 conversations/mo", highlight: false },
    { key: "custom", name: "Custom", price: "Contact us", period: "", pages: "Unlimited pages", conversations: "Unlimited conversations", highlight: false },
  ];
  const currentPlan = (user as any)?.plan || "free";
  const currentIdx = PLAN_ORDER.indexOf(currentPlan as any);

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-bold mb-1">Billing & Plan</h3>
        <p className="text-sm text-muted-foreground">Manage your subscription. This applies to your entire account.</p>
      </div>

      {/* Current plan summary */}
      <div className="flex items-center gap-3 p-4 bg-messenger/5 border border-messenger/20 rounded-xl">
        <Crown className="w-5 h-5 text-messenger shrink-0" />
        <div>
          <p className="text-sm font-semibold text-foreground">
            You're on the <span className="text-messenger">{plans.find(p => p.key === currentPlan)?.name || "Free"}</span> plan
          </p>
          <p className="text-xs text-muted-foreground">
            {currentPlan === "custom" ? "Custom enterprise plan" : `${plans.find(p => p.key === currentPlan)?.pages}, ${plans.find(p => p.key === currentPlan)?.conversations}`}
          </p>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {plans.map(plan => {
          const isCurrent = currentPlan === plan.key;
          const planIdx = PLAN_ORDER.indexOf(plan.key as any);
          const isBelow = planIdx < currentIdx;
          const isAbove = planIdx > currentIdx;

          return (
            <div
              key={plan.key}
              className={`relative p-5 rounded-xl border-2 transition-all ${
                isCurrent
                  ? "border-messenger bg-messenger/5 shadow-md shadow-messenger/10"
                  : isBelow
                    ? "border-border bg-gray-50/50 opacity-70"
                    : "border-border bg-white hover:border-messenger/30"
              }`}
            >
              {/* Current plan badge */}
              {isCurrent && (
                <div className="absolute -top-3 left-4 bg-messenger text-white text-[11px] font-bold px-3 py-0.5 rounded-full">
                  Current Plan
                </div>
              )}

              <p className="font-bold text-foreground mt-1">{plan.name}</p>
              <div className="flex items-baseline gap-0.5 mt-2">
                <span className="text-2xl font-extrabold text-foreground">{plan.price}</span>
                {plan.period && <span className="text-sm text-muted-foreground">{plan.period}</span>}
              </div>
              <div className="mt-3 space-y-1">
                <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-green-500 shrink-0" /> {plan.pages}
                </p>
                <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-green-500 shrink-0" /> {plan.conversations}
                </p>
              </div>

              {isCurrent ? (
                <div className="mt-4 text-center">
                  <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-messenger">
                    <CheckCircle className="w-3.5 h-3.5" /> Active
                  </span>
                </div>
              ) : plan.key === "custom" ? (
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-4 w-full"
                  onClick={() => window.open("mailto:support@rocketeerio.com?subject=Custom Plan Inquiry", "_blank")}
                >
                  Contact Us
                </Button>
              ) : isBelow ? (
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-4 w-full text-muted-foreground"
                  onClick={() => window.location.href = "/billing"}
                >
                  Downgrade
                </Button>
              ) : (
                <Button
                  size="sm"
                  className="mt-4 w-full bg-messenger hover:bg-messenger-dark gap-1.5"
                  onClick={() => window.location.href = "/billing"}
                >
                  <ArrowUpCircle className="w-3.5 h-3.5" /> Upgrade
                </Button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════
// PAGE-LEVEL TABS (unique per active page workspace)
// ═══════════════════════════════════════════════════════════════════════

function ChannelsTab() {
  const { activePage } = useActivePage();
  const { data: channels, isLoading } = trpc.pages.getChannels.useQuery(
    { pageId: activePage?.id || 0 },
    { enabled: !!activePage }
  );
  const disconnectChannel = trpc.pages.disconnectChannel.useMutation();
  const utils = trpc.useUtils();

  const handleDisconnect = async (channel: string) => {
    if (!activePage) return;
    try {
      await disconnectChannel.mutateAsync({ pageId: activePage.id, channel });
      utils.pages.getChannels.invalidate();
      toast.success(`${channel} disconnected`);
    } catch {
      toast.error(`Failed to disconnect ${channel}`);
    }
  };

  if (isLoading) return <div className="flex items-center justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-messenger" /></div>;

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-bold mb-1">Channels</h3>
        <p className="text-sm text-muted-foreground">Connect additional channels like Instagram to this page.</p>
      </div>

      {/* Facebook */}
      <div className="bg-white rounded-xl border p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Facebook className="w-5 h-5 text-[#1877F2]" />
            <div>
              <p className="font-medium">Facebook</p>
              <p className="text-xs text-muted-foreground">Connected</p>
            </div>
          </div>
          <CheckCircle className="w-5 h-5 text-green-500" />
        </div>
      </div>

      {/* Instagram */}
      <div className="bg-white rounded-xl border p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Instagram className="w-5 h-5 text-[#E4405F]" />
            <div>
              <p className="font-medium">Instagram</p>
              <p className="text-xs text-muted-foreground">
                {channels?.instagram ? "Connected" : "Not connected"}
              </p>
            </div>
          </div>
          {channels?.instagram ? (
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleDisconnect("instagram")}
              disabled={disconnectChannel.isPending}
            >
              Disconnect
            </Button>
          ) : (
            <Button size="sm" className="bg-[#E4405F] hover:bg-[#D43F5A] text-white">
              Connect
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

function PersonalityTab() {
  const { activePage } = useActivePage();
  const { data: personality, isLoading } = trpc.pages.getPersonality.useQuery(
    { pageId: activePage?.id || 0 },
    { enabled: !!activePage }
  );
  const updatePersonality = trpc.pages.updatePersonality.useMutation();
  const [description, setDescription] = useState("");
  const utils = trpc.useUtils();

  useEffect(() => {
    if (personality) setDescription(personality.description);
  }, [personality]);

  const handleSave = async () => {
    if (!activePage) return;
    try {
      await updatePersonality.mutateAsync({
        pageId: activePage.id,
        description,
      });
      utils.pages.getPersonality.invalidate();
      toast.success("Personality saved!");
    } catch {
      toast.error("Failed to save personality");
    }
  };

  if (isLoading) return <div className="flex items-center justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-messenger" /></div>;

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-bold mb-1">AI Personality</h3>
        <p className="text-sm text-muted-foreground">Define how your AI assistant responds to customers.</p>
      </div>

      <div className="bg-white rounded-xl border p-6 space-y-4">
        <div>
          <Label htmlFor="personality" className="text-sm font-medium mb-2 block">Personality Description</Label>
          <Textarea
            id="personality"
            placeholder="Describe your brand voice, tone, and communication style..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={6}
            className="resize-none"
          />
          <p className="text-xs text-muted-foreground mt-2">This helps the AI understand how to respond to customers on your behalf.</p>
        </div>
        <Button onClick={handleSave} disabled={updatePersonality.isPending} className="bg-messenger hover:bg-messenger-dark">
          {updatePersonality.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
          Save Personality
        </Button>
      </div>
    </div>
  );
}

function KnowledgeBaseTab() {
  const { activePage } = useActivePage();
  const { data: kb, isLoading } = trpc.pages.getKnowledgeBase.useQuery(
    { pageId: activePage?.id || 0 },
    { enabled: !!activePage }
  );
  const updateKb = trpc.pages.updateKnowledgeBase.useMutation();
  const [content, setContent] = useState("");
  const utils = trpc.useUtils();

  useEffect(() => {
    if (kb) setContent(kb.content);
  }, [kb]);

  const handleSave = async () => {
    if (!activePage) return;
    try {
      await updateKb.mutateAsync({
        pageId: activePage.id,
        content,
      });
      utils.pages.getKnowledgeBase.invalidate();
      toast.success("Knowledge Base saved!");
    } catch {
      toast.error("Failed to save Knowledge Base");
    }
  };

  if (isLoading) return <div className="flex items-center justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-messenger" /></div>;

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-bold mb-1">Knowledge Base</h3>
        <p className="text-sm text-muted-foreground">Provide information your AI can reference when responding to customers.</p>
      </div>

      <div className="bg-white rounded-xl border p-6 space-y-4">
        <div>
          <Label htmlFor="kb" className="text-sm font-medium mb-2 block">Knowledge Base Content</Label>
          <Textarea
            id="kb"
            placeholder="Add FAQs, product info, policies, or any other information your AI should know..."
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={10}
            className="resize-none font-mono text-sm"
          />
          <p className="text-xs text-muted-foreground mt-2">Use clear formatting. The AI will search this content when answering questions.</p>
        </div>
        <Button onClick={handleSave} disabled={updateKb.isPending} className="bg-messenger hover:bg-messenger-dark">
          {updateKb.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
          Save Knowledge Base
        </Button>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════
// MAIN SETTINGS PAGE
// ═══════════════════════════════════════════════════════════════════════

const ACCOUNT_TABS = [
  { id: "profile", label: "Profile", icon: User },
  { id: "accounts", label: "Connected Accounts", icon: Facebook },
  { id: "notifications", label: "Notifications", icon: Bell },
  { id: "billing", label: "Billing & Plan", icon: CreditCard },
];

const PAGE_TABS = [
  { id: "channels", label: "Channels", icon: Radio },
  { id: "personality", label: "AI Personality", icon: Bot },
  { id: "knowledge-base", label: "Knowledge Base", icon: BookOpen },
];

export default function Settings() {
  const { user, loading } = useAuth({ redirectOnUnauthenticated: true });
  const { activePage } = useActivePage();
  const [tab, setTab] = useState("profile");

  if (loading) return <div className="flex items-center justify-center min-h-screen"><Loader2 className="w-8 h-8 animate-spin text-messenger" /></div>;

  const isAccountTab = ACCOUNT_TABS.some(t => t.id === tab);
  const tabs = isAccountTab ? ACCOUNT_TABS : PAGE_TABS;

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex flex-col gap-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold tracking-tight mb-1">Settings</h1>
          <p className="text-muted-foreground">
            {isAccountTab ? "Manage your account settings" : `Manage settings for ${activePage?.pageName || "your page"}`}
          </p>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 border-b overflow-x-auto">
          {tabs.map(t => {
            const Icon = t.icon;
            const isActive = tab === t.id;
            return (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={`flex items-center gap-2 px-4 py-3 border-b-2 transition-colors whitespace-nowrap ${
                  isActive
                    ? "border-messenger text-foreground font-semibold"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                }`}
              >
                <Icon className="w-4 h-4" />
                {t.label}
              </button>
            );
          })}
        </div>

        {/* Content */}
        <div className="pb-12">
          {tab === "profile" && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-bold mb-1">Profile</h3>
                <p className="text-sm text-muted-foreground">Update your account information.</p>
              </div>
              <div className="bg-white rounded-xl border p-6 space-y-4">
                <div>
                  <Label htmlFor="name" className="text-sm font-medium mb-2 block">Full Name</Label>
                  <Input id="name" defaultValue={user?.name || ""} placeholder="Your name" />
                </div>
                <div>
                  <Label htmlFor="email" className="text-sm font-medium mb-2 block">Email</Label>
                  <Input id="email" type="email" defaultValue={user?.email || ""} placeholder="your@email.com" disabled />
                </div>
                <Button className="bg-messenger hover:bg-messenger-dark">Save Profile</Button>
              </div>
            </div>
          )}
          {tab === "accounts" && <ConnectedAccountsTab />}
          {tab === "notifications" && <NotificationsTab />}
          {tab === "billing" && <BillingTab />}
          {tab === "channels" && <ChannelsTab />}
          {tab === "personality" && <PersonalityTab />}
          {tab === "knowledge-base" && <KnowledgeBaseTab />}
        </div>
      </div>
    </div>
  );
}
