import { useAuth } from "@/_core/hooks/useAuth";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { trpc } from "@/lib/trpc";
import { User, Bell, CreditCard, Facebook, Loader2, Save, Trash2, CheckCircle, AlertCircle, ExternalLink } from "lucide-react";
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
  const togglePage = trpc.pages.update.useMutation();
  const utils = trpc.useUtils();
  const [connecting, setConnecting] = useState(false);

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

  const handleToggle = async (id: number, isActive: boolean) => {
    try {
      await togglePage.mutateAsync({ id, isActive });
      utils.pages.list.invalidate();
      toast.success(isActive ? "AI agent activated" : "AI agent paused");
    } catch { toast.error("Failed to update page"); }
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
        <div className="space-y-3">
          {pages.map(page => (
            <div key={page.id} className="flex items-center justify-between p-4 bg-white rounded-lg border">
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
                    <span className={`text-xs font-medium flex items-center gap-1 ${page.isActive ? "text-green-600" : "text-amber-600"}`}>
                      {page.isActive ? <><CheckCircle className="w-3 h-3" /> AI Active</> : "AI Paused"}
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  checked={page.isActive}
                  onCheckedChange={(checked) => handleToggle(page.id, checked)}
                />
                <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive" onClick={() => handleDelete(page.id)}>
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          ))}
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
            <TabsTrigger value="billing"><CreditCard className="w-4 h-4 mr-1.5" />Billing</TabsTrigger>
          </TabsList>
          <TabsContent value="profile"><ProfileTab /></TabsContent>
          <TabsContent value="notifications"><NotificationsTab /></TabsContent>
          <TabsContent value="pages"><PagesTab /></TabsContent>
          <TabsContent value="billing"><BillingTab /></TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
