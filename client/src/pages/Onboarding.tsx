import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { trpc } from "@/lib/trpc";
import { Facebook, BookOpen, Bell, CheckCircle2, ArrowRight, Loader2 } from "lucide-react";
import { useState } from "react";
import { useLocation } from "wouter";
import { toast } from "sonner";

export default function Onboarding() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const [step, setStep] = useState(1);

  // Step 1: Connect Facebook Page
  const [pageName, setPageName] = useState("");
  const [pageCategory, setPageCategory] = useState("");

  // Step 2: Business Info
  const [kbEntries, setKbEntries] = useState<Array<{ title: string; content: string; category: "product" | "pricing" | "faq" | "policy" | "general" }>>([
    { title: "", content: "", category: "product" },
  ]);

  // Step 3: Notifications
  const [smsEnabled, setSmsEnabled] = useState(true);
  const [emailEnabled, setEmailEnabled] = useState(true);
  const [phone, setPhone] = useState("");
  const [notifEmail, setNotifEmail] = useState(user?.email || "");

  const createPage = trpc.pages.create.useMutation();
  const createKb = trpc.knowledgeBase.create.useMutation();
  const updateNotifs = trpc.notifications.update.useMutation();
  const updateProfile = trpc.user.updateProfile.useMutation();

  const handleStep1 = async () => {
    if (!pageName.trim()) { toast.error("Please enter your page name"); return; }
    try {
      await createPage.mutateAsync({
        pageId: `page_${Date.now()}`,
        pageName: pageName.trim(),
        category: pageCategory || "Business",
      });
      setStep(2);
    } catch (err: any) {
      const msg = err?.message || "";
      if (msg.includes("limit") || msg.includes("Upgrade")) {
        toast.error(msg);
      } else {
        toast.error("Failed to connect page");
      }
    }
  };

  const handleStep2 = async () => {
    try {
      for (const entry of kbEntries) {
        if (entry.title.trim() && entry.content.trim()) {
          await createKb.mutateAsync({
            title: entry.title.trim(),
            content: entry.content.trim(),
            category: entry.category,
          });
        }
      }
      setStep(3);
    } catch { toast.error("Failed to save business info"); }
  };

  const handleStep3 = async () => {
    try {
      await updateNotifs.mutateAsync({
        smsEnabled,
        emailEnabled,
        hotLeadSms: smsEnabled,
        hotLeadEmail: emailEnabled,
        smsPhone: phone,
        notificationEmail: notifEmail,
      });
      await updateProfile.mutateAsync({ onboardingCompleted: true });
      toast.success("Setup complete! Welcome to Rocketeerio.");
      setLocation("/dashboard");
    } catch { toast.error("Failed to save preferences"); }
  };

  const steps = [
    { num: 1, title: "Connect Page", icon: Facebook },
    { num: 2, title: "Business Info", icon: BookOpen },
    { num: 3, title: "Notifications", icon: Bell },
  ];

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <div className="border-b bg-white">
        <div className="container flex items-center h-16">
          <div className="flex items-center gap-2">
            <img src="/favicon.svg" alt="Rocketeerio" className="w-8 h-8" />
            <span className="text-xl font-bold">Rocketeerio</span>
          </div>
        </div>
      </div>

      <div className="flex-1 container py-4 sm:py-8 px-4 sm:px-6 max-w-2xl mx-auto">
        {/* Progress Steps */}
        <div className="flex items-center justify-center gap-2 sm:gap-4 mb-6 sm:mb-10">
          {steps.map((s, i) => (
            <div key={s.num} className="flex items-center gap-2">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold transition-colors ${
                step > s.num ? "bg-success text-white" : step === s.num ? "bg-messenger text-white" : "bg-muted text-muted-foreground"
              }`}>
                {step > s.num ? <CheckCircle2 className="w-5 h-5" /> : s.num}
              </div>
              <span className={`text-sm font-medium hidden sm:inline ${step === s.num ? "text-foreground" : "text-muted-foreground"}`}>
                {s.title}
              </span>
              {i < steps.length - 1 && <div className="w-12 h-0.5 bg-border mx-2" />}
            </div>
          ))}
        </div>

        {/* Step Content */}
        <div className="bg-white rounded-xl p-4 sm:p-8 card-shadow">
          {step === 1 && (
            <div>
              <div className="flex items-start sm:items-center gap-3 mb-6">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-messenger-light rounded-xl flex items-center justify-center shrink-0">
                  <Facebook className="w-5 h-5 sm:w-6 sm:h-6 text-messenger" />
                </div>
                <div className="min-w-0">
                  <h2 className="text-lg sm:text-xl font-bold">Connect Your Facebook Page</h2>
                  <p className="text-sm text-muted-foreground">Link your business page to start receiving AI-powered lead qualification.</p>
                </div>
              </div>
              <div className="space-y-4">
                <div>
                  <Label>Page Name</Label>
                  <Input placeholder="e.g., My Business Page" value={pageName} onChange={e => setPageName(e.target.value)} className="mt-1.5" />
                </div>
                <div>
                  <Label>Category (optional)</Label>
                  <Input placeholder="e.g., Local Business, E-commerce" value={pageCategory} onChange={e => setPageCategory(e.target.value)} className="mt-1.5" />
                </div>
                <div className="bg-messenger-light/50 rounded-lg p-4 text-sm text-muted-foreground">
                  <p className="font-medium text-foreground mb-1">How it works:</p>
                  <p>In production, this step connects via Facebook OAuth. For the MVP, enter your page details manually and the AI agent will be ready to handle conversations.</p>
                </div>
              </div>
              <Button className="w-full mt-6 bg-messenger hover:bg-messenger-dark h-12" onClick={handleStep1} disabled={createPage.isPending}>
                {createPage.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                Connect Page <ArrowRight className="ml-2 w-4 h-4" />
              </Button>
            </div>
          )}

          {step === 2 && (
            <div>
              <div className="flex items-start sm:items-center gap-3 mb-6">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-messenger-light rounded-xl flex items-center justify-center shrink-0">
                  <BookOpen className="w-5 h-5 sm:w-6 sm:h-6 text-messenger" />
                </div>
                <div className="min-w-0">
                  <h2 className="text-lg sm:text-xl font-bold">Add Your Business Info</h2>
                  <p className="text-sm text-muted-foreground">The AI uses this to answer questions and qualify leads accurately.</p>
                </div>
              </div>
              <div className="space-y-4">
                {kbEntries.map((entry, idx) => (
                  <div key={idx} className="border rounded-lg p-4 space-y-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <Label className="text-sm font-semibold">Entry {idx + 1}</Label>
                      <select
                        value={entry.category}
                        onChange={e => {
                          const updated = [...kbEntries];
                          updated[idx] = { ...updated[idx], category: e.target.value as any };
                          setKbEntries(updated);
                        }}
                        className="text-xs border rounded px-2 py-1 flex-shrink-0"
                      >
                        <option value="product">Product</option>
                        <option value="pricing">Pricing</option>
                        <option value="faq">FAQ</option>
                        <option value="policy">Policy</option>
                        <option value="general">General</option>
                      </select>
                    </div>
                    <Input
                      placeholder="Title (e.g., Product Overview)"
                      value={entry.title}
                      onChange={e => {
                        const updated = [...kbEntries];
                        updated[idx] = { ...updated[idx], title: e.target.value };
                        setKbEntries(updated);
                      }}
                    />
                    <Textarea
                      placeholder="Content (e.g., We offer premium home renovation services...)"
                      value={entry.content}
                      onChange={e => {
                        const updated = [...kbEntries];
                        updated[idx] = { ...updated[idx], content: e.target.value };
                        setKbEntries(updated);
                      }}
                      rows={3}
                    />
                  </div>
                ))}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setKbEntries([...kbEntries, { title: "", content: "", category: "general" as const }])}
                >
                  + Add Another Entry
                </Button>
              </div>
              <div className="flex gap-3 mt-6">
                <Button variant="outline" onClick={() => setStep(1)} className="flex-1 h-12">Back</Button>
                <Button className="flex-1 bg-messenger hover:bg-messenger-dark h-12" onClick={handleStep2} disabled={createKb.isPending}>
                  {createKb.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                  Continue <ArrowRight className="ml-2 w-4 h-4" />
                </Button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div>
              <div className="flex items-start sm:items-center gap-3 mb-6">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-messenger-light rounded-xl flex items-center justify-center shrink-0">
                  <Bell className="w-5 h-5 sm:w-6 sm:h-6 text-messenger" />
                </div>
                <div className="min-w-0">
                  <h2 className="text-lg sm:text-xl font-bold">Set Notification Preferences</h2>
                  <p className="text-sm text-muted-foreground">Choose how you want to be alerted about hot leads.</p>
                </div>
              </div>
              <div className="space-y-6">
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <p className="font-medium">SMS Notifications</p>
                    <p className="text-sm text-muted-foreground">Get instant SMS when a hot lead is detected</p>
                  </div>
                  <Switch checked={smsEnabled} onCheckedChange={setSmsEnabled} />
                </div>
                {smsEnabled && (
                  <div>
                    <Label>Phone Number</Label>
                    <Input placeholder="+1 (555) 000-0000" value={phone} onChange={e => setPhone(e.target.value)} className="mt-1.5" />
                  </div>
                )}
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <p className="font-medium">Email Notifications</p>
                    <p className="text-sm text-muted-foreground">Receive email alerts for hot and warm leads</p>
                  </div>
                  <Switch checked={emailEnabled} onCheckedChange={setEmailEnabled} />
                </div>
                {emailEnabled && (
                  <div>
                    <Label>Email Address</Label>
                    <Input placeholder="you@example.com" value={notifEmail} onChange={e => setNotifEmail(e.target.value)} className="mt-1.5" />
                  </div>
                )}
              </div>
              <div className="flex gap-3 mt-6">
                <Button variant="outline" onClick={() => setStep(2)} className="flex-1 h-12">Back</Button>
                <Button className="flex-1 bg-messenger hover:bg-messenger-dark h-12" onClick={handleStep3} disabled={updateNotifs.isPending}>
                  {updateNotifs.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                  Complete Setup <CheckCircle2 className="ml-2 w-4 h-4" />
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Skip option */}
        <div className="text-center mt-4">
          <button
            onClick={async () => {
              await updateProfile.mutateAsync({ onboardingCompleted: true });
              setLocation("/dashboard");
            }}
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            Skip for now and explore the dashboard
          </button>
        </div>
      </div>
    </div>
  );
}
