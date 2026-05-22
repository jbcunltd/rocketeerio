import Image from "next/image";
import type { LucideIcon } from "lucide-react";
import {
  ArrowRight,
  Bell,
  CheckCircle2,
  Clock3,
  Facebook,
  Filter,
  Languages,
  LineChart,
  MessageCircle,
  MousePointerClick,
  PlayCircle,
  Rocket,
  Sparkles,
  Store,
  Target,
  Users,
  Zap,
} from "lucide-react";
import { ChatPreview } from "@/components/chat-preview";
import { FAQAccordion, type FAQItem } from "@/components/faq-accordion";
import { TrustBadges } from "@/components/trust-badges";

const FACEBOOK_AUTH_HREF = "/api/auth/facebook";

const FAQ: FAQItem[] = [
  {
    q: "What happens after I click Get Started with Facebook?",
    a: "You will connect the Facebook Page where your leads message you. Rocketeerio then uses that connection to help Josh respond to Messenger conversations, qualify leads, and prepare hot-lead summaries for you.",
  },
  {
    q: "Is there really a free tier?",
    a: "Yes. The free tier is designed so small business owners can connect a Facebook Page, test Josh with a limited number of leads, and understand the workflow before upgrading to a paid plan.",
  },
  {
    q: "Will Josh reply in a way that fits my business?",
    a: "Josh is trained on your offer, service area, pricing rules, qualifying questions, and tone. You can keep him professional, friendly, direct, or conversational depending on how your business normally sells.",
  },
  {
    q: "Can I take over the conversation anytime?",
    a: "Yes. Josh is meant to qualify and prepare the conversation, not trap you outside your own inbox. When a lead is ready, you can step in with the context Josh collected.",
  },
  {
    q: "Does this work for businesses in the Philippines?",
    a: "Yes. Rocketeerio is positioned for Facebook-first businesses in the Philippines that receive inquiries through Messenger, especially businesses running Meta ads and replying manually today.",
  },
  {
    q: "Do I need developers or complicated setup?",
    a: "No. The main setup step is connecting your Facebook Page, then answering a few questions about how you qualify leads. Josh is built for owners and operators, not engineering teams.",
  },
];

const HOW_IT_WORKS = [
  {
    n: "01",
    icon: Facebook,
    title: "Connect your Facebook Page",
    body: "Use Facebook Login to connect the Page where leads already message you after seeing your ads, posts, or Marketplace listings.",
  },
  {
    n: "02",
    icon: MessageCircle,
    title: "Josh replies and qualifies",
    body: "Josh answers fast, asks your qualifying questions, and keeps the lead engaged while you are serving customers or off the clock.",
  },
  {
    n: "03",
    icon: Bell,
    title: "You get hot-lead handoffs",
    body: "When a lead shows intent, Josh summarizes budget, timeline, need, and next step so you know exactly when to jump in.",
  },
];

const FEATURES = [
  {
    icon: Clock3,
    title: "24/7 Messenger coverage",
    desc: "Josh keeps the inbox staffed after store hours, during weekends, and while your team is busy closing current customers.",
  },
  {
    icon: Filter,
    title: "Lead qualification scripts",
    desc: "Ask about budget, location, urgency, preferred schedule, vehicle model, property type, or any detail your sales process needs.",
  },
  {
    icon: Sparkles,
    title: "AI replies trained on your offer",
    desc: "Josh uses your business details so replies feel useful, specific, and consistent with the way you want customers handled.",
  },
  {
    icon: Bell,
    title: "Hot-lead notifications",
    desc: "You do not need to dig through cold chats. Josh flags serious buyers and sends a plain-English summary for faster follow-up.",
  },
  {
    icon: Languages,
    title: "Local-friendly conversations",
    desc: "Built for the practical way Filipino customers inquire on Facebook: quick questions, mixed English and Tagalog, and mobile-first chat.",
  },
  {
    icon: LineChart,
    title: "Conversion-focused dashboard",
    desc: "Track connected Pages, lead activity, Josh settings, and the conversations that are most likely to become revenue.",
  },
];

