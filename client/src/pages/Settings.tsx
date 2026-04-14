import { useAuth } from "@/_core/hooks/useAuth";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { trpc } from "@/lib/trpc";
import { User, Bell, CreditCard, Facebook, Loader2, Save, Trash2 } from "lucide-react";
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
      <div>
        <h3 className="text-lg font-bold mb-1">Connected Facebook Pages</h3>
        <p className="text-sm text-muted-foreground">Manage your connected pages and their AI agent settings.</p>
      </div>
      {!pages?.length ? (
        <div className="text-center py-12 bg-white rounded-lg border">
          <Facebook className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
          <p className="text-muted-foreground">No pages connected yet.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {pages.map(page => (
            <div key={page.id} className="flex items-center justify-between p-4 bg-white rounded-lg border">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-messenger-light rounded-lg flex items-center justify-center">
                  <Facebook className="w-5 h-5 text-messenger" />
                </div>
                <div>
                  <p className="font-medium">{page.pageName}</p>
                  <p className="text-xs text-muted-foreground">{page.category || "Business"} · {page.isActive ? "Active" : "Paused"}</p>
                </div>
              </div>
              <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive" onClick={() => handleDelete(page.id)}>
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          ))}
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
  return (
    <DashboardLayout>
      <div className="max-w-3xl">
        <div className="mb-6">
          <h1 className="text-2xl font-bold">Settings</h1>
          <p className="text-muted-foreground">Manage your account, notifications, and integrations.</p>
        </div>
        <Tabs defaultValue="profile">
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
