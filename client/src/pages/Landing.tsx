import { Button } from "@/components/ui/button";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import {
  Zap, MessageCircle, BarChart3, Bell, Clock, Shield,
  CheckCircle2, ArrowRight, Rocket, Star, TrendingUp
} from "lucide-react";
import { useEffect, useState, FormEvent } from "react";
import { useLocation } from "wouter";

const features = [
  {
    icon: MessageCircle,
    title: "AI-Powered Conversations",
    description: "Your AI agent responds to every Messenger lead in under 5 seconds, 24/7. No more missed opportunities from slow response times.",
  },
  {
    icon: BarChart3,
    title: "BANT Lead Scoring",
    description: "Automatically score leads on Budget, Authority, Need, and Timeline. Know exactly which prospects are ready to buy.",
  },
  {
    icon: Bell,
    title: "Instant Hot Lead Alerts",
    description: "Get SMS and email notifications the moment a high-value lead is detected. Never miss a hot prospect again.",
  },
  {
    icon: Zap,
    title: "Knowledge Base RAG",
    description: "Upload your products, pricing, and FAQs. The AI answers questions accurately using your real business data.",
  },
  {
    icon: Clock,
    title: "Automated Follow-Ups",
    description: "Smart follow-up sequences at 30 min, 2 hours, and 12 hours keep leads engaged without lifting a finger.",
  },
  {
    icon: Shield,
    title: "Conversation Dashboard",
    description: "See every conversation, lead score, and conversion metric in one clean dashboard. Full visibility into your pipeline.",
  },
];

const pricingPlans = [
  {
    name: "Starter",
    price: "$49",
    period: "/month",
    description: "Perfect for small businesses with one Facebook Page",
    features: [
      "1 Facebook Page",
      "Up to 500 conversations/mo",
      "AI auto-replies",
      "BANT lead scoring",
      "Email notifications",
      "Basic knowledge base",
    ],
    cta: "Get Started",
    popular: false,
  },
  {
    name: "Growth",
    price: "$149",
    period: "/month",
    description: "For growing businesses managing multiple pages",
    features: [
      "Up to 5 Facebook Pages",
      "Unlimited conversations",
      "AI auto-replies + follow-ups",
      "BANT lead scoring",
      "SMS + Email notifications",
      "Advanced knowledge base",
      "Priority support",
      "Conversion analytics",
    ],
    cta: "Start Growing",
    popular: true,
  },
  {
    name: "Scale",
    price: "$299",
    period: "/month",
    description: "For agencies and enterprises with high volume",
    features: [
      "Unlimited Facebook Pages",
      "Unlimited conversations",
      "AI auto-replies + follow-ups",
      "Advanced BANT scoring",
      "SMS + Email + Webhook alerts",
      "Custom AI persona",
      "Dedicated account manager",
      "API access",
      "White-label option",
    ],
    cta: "Scale Up",
    popular: false,
  },
];

const stats = [
  { value: "< 5s", label: "Average Response Time" },
  { value: "3.2x", label: "More Leads Qualified" },
  { value: "24/7", label: "Always-On Coverage" },
  { value: "89%", label: "Lead Engagement Rate" },
];

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

      // Invalidate auth cache and redirect
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
      <div className="bg-white rounded-xl p-6 card-shadow border border-border/50">
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