const PROOF_POINTS = [
  "For Facebook-first small businesses in the Philippines",
  "Free tier available before you scale",
  "Designed for Messenger leads from Meta ads",
];

const PRICING = [
  {
    name: "Free",
    price: "$0",
    cadence: "to start",
    description: "Best for testing Josh on a connected Facebook Page before committing.",
    features: ["Connect a Facebook Page", "Limited AI lead replies", "Basic qualification flow", "Upgrade only when ready"],
    badge: "Start here",
  },
  {
    name: "Starter",
    price: "$49",
    cadence: "/month",
    description: "Best for owner-operated businesses that get regular Messenger inquiries.",
    features: ["More monthly lead conversations", "Custom qualifying questions", "Hot-lead summaries", "Messenger-first sales workflow"],
    badge: "For small teams",
    featured: true,
  },
  {
    name: "Growth",
    price: "$99",
    cadence: "/month",
    description: "Best for advertisers with steady Meta spend and multiple daily leads.",
    features: ["Higher lead volume", "Priority setup support", "Advanced Josh tuning", "Owner-ready handoff workflow"],
    badge: "For scaling ads",
  },
];

const AUDIENCES = [
  { icon: Store, label: "Local services", copy: "clinics, salons, repair shops, contractors" },
  { icon: Users, label: "High-touch sellers", copy: "real estate, auto, insurance, education" },
  { icon: Target, label: "Meta advertisers", copy: "teams paying for leads that land in Messenger" },
];

function PrimaryCTA({ label = "Hire Josh for Sales" }: { label?: string }) {
  return (
    <a
      href={FACEBOOK_AUTH_HREF}
      className="group inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-brand-600 px-6 py-4 text-base font-semibold text-white shadow-xl shadow-brand-500/30 transition-all hover:-translate-y-0.5 hover:bg-brand-700 hover:shadow-2xl hover:shadow-brand-500/40 focus:outline-none focus:ring-2 focus:ring-brand-500/40 sm:w-auto"
    >
      <Facebook className="h-5 w-5" aria-hidden />
      {label}
      <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" aria-hidden />
    </a>
  );
}

function SecondaryCTA({ href, label }: { href: string; label: string }) {
  return (
    <a
      href={href}
      className="inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-ink-200 bg-white/90 px-6 py-4 text-base font-medium text-ink-900 shadow-sm transition-all hover:-translate-y-0.5 hover:border-brand-300 hover:bg-brand-50 focus:outline-none focus:ring-2 focus:ring-brand-500/30 sm:w-auto"
    >
      <PlayCircle className="h-5 w-5 text-brand-600" aria-hidden />
      {label}
    </a>
  );
}

function ProofItem({ children }: { children: string }) {
  return (
    <div className="flex items-center justify-center gap-2 rounded-full border border-ink-100 bg-white px-4 py-2 text-sm font-medium text-ink-700 shadow-sm">
      <CheckCircle2 className="h-4 w-4 flex-none text-mint" aria-hidden />
      <span>{children}</span>
    </div>
  );
}

function IconBadge({ Icon }: { Icon: LucideIcon }) {
  return (
    <span className="grid h-12 w-12 place-items-center rounded-2xl bg-brand-50 text-brand-600 ring-1 ring-brand-100">
      <Icon className="h-6 w-6" aria-hidden />
    </span>
  );
}

function FeatureCard({ Icon, title, desc }: { Icon: LucideIcon; title: string; desc: string }) {
  return (
    <article className="group rounded-[1.75rem] border border-ink-100 bg-white p-7 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-brand-200 hover:shadow-xl hover:shadow-brand-900/10">
      <IconBadge Icon={Icon} />
      <h3 className="mt-5 text-xl font-semibold tracking-tight text-ink-900">{title}</h3>
      <p className="mt-3 leading-relaxed text-ink-600">{desc}</p>
    </article>
  );
}

