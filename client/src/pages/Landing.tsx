import { Button } from "@/components/ui/button";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import {
  CheckCircle2, ArrowRight, Rocket, Star, TrendingUp,
  Zap, MessageSquare, BellRing, DollarSign, Clock, Users,
  ChevronRight
} from "lucide-react";
import { useEffect, useState, FormEvent } from "react";
import { useLocation } from "wouter";

/* ------------------------------------------------------------------ */
/*  Auth Form (kept from original)                                     */
/* ------------------------------------------------------------------ */
function AuthForm() {
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [, setLocation] = useLocation();
  const utils = trpc.useUtils();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const endpoint = mode === "login" ? "/api/auth/login" : "/api/auth/signup";
      const body: Record<string, string> = { email, password };
      if (mode === "signup" && name) body.name = name;

      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(body),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Something went wrong");
        return;
      }

      await utils.auth.me.invalidate();
      setLocation("/dashboard");
    } catch (err) {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-sm mx-auto">
      <div className="bg-white rounded-2xl p-6 shadow-xl border border-border/30">
        <div className="flex items-center justify-center gap-2 mb-6">
          <div className="w-10 h-10 bg-messenger rounded-xl flex items-center justify-center">
            <Rocket className="w-6 h-6 text-white" />
          </div>
        </div>

        <div className="flex mb-6 bg-muted rounded-lg p-1">
          <button
            type="button"
            className={`flex-1 text-sm font-medium py-2 rounded-md transition-colors ${
              mode === "login"
                ? "bg-white text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
            onClick={() => { setMode("login"); setError(null); }}
          >
            Log In
          </button>
          <button
            type="button"
            className={`flex-1 text-sm font-medium py-2 rounded-md transition-colors ${
              mode === "signup"
                ? "bg-white text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
            onClick={() => { setMode("signup"); setError(null); }}
          >
            Sign Up
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === "signup" && (
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-foreground mb-1.5">
                Name
              </label>
              <input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your name"
                className="w-full h-10 px-3 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-messenger/30 focus:border-messenger transition-colors"
              />
            </div>
          )}

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-foreground mb-1.5">
              Email
            </label>
            <input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="w-full h-10 px-3 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-messenger/30 focus:border-messenger transition-colors"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-foreground mb-1.5">
              Password
            </label>
            <input
              id="password"
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={mode === "signup" ? "Min 6 characters" : "Your password"}
              className="w-full h-10 px-3 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-messenger/30 focus:border-messenger transition-colors"
            />
          </div>

          {error && (
            <div className="text-sm text-destructive bg-destructive/10 rounded-lg px-3 py-2">
              {error}
            </div>
          )}

          <Button
            type="submit"
            disabled={loading}
            className="w-full bg-messenger hover:bg-messenger-dark h-10"
          >
            {loading
              ? "Please wait..."
              : mode === "login"
                ? "Log In"
                : "Create Account"}
          </Button>
        </form>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Pricing data                                                       */
/* ------------------------------------------------------------------ */
const pricingPlans = [
  {
    name: "Free",
    icon: Rocket,
    iconBg: "bg-gray-100 dark:bg-gray-800",
    iconColor: "text-gray-600 dark:text-gray-400",
    monthlyPrice: 0,
    annualPrice: 0,
    features: ["100 active leads", "50 conversations/mo", "1 Facebook Page", "Basic analytics"],
    buttonStyle: "border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700",
    buttonText: "Start Free",
    popular: false,
  },
  {
    name: "Growth",
    icon: TrendingUp,
    iconBg: "bg-messenger/10",
    iconColor: "text-messenger",
    monthlyPrice: 29,
    annualPrice: 23,
    features: ["1,000 active leads", "500 conversations/mo", "1 Facebook Page", "CRM-style pipeline"],
    buttonStyle: "bg-messenger hover:bg-messenger-dark text-white",
    buttonText: "Get Started",
    popular: false,
  },
  {
    name: "Pro",
    icon: Star,
    iconBg: "bg-messenger/10",
    iconColor: "text-messenger",
    monthlyPrice: 69,
    annualPrice: 55,
    features: ["5,000 active leads", "2,500 conversations/mo", "3 Facebook Pages", "Priority support"],
    buttonStyle: "bg-messenger hover:bg-messenger-dark text-white",
    buttonText: "Get Started",
    popular: true,
  },
  {
    name: "Scale",
    icon: Zap,
    iconBg: "bg-slate-100 dark:bg-slate-800",
    iconColor: "text-slate-700 dark:text-slate-300",
    monthlyPrice: 149,
    annualPrice: 119,
    features: ["20,000 active leads", "10,000 conversations/mo", "10 Facebook Pages", "White-label option"],
    buttonStyle: "bg-slate-900 hover:bg-slate-950 text-white dark:bg-slate-800 dark:hover:bg-slate-700",
    buttonText: "Get Started",
    popular: false,
  },
  {
    name: "Custom",
    icon: Star,
    iconBg: "bg-gray-100 dark:bg-gray-800",
    iconColor: "text-gray-600 dark:text-gray-400",
    monthlyPrice: -1,
    annualPrice: -1,
    features: ["Unlimited everything", "Custom setup", "Dedicated account manager", "SSO/SAML"],
    buttonStyle: "border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700",
    buttonText: "Contact Sales",
    popular: false,
  },
];

/* ------------------------------------------------------------------ */
/*  Landing Page                                                       */
/* ------------------------------------------------------------------ */
export default function Landing() {
  const { user, loading } = useAuth();
  const [, setLocation] = useLocation();
  const [annual, setAnnual] = useState(false);

  useEffect(() => {
    if (!loading && user) {
      setLocation("/dashboard");
    }
  }, [user, loading, setLocation]);

  const scrollToAuth = () => {
    document.getElementById("auth-section")?.scrollIntoView({ behavior: "smooth" });
  };

  const scrollToHowItWorks = () => {
    document.getElementById("how-it-works")?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <div className="min-h-screen bg-background">
      {/* ============================================================ */}
      {/*  NAVIGATION                                                   */}
      {/* ============================================================ */}
      <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-lg border-b border-border/50">
        <div className="container flex items-center justify-between h-16">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-messenger rounded-lg flex items-center justify-center">
              <Rocket className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold text-foreground">Rocketeer</span>
          </div>
          <div className="hidden md:flex items-center gap-8">
            <a href="#how-it-works" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">How It Works</a>
            <a href="#pricing" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">Pricing</a>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={scrollToAuth}>
              Log In
            </Button>
            <Button size="sm" className="bg-messenger hover:bg-messenger-dark" onClick={scrollToAuth}>
              Get More Customers
            </Button>
          </div>
        </div>
      </nav>

      {/* ============================================================ */}
      {/*  HERO SECTION                                                 */}
      {/* ============================================================ */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-messenger/5 via-transparent to-messenger-light/20" />
        <div className="container relative py-24 md:py-36">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight text-foreground leading-[1.1] mb-6">
              Turn every message into a{" "}
              <span className="text-messenger">paying customer.</span>
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed">
              We reply to your Facebook leads instantly and notify you when it's time to close.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Button
                size="lg"
                className="bg-messenger hover:bg-messenger-dark text-lg px-8 h-14 shadow-lg shadow-messenger/25"
                onClick={scrollToAuth}
              >
                Get More Customers <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
              <Button
                variant="outline"
                size="lg"
                className="text-lg px-8 h-14 border-border/60"
                onClick={scrollToHowItWorks}
              >
                See How It Works
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* ============================================================ */}
      {/*  PROBLEM SECTION                                              */}
      {/* ============================================================ */}
      <section className="py-20 md:py-28 border-t border-border/50">
        <div className="container">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-6">
              Stop losing leads you already paid for.
            </h2>
            <p className="text-lg md:text-xl text-muted-foreground leading-relaxed max-w-2xl mx-auto">
              Most businesses run Facebook ads but miss leads because they reply too late — or not at all. Every missed message is a lost sale.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 mt-16 max-w-4xl mx-auto">
            {[
              {
                icon: Clock,
                stat: "78%",
                text: "of leads buy from the first business to respond",
              },
              {
                icon: MessageSquare,
                stat: "5 min",
                text: "is the average response time that wins the deal",
              },
              {
                icon: DollarSign,
                stat: "$0",
                text: "is what a missed message earns you",
              },
            ].map((item) => (
              <div key={item.stat} className="text-center">
                <div className="w-14 h-14 bg-messenger/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <item.icon className="w-7 h-7 text-messenger" />
                </div>
                <div className="text-3xl font-extrabold text-foreground mb-1">{item.stat}</div>
                <p className="text-sm text-muted-foreground">{item.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ============================================================ */}
      {/*  HOW IT WORKS (Solution Section)                              */}
      {/* ============================================================ */}
      <section id="how-it-works" className="py-20 md:py-28 bg-white">
        <div className="container">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              Rocketeer handles your leads instantly.
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Three steps. Zero missed leads.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            {[
              {
                step: "1",
                title: "A customer messages your page",
                description: "Someone clicks your Facebook ad or finds your page and sends a message. That's a potential sale.",
                icon: MessageSquare,
              },
              {
                step: "2",
                title: "Rocketeer replies instantly and qualifies them",
                description: "Your leads get an immediate, helpful response — day or night. Rocketeer asks the right questions and figures out who's ready to buy.",
                icon: Zap,
              },
              {
                step: "3",
                title: "You get notified when they're ready to buy",
                description: "No more sifting through messages. You only step in when a lead is serious — so you can focus on closing.",
                icon: BellRing,
              },
            ].map((item) => (
              <div key={item.step} className="relative text-center">
                <div className="w-16 h-16 bg-messenger rounded-2xl flex items-center justify-center mx-auto mb-5 shadow-lg shadow-messenger/20">
                  <item.icon className="w-8 h-8 text-white" />
                </div>
                <div className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-messenger/10 text-messenger text-sm font-bold mb-3">
                  {item.step}
                </div>
                <h3 className="text-lg font-bold text-foreground mb-2">{item.title}</h3>
                <p className="text-muted-foreground leading-relaxed">{item.description}</p>
              </div>
            ))}
          </div>

          {/* Mid-page CTA */}
          <div className="text-center mt-16">
            <Button
              size="lg"
              className="bg-messenger hover:bg-messenger-dark text-lg px-8 h-14 shadow-lg shadow-messenger/25"
              onClick={scrollToAuth}
            >
              Get More Customers <ArrowRight className="ml-2 w-5 h-5" />
            </Button>
          </div>
        </div>
      </section>

      {/* ============================================================ */}
      {/*  VALUE SECTION                                                */}
      {/* ============================================================ */}
      <section className="py-20 md:py-28 border-t border-border/50">
        <div className="container">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              More replies. More customers. More revenue.
            </h2>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 max-w-5xl mx-auto">
            {[
              {
                icon: BellRing,
                title: "Never miss a lead again",
                description: "Every message gets a reply — instantly, around the clock.",
              },
              {
                icon: Zap,
                title: "Faster replies = more conversions",
                description: "Speed wins deals. Be the first business to respond, every time.",
              },
              {
                icon: Users,
                title: "Focus only on serious buyers",
                description: "Stop wasting time on tire-kickers. Talk only to qualified leads.",
              },
              {
                icon: DollarSign,
                title: "Turn conversations into revenue",
                description: "Every chat is a chance to close. Rocketeer makes sure you don't waste it.",
              },
            ].map((item) => (
              <div key={item.title} className="bg-white rounded-2xl p-6 border border-border/50 hover:shadow-md transition-shadow">
                <div className="w-12 h-12 bg-messenger/10 rounded-xl flex items-center justify-center mb-4">
                  <item.icon className="w-6 h-6 text-messenger" />
                </div>
                <h3 className="text-base font-bold text-foreground mb-2">{item.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ============================================================ */}
      {/*  PRICING SECTION                                              */}
      {/* ============================================================ */}
      <section id="pricing" className="py-20 md:py-28 bg-white border-t border-border/50">
        <div className="container">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              Simple, transparent pricing
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Pick a plan that fits your business. Upgrade anytime as you grow.
            </p>
          </div>

          {/* Billing Toggle */}
          <div className="flex items-center justify-center gap-4 mb-12">
            <button
              type="button"
              className={`text-sm font-medium cursor-pointer transition-colors ${!annual ? "text-foreground" : "text-muted-foreground hover:text-foreground"}`}
              onClick={() => setAnnual(false)}
            >
              Monthly
            </button>
            <button
              type="button"
              className={`relative inline-flex h-8 w-14 items-center rounded-full cursor-pointer border-2 transition-colors ${
                annual
                  ? "bg-messenger border-messenger"
                  : "bg-gray-300 border-gray-300 dark:bg-gray-600 dark:border-gray-600"
              }`}
              onClick={() => setAnnual(!annual)}
            >
              <span
                className={`inline-block h-6 w-6 transform rounded-full bg-white shadow-md transition-transform ${
                  annual ? "translate-x-6" : "translate-x-1"
                }`}
              />
            </button>
            <button
              type="button"
              className={`text-sm font-medium cursor-pointer transition-colors ${annual ? "text-foreground" : "text-muted-foreground hover:text-foreground"}`}
              onClick={() => setAnnual(true)}
            >
              Annual
            </button>
            <span
              className={`ml-2 inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold transition-all ${
                annual
                  ? "visible opacity-100 bg-green-100 text-green-700"
                  : "invisible opacity-0"
              }`}
            >
              Save 20%
            </span>
          </div>

          {/* Pricing Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-12">
            {pricingPlans.map((plan) => (
              <div
                key={plan.name}
                className={`relative rounded-2xl p-6 transition-all hover:shadow-md flex flex-col ${
                  plan.popular
                    ? "border-2 border-messenger bg-gradient-to-br from-messenger/5 to-white dark:from-messenger/10 dark:to-gray-900 shadow-lg"
                    : "border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900"
                }`}
              >
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-10">
                    <span className="inline-block bg-messenger text-white text-xs font-bold px-3 py-1 rounded-full whitespace-nowrap">
                      MOST POPULAR
                    </span>
                  </div>
                )}

                <div className="flex items-center gap-3 mb-4 pt-2">
                  <div className={`w-10 h-10 rounded-lg ${plan.iconBg} flex items-center justify-center`}>
                    <plan.icon className={`w-5 h-5 ${plan.iconColor}`} />
                  </div>
                  <h3 className="text-lg font-semibold">{plan.name}</h3>
                </div>

                <div className="mb-6">
                  {plan.monthlyPrice >= 0 ? (
                    <>
                      <span className="text-3xl font-bold">
                        ${annual ? plan.annualPrice : plan.monthlyPrice}
                      </span>
                      <span className="text-muted-foreground">/month</span>
                      <p className="text-xs text-muted-foreground mt-1">
                        {annual ? "billed annually" : "billed monthly"}
                      </p>
                    </>
                  ) : (
                    <>
                      <span className="text-sm text-muted-foreground">Custom pricing</span>
                      <p className="text-xs text-muted-foreground mt-1">Contact sales</p>
                    </>
                  )}
                </div>

                <ul className="space-y-2.5 mb-6 flex-1">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-2 text-sm">
                      <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5 shrink-0" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>

                <Button className={`w-full ${plan.buttonStyle}`} onClick={scrollToAuth}>
                  {plan.buttonText}
                </Button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ============================================================ */}
      {/*  AUTH SECTION                                                 */}
      {/* ============================================================ */}
      <section id="auth-section" className="py-16 md:py-20 bg-gradient-to-b from-background to-white">
        <div className="container">
          <div className="text-center mb-8">
            <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-3">
              Start turning your leads into customers today
            </h2>
            <p className="text-muted-foreground max-w-md mx-auto">
              Create your free account in 30 seconds.
            </p>
          </div>
          <AuthForm />
        </div>
      </section>

      {/* ============================================================ */}
      {/*  BOTTOM CTA                                                   */}
      {/* ============================================================ */}
      <section className="py-20 md:py-28 bg-messenger">
        <div className="container text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Start turning your leads into customers today.
          </h2>
          <p className="text-lg text-white/80 max-w-2xl mx-auto mb-8">
            Every minute you wait, another lead goes cold. Set up Rocketeer in minutes and start closing more deals.
          </p>
          <Button
            size="lg"
            className="bg-white text-messenger hover:bg-white/90 text-lg px-8 h-14 shadow-lg font-bold"
            onClick={scrollToAuth}
          >
            Get Started <ArrowRight className="ml-2 w-5 h-5" />
          </Button>
        </div>
      </section>

      {/* ============================================================ */}
      {/*  FOOTER                                                       */}
      {/* ============================================================ */}
      <footer className="bg-foreground py-12">
        <div className="container">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 bg-messenger rounded-lg flex items-center justify-center">
                <Rocket className="w-4 h-4 text-white" />
              </div>
              <span className="text-lg font-bold text-white">Rocketeer</span>
            </div>
            <p className="text-sm text-white/50">
              &copy; {new Date().getFullYear()} Rocketeer. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
