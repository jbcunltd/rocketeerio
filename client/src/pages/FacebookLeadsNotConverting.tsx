import { useEffect } from "react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import SEO from "@/components/SEO";
import {
  ArrowRight,
  ChevronRight,
  Clock,
  MessageSquare,
  AlertTriangle,
  Target,
  CheckCircle2,
  XCircle,
  Zap,
  BellRing,
  TrendingUp,
  Wrench,
  Home,
  Car,
  Stethoscope,
} from "lucide-react";

const PAGE_TITLE = "Why Your Facebook Leads Aren't Converting";
const PAGE_DESCRIPTION =
  "Most Facebook leads don't convert because of slow replies, weak qualification, and broken follow-up — not because the leads are bad. Here's exactly why, with real industry examples and how to fix it.";
const PAGE_PATH = "/facebook-leads-not-converting";
const PAGE_URL = `https://rocketeerio.com${PAGE_PATH}`;

const REASONS: Array<{
  number: string;
  title: string;
  body: string;
}> = [
  {
    number: "01",
    title: "You're replying too slowly",
    body: "The single biggest reason Facebook leads don't convert is response time. Studies of inbound lead behaviour consistently show conversion rates drop sharply after the first 5 minutes — and fall off a cliff after the first hour. If you're replying in 30 minutes, two hours, or the next morning, the lead has already messaged your competitors and chosen one of them.",
  },
  {
    number: "02",
    title: "Your replies are generic and impersonal",
    body: "Copy-pasted responses like \"Hi, thanks for reaching out, someone will get back to you shortly\" tell the lead they're a number in a queue. Leads who feel ignored disengage immediately. The first reply has to acknowledge what they actually asked, sound human, and move the conversation forward — or the conversation ends right there.",
  },
  {
    number: "03",
    title: "You're not qualifying leads before you reply",
    body: "Without basic qualification — budget, timeline, location, what they actually need — every conversation feels like starting over. You waste time on people who were never going to buy and miss the ones who were ready. Qualifying questions, asked early, separate buyers from browsers.",
  },
  {
    number: "04",
    title: "Nobody is watching the inbox after hours",
    body: "Facebook ads run 24/7. Customer attention does not. A lead that messages you at 9pm or on a Sunday will be gone by Monday morning. If your inbox is only watched during business hours, you're throwing away every lead that comes in outside that window — and that's typically 40–60% of them.",
  },
  {
    number: "05",
    title: "You have no follow-up system",
    body: "Most leads don't buy on the first message. They ask a question, get distracted, and never come back — unless something pulls them back in. Without an automatic follow-up sequence, the leads that didn't close on day one are simply lost. A simple, well-timed follow-up message recovers a meaningful portion of those leads.",
  },
  {
    number: "06",
    title: "Your sales team gets the lead too late — or too cold",
    body: "By the time a hot lead is handed to a closer, the conversation is often hours old, half the context is missing, and the lead has cooled off. Sales should only be pulled in when a lead is qualified and ready — and they should arrive with the full conversation in hand, not a screenshot from yesterday.",
  },
  {
    number: "07",
    title: "You're treating Facebook leads like email leads",
    body: "Facebook and Instagram DMs are conversational. Customers expect a reply in seconds, not a polished email an hour later. If you're applying email-marketing rhythm to messaging-app leads, you're losing them by default. The medium changed. The reply pattern has to change with it.",
  },
];

const MISTAKES = [
  {
    wrong: "Letting leads sit in the Facebook Page inbox until \"someone has time\"",
    right: "Replying within 60 seconds, automatically, every time — day or night",
  },
  {
    wrong: "Sending the same canned \"thanks for your message\" to every lead",
    right: "Acknowledging the actual question and moving the lead toward a decision",
  },
  {
    wrong: "Asking your team to manually qualify every lead in the DMs",
    right: "Letting an automated qualification flow do it before a human ever steps in",
  },
  {
    wrong: "Treating every conversation as equally important",
    right: "Getting alerted only when a lead is qualified and ready to buy",
  },
  {
    wrong: "Spending more on ads to compensate for poor follow-up",
    right: "Converting more of the leads you already paid for",
  },
];