function StepCard({ n, Icon, title, body, featured }: { n: string; Icon: LucideIcon; title: string; body: string; featured?: boolean }) {
  return (
    <article
      className={`relative overflow-hidden rounded-[2rem] border p-7 ${
        featured
          ? "border-brand-300 bg-brand-500 text-white shadow-2xl shadow-brand-950/30"
          : "border-white/10 bg-white/[0.06] text-white shadow-xl shadow-black/10"
      }`}
    >
      <div className="flex items-center justify-between gap-4">
        <span className={featured ? "text-sm font-medium text-white/70" : "text-sm font-medium text-brand-200"}>{n}</span>
        <span className={featured ? "grid h-12 w-12 place-items-center rounded-2xl bg-white/15" : "grid h-12 w-12 place-items-center rounded-2xl bg-white/10 text-brand-200"}>
          <Icon className="h-6 w-6" aria-hidden />
        </span>
      </div>
      <h3 className="mt-8 text-2xl font-semibold tracking-tight">{title}</h3>
      <p className={featured ? "mt-3 leading-relaxed text-white/85" : "mt-3 leading-relaxed text-white/70"}>{body}</p>
    </article>
  );
}

function PricingCard({ plan }: { plan: (typeof PRICING)[number] }) {
  return (
    <article
      className={`relative flex h-full flex-col rounded-[2rem] border p-7 shadow-sm ${
        plan.featured
          ? "border-brand-300 bg-white shadow-2xl shadow-brand-900/15 ring-4 ring-brand-100"
          : "border-ink-100 bg-white/85"
      }`}
    >
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-2xl font-semibold tracking-tight text-ink-900">{plan.name}</h3>
        <span className="rounded-full bg-brand-50 px-3 py-1 text-xs font-medium uppercase tracking-[0.16em] text-brand-700">
          {plan.badge}
        </span>
      </div>
      <div className="mt-6 flex items-end gap-1">
        <span className="text-5xl font-bold tracking-tight text-ink-900">{plan.price}</span>
        <span className="pb-2 text-sm font-medium text-ink-500">{plan.cadence}</span>
      </div>
      <p className="mt-4 min-h-16 leading-relaxed text-ink-600">{plan.description}</p>
      <ul className="mt-6 space-y-3 text-sm font-medium text-ink-700">
        {plan.features.map((feature) => (
          <li key={feature} className="flex gap-2">
            <CheckCircle2 className="mt-0.5 h-4 w-4 flex-none text-brand-600" aria-hidden />
            <span>{feature}</span>
          </li>
        ))}
      </ul>
      <div className="mt-8">
        <PrimaryCTA label={plan.name === "Free" ? "Start free with Facebook" : "Get Started with Facebook"} />
      </div>
    </article>
  );
}