export default function Landing() {
  const { user, loading } = useAuth();
  const [, setLocation] = useLocation();

  // If already authenticated, redirect to dashboard
  useEffect(() => {
    if (!loading && user) {
      setLocation("/dashboard");
    }
  }, [user, loading, setLocation]);

  const scrollToAuth = () => {
    document.getElementById("auth-section")?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-lg border-b border-border/50">
        <div className="container flex items-center justify-between h-16">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-messenger rounded-lg flex items-center justify-center">
              <Rocket className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold text-foreground">Rocketeer</span>
          </div>
          <div className="hidden md:flex items-center gap-8">
            <a href="#features" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">Features</a>
            <a href="#pricing" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">Pricing</a>
            <a href="#how-it-works" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">How It Works</a>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={scrollToAuth}>
              Log In
            </Button>
            <Button size="sm" className="bg-messenger hover:bg-messenger-dark" onClick={scrollToAuth}>
              Get Started Free
            </Button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-messenger/5 via-transparent to-messenger-light/30" />
        <div className="container relative py-20 md:py-32">
          <div className="max-w-3xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-messenger-light rounded-full text-messenger text-sm font-semibold mb-6">
              <Zap className="w-4 h-4" />
              AI Sales Agent for Facebook Messenger
            </div>
            <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight text-foreground leading-tight mb-6">
              Turn Every Messenger Lead Into a{" "}
              <span className="text-messenger">Paying Customer</span>
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-8 leading-relaxed">
              Rocketeer connects to your Facebook Pages and instantly qualifies every lead with AI. Get real-time alerts for hot prospects and never miss a sale again.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Button size="lg" className="bg-messenger hover:bg-messenger-dark text-lg px-8 h-14 shadow-lg shadow-messenger/25" onClick={scrollToAuth}>
                Start Free <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
              <Button variant="outline" size="lg" className="text-lg px-8 h-14" onClick={() => document.getElementById("how-it-works")?.scrollIntoView({ behavior: "smooth" })}>
                See How It Works
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Bar */}
      <section className="border-y bg-white">
        <div className="container py-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat) => (
              <div key={stat.label} className="text-center">
                <div className="text-3xl md:text-4xl font-extrabold text-messenger mb-1">{stat.value}</div>
                <div className="text-sm text-muted-foreground font-medium">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Auth Section */}
      <section id="auth-section" className="py-16 md:py-20 bg-gradient-to-b from-background to-white">
        <div className="container">
          <div className="text-center mb-8">
            <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-3">
              Get Started with Rocketeer
            </h2>
            <p className="text-muted-foreground max-w-md mx-auto">
              Create your account or log in to start qualifying leads with AI.
            </p>
          </div>
          <AuthForm />
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 md:py-28">
        <div className="container">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              Everything You Need to Close More Deals
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              From instant AI responses to intelligent lead scoring, Rocketeer handles the entire sales conversation so you can focus on closing.
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature) => (
              <div key={feature.title} className="bg-white rounded-xl p-6 card-shadow hover:shadow-lg transition-shadow border border-border/50">
                <div className="w-12 h-12 bg-messenger-light rounded-xl flex items-center justify-center mb-4">
                  <feature.icon className="w-6 h-6 text-messenger" />
                </div>
                <h3 className="text-lg font-bold text-foreground mb-2">{feature.title}</h3>
                <p className="text-muted-foreground leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-20 md:py-28 bg-white">
        <div className="container">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              How Rocketeer Works
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Get up and running in under 10 minutes. No coding required.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            {[
              { step: "1", title: "Connect Your Page", description: "Link your Facebook Page with one click. Rocketeer handles all the OAuth and permissions automatically.", icon: MessageCircle },
              { step: "2", title: "Upload Your Info", description: "Add your products, pricing, and FAQs. The AI uses this to answer questions accurately and qualify leads.", icon: TrendingUp },
              { step: "3", title: "Get Hot Lead Alerts", description: "Sit back while the AI qualifies leads 24/7. Get instant SMS alerts when a hot prospect is ready to buy.", icon: Bell },
            ].map((item) => (
              <div key={item.step} className="text-center">
                <div className="w-16 h-16 bg-messenger rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-messenger/20">
                  <item.icon className="w-8 h-8 text-white" />
                </div>
                <div className="text-sm font-bold text-messenger mb-2">Step {item.step}</div>
                <h3 className="text-xl font-bold text-foreground mb-2">{item.title}</h3>
                <p className="text-muted-foreground">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-20 md:py-28">
        <div className="container">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              Simple, Transparent Pricing
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Start with a 14-day free trial. No credit card required.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {pricingPlans.map((plan) => (
              <div
                key={plan.name}
                className={`relative bg-white rounded-xl p-8 card-shadow border-2 transition-shadow hover:shadow-lg ${
                  plan.popular ? "border-messenger" : "border-transparent"
                }`}
              >
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <div className="flex items-center gap-1 px-3 py-1 bg-messenger text-white text-xs font-bold rounded-full">
                      <Star className="w-3 h-3" /> Most Popular
                    </div>
                  </div>
                )}
                <div className="mb-6">
                  <h3 className="text-xl font-bold text-foreground mb-1">{plan.name}</h3>
                  <p className="text-sm text-muted-foreground mb-4">{plan.description}</p>
                  <div className="flex items-baseline gap-1">
                    <span className="text-4xl font-extrabold text-foreground">{plan.price}</span>
                    <span className="text-muted-foreground">{plan.period}</span>
                  </div>
                </div>
                <ul className="space-y-3 mb-8">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-2 text-sm">
                      <CheckCircle2 className="w-4 h-4 text-success mt-0.5 shrink-0" />
                      <span className="text-foreground">{feature}</span>
                    </li>
                  ))}
                </ul>
                <Button
                  className={`w-full ${plan.popular ? "bg-messenger hover:bg-messenger-dark" : ""}`}
                  variant={plan.popular ? "default" : "outline"}
                  onClick={scrollToAuth}
                >
                  {plan.cta}
                </Button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-20 md:py-28 bg-background border-t border-border/50">
        <div className="container">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">Simple, Transparent Pricing</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">Choose the perfect plan for your business. Scale up as you grow.</p>
          </div>

          {/* Billing Period Toggle */}
          <div className="flex items-center justify-center gap-4 mb-12">
            <button className="text-sm font-medium cursor-pointer transition-colors text-foreground">
              Monthly
            </button>
            <button className="relative inline-flex h-8 w-14 items-center rounded-full cursor-pointer border-2 transition-colors bg-gray-300 border-gray-300 dark:bg-gray-600 dark:border-gray-600">
              <span className="inline-block h-6 w-6 transform rounded-full bg-white shadow-md transition-transform translate-x-1" />
            </button>
            <button className="text-sm font-medium cursor-pointer transition-colors text-muted-foreground hover:text-foreground">
              Annual
            </button>
            <span className="ml-2 inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold invisible opacity-0 transition-all">
              Save 20%
            </span>
          </div>

          {/* Pricing Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-12">
            {/* Free Tier */}
            <div className="relative rounded-xl border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900 p-6 transition-all hover:shadow-md flex flex-col">
              <div className="flex items-center gap-3 mb-4 pt-2">
                <div className="w-10 h-10 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                  <Rocket className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                </div>
                <h3 className="text-lg font-semibold">Free</h3>
              </div>
              <div className="mb-6">
                <span className="text-3xl font-bold">$0</span>
                <span className="text-muted-foreground">/month</span>
                <p className="text-xs text-muted-foreground mt-1">billed monthly</p>
              </div>
              <ul className="space-y-2.5 mb-6 flex-1">
                <li className="flex items-start gap-2 text-sm">
                  <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5 shrink-0" />
                  <span>100 active leads</span>
                </li>
                <li className="flex items-start gap-2 text-sm">
                  <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5 shrink-0" />
                  <span>50 AI conversations/mo</span>
                </li>
                <li className="flex items-start gap-2 text-sm">
                  <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5 shrink-0" />
                  <span>1 Facebook Page</span>
                </li>
                <li className="flex items-start gap-2 text-sm">
                  <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5 shrink-0" />
                  <span>Basic analytics</span>
                </li>
              </ul>
              <Button className="w-full border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700" onClick={scrollToAuth}>
                Start Free
              </Button>
            </div>

            {/* Growth Tier */}
            <div className="relative rounded-xl border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900 p-6 transition-all hover:shadow-md flex flex-col">
              <div className="flex items-center gap-3 mb-4 pt-2">
                <div className="w-10 h-10 rounded-lg bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                  <TrendingUp className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                </div>
                <h3 className="text-lg font-semibold">Growth</h3>
              </div>
              <div className="mb-6">
                <span className="text-3xl font-bold">$29</span>
                <span className="text-muted-foreground">/month</span>
                <p className="text-xs text-muted-foreground mt-1">billed monthly</p>
              </div>
              <ul className="space-y-2.5 mb-6 flex-1">
                <li className="flex items-start gap-2 text-sm">
                  <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5 shrink-0" />
                  <span>1,000 active leads</span>
                </li>
                <li className="flex items-start gap-2 text-sm">
                  <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5 shrink-0" />
                  <span>500 AI conversations/mo</span>
                </li>
                <li className="flex items-start gap-2 text-sm">
                  <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5 shrink-0" />
                  <span>1 Facebook Page</span>
                </li>
                <li className="flex items-start gap-2 text-sm">
                  <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5 shrink-0" />
                  <span>CRM-style pipeline</span>
                </li>
              </ul>
              <Button className="w-full bg-purple-600 hover:bg-purple-700 text-white" onClick={scrollToAuth}>
                Subscribe
              </Button>
            </div>

            {/* Pro Tier - Most Popular */}
            <div className="relative rounded-xl border-2 border-purple-600 bg-gradient-to-br from-purple-50 to-white dark:from-purple-900/30 dark:to-gray-900 p-6 transition-all hover:shadow-md flex flex-col shadow-lg">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-10">
                <span className="inline-block bg-purple-600 text-white text-xs font-bold px-3 py-1 rounded-full whitespace-nowrap">
                  MOST POPULAR
                </span>
              </div>
              <div className="flex items-center gap-3 mb-4 pt-2">
                <div className="w-10 h-10 rounded-lg bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                  <Star className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                </div>
                <h3 className="text-lg font-semibold">Pro</h3>
              </div>
              <div className="mb-6">
                <span className="text-3xl font-bold">$69</span>
                <span className="text-muted-foreground">/month</span>
                <p className="text-xs text-muted-foreground mt-1">billed monthly</p>
              </div>
              <ul className="space-y-2.5 mb-6 flex-1">
                <li className="flex items-start gap-2 text-sm">
                  <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5 shrink-0" />
                  <span>5,000 active leads</span>
                </li>
                <li className="flex items-start gap-2 text-sm">
                  <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5 shrink-0" />
                  <span>2,500 AI conversations/mo</span>
                </li>
                <li className="flex items-start gap-2 text-sm">
                  <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5 shrink-0" />
                  <span>3 Facebook Pages</span>
                </li>
                <li className="flex items-start gap-2 text-sm">
                  <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5 shrink-0" />
                  <span>API access</span>
                </li>
              </ul>
              <Button className="w-full bg-white border-2 border-purple-600 text-purple-600 hover:bg-purple-50 dark:bg-gray-800 dark:text-purple-400 dark:hover:bg-gray-700" onClick={scrollToAuth}>
                Subscribe
              </Button>
            </div>

            {/* Scale Tier */}
            <div className="relative rounded-xl border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900 p-6 transition-all hover:shadow-md flex flex-col">
              <div className="flex items-center gap-3 mb-4 pt-2">
                <div className="w-10 h-10 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                  <Zap className="w-5 h-5 text-slate-700 dark:text-slate-300" />
                </div>
                <h3 className="text-lg font-semibold">Scale</h3>
              </div>
              <div className="mb-6">
                <span className="text-3xl font-bold">$149</span>
                <span className="text-muted-foreground">/month</span>
                <p className="text-xs text-muted-foreground mt-1">billed monthly</p>
              </div>
              <ul className="space-y-2.5 mb-6 flex-1">
                <li className="flex items-start gap-2 text-sm">
                  <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5 shrink-0" />
                  <span>20,000 active leads</span>
                </li>
                <li className="flex items-start gap-2 text-sm">
                  <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5 shrink-0" />
                  <span>10,000 AI conversations/mo</span>
                </li>
                <li className="flex items-start gap-2 text-sm">
                  <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5 shrink-0" />
                  <span>10 Facebook Pages</span>
                </li>
                <li className="flex items-start gap-2 text-sm">
                  <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5 shrink-0" />
                  <span>White-label option</span>
                </li>
              </ul>
              <Button className="w-full bg-slate-900 hover:bg-slate-950 text-white dark:bg-slate-800 dark:hover:bg-slate-700" onClick={scrollToAuth}>
                Subscribe
              </Button>
            </div>

            {/* Custom Tier */}
            <div className="relative rounded-xl border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900 p-6 transition-all hover:shadow-md flex flex-col">
              <div className="flex items-center gap-3 mb-4 pt-2">
                <div className="w-10 h-10 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                  <Star className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                </div>
                <h3 className="text-lg font-semibold">Custom</h3>
              </div>
              <div className="mb-6">
                <span className="text-sm text-muted-foreground">Custom pricing</span>
                <p className="text-xs text-muted-foreground mt-1">Contact sales</p>
              </div>
              <ul className="space-y-2.5 mb-6 flex-1">
                <li className="flex items-start gap-2 text-sm">
                  <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5 shrink-0" />
                  <span>Unlimited everything</span>
                </li>
                <li className="flex items-start gap-2 text-sm">
                  <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5 shrink-0" />
                  <span>Custom AI fine-tuning</span>
                </li>
                <li className="flex items-start gap-2 text-sm">
                  <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5 shrink-0" />
                  <span>Dedicated CSM</span>
                </li>
                <li className="flex items-start gap-2 text-sm">
                  <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5 shrink-0" />
                  <span>SSO/SAML</span>
                </li>
              </ul>
              <Button className="w-full border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700" onClick={scrollToAuth}>
                Contact Sales
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 md:py-28 bg-messenger">
        <div className="container text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Ready to Stop Losing Leads?
          </h2>
          <p className="text-lg text-white/80 max-w-2xl mx-auto mb-8">
            Join hundreds of businesses using Rocketeer to qualify leads 24/7 and close more deals from their Facebook ads.
          </p>
          <Button
            size="lg"
            className="bg-white text-messenger hover:bg-white/90 text-lg px-8 h-14 shadow-lg font-bold"
            onClick={scrollToAuth}
          >
            Start Your Free Trial <ArrowRight className="ml-2 w-5 h-5" />
          </Button>
        </div>
      </section>

      {/* Footer */}
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