const EXAMPLES = [
  {
    icon: Wrench,
    industry: "Contractors & home services",
    scenario:
      "A homeowner messages three roofers at 9pm asking for a quote. The first to reply gets the site visit. The other two get ignored — even if their pricing is better. Most contractors lose this race because nobody is watching the inbox at 9pm.",
    fix:
      "An instant reply with two qualifying questions (\"What's the size of the property and is the roof leaking now?\") books the visit before the competition wakes up.",
  },
  {
    icon: Home,
    industry: "Real estate & property",
    scenario:
      "A buyer DMs about a listing on a Saturday afternoon. The agent doesn't see it until Monday. By then the buyer has already toured two other properties and is in love with one of them.",
    fix:
      "An automated reply confirms availability, captures pre-approval status, and offers a Saturday or Sunday viewing slot — keeping the listing in the running.",
  },
  {
    icon: Car,
    industry: "Auto dealers & detailers",
    scenario:
      "A shopper asks \"Is the 2022 Civic still available?\" The dealership replies six hours later with \"Yes, when can you come in?\" The shopper has already test-driven a different car at another lot.",
    fix:
      "A 30-second reply confirms availability, sends photos and pricing, asks about trade-in, and books a test drive — all before a human salesperson touches it.",
  },
  {
    icon: Stethoscope,
    industry: "Med spas & local clinics",
    scenario:
      "A prospect asks about pricing for a treatment. The front desk is busy with in-clinic patients and replies hours later. The prospect has already booked a consultation elsewhere.",
    fix:
      "An instant, on-brand reply gives the price range, answers the most common follow-up questions, and offers two open consultation slots in the next 48 hours.",
  },
];