export default function HomePage() {
  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: FAQ.map(({ q, a }) => ({
      "@type": "Question",
      name: q,
      acceptedAnswer: { "@type": "Answer", text: a },
    })),
  };

  const productSchema = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: "Josh by Rocketeerio",
    description:
      "AI lead qualification platform for small businesses. Business owners connect their Facebook Page and Josh qualifies incoming Messenger leads 24/7.",
    brand: { "@type": "Brand", name: "Rocketeerio" },
    offers: {
      "@type": "AggregateOffer",
      priceCurrency: "USD",
      lowPrice: "0",
      highPrice: "99",
      offerCount: 3,
    },
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(productSchema) }} />

      <section className="relative isolate overflow-hidden bg-[linear-gradient(135deg,#f7fbff_0%,#ffffff_42%,#eef7ff_100%)]">
        <div aria-hidden className="absolute inset-0 bg-grid opacity-70" />
        <div aria-hidden className="absolute left-1/2 top-0 h-[540px] w-[840px] -translate-x-1/2 rounded-full bg-brand-200/45 blur-3xl" />
        <div aria-hidden className="absolute -right-24 top-24 h-80 w-80 rounded-full bg-mint/20 blur-3xl animate-blob" />

        <div className="relative mx-auto max-w-7xl px-4 pb-16 pt-10 sm:px-6 sm:pb-20 sm:pt-16 lg:px-8 lg:pb-28 lg:pt-20">
          <div className="grid items-center gap-10 lg:grid-cols-12 lg:gap-14">
            <div className="lg:col-span-7">
              <div className="inline-flex items-center gap-2 rounded-full border border-brand-200 bg-white/80 px-3 py-1.5 text-xs font-medium uppercase tracking-[0.18em] text-brand-700 shadow-sm">
                <Rocket className="h-3.5 w-3.5" aria-hidden />
                AI sales agent for Messenger leads
              </div>

              <h1 className="mt-6 max-w-4xl text-[2.65rem] font-bold leading-[0.98] tracking-[-0.055em] text-ink-900 text-balance sm:text-6xl lg:text-[5.35rem]">
                Turn Facebook messages into qualified leads, even while you sleep.
              </h1>

              <p className="mt-6 max-w-2xl text-lg leading-8 text-ink-700 sm:text-xl">
                Rocketeerio gives your business an AI sales agent named Josh. Connect your Facebook Page, and Josh replies to incoming Messenger leads 24/7, asks qualifying questions, and alerts you when a customer is ready to buy.
              </p>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <PrimaryCTA />
                <SecondaryCTA href="#how-it-works" label="See how it works" />
              </div>

              <div className="mt-5 flex flex-wrap gap-2 text-sm font-medium text-ink-700">
                {PROOF_POINTS.map((point) => (
                  <ProofItem key={point}>{point}</ProofItem>
                ))}
              </div>

              <div className="mt-7">
                <TrustBadges variant="light" />
              </div>
            </div>

            <div id="josh-demo" className="scroll-mt-24 lg:col-span-5">
              <div className="relative">
                <div aria-hidden className="absolute -inset-5 rounded-[2.5rem] bg-gradient-to-br from-brand-400/25 via-white to-mint/20 blur-2xl" />
                <ChatPreview />
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="border-y border-ink-100 bg-white py-8" aria-label="Conversion proof points">
        <div className="mx-auto grid max-w-7xl gap-4 px-4 sm:px-6 md:grid-cols-3 lg:px-8">
          <div className="rounded-3xl bg-ink-50 p-6 text-center">
            <p className="text-3xl font-bold tracking-tight text-ink-900">24/7</p>
            <p className="mt-1 text-sm font-normal text-ink-600">Messenger coverage without hiring night shift staff.</p>
          </div>
          <div className="rounded-3xl bg-brand-600 p-6 text-center text-white shadow-xl shadow-brand-500/25">
            <p className="text-3xl font-bold tracking-tight">Free</p>
            <p className="mt-1 text-sm font-normal text-white/85">Tier available so owners can try Josh first.</p>
          </div>
          <div className="rounded-3xl bg-ink-50 p-6 text-center">
            <p className="text-3xl font-bold tracking-tight text-ink-900">FB-first</p>
            <p className="mt-1 text-sm font-normal text-ink-600">Built for leads that start in Facebook Messenger.</p>
          </div>
        </div>
      </section>

      <section id="how-it-works" className="relative overflow-hidden bg-ink-900 py-20 text-white sm:py-28">
        <div aria-hidden className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,_rgba(0,132,255,0.28),_transparent_55%)]" />
        <div aria-hidden className="absolute bottom-0 right-0 h-[420px] w-[420px] rounded-full bg-mint/10 blur-3xl" />
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-10 lg:grid-cols-12 lg:items-end">
            <div className="lg:col-span-7">
              <p className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-medium uppercase tracking-[0.18em] text-brand-200">
                <MousePointerClick className="h-3.5 w-3.5" aria-hidden />
                How it works
              </p>
              <h2 className="mt-5 text-4xl font-bold tracking-[-0.045em] sm:text-5xl lg:text-6xl">
                Connect Facebook once. Let Josh qualify leads every day.
              </h2>
            </div>
            <p className="lg:col-span-5 text-lg leading-8 text-white/70">
              The funnel is intentionally simple for busy owners. Josh works inside the lead channel you already use and hands you the conversations that deserve attention.
            </p>
          </div>

          <div className="mt-12 grid gap-6 lg:grid-cols-3">
            {HOW_IT_WORKS.map((step, index) => (
              <StepCard key={step.title} n={step.n} Icon={step.icon} title={step.title} body={step.body} featured={index === 1} />
            ))}
          </div>
        </div>
      </section>

      <section id="features" className="bg-white py-20 sm:py-28">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl">
            <p className="text-sm font-medium uppercase tracking-[0.2em] text-brand-700">Feature breakdown</p>
            <h2 className="mt-4 text-4xl font-bold tracking-[-0.045em] text-ink-900 sm:text-5xl">
              Everything Josh does is built to convert Messenger inquiries faster.
            </h2>
            <p className="mt-5 text-lg leading-8 text-ink-600">
              Rocketeerio is not a generic chat widget. It is a lead qualification workflow for owners who already get Facebook messages and need a dependable first responder.
            </p>
          </div>

          <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map((feature) => (
              <FeatureCard key={feature.title} Icon={feature.icon} title={feature.title} desc={feature.desc} />
            ))}
          </div>
        </div>
      </section>

      <section className="border-y border-ink-100 bg-ink-50/70 py-20 sm:py-28">
        <div className="mx-auto grid max-w-7xl gap-10 px-4 sm:px-6 lg:grid-cols-12 lg:px-8">
          <div className="lg:col-span-5">
            <p className="text-sm font-medium uppercase tracking-[0.2em] text-brand-700">Built for Philippine SMBs</p>
            <h2 className="mt-4 text-4xl font-bold tracking-[-0.045em] text-ink-900 sm:text-5xl">
              If your customers DM before they buy, Josh can protect the sale.
            </h2>
            <p className="mt-5 text-lg leading-8 text-ink-600">
              Filipino customers often ask quick questions on mobile before visiting, booking, or paying. Josh makes sure those first questions get answered while the lead is still interested.
            </p>
          </div>
          <div className="grid gap-5 lg:col-span-7">
            {AUDIENCES.map((audience) => (
              <article key={audience.label} className="flex gap-5 rounded-[1.75rem] border border-ink-100 bg-white p-6 shadow-sm">
                <IconBadge Icon={audience.icon} />
                <div>
                  <h3 className="text-xl font-semibold tracking-tight text-ink-900">{audience.label}</h3>
                  <p className="mt-2 leading-relaxed text-ink-600">{audience.copy}</p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 sm:py-28" aria-label="Meet Josh">
        <div className="mx-auto grid max-w-7xl gap-12 px-4 sm:px-6 lg:grid-cols-12 lg:items-center lg:px-8">
          <div className="lg:col-span-5">
            <div className="relative overflow-hidden rounded-[2.25rem] border border-ink-100 bg-ink-50 shadow-2xl shadow-brand-900/10">
              <Image
                src="/josh-cover.jpg"
                alt="Josh, Rocketeerio's AI sales agent for Messenger leads"
                width={900}
                height={1100}
                className="h-[430px] w-full object-cover sm:h-[540px]"
                priority
              />
              <div className="absolute inset-x-5 bottom-5 rounded-3xl border border-white/40 bg-white/90 p-5 shadow-xl backdrop-blur">
                <p className="text-xs font-medium uppercase tracking-[0.2em] text-brand-700">Your AI sales agent</p>
                <p className="mt-1 text-xl font-semibold text-ink-900">Josh is ready to work the inbox.</p>
              </div>
            </div>
          </div>
          <div className="lg:col-span-7">
            <p className="text-sm font-medium uppercase tracking-[0.2em] text-brand-700">Meet Josh</p>
            <h2 className="mt-4 text-4xl font-bold tracking-[-0.045em] text-ink-900 sm:text-5xl">
              A professional first responder for every Facebook lead.
            </h2>
            <div className="mt-6 space-y-4 text-lg leading-8 text-ink-700">
              <p>
                Josh is trained to greet new leads, ask the questions your sales process needs, and keep the conversation moving until a real buying signal appears.
              </p>
              <p>
                He does not replace the owner. He protects your time by making sure you only jump into the conversations that are worth your attention.
              </p>
            </div>
            <div className="mt-8 rounded-[1.75rem] border border-brand-100 bg-brand-50 p-6">
              <p className="text-sm font-medium uppercase tracking-[0.18em] text-brand-700">Josh is responsible for</p>
              <ul className="mt-4 grid gap-3 text-sm font-medium text-ink-700 sm:grid-cols-2">
                {[
                  "Fast first replies",
                  "Qualification questions",
                  "Follow-up prompts",
                  "Hot-lead summaries",
                ].map((item) => (
                  <li key={item} className="flex gap-2">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 flex-none text-brand-600" aria-hidden />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      <section id="pricing" className="bg-[linear-gradient(180deg,#f4f8ff_0%,#ffffff_100%)] py-20 sm:py-28">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <p className="text-sm font-medium uppercase tracking-[0.2em] text-brand-700">Pricing</p>
            <h2 className="mt-4 text-4xl font-bold tracking-[-0.045em] text-ink-900 sm:text-5xl">
              Start free, then scale when Josh is helping you win more leads.
            </h2>
            <p className="mt-5 text-lg leading-8 text-ink-600">
              Every plan starts with the same primary step: connect Facebook and let Josh begin qualifying Messenger conversations.
            </p>
          </div>

          <div className="mt-14 grid gap-6 lg:grid-cols-3">
            {PRICING.map((plan) => (
              <PricingCard key={plan.name} plan={plan} />
            ))}
          </div>
        </div>
      </section>

      <section id="faq" className="py-20 sm:py-28">
        <div className="mx-auto grid max-w-7xl gap-10 px-4 sm:px-6 lg:grid-cols-12 lg:px-8">
          <div className="lg:col-span-5">
            <p className="text-sm font-medium uppercase tracking-[0.2em] text-brand-700">FAQ</p>
            <h2 className="mt-4 text-4xl font-bold tracking-[-0.045em] text-ink-900 sm:text-5xl">
              Clear answers before you connect your Page.
            </h2>
            <p className="mt-5 text-lg leading-8 text-ink-600">
              Rocketeerio is built for owners who want less manual inbox work and a practical path from Facebook inquiry to qualified customer.
            </p>
            <div className="mt-8 hidden lg:block">
              <PrimaryCTA label="Get Started with Facebook" />
            </div>
          </div>
          <div className="lg:col-span-7">
            <FAQAccordion items={FAQ} />
          </div>
        </div>
      </section>

      <section id="cta" className="px-4 pb-20 sm:px-6 sm:pb-28 lg:px-8">
        <div className="mx-auto max-w-7xl overflow-hidden rounded-[2.5rem] bg-ink-900 px-6 py-14 text-center text-white shadow-2xl shadow-ink-900/30 sm:px-12 sm:py-20">
          <div className="mx-auto max-w-3xl">
            <p className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-medium uppercase tracking-[0.18em] text-brand-200">
              <Zap className="h-3.5 w-3.5" aria-hidden />
              Stop letting warm leads go cold
            </p>
            <h2 className="mt-5 text-4xl font-bold tracking-[-0.045em] sm:text-5xl">
              Hire Josh today and give every Messenger lead a fast first reply.
            </h2>
            <p className="mx-auto mt-5 max-w-2xl text-lg leading-8 text-white/72">
              Connect your Facebook Page, test the free tier, and see how an AI sales agent can qualify leads before you step in.
            </p>
            <div className="mt-8 flex justify-center">
              <PrimaryCTA label="Hire Josh for Sales" />
            </div>
            <p className="mt-5 text-sm font-medium text-white/75">Facebook Login signup · Free tier available · Built for Messenger leads</p>
          </div>
        </div>
      </section>
    </>
  );
}
