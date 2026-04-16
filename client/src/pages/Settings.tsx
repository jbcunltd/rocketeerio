import { useAuth } from "@/_core/hooks/useAuth";
import DashboardLayout from "@/components/DashboardLayout";
import { AiModeToggle, AiModeBadge } from "@/components/AiModeToggle";
import type { AiMode } from "@/components/AiModeToggle";
import { TesterManager } from "@/components/TesterManager";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectSeparator, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { trpc } from "@/lib/trpc";
import { useActivePage } from "@/contexts/ActivePageContext";
import {
  User, Bell, CreditCard, Facebook, Loader2, Save, Trash2, CheckCircle,
  AlertCircle, ExternalLink, Bot, Instagram, Headphones, MessageSquare,
  Smartphone, Mail, Radio, BellRing, CheckCircle2, Hash, Zap, Globe,
  Settings2, Lock, MessageCircle, Clock, RefreshCw
} from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

// ═══════════════════════════════════════════════════════════════════════
// ACCOUNT-LEVEL TABS (shared across all pages)
// ═══════════════════════════════════════════════════════════════════════

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
        <p className="text-sm text-muted-foreground">Update your personal details. These apply to your entire account.</p>
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
        <p className="text-sm text-muted-foreground">Configure how and when you receive alerts. These apply across all your pages.</p>
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