export default function FacebookLeadsNotConverting() {
  const [, setLocation] = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const goToHome = () => setLocation("/");

  const articleSchema = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: PAGE_TITLE,
    description: PAGE_DESCRIPTION,
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": PAGE_URL,
    },
    author: {
      "@type": "Organization",
      name: "Rocketeerio",
      url: "https://rocketeerio.com",
    },
    publisher: {
      "@type": "Organization",
      name: "Rocketeerio",
      url: "https://rocketeerio.com",
      logo: {
        "@type": "ImageObject",
        url: "https://rocketeerio.com/android-chrome-512x512.png",
      },
    },
    image: "https://rocketeerio.com/og-image.png",
    datePublished: "2026-04-19",
    dateModified: "2026-04-19",
  };

  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "Home",
        item: "https://rocketeerio.com/",
      },
      {
        "@type": "ListItem",
        position: 2,
        name: "Why Your Facebook Leads Aren't Converting",
        item: PAGE_URL,
      },
    ],
  };

  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: [
      {
        "@type": "Question",
        name: "Why are my Facebook leads not converting?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Most Facebook leads don't convert because of slow reply times, generic responses, missing qualification, no after-hours coverage, and no follow-up system. The leads themselves are usually fine — the conversion process around them is broken.",
        },
      },
      {
        "@type": "Question",
        name: "How fast do I need to reply to a Facebook lead?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Inside 5 minutes is the benchmark that wins most deals. After 5 minutes, conversion rates drop sharply. After an hour, the lead has usually messaged competitors and made a decision.",
        },
      },
      {
        "@type": "Question",
        name: "Is Rocketeerio a chatbot?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "No. Rocketeerio is a Facebook lead conversion system. It replies instantly, qualifies the lead, follows up automatically, and tells you the moment a lead is ready to close — so you only step in when there's a real sale on the table.",
        },
      },
      {
        "@type": "Question",
        name: "Will Rocketeerio work for my business?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "If you run Facebook or Instagram ads and your customers DM you before they buy — contractors, real estate, auto, med spas, fitness, coaching, local services — Rocketeerio is built for you.",
        },
      },
    ],
  };

  return (
    <div className="min-h-screen bg-background">
      <SEO
        title={PAGE_TITLE}
        description={PAGE_DESCRIPTION}
        path={PAGE_PATH}
        type="article"
        schema={[articleSchema, breadcrumbSchema, faqSchema]}
      />

      {/* ============================================================ */}
      {/*  NAVIGATION                                                   */}
      {/* ============================================================ */}
      <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-lg border-b border-border/50">
        <div className="container flex items-center justify-between h-16 px-4 sm:px-6">
          <Link href="/" className="flex items-center gap-2">
            <img src="/favicon.svg" alt="Rocketeerio" className="w-8 h-8" />
            <span className="text-lg sm:text-xl font-bold text-foreground">Rocketeerio</span>
          </Link>
          <div className="hidden md:flex items-center gap-8">
            <Link href="/" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">Home</Link>
            <Link href="/#how-it-works" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">How It Works</Link>
            <Link href="/#pricing" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">Pricing</Link>
          </div>
          <div className="flex items-center gap-2 sm:gap-3">
            <Button
              size="sm"
              className="bg-messenger hover:bg-messenger-dark text-xs sm:text-sm px-3 sm:px-4"
              onClick={goToHome}
            >
              Start Converting Leads
            </Button>
          </div>
        </div>
      </nav>

      {/* ============================================================ */}
      {/*  BREADCRUMBS                                                  */}
      {/* ============================================================ */}
      <div className="border-b border-border/50 bg-white/50">
        <div className="container px-4 sm:px-6 py-3">
          <nav aria-label="Breadcrumb" className="text-xs sm:text-sm text-muted-foreground">
            <ol className="flex items-center gap-1.5">
              <li>
                <Link href="/" className="hover:text-foreground transition-colors">Home</Link>
              </li>
              <li aria-hidden="true"><ChevronRight className="w-3.5 h-3.5" /></li>
              <li className="text-foreground font-medium" aria-current="page">
                Why Facebook Leads Aren't Converting
              </li>
            </ol>
          </nav>
        </div>
      </div>

      {/* ============================================================ */}
      {/*  HERO                                                         */}
      {/* ============================================================ */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-messenger/5 via-transparent to-messenger-light/20" />
        <div className="container relative py-12 sm:py-20 md:py-28 px-4 sm:px-6">
          <div className="max-w-3xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 rounded-full bg-red-50 border border-red-100 px-3 py-1 mb-6">
              <AlertTriangle className="w-4 h-4 text-red-600" />
              <span className="text-xs sm:text-sm font-semibold text-red-700">The real reason your ad spend isn't paying off</span>
            </div>
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight text-foreground leading-[1.1] mb-6">
              Why your Facebook leads{" "}
              <span className="text-messenger">aren't converting.</span>
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed">
              You're spending money on Facebook ads. Leads are coming in. But the sales aren't following. Here are the seven reasons that's happening — and exactly how to fix every one of them.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Button
                size="lg"
                className="bg-messenger hover:bg-messenger-dark text-lg px-8 h-14 shadow-lg shadow-messenger/25"
                onClick={goToHome}
              >
                Fix This With Rocketeerio <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
              <a
                href="#reasons"
                className="text-base font-semibold text-foreground hover:text-messenger transition-colors"
              >
                Read the 7 reasons ↓
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* ============================================================ */}
      {/*  PROBLEM STATEMENT                                            */}
      {/* ============================================================ */}
      <section className="py-16 md:py-20 bg-white border-t border-border/50">
        <div className="container px-4 sm:px-6">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-foreground mb-6 text-center">
              The leads aren't the problem. The follow-up is.
            </h2>
            <div className="space-y-5 text-base md:text-lg text-muted-foreground leading-relaxed">
              <p>
                If you're running Facebook or Instagram ads, you already know that the leads are out there. People are clicking. People are messaging. The number in your Ads Manager looks right. So why isn't the revenue showing up?
              </p>
              <p>
                In almost every case, the answer is the same: <strong className="text-foreground">the leads are fine — the way they're being handled is what's broken.</strong> Slow replies, generic responses, no qualification, no after-hours coverage, no follow-up. By the time you get back to the lead, they've already become a customer of someone who replied first.
              </p>
              <p>
                Below are the seven specific reasons Facebook leads stop converting, real examples from the industries it hurts most, and the system we built to fix it.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ============================================================ */}
      {/*  7 REASONS                                                    */}
      {/* ============================================================ */}
      <section id="reasons" className="py-20 md:py-28 border-t border-border/50">
        <div className="container px-4 sm:px-6">
          <div className="max-w-3xl mx-auto text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              7 reasons your Facebook leads aren't converting
            </h2>
            <p className="text-lg text-muted-foreground">
              In order of impact. Fix the first three and most businesses see conversion rates double.
            </p>
          </div>

          <div className="max-w-3xl mx-auto space-y-6">
            {REASONS.map((r) => (
              <article
                key={r.number}
                className="bg-white rounded-2xl border border-border/50 p-6 sm:p-8 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start gap-4 sm:gap-6">
                  <div className="shrink-0 w-12 h-12 sm:w-14 sm:h-14 rounded-xl bg-messenger/10 text-messenger flex items-center justify-center font-extrabold text-base sm:text-lg">
                    {r.number}
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg sm:text-xl font-bold text-foreground mb-2">
                      {r.title}
                    </h3>
                    <p className="text-base text-muted-foreground leading-relaxed">
                      {r.body}
                    </p>
                  </div>
                </div>
              </article>
            ))}
          </div>

          {/* Mid-page CTA */}
          <div className="text-center mt-16">
            <Button
              size="lg"
              className="bg-messenger hover:bg-messenger-dark text-lg px-8 h-14 shadow-lg shadow-messenger/25"
              onClick={goToHome}
            >
              See How Rocketeerio Fixes All 7 <ArrowRight className="ml-2 w-5 h-5" />
            </Button>
            <p className="text-xs text-muted-foreground mt-3">No credit card required • Setup in minutes</p>
          </div>
        </div>
      </section>

      {/* ============================================================ */}
      {/*  REAL EXAMPLES                                                */}
      {/* ============================================================ */}
      <section className="py-20 md:py-28 bg-white border-t border-border/50">
        <div className="container px-4 sm:px-6">
          <div className="max-w-3xl mx-auto text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              What this looks like in real businesses
            </h2>
            <p className="text-lg text-muted-foreground">
              Same pattern, different industries. Every one of these conversations happens hundreds of times a day.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6 max-w-5xl mx-auto">
            {EXAMPLES.map((ex) => (
              <article
                key={ex.industry}
                className="bg-background rounded-2xl border border-border/50 p-6 sm:p-7"
              >
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-11 h-11 rounded-xl bg-messenger/10 flex items-center justify-center">
                    <ex.icon className="w-5 h-5 text-messenger" />
                  </div>
                  <h3 className="text-base sm:text-lg font-bold text-foreground">{ex.industry}</h3>
                </div>
                <div className="space-y-4">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-red-600 mb-1.5">
                      What usually happens
                    </p>
                    <p className="text-sm text-muted-foreground leading-relaxed">{ex.scenario}</p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-green-600 mb-1.5">
                      What should happen
                    </p>
                    <p className="text-sm text-foreground leading-relaxed">{ex.fix}</p>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* ============================================================ */}
      {/*  COMMON MISTAKES TABLE                                        */}
      {/* ============================================================ */}
      <section className="py-20 md:py-28 border-t border-border/50">
        <div className="container px-4 sm:px-6">
          <div className="max-w-3xl mx-auto text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              The most common mistakes — and what to do instead
            </h2>
            <p className="text-lg text-muted-foreground">
              If you recognise any of these, you're leaving paid leads on the table every single day.
            </p>
          </div>

          <div className="max-w-4xl mx-auto space-y-3">
            {MISTAKES.map((m) => (
              <div
                key={m.wrong}
                className="grid sm:grid-cols-2 gap-3 sm:gap-6 bg-white rounded-2xl border border-border/50 p-5 sm:p-6"
              >
                <div className="flex items-start gap-3">
                  <XCircle className="w-5 h-5 text-red-500 mt-0.5 shrink-0" />
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-red-600 mb-1">Don't</p>
                    <p className="text-sm sm:text-base text-foreground">{m.wrong}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 sm:border-l sm:border-border/50 sm:pl-6">
                  <CheckCircle2 className="w-5 h-5 text-green-500 mt-0.5 shrink-0" />
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-green-600 mb-1">Do</p>
                    <p className="text-sm sm:text-base text-foreground font-medium">{m.right}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ============================================================ */}
      {/*  ROCKETEERIO AS THE SOLUTION                                  */}
      {/* ============================================================ */}
      <section className="py-20 md:py-28 bg-white border-t border-border/50">
        <div className="container px-4 sm:px-6">
          <div className="max-w-3xl mx-auto text-center mb-16">
            <div className="inline-flex items-center gap-2 rounded-full border border-messenger/20 bg-messenger/5 px-3 py-1 mb-6">
              <Target className="w-4 h-4 text-messenger" />
              <span className="text-xs sm:text-sm font-semibold text-messenger">The fix</span>
            </div>
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              Rocketeerio is the Facebook lead conversion system that fixes all of this.
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Not a chatbot. Not another AI inbox. A purpose-built system for turning Facebook and Instagram leads into paying customers — 24/7, automatically, in seconds.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 max-w-5xl mx-auto">
            {[
              {
                icon: Zap,
                title: "Replies in seconds",
                body: "Every lead gets an instant, personal, on-brand reply — day, night, weekends, holidays.",
              },
              {
                icon: MessageSquare,
                title: "Qualifies automatically",
                body: "Asks the right questions to separate buyers from browsers before a human ever steps in.",
              },
              {
                icon: BellRing,
                title: "Hot-lead alerts",
                body: "When a lead is qualified and ready to close, you get pinged — with the full conversation in hand.",
              },
              {
                icon: TrendingUp,
                title: "Built-in follow-up",
                body: "Leads that don't close on day one get pulled back in automatically, recovering revenue you'd otherwise lose.",
              },
            ].map((b) => (
              <div key={b.title} className="bg-background rounded-2xl p-6 border border-border/50">
                <div className="w-12 h-12 bg-messenger/10 rounded-xl flex items-center justify-center mb-4">
                  <b.icon className="w-6 h-6 text-messenger" />
                </div>
                <h3 className="text-base font-bold text-foreground mb-2">{b.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{b.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ============================================================ */}
      {/*  FAQ                                                          */}
      {/* ============================================================ */}
      <section className="py-20 md:py-28 border-t border-border/50">
        <div className="container px-4 sm:px-6">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-12 text-center">
              Frequently asked questions
            </h2>
            <div className="space-y-4">
              {[
                {
                  q: "Why are my Facebook leads not converting?",
                  a: "Almost always: slow replies, generic responses, no qualification, no after-hours coverage, and no follow-up. The leads are fine — the conversion process around them is what's broken.",
                },
                {
                  q: "How fast do I really need to reply to a Facebook lead?",
                  a: "Inside 5 minutes is the benchmark that wins most deals. After 5 minutes, conversion drops sharply. After an hour, the lead has usually messaged competitors and chosen one.",
                },
                {
                  q: "Is Rocketeerio just another chatbot?",
                  a: "No. Rocketeerio is a Facebook lead conversion system. It replies instantly, qualifies, follows up, and tells you the exact moment a lead is ready to close — so you only step in when there's a real sale on the table.",
                },
                {
                  q: "Will it work for my industry?",
                  a: "If you run Facebook or Instagram ads and your customers DM you before they buy — contractors, real estate, auto, med spas, fitness, coaching, local services — Rocketeerio is built for you.",
                },
                {
                  q: "How long does setup take?",
                  a: "Most businesses are live in under 10 minutes. Connect your Facebook Page, point it at your knowledge base, and Rocketeerio starts replying instantly.",
                },
              ].map((f) => (
                <details
                  key={f.q}
                  className="bg-white rounded-xl border border-border/50 p-5 sm:p-6 group"
                >
                  <summary className="flex items-center justify-between cursor-pointer list-none">
                    <h3 className="text-base sm:text-lg font-semibold text-foreground pr-4">{f.q}</h3>
                    <ChevronRight className="w-5 h-5 text-muted-foreground transition-transform group-open:rotate-90 shrink-0" />
                  </summary>
                  <p className="mt-4 text-sm sm:text-base text-muted-foreground leading-relaxed">
                    {f.a}
                  </p>
                </details>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ============================================================ */}
      {/*  FINAL CTA                                                    */}
      {/* ============================================================ */}
      <section className="py-12 sm:py-20 md:py-28 bg-messenger">
        <div className="container text-center px-4 sm:px-6">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white mb-4">
            Stop losing the leads you already paid for.
          </h2>
          <p className="text-lg text-white/80 max-w-2xl mx-auto mb-8">
            Rocketeerio replies in seconds, qualifies every lead, and tells you exactly when to close.
          </p>
          <Button
            size="lg"
            className="bg-white text-messenger hover:bg-white/90 text-lg px-8 h-14 shadow-lg font-bold"
            onClick={goToHome}
          >
            Start Converting Leads <ArrowRight className="ml-2 w-5 h-5" />
          </Button>
          <p className="text-xs text-white/70 mt-3">No credit card required • Setup in minutes</p>
        </div>
      </section>

      {/* ============================================================ */}
      {/*  FOOTER                                                       */}
      {/* ============================================================ */}
      <footer className="bg-foreground py-12">
        <div className="container px-4 sm:px-6">
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8 mb-8">
            <div>
              <Link href="/" className="flex items-center gap-2 mb-3">
                <img src="/favicon.svg" alt="Rocketeerio" className="w-7 h-7" />
                <span className="text-lg font-bold text-white">Rocketeerio</span>
              </Link>
              <p className="text-sm text-white/60 leading-relaxed">
                The Facebook lead conversion system that turns DMs into paying customers.
              </p>
            </div>
            <div>
              <h4 className="text-sm font-semibold text-white mb-3">Product</h4>
              <ul className="space-y-2 text-sm text-white/60">
                <li><Link href="/#how-it-works" className="hover:text-white transition-colors">How It Works</Link></li>
                <li><Link href="/#pricing" className="hover:text-white transition-colors">Pricing</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-sm font-semibold text-white mb-3">Resources</h4>
              <ul className="space-y-2 text-sm text-white/60">
                <li>
                  <Link href="/facebook-leads-not-converting" className="hover:text-white transition-colors">
                    Why Facebook leads aren't converting
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="text-sm font-semibold text-white mb-3">Company</h4>
              <ul className="space-y-2 text-sm text-white/60">
                <li><Link href="/privacy" className="hover:text-white transition-colors">Privacy</Link></li>
                <li><Link href="/terms" className="hover:text-white transition-colors">Terms</Link></li>
              </ul>
            </div>
          </div>
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 pt-8 border-t border-white/10">
            <p className="text-sm text-white/50">
              &copy; {new Date().getFullYear()} Rocketeerio. All rights reserved.
            </p>
            <p className="text-sm text-white/50">
              Built for businesses that run Facebook & Instagram ads.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