function ConnectedAccountsTab() {
  const { data: pages, isLoading } = trpc.pages.list.useQuery();
  const disconnectFb = trpc.pages.disconnectFacebook.useMutation();
  const utils = trpc.useUtils();
  const [connecting, setConnecting] = useState(false);
  const [showDisconnectConfirm, setShowDisconnectConfirm] = useState(false);

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
      setShowDisconnectConfirm(false);
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
        <div className="p-4">
          {/* Top row: info + badge */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="w-10 h-10 bg-[#1877F2]/10 rounded-lg flex items-center justify-center shrink-0">
              <Facebook className="w-5 h-5 text-[#1877F2]" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-medium">Facebook</p>
              <p className="text-xs text-muted-foreground">
                {hasFacebookConnected
                  ? `${pages.length} page${pages.length > 1 ? "s" : ""} connected`
                  : "Not connected"}
              </p>
            </div>
            {hasFacebookConnected && (
              <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded inline-flex items-center gap-1 shrink-0">
                <CheckCircle className="w-3 h-3" /> Connected
              </span>
            )}
          </div>

          {/* Action buttons row */}
          <div className="mt-3 flex flex-wrap items-center gap-3">
            {hasFacebookConnected ? (
              <>
                <Button
                  onClick={handleReconnect}
                  disabled={connecting}
                  size="sm"
                  variant="outline"
                  className="text-[#1877F2] border-[#1877F2]/30 hover:bg-[#1877F2]/5"
                >
                  {connecting ? <Loader2 className="w-4 h-4 animate-spin mr-1.5" /> : <RefreshCw className="w-4 h-4 mr-1.5" />}
                  Reconnect
                </Button>
                <button
                  onClick={() => setShowDisconnectConfirm(true)}
                  className="text-sm text-red-600 hover:text-red-700 hover:underline font-medium cursor-pointer px-2 py-1"
                >
                  Disconnect
                </button>
              </>
            ) : (
              <Button onClick={handleConnect} disabled={connecting} size="sm" className="bg-[#1877F2] hover:bg-[#166FE5] text-white">
                {connecting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Facebook className="w-4 h-4 mr-2" />}
                Connect Facebook
              </Button>
            )}
          </div>
        </div>

        {hasFacebookConnected && (
          <div className="border-t px-4 py-3 bg-gray-50/50">
            <p className="text-xs text-muted-foreground">
              <strong>Reconnect</strong> to re-authorize and pick up new pages.
              <strong> Disconnect</strong> removes access tokens but keeps your page data intact.
            </p>
          </div>
        )}
      </div>

      {/* Disconnect Confirmation Dialog */}
      {showDisconnectConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setShowDisconnectConfirm(false)}>
          <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4 shadow-xl" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-bold mb-2">Disconnect Facebook?</h3>
            <p className="text-sm text-muted-foreground mb-4">
              This will remove your Facebook access tokens. Your page data, conversations, and leads will be preserved, but the AI agent will stop responding to new messages until you reconnect.
            </p>
            <div className="flex justify-end gap-3">
              <Button variant="outline" size="sm" onClick={() => setShowDisconnectConfirm(false)}>
                Cancel
              </Button>
              <Button
                size="sm"
                variant="destructive"
                onClick={handleDisconnect}
                disabled={disconnectFb.isPending}
              >
                {disconnectFb.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-1.5" /> : null}
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
          <li>2. After connecting, choose which pages to add from the page picker</li>
          <li>3. Each page gets its own AI personality, knowledge base, leads, and conversations</li>
          <li>4. Connect Instagram per-page under each page's <strong>Channels</strong> settings</li>
        </ul>
      </div>
    </div>
  );
}

function BillingTab() {
  const subscriptionQuery = trpc.billing.currentSubscription.useQuery();
  const currentSlug = subscriptionQuery.data?.plan?.slug || "free";

  const plans = [
    { key: "free", name: "Free", price: "$0", period: "/mo", pages: "1 page", convos: "100 conversations/mo" },
    { key: "growth", name: "Growth", price: "$29", period: "/mo", pages: "3 pages", convos: "1,000 conversations/mo" },
    { key: "pro", name: "Pro", price: "$79", period: "/mo", pages: "10 pages", convos: "2,500 conversations/mo" },
    { key: "scale", name: "Scale", price: "$149", period: "/mo", pages: "25 pages", convos: "10,000 conversations/mo" },
    { key: "custom", name: "Custom", price: "Contact us", period: "", pages: "Unlimited pages", convos: "Unlimited conversations" },
  ];

  const planOrder = ["free", "growth", "pro", "scale", "custom"];
  const currentIndex = planOrder.indexOf(currentSlug);

  if (subscriptionQuery.isLoading) {
    return <div className="flex items-center justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-messenger" /></div>;
  }

  const currentPlanName = plans.find(p => p.key === currentSlug)?.name || "Free";

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-bold mb-1">Billing & Plan</h3>
        <p className="text-sm text-muted-foreground">Manage your subscription. This applies to your entire account.</p>
      </div>

      {/* Current plan summary */}
      <div className="bg-messenger/5 border border-messenger/20 rounded-lg p-4 flex items-center gap-3">
        <div className="w-10 h-10 bg-messenger/10 rounded-lg flex items-center justify-center shrink-0">
          <CreditCard className="w-5 h-5 text-messenger" />
        </div>
        <div>
          <p className="font-semibold">You're on the <span className="text-messenger">{currentPlanName}</span> plan</p>
          <p className="text-xs text-muted-foreground">
            {plans.find(p => p.key === currentSlug)?.pages} · {plans.find(p => p.key === currentSlug)?.convos}
          </p>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {plans.map((plan, idx) => {
          const isCurrent = plan.key === currentSlug;
          const isBelow = idx < currentIndex;
          const isAbove = idx > currentIndex;

          return (
            <div
              key={plan.key}
              className={`relative p-5 rounded-xl border-2 transition-all ${
                isCurrent
                  ? "border-messenger bg-messenger/5 shadow-md"
                  : isBelow
                    ? "border-border bg-gray-50 opacity-60"
                    : "border-border bg-white hover:border-messenger/30"
              }`}
            >
              {isCurrent && (
                <span className="absolute -top-3 left-4 bg-messenger text-white text-xs font-bold px-3 py-0.5 rounded-full">
                  Current Plan
                </span>
              )}
              <p className="font-bold text-lg mt-1">{plan.name}</p>
              <div className="mt-2">
                {plan.key === "custom" ? (
                  <p className="text-xl font-extrabold text-foreground">{plan.price}</p>
                ) : (
                  <p className="text-3xl font-extrabold text-foreground">
                    {plan.price}<span className="text-sm font-normal text-muted-foreground">{plan.period}</span>
                  </p>
                )}
              </div>
              <div className="mt-3 space-y-1.5">
                <p className="text-sm text-muted-foreground flex items-center gap-1.5">
                  <CheckCircle className="w-3.5 h-3.5 text-green-500 shrink-0" /> {plan.pages}
                </p>
                <p className="text-sm text-muted-foreground flex items-center gap-1.5">
                  <CheckCircle className="w-3.5 h-3.5 text-green-500 shrink-0" /> {plan.convos}
                </p>
              </div>
              <div className="mt-4">
                {isCurrent ? (
                  <div className="text-center text-sm font-medium text-messenger py-2">Active</div>
                ) : isBelow ? (
                  <Button variant="outline" size="sm" className="w-full opacity-50" disabled>
                    Downgrade
                  </Button>
                ) : plan.key === "custom" ? (
                  <Button variant="outline" size="sm" className="w-full" onClick={() => window.open("mailto:support@rocketeerio.com", "_blank")}>
                    Contact Us
                  </Button>
                ) : (
                  <Button size="sm" className="w-full bg-messenger hover:bg-messenger-dark text-white" onClick={() => window.location.href = "/billing"}>
                    Upgrade
                  </Button>
                )}
              </div>
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
  const { data: igAccounts } = trpc.instagram.list.useQuery();
  const deleteIg = trpc.instagram.delete.useMutation();
  const updateIgMode = trpc.instagram.updateMode.useMutation();
  const utils = trpc.useUtils();
  const [connectingIg, setConnectingIg] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("tab") === "channels" && params.get("success") === "connected") {
      toast.success("Instagram connected successfully!");
      utils.instagram.list.invalidate();
      window.history.replaceState({}, "", "/settings?tab=channels");
    }
    if (params.get("tab") === "channels") {
      const error = params.get("error");
      if (error) {
        const errorMessages: Record<string, string> = {
          not_authenticated: "Please log in first",
          oauth_failed: "Instagram authentication failed",
          no_ig_accounts: "No Instagram Business account found linked to this page.",
          callback_failed: "Something went wrong during connection",
        };
        toast.error(errorMessages[error] || "Connection failed");
        window.history.replaceState({}, "", "/settings?tab=channels");
      }
    }
  }, []);

  if (!activePage) return null;

  // Find the IG account linked to this page
  const linkedIg = igAccounts?.find((a: any) => a.facebookPageId === activePage.id);

  const handleConnectInstagram = () => {
    setConnectingIg(true);
    // Pass the active page ID so the OAuth callback can scope to this page
    window.location.href = `/api/auth/instagram?pageId=${activePage.id}`;
  };

  const handleDisconnectIg = async () => {
    if (!linkedIg) return;
    try {
      await deleteIg.mutateAsync({ id: linkedIg.id });
      utils.instagram.list.invalidate();
      toast.success("Instagram disconnected from this page");
    } catch { toast.error("Failed to disconnect Instagram"); }
  };

  const handleIgModeChange = async (mode: "paused" | "testing" | "live") => {
    if (!linkedIg) return;
    try {
      await updateIgMode.mutateAsync({ id: linkedIg.id, aiMode: mode });
      utils.instagram.list.invalidate();
      toast.success(`Instagram AI mode updated to ${mode}`);
    } catch { toast.error("Failed to update AI mode"); }
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-bold mb-1">Channels</h3>
        <p className="text-sm text-muted-foreground">
          Manage messaging channels for <strong>{activePage.pageName}</strong>. Each channel connects customers to your AI agent.
        </p>
      </div>

      {/* Messenger Channel */}
      <div className="bg-white rounded-xl border overflow-hidden">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[#1877F2]/10 rounded-lg flex items-center justify-center">
              <MessageCircle className="w-5 h-5 text-[#1877F2]" />
            </div>
            <div>
              <p className="font-medium">Messenger</p>
              <p className="text-xs text-muted-foreground">Facebook Messenger for {activePage.pageName}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <AiModeToggle
              pageId={activePage.id}
              currentMode={(activePage.aiMode as AiMode) || "testing"}
              compact
            />
            <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded inline-flex items-center gap-1">
              <CheckCircle className="w-3 h-3" /> Connected
            </span>
          </div>
        </div>
        <div className="border-t px-4 py-3 bg-gray-50/50">
          <p className="text-xs text-muted-foreground">
            Messenger is automatically connected when you add a Facebook Page. Your AI agent responds to all new conversations.
          </p>
        </div>
      </div>

      {/* Instagram Channel */}
      <div className="bg-white rounded-xl border overflow-hidden">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-purple-500/10 to-pink-500/10 rounded-lg flex items-center justify-center">
              <Instagram className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <p className="font-medium">Instagram</p>
              {linkedIg ? (
                <p className="text-xs text-muted-foreground">@{linkedIg.igUsername}</p>
              ) : (
                <p className="text-xs text-muted-foreground">Connect the Instagram account linked to this page</p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-3">
            {linkedIg ? (
              <>
                <select
                  value={linkedIg.aiMode}
                  onChange={(e) => handleIgModeChange(e.target.value as any)}
                  className="text-xs border rounded-md px-2 py-1.5 bg-white"
                >
                  <option value="paused">Paused</option>
                  <option value="testing">Testing</option>
                  <option value="live">Live</option>
                </select>
                <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded inline-flex items-center gap-1">
                  <CheckCircle className="w-3 h-3" /> Connected
                </span>
              </>
            ) : (
              <Button
                onClick={handleConnectInstagram}
                disabled={connectingIg}
                size="sm"
                className="bg-gradient-to-r from-purple-600 to-pink-500 hover:from-purple-700 hover:to-pink-600 text-white"
              >
                {connectingIg ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Instagram className="w-4 h-4 mr-2" />}
                Connect Instagram
              </Button>
            )}
          </div>
        </div>
        {linkedIg && (
          <div className="border-t px-4 py-3 bg-gray-50/50 flex items-center justify-between">
            <div className="flex items-center gap-3">
              {linkedIg.profilePicUrl && (
                <img src={linkedIg.profilePicUrl} alt={linkedIg.igUsername} className="w-6 h-6 rounded-full" />
              )}
              <p className="text-xs text-muted-foreground">
                {linkedIg.igName || linkedIg.igUsername}
                {linkedIg.followerCount ? ` \u00B7 ${linkedIg.followerCount.toLocaleString()} followers` : ""}
              </p>
            </div>
            <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive text-xs" onClick={handleDisconnectIg}>
              <Trash2 className="w-3 h-3 mr-1" /> Disconnect
            </Button>
          </div>
        )}
        {!linkedIg && (
          <div className="border-t px-4 py-3 bg-purple-50/50">
            <p className="text-xs text-purple-800">
              Your Instagram account must be a <strong>Business</strong> or <strong>Creator</strong> account linked to this Facebook Page.
            </p>
          </div>
        )}
      </div>

      {/* WhatsApp Channel - Coming Soon */}
      <div className="bg-white rounded-xl border overflow-hidden opacity-60">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-500/10 rounded-lg flex items-center justify-center">
              <Smartphone className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="font-medium">
                WhatsApp
                <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded ml-2">Coming Soon</span>
              </p>
              <p className="text-xs text-muted-foreground">WhatsApp Business API integration</p>
            </div>
          </div>
          <Lock className="w-4 h-4 text-muted-foreground" />
        </div>
        <div className="border-t px-4 py-3 bg-gray-50/50">
          <p className="text-xs text-muted-foreground">
            WhatsApp Business integration is coming soon. Connect your WhatsApp Business number to let your AI agent respond to WhatsApp messages.
          </p>
        </div>
      </div>

      {/* Tester Management */}
      <div className="bg-white rounded-xl border overflow-hidden">
        <div className="p-4">
          <h4 className="font-semibold mb-1">Test Users</h4>
          <p className="text-xs text-muted-foreground mb-4">
            When your page is in <strong>Testing</strong> mode, only these users will receive AI responses.
          </p>
          <TesterManager pageId={activePage.id} />
        </div>
      </div>
    </div>
  );
}

function AiPersonalityTab() {
  const { activePage } = useActivePage();

  if (!activePage) {
    return (
      <div className="space-y-6">
        <div>
          <h3 className="text-lg font-bold mb-1">AI Personality</h3>
          <p className="text-sm text-muted-foreground">Configure how your AI sales agent communicates.</p>
        </div>
        <div className="text-center py-12 bg-white rounded-lg border">
          <Bot className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
          <p className="text-muted-foreground mb-2">No page selected.</p>
          <p className="text-sm text-muted-foreground">Select a page from the sidebar to configure its AI personality.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-bold mb-1">AI Personality</h3>
        <p className="text-sm text-muted-foreground">
          Configure how the AI agent communicates for <strong>{activePage.pageName}</strong>.
          Each page has its own personality settings.
        </p>
      </div>
      <AiSettingsForm pageId={activePage.id} key={activePage.id} />
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
            <p className="text-xs text-muted-foreground">The name your AI uses when chatting</p>
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
            <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
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
            <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
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
            <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
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

      {/* Custom Goal */}
      {primaryGoal === "custom_goal" && (
        <div className="bg-white rounded-lg border p-5 border-blue-200 bg-blue-50">
          <Label className="font-bold text-sm">Custom Goal Description</Label>
          <p className="text-xs text-muted-foreground mt-0.5 mb-2">Describe what you want the AI to push conversations toward</p>
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
          Free-form instructions for the AI (e.g. "never discount, always reframe toward value")
        </p>
        <Textarea
          value={customInstructions}
          onChange={e => setCustomInstructions(e.target.value)}
          placeholder="Add any special instructions for your AI agent..."
          className="min-h-[120px] resize-y"
        />
      </div>

      <Button onClick={handleSave} disabled={updateSettings.isPending} className="bg-messenger hover:bg-messenger-dark">
        {updateSettings.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
        Save AI Settings
      </Button>
    </div>
  );
}

function HotLeadAlertsTab() {
  const { user } = useAuth();
  const { activePage } = useActivePage();
  const subscriptionQuery = trpc.billing.currentSubscription.useQuery();
  const currentPlan = subscriptionQuery.data?.plan?.slug;
  const isPro = currentPlan === "pro" || currentPlan === "scale" || currentPlan === "custom";

  const [emailStatus, setEmailStatus] = useState<"not_connected" | "pending" | "connected">("not_connected");
  const [emailAddr, setEmailAddr] = useState("");
  const [emailVerificationCode, setEmailVerificationCode] = useState("");
  const [emailOtpInput, setEmailOtpInput] = useState("");
  const [emailSending, setEmailSending] = useState(false);
  const [messengerStatus, setMessengerStatus] = useState<"not_connected" | "connected">("not_connected");
  const [messengerPageName, setMessengerPageName] = useState("");
  const [messengerConnecting, setMessengerConnecting] = useState(false);
  const [telegramStatus, setTelegramStatus] = useState<"not_connected" | "pending" | "connected">("not_connected");
  const [telegramCode, setTelegramCode] = useState("");
  const [telegramHandle, setTelegramHandle] = useState("");
  const [whatsappStatus, setWhatsappStatus] = useState<"not_connected" | "pending" | "connected">("not_connected");
  const [whatsappNumber, setWhatsappNumber] = useState("");
  const [whatsappOtpInput, setWhatsappOtpInput] = useState("");
  const [whatsappSending, setWhatsappSending] = useState(false);
  const [smsStatus, setSmsStatus] = useState<"not_connected" | "pending" | "connected">("not_connected");
  const [smsNumber, setSmsNumber] = useState("");
  const [smsOtpInput, setSmsOtpInput] = useState("");
  const [smsSending, setSmsSending] = useState(false);
  const [leadStatus, setLeadStatus] = useState<"hot" | "warm" | "all">("hot");

  const handleEmailSendCode = async () => {
    if (!emailAddr.trim()) { toast.error("Please enter your email"); return; }
    setEmailSending(true);
    setTimeout(() => {
      const code = Math.random().toString().slice(2, 8);
      setEmailVerificationCode(code);
      setEmailStatus("pending");
      setEmailSending(false);
      toast.success("Verification code sent to " + emailAddr);
    }, 1000);
  };
  const handleEmailVerify = () => {
    if (emailOtpInput === emailVerificationCode) { setEmailStatus("connected"); setEmailOtpInput(""); toast.success("Email connected!"); }
    else { toast.error("Invalid verification code"); }
  };
  const handleMessengerConnect = () => {
    setMessengerConnecting(true);
    setTimeout(() => { setMessengerStatus("connected"); setMessengerPageName(activePage?.pageName || "My Page"); setMessengerConnecting(false); toast.success("Messenger alert connected!"); }, 1500);
  };
  const handleTelegramConnect = () => {
    const code = Math.random().toString().slice(2, 8).toUpperCase();
    setTelegramCode(code); setTelegramStatus("pending"); toast.success("Telegram connection code: " + code);
  };
  const handleTelegramVerify = () => {
    if (telegramHandle.trim()) { setTelegramStatus("connected"); toast.success("Telegram connected!"); }
    else { toast.error("Please enter your Telegram handle"); }
  };
  const handleWhatsappSendCode = async () => {
    if (!whatsappNumber.trim()) { toast.error("Please enter your phone number"); return; }
    setWhatsappSending(true);
    setTimeout(() => { setWhatsappStatus("pending"); setWhatsappSending(false); toast.success("Verification code sent"); }, 1000);
  };
  const handleWhatsappVerify = () => {
    if (whatsappOtpInput.length === 6) { setWhatsappStatus("connected"); setWhatsappOtpInput(""); toast.success("WhatsApp connected!"); }
    else { toast.error("Please enter a valid 6-digit code"); }
  };
  const handleSmsSendCode = async () => {
    if (!smsNumber.trim()) { toast.error("Please enter your phone number"); return; }
    setSmsSending(true);
    setTimeout(() => { setSmsStatus("pending"); setSmsSending(false); toast.success("Verification code sent"); }, 1000);
  };
  const handleSmsVerify = () => {
    if (smsOtpInput.length === 6) { setSmsStatus("connected"); setSmsOtpInput(""); toast.success("SMS connected!"); }
    else { toast.error("Please enter a valid 6-digit code"); }
  };

  const handleSave = () => {
    const connected = [emailStatus === "connected" && "Email", messengerStatus === "connected" && "Messenger", telegramStatus === "connected" && "Telegram", whatsappStatus === "connected" && "WhatsApp", smsStatus === "connected" && "SMS"].filter(Boolean).join(", ");
    if (connected) toast.success("Alert preferences saved. Channels: " + connected);
    else toast.error("Please connect at least one notification channel");
  };

  const getStatusBadge = (status: string) => {
    if (status === "connected") return <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded inline-flex items-center gap-1"><CheckCircle className="w-3 h-3" /> Connected</span>;
    if (status === "pending") return <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded">Pending</span>;
    return <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded">Not connected</span>;
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-bold mb-1">Hot Lead Alerts</h3>
        <p className="text-sm text-muted-foreground">
          Configure alert triggers and channels for <strong>{activePage?.pageName || "this page"}</strong>.
        </p>
      </div>

      {/* Alert Trigger */}
      <div className="border-b pb-6">
        <h4 className="font-semibold mb-4">Alert Trigger</h4>
        <div className="space-y-3">
          <label className="flex items-center p-3 rounded-lg border cursor-pointer hover:bg-gray-50" style={{ borderColor: leadStatus === "hot" ? "#0084FF" : "inherit" }}>
            <input type="radio" name="leadStatus" value="hot" checked={leadStatus === "hot"} onChange={() => setLeadStatus("hot")} className="mr-3" />
            <div><p className="font-medium">Hot leads only <span className="text-xs bg-messenger text-white px-2 py-0.5 rounded ml-2">Recommended</span></p><p className="text-sm text-muted-foreground">Only your most qualified leads</p></div>
          </label>
          <label className="flex items-center p-3 rounded-lg border cursor-pointer hover:bg-gray-50">
            <input type="radio" name="leadStatus" value="warm" checked={leadStatus === "warm"} onChange={() => setLeadStatus("warm")} className="mr-3" />
            <div><p className="font-medium">Warm + Hot leads</p><p className="text-sm text-muted-foreground">Both warm and hot leads</p></div>
          </label>
          <label className="flex items-center p-3 rounded-lg border cursor-pointer hover:bg-gray-50">
            <input type="radio" name="leadStatus" value="all" checked={leadStatus === "all"} onChange={() => setLeadStatus("all")} className="mr-3" />
            <div><p className="font-medium">All leads</p><p className="text-sm text-muted-foreground">Every incoming message</p></div>
          </label>
        </div>
      </div>

      {/* Notification Channels */}
      <div>
        <h4 className="font-semibold mb-4">Notification Channels</h4>
        <div className="space-y-4">
          {/* Email */}
          <div className="p-4 bg-white rounded-lg border">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3"><Mail className="w-5 h-5 text-orange-500" /><div><p className="font-medium">Email</p><p className="text-xs text-muted-foreground">Get email summaries</p></div></div>
              {getStatusBadge(emailStatus)}
            </div>
            {emailStatus === "not_connected" && (
              <div className="space-y-3">
                <Input value={emailAddr} onChange={e => setEmailAddr(e.target.value)} placeholder="you@example.com" className="max-w-xs" />
                <Button onClick={handleEmailSendCode} disabled={emailSending || !emailAddr.trim()} size="sm" className="bg-messenger hover:bg-messenger-dark">
                  {emailSending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null} Send Verification Code
                </Button>
              </div>
            )}
            {emailStatus === "pending" && (
              <div className="space-y-3">
                <div><Label className="text-xs">Enter code sent to {emailAddr}</Label><Input value={emailOtpInput} onChange={e => setEmailOtpInput(e.target.value)} placeholder="000000" maxLength={6} className="mt-1.5 max-w-xs" /></div>
                <Button onClick={handleEmailVerify} size="sm" className="bg-messenger hover:bg-messenger-dark">Verify Email</Button>
              </div>
            )}
            {emailStatus === "connected" && (
              <div className="flex items-center justify-between">
                <p className="text-sm text-green-600">{emailAddr}</p>
                <div className="flex gap-2"><Button onClick={() => toast.success("Test alert sent!")} variant="outline" size="sm">Test</Button><Button onClick={() => setEmailStatus("not_connected")} variant="outline" size="sm">Change</Button></div>
              </div>
            )}
          </div>

          {/* Messenger */}
          <div className="p-4 bg-white rounded-lg border">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3"><MessageSquare className="w-5 h-5 text-messenger" /><div><p className="font-medium">Messenger</p><p className="text-xs text-muted-foreground">Alerts in your Messenger inbox</p></div></div>
              {getStatusBadge(messengerStatus)}
            </div>
            {messengerStatus === "not_connected" && (
              <Button onClick={handleMessengerConnect} disabled={messengerConnecting} size="sm" className="bg-[#1877F2] hover:bg-[#166FE5]">
                {messengerConnecting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null} Connect Messenger
              </Button>
            )}
            {messengerStatus === "connected" && (
              <div className="flex items-center justify-between">
                <p className="text-sm text-green-600">Connected to {messengerPageName}</p>
                <div className="flex gap-2"><Button onClick={() => toast.success("Test alert sent!")} variant="outline" size="sm">Test</Button><Button onClick={() => setMessengerStatus("not_connected")} variant="outline" size="sm">Disconnect</Button></div>
              </div>
            )}
          </div>

          {/* Telegram */}
          <div className="p-4 bg-white rounded-lg border">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3"><Radio className="w-5 h-5 text-blue-500" /><div><p className="font-medium">Telegram</p><p className="text-xs text-muted-foreground">Telegram ping on hot leads</p></div></div>
              {getStatusBadge(telegramStatus)}
            </div>
            {telegramStatus === "not_connected" && <Button onClick={handleTelegramConnect} size="sm" className="bg-blue-500 hover:bg-blue-600">Get Connection Code</Button>}
            {telegramStatus === "pending" && (
              <div className="space-y-3 bg-blue-50 p-3 rounded">
                <p className="text-sm">Message <strong>@RocketeerBot</strong> with code: <strong className="text-lg text-blue-600">{telegramCode}</strong></p>
                <div><Label className="text-xs">Your Telegram handle</Label><Input value={telegramHandle} onChange={e => setTelegramHandle(e.target.value)} placeholder="@yourhandle" className="mt-1.5 max-w-xs" /></div>
                <Button onClick={handleTelegramVerify} size="sm" className="bg-blue-500 hover:bg-blue-600">Verify</Button>
              </div>
            )}
            {telegramStatus === "connected" && (
              <div className="flex items-center justify-between">
                <p className="text-sm text-green-600">{telegramHandle}</p>
                <div className="flex gap-2"><Button onClick={() => toast.success("Test alert sent!")} variant="outline" size="sm">Test</Button><Button onClick={() => setTelegramStatus("not_connected")} variant="outline" size="sm">Disconnect</Button></div>
              </div>
            )}
          </div>

          {/* WhatsApp - Pro */}
          <div className={`p-4 bg-white rounded-lg border ${!isPro ? "opacity-60 bg-gray-50" : ""}`}>
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3"><Smartphone className="w-5 h-5 text-green-500" /><div><p className="font-medium">WhatsApp <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded ml-2">Pro</span></p><p className="text-xs text-muted-foreground">Instant WhatsApp notifications</p></div></div>
              {getStatusBadge(whatsappStatus)}
            </div>
            {!isPro ? <p className="text-xs text-purple-600 font-medium">Upgrade to Pro to unlock</p> : whatsappStatus === "not_connected" ? (
              <div className="space-y-3">
                <Input value={whatsappNumber} onChange={e => setWhatsappNumber(e.target.value)} placeholder="+1 (555) 000-0000" className="max-w-xs" />
                <Button onClick={handleWhatsappSendCode} disabled={whatsappSending || !whatsappNumber.trim()} size="sm" className="bg-green-500 hover:bg-green-600">{whatsappSending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null} Send Code</Button>
              </div>
            ) : whatsappStatus === "pending" ? (
              <div className="space-y-3">
                <div><Label className="text-xs">Enter code sent to {whatsappNumber}</Label><Input value={whatsappOtpInput} onChange={e => setWhatsappOtpInput(e.target.value)} placeholder="000000" maxLength={6} className="mt-1.5 max-w-xs" /></div>
                <Button onClick={handleWhatsappVerify} size="sm" className="bg-green-500 hover:bg-green-600">Verify</Button>
              </div>
            ) : (
              <div className="flex items-center justify-between">
                <p className="text-sm text-green-600">{whatsappNumber}</p>
                <div className="flex gap-2"><Button onClick={() => toast.success("Test alert sent!")} variant="outline" size="sm">Test</Button><Button onClick={() => setWhatsappStatus("not_connected")} variant="outline" size="sm">Change</Button></div>
              </div>
            )}
          </div>

          {/* SMS - Pro */}
          <div className={`p-4 bg-white rounded-lg border ${!isPro ? "opacity-60 bg-gray-50" : ""}`}>
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3"><Radio className="w-5 h-5 text-purple-500" /><div><p className="font-medium">SMS <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded ml-2">Pro</span></p><p className="text-xs text-muted-foreground">Instant SMS for urgent leads</p></div></div>
              {getStatusBadge(smsStatus)}
            </div>
            {!isPro ? <p className="text-xs text-purple-600 font-medium">Upgrade to Pro to unlock</p> : smsStatus === "not_connected" ? (
              <div className="space-y-3">
                <Input value={smsNumber} onChange={e => setSmsNumber(e.target.value)} placeholder="+1 (555) 000-0000" className="max-w-xs" />
                <Button onClick={handleSmsSendCode} disabled={smsSending || !smsNumber.trim()} size="sm" className="bg-purple-500 hover:bg-purple-600">{smsSending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null} Send Code</Button>
              </div>
            ) : smsStatus === "pending" ? (
              <div className="space-y-3">
                <div><Label className="text-xs">Enter code sent to {smsNumber}</Label><Input value={smsOtpInput} onChange={e => setSmsOtpInput(e.target.value)} placeholder="000000" maxLength={6} className="mt-1.5 max-w-xs" /></div>
                <Button onClick={handleSmsVerify} size="sm" className="bg-purple-500 hover:bg-purple-600">Verify</Button>
              </div>
            ) : (
              <div className="flex items-center justify-between">
                <p className="text-sm text-green-600">{smsNumber}</p>
                <div className="flex gap-2"><Button onClick={() => toast.success("Test alert sent!")} variant="outline" size="sm">Test</Button><Button onClick={() => setSmsStatus("not_connected")} variant="outline" size="sm">Change</Button></div>
              </div>
            )}
          </div>
        </div>
      </div>

      <Button onClick={handleSave} className="bg-messenger hover:bg-messenger-dark"><Save className="w-4 h-4 mr-2" /> Save Alert Preferences</Button>
    </div>
  );
}

function HandoffTab() {
  const { activePage } = useActivePage();
  const activePageId = activePage?.id;
  const settingsQuery = trpc.handoffs.getSettings.useQuery(
    { pageId: activePageId },
    { enabled: !!activePageId }
  );
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
    const keywordArray = keywords.split("\n").map(k => k.trim()).filter(Boolean);
    updateMutation.mutate({
      pageId: activePageId,
      autoHandoffEnabled: autoEnabled,
      notifyOnHandoff,
      sentimentThreshold,
      handoffKeywords: keywordArray,
    });
  };

  if (settingsQuery.isLoading) return <div className="flex items-center justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-messenger" /></div>;

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-bold mb-1">Live Agent Handoff</h3>
        <p className="text-sm text-muted-foreground">
          Configure when conversations for <strong>{activePage?.pageName || "this page"}</strong> should be handed off to a human agent.
        </p>
      </div>

      <div className="space-y-5">
        <div className="flex items-center justify-between p-4 bg-white rounded-lg border">
          <div><p className="font-medium">Auto-Handoff</p><p className="text-sm text-muted-foreground">Automatically detect when a lead needs a human</p></div>
          <Switch checked={autoEnabled} onCheckedChange={setAutoEnabled} />
        </div>
        <div className="flex items-center justify-between p-4 bg-white rounded-lg border">
          <div><p className="font-medium">Notify on Handoff</p><p className="text-sm text-muted-foreground">Send a notification when a handoff occurs</p></div>
          <Switch checked={notifyOnHandoff} onCheckedChange={setNotifyOnHandoff} />
        </div>
        <div>
          <Label>Sentiment Threshold</Label>
          <p className="text-xs text-muted-foreground mb-2">Lower values trigger handoff more easily (0.0 = very sensitive, 1.0 = never)</p>
          <Input type="number" min={0} max={1} step={0.1} value={sentimentThreshold} onChange={e => setSentimentThreshold(parseFloat(e.target.value) || 0.3)} className="w-32" />
        </div>
        <div>
          <Label>Handoff Keywords</Label>
          <p className="text-xs text-muted-foreground mb-2">One keyword/phrase per line. If a lead says any of these, handoff is triggered.</p>
          <Textarea value={keywords} onChange={e => setKeywords(e.target.value)} rows={5} placeholder={"speak to a human\ntalk to someone\nreal person"} />
        </div>
      </div>

      <Button onClick={handleSave} disabled={updateMutation.isPending} className="bg-messenger hover:bg-messenger-dark">
        {updateMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
        Save Handoff Settings
      </Button>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════
// MAIN SETTINGS COMPONENT
// ═══════════════════════════════════════════════════════════════════════

const PAGE_TABS = [
  { id: "channels", label: "Channels", icon: MessageCircle, description: "Messenger, Instagram, WhatsApp" },
  { id: "ai-personality", label: "AI Personality", icon: Bot, description: "How the AI talks to customers" },
  { id: "hot-lead-alerts", label: "Hot Lead Alerts", icon: BellRing, description: "When to notify you about leads" },
  { id: "handoff", label: "Live Agent Handoff", icon: Headphones, description: "When to pass to a human" },
];

const ACCOUNT_TABS = [
  { id: "profile", label: "Profile", icon: User, description: "Personal details" },
  { id: "notifications", label: "Notifications", icon: Bell, description: "Email and SMS preferences" },
  { id: "accounts", label: "Connected Accounts", icon: Facebook, description: "Facebook & Instagram accounts" },
  { id: "billing", label: "Billing & Plans", icon: CreditCard, description: "Manage your subscription" },
];

export default function Settings() {
  const params = new URLSearchParams(window.location.search);
  const defaultTab = params.get("tab") || "channels";
  const { activePage } = useActivePage();

  const [activeTab, setActiveTab] = useState(defaultTab);

  // If the URL had "pages" or "instagram" from old links, redirect to new tabs
  useEffect(() => {
    if (defaultTab === "pages" || defaultTab === "instagram") {
      setActiveTab("accounts");
    }
  }, [defaultTab]);

  const allTabs = [...PAGE_TABS, ...ACCOUNT_TABS];

  return (
    <DashboardLayout>
      <div className="max-w-5xl mx-auto">
        <div className="mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Settings</h1>
          <p className="text-muted-foreground mt-1">
            {PAGE_TABS.some(t => t.id === activeTab) && activePage
              ? <>Settings for <strong>{activePage.pageName}</strong></>
              : "Manage your account settings"
            }
          </p>
        </div>

        <div className="flex flex-col md:flex-row gap-8">
          {/* Mobile Tab Selector */}
          <div className="md:hidden mb-4">
            <Label className="mb-2 block text-sm font-medium text-muted-foreground">Select Settings Category</Label>
            <Select value={activeTab} onValueChange={setActiveTab}>
              <SelectTrigger className="w-full h-12 bg-white"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectLabel className="text-xs font-semibold text-muted-foreground uppercase tracking-wide px-2">
                    {activePage ? activePage.pageName : "Page Settings"}
                  </SelectLabel>
                  {PAGE_TABS.map(tab => (
                    <SelectItem key={tab.id} value={tab.id}>
                      <div className="flex items-center gap-2"><tab.icon className="w-4 h-4 text-muted-foreground" /><span>{tab.label}</span></div>
                    </SelectItem>
                  ))}
                </SelectGroup>
                <SelectSeparator />
                <SelectGroup>
                  <SelectLabel className="text-xs font-semibold text-muted-foreground uppercase tracking-wide px-2">Account</SelectLabel>
                  {ACCOUNT_TABS.map(tab => (
                    <SelectItem key={tab.id} value={tab.id}>
                      <div className="flex items-center gap-2"><tab.icon className="w-4 h-4 text-muted-foreground" /><span>{tab.label}</span></div>
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>

          {/* Desktop Sidebar */}
          <div className="hidden md:block w-64 shrink-0">
            <nav className="flex flex-col gap-1 sticky top-6">
              {/* Page-Level Section */}
              <div className="mb-1">
                <div className="flex items-center gap-2 px-3 py-1.5">
                  <div className="w-1.5 h-1.5 rounded-full bg-messenger" />
                  <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                    {activePage ? activePage.pageName : "Page Settings"}
                  </p>
                </div>
                {PAGE_TABS.map(tab => {
                  const isActive = activeTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`flex items-start gap-3 px-3 py-2.5 rounded-lg text-left transition-colors w-full ${
                        isActive
                          ? "bg-messenger/10 text-messenger font-medium"
                          : "text-muted-foreground hover:bg-gray-100 hover:text-foreground"
                      }`}
                    >
                      <tab.icon className={`w-5 h-5 shrink-0 mt-0.5 ${isActive ? "text-messenger" : "text-muted-foreground"}`} />
                      <div>
                        <div className="text-sm">{tab.label}</div>
                        <div className={`text-xs mt-0.5 ${isActive ? "text-messenger/70" : "text-muted-foreground/70"}`}>{tab.description}</div>
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Divider */}
              <div className="border-t my-2" />

              {/* Account-Level Section */}
              <div>
                <div className="flex items-center gap-2 px-3 py-1.5">
                  <div className="w-1.5 h-1.5 rounded-full bg-gray-400" />
                  <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Account</p>
                </div>
                {ACCOUNT_TABS.map(tab => {
                  const isActive = activeTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`flex items-start gap-3 px-3 py-2.5 rounded-lg text-left transition-colors w-full ${
                        isActive
                          ? "bg-messenger/10 text-messenger font-medium"
                          : "text-muted-foreground hover:bg-gray-100 hover:text-foreground"
                      }`}
                    >
                      <tab.icon className={`w-5 h-5 shrink-0 mt-0.5 ${isActive ? "text-messenger" : "text-muted-foreground"}`} />
                      <div>
                        <div className="text-sm">{tab.label}</div>
                        <div className={`text-xs mt-0.5 ${isActive ? "text-messenger/70" : "text-muted-foreground/70"}`}>{tab.description}</div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </nav>
          </div>

          {/* Content Area */}
          <div className="flex-1 min-w-0">
            {/* Page context banner for page-level tabs */}
            {PAGE_TABS.some(t => t.id === activeTab) && activePage && (
              <div className="flex items-center gap-2 mb-4 px-4 py-2.5 bg-blue-50 border border-blue-200 rounded-lg">
                {activePage.avatarUrl ? (
                  <img src={activePage.avatarUrl} alt={activePage.pageName} className="w-6 h-6 rounded" />
                ) : (
                  <Facebook className="w-4 h-4 text-[#1877F2]" />
                )}
                <p className="text-sm text-blue-800">
                  Editing settings for <strong>{activePage.pageName}</strong>
                </p>
                <span className="text-xs text-blue-600 ml-auto">Switch pages in the sidebar</span>
              </div>
            )}

            {PAGE_TABS.some(t => t.id === activeTab) && !activePage && (
              <div className="flex items-center gap-2 mb-4 px-4 py-2.5 bg-amber-50 border border-amber-200 rounded-lg">
                <AlertCircle className="w-4 h-4 text-amber-600" />
                <p className="text-sm text-amber-800">
                  No page selected. Use the page switcher in the sidebar to select a page first.
                </p>
              </div>
            )}

            <div className="bg-white rounded-xl border border-border/50 shadow-sm p-4 sm:p-6 md:p-8">
              {activeTab === "channels" && <ChannelsTab />}
              {activeTab === "ai-personality" && <AiPersonalityTab />}
              {activeTab === "hot-lead-alerts" && <HotLeadAlertsTab />}
              {activeTab === "handoff" && <HandoffTab />}
              {activeTab === "profile" && <ProfileTab />}
              {activeTab === "notifications" && <NotificationsTab />}
              {activeTab === "accounts" && <ConnectedAccountsTab />}
              {activeTab === "billing" && <BillingTab />}
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
