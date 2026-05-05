import Link from "next/link";
import {
  ArrowRight,
  Bell,
  Filter,
  Hammer,
  Home as HomeIcon,
  MessageSquare,
  PlayCircle,
  Rocket,
  Sparkles,
  Star,
  Target,
  TrendingUp,
  Truck,
  Zap,
} from "lucide-react";
import { ChatPreview } from "@/components/chat-preview";
import { SectionHeading, Eyebrow } from "@/components/section-heading";
import { FAQAccordion, type FAQItem } from "@/components/faq-accordion";
import { EmailCaptureForm } from "@/components/email-capture-form";
import { SocialProofStats } from "@/components/social-proof-stats";
import { TrustBadges } from "@/components/trust-badges";

const FAQ: FAQItem[] = [
  {
    q: "How fast does Rocketeerio actually reply to a Facebook lead?",
    a: "Under 60 seconds, every time. The moment a lead messages your Facebook Page or fills out a Lead Ad form, our AI sends a personalized reply, asks the qualifying questions you set up, and keeps the conversation moving — even if it's 2am.",
  },
  {
    q: "Will it sound like a robot or like my business?",
    a: "Like your business. You give Rocketeerio your tone, your offer, and your pricing rules. The AI mirrors how you talk to customers — friendly, direct, on-brand. Most leads can't tell they're talking to AI until you take over to close.",
  },
  {
    q: "Do I need to be technical to set this up?",
    a: "No. You connect your Facebook Page in two clicks, paste in a few details about your business, and you're live. The average setup takes under 10 minutes — no developers, no Zapier spaghetti.",
  },
  {
    q: "What channels does Rocketeerio support?",
    a: "Facebook Messenger, Instagram DMs, and Facebook Lead Ads. If your customers can message you on Meta, Rocketeerio can reply, qualify, and route them to you.",
  },
  {
    q: "How does the hot-lead alert work?",
    a: "When a lead hits your qualifying criteria — budget, timeline, intent — Rocketeerio pings your phone (SMS or app), drops the full conversation in your CRM, and tags the lead as ready to close. You step in only when it matters.",
  },
  {
    q: "What's the money-back guarantee?",
    a: "14 days, no questions asked. If Rocketeerio doesn't reply faster, qualify cleaner, or route hot leads to you, email us and we refund 100%.",
  },
];

const FEATURES = [
  {
    icon: Zap,
    title: "Instant replies, even at 2am",
    desc: "Every lead gets a personalized first reply in under 60 seconds — the single biggest factor in whether they buy from you or your competitor.",
  },
  {
    icon: Filter,
    title: "Auto-qualification that respects your time",
    desc: "Budget, timeline, location, intent. Rocketeerio asks the questions you'd ask — so the leads that reach your inbox are the ones worth closing.",
  },
  {
    icon: Bell,
    title: "Hot-lead alerts to your phone",
    desc: "When a lead is ready to buy, you get a push, an SMS, and a tagged conversation. No more inbox archaeology to find the gold.",
  },
  {
    icon: MessageSquare,
    title: "Messenger + Instagram, one inbox",
    desc: "Stop juggling tabs. Every conversation across Meta lands in one place, with full lead context attached.",
  },
  {
    icon: Sparkles,
    title: "Brand-trained AI replies",
    desc: "Train Rocketeerio on your offer, pricing, and tone. It mirrors how you talk to customers — not generic chatbot fluff.",
  },
  {
    icon: TrendingUp,
    title: "Built-in pipeline + analytics",
    desc: "See response time, qualification rate, hot-lead conversion, and revenue per lead. The metrics that actually move the needle.",
  },
];

const VERTICALS = [
  {
    icon: Hammer,
    title: "Contractors",
    body:
      "Quote requests come in at 9pm. Whoever replies first books the job. Rocketeerio replies in seconds — even when you're on the roof or asleep.",
  },
  {
    icon: HomeIcon,
    title: "Real estate",
    body:
      "Buyers DM about listings on weekends. Reply Monday and the showing is already booked with another agent. Rocketeerio keeps you first, every time.",
  },
  {
    icon: Truck,
    title: "Auto & dealerships",
    body:
      '"Is it still available?" If you take six hours to answer, they\'ve already test-driven a different car at another lot. Rocketeerio answers in 30 seconds.',
  },
];

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
    name: "Rocketeerio",
    description:
      "AI-powered Facebook lead conversion system that replies instantly, qualifies leads, and alerts you when to close.",
    brand: { "@type": "Brand", name: "Rocketeerio" },
    offers: {
      "@type": "AggregateOffer",
      priceCurrency: "USD",
      lowPrice: "0",
      highPrice: "199",
      offerCount: 3,
    },
    aggregateRating: {
      "@type": "AggregateRating",
      ratingValue: "4.9",
      reviewCount: "127",
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(productSchema) }}
      />

      {/* HERO */}
      <section className="relative overflow-hidden">
        <div aria-hidden className="absolute inset-0 bg-grid opacity-60" />
        <div aria-hidden className="absolute inset-x-0 top-0 h-[680px] bg-radial-fade" />
        <div
          aria-hidden
          className="absolute -top-24 -right-24 h-[420px] w-[420px] rounded-full bg-brand-200/40 blur-3xl animate-blob"
        />

        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-14 pb-20 sm:pt-20 sm:pb-28">
          <div className="grid items-center gap-12 lg:grid-cols-12">
            <div className="lg:col-span-7">
              <Eyebrow>The Facebook Lead Conversion System</Eyebrow>

              <h1 className="mt-5 text-[2rem] sm:text-5xl lg:text-[3.75rem] font-bold leading-[1.1] sm:leading-[1.05] tracking-tight text-ink-900 text-balance break-words">
                Stop losing the{" "}
                <span className="relative inline-block text-brand-500">
                  Facebook leads
                  <svg
                    aria-hidden
                    viewBox="0 0 300 14"
                    className="absolute left-0 -bottom-2 w-full"
                    preserveAspectRatio="none"
                  >
                    <path
                      d="M2 9 C 80 1, 220 1, 298 9"
                      stroke="currentColor"
                      strokeWidth="3"
                      strokeLinecap="round"
                      fill="none"
                    />
                  </svg>
                </span>{" "}
                you already paid for.
              </h1>

              <p className="mt-6 max-w-xl text-lg leading-relaxed text-ink-700">
                Rocketeerio auto-replies to every Facebook lead in{" "}
                <strong className="text-ink-900">under 60 seconds</strong>,
                qualifies them with AI, and pings you the moment one is ready
                to close. Join{" "}
                <strong className="text-ink-900">500+ businesses</strong>{" "}
                getting 3× faster lead response and 40% lower cost per close.
              </p>

              <div className="mt-8 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                <Link
                  href="/signup"
                  className="group inline-flex w-full sm:w-auto items-center justify-center gap-2 rounded-xl bg-brand-600 px-6 py-3.5 text-base font-semibold text-white shadow-lg shadow-brand-500/30 hover:bg-brand-700 hover:shadow-xl hover:shadow-brand-500/40 focus:outline-none focus:ring-2 focus:ring-brand-500/40 transition-all"
                >
                  Start Free Trial
                  <ArrowRight className="h-4.5 w-4.5 transition-transform group-hover:translate-x-0.5" />
                </Link>
                <Link
                  href="#how-it-works"
                  className="inline-flex w-full sm:w-auto items-center justify-center gap-2 rounded-xl border border-ink-300 bg-white px-6 py-3.5 text-base font-semibold text-ink-900 hover:bg-ink-50 hover:border-brand-500 transition-colors"
                >
                  <PlayCircle className="h-5 w-5 text-brand-600" aria-hidden />
                  See it in action
                </Link>
              </div>

              <div className="mt-6">
                <TrustBadges variant="light" />
              </div>

              <div className="mt-10 grid grid-cols-3 gap-6 max-w-lg">
                <Stat value="<60s" label="Avg first reply" />
                <Stat value="3×" label="Faster lead response" />
                <Stat value="40%" label="Lower cost per close" />
              </div>
            </div>

            <div className="lg:col-span-5">
              <ChatPreview />
            </div>
          </div>
        </div>
      </section>

      {/* LOGO BAR */}
      <section className="border-y border-ink-100 bg-ink-50/40 py-8" aria-label="Trusted by">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <p className="text-center text-xs font-semibold uppercase tracking-[0.2em] text-ink-700">
            As featured in · Trusted by 500+ businesses running Meta ads
          </p>
          <div className="mt-6 overflow-hidden">
            <div className="flex animate-marquee gap-12 whitespace-nowrap text-ink-500">
              {[0, 1].map((n) => (
                <div key={n} className="flex items-center gap-12">
                  {[
                    "MetaPress",
                    "AdWeek",
                    "DigitalToday",
                    "GrowthLab",
                    "MarketerMag",
                    "SaaSDigest",
                    "LocalBizPro",
                    "Conversion.io",
                  ].map((name) => (
                    <span
                      key={name + n}
                      className="text-xl sm:text-2xl font-bold tracking-tight"
                    >
                      {name}
                    </span>
                  ))}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* PROBLEM / SOLUTION */}
      <section className="py-20 sm:py-28">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-12 lg:grid-cols-12 lg:gap-16 items-start">
            <div className="lg:col-span-5">
              <Eyebrow>The real cost of slow replies</Eyebrow>
              <h2 className="mt-4 text-3xl sm:text-4xl lg:text-[2.75rem] font-bold tracking-tight text-ink-900 leading-tight">
                You&apos;re not losing leads because of bad ads.{" "}
                <span className="text-brand-500">
                  You&apos;re losing them because nobody replied in time.
                </span>
              </h2>
              <p className="mt-5 text-lg leading-relaxed text-ink-600">
                Every Facebook lead that messages your page is comparing you to
                two or three other businesses at the same time. Whoever replies
                first usually wins the sale — and right now, that probably
                isn&apos;t you.
              </p>
              <Link
                href="/blog/why-facebook-leads-arent-converting"
                className="mt-6 inline-flex items-center gap-1.5 text-sm font-semibold text-brand-600 hover:text-brand-700"
              >
                Read: 7 reasons your Facebook leads aren&apos;t converting
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>

            <div className="lg:col-span-7">
              <div className="grid gap-4 sm:grid-cols-3">
                <StatCard
                  number="78%"
                  text="of leads buy from the first business that responds to them."
                />
                <StatCard
                  number="5 min"
                  text="is the response window before lead-to-sale conversion drops by 80%."
                  highlight
                />
                <StatCard
                  number="$0"
                  text="is the return on every Facebook lead you didn't reply to."
                />
              </div>

              <div className="mt-6 rounded-2xl border border-ink-100 bg-white p-6 shadow-sm">
                <div className="flex items-start gap-4">
                  <span className="grid h-12 w-12 flex-none place-items-center rounded-xl bg-brand-50 text-brand-600">
                    <Target className="h-6 w-6" />
                  </span>
                  <div>
                    <h3 className="text-lg font-bold text-ink-900">
                      This isn&apos;t another chatbot.
                    </h3>
                    <p className="mt-2 text-ink-600 leading-relaxed">
                      Chatbots reply for the sake of replying. Rocketeerio
                      replies to <strong>close</strong>. We answer instantly,
                      ask the right questions, and only put a lead on your desk
                      when they&apos;re ready to buy.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SOCIAL PROOF STATS */}
      <SocialProofStats />

      {/* HOW IT WORKS */}
      <section
        id="how-it-works"
        className="relative py-20 sm:py-28 bg-ink-900 text-white overflow-hidden"
      >
        <div
          aria-hidden
          className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(0,132,255,0.18),_transparent_60%)]"
        />
        <div
          aria-hidden
          className="absolute -bottom-24 -left-24 h-96 w-96 rounded-full bg-brand-500/15 blur-3xl"
        />
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl">
            <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-brand-200">
              <Rocket className="h-3.5 w-3.5" />
              How it works
            </span>
            <h2 className="mt-4 text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight leading-tight">
              Three steps. Zero missed leads.
            </h2>
            <p className="mt-4 text-lg text-white/70 max-w-xl">
              Lead comes in. Bot qualifies. You close. That&apos;s the whole
              system.
            </p>
          </div>

          <div className="mt-12 grid gap-6 lg:grid-cols-3">
            <Step
              n="01"
              icon={MessageSquare}
              title="A lead messages your Page"
              body="From your Facebook Lead Ads, Messenger, or Instagram DM. Rocketeerio sees it the second it arrives."
            />
            <Step
              n="02"
              icon={Sparkles}
              title="Rocketeerio replies & qualifies"
              body="Instantly responds in your brand voice, asks the right qualifying questions, and keeps the lead engaged 24/7."
              accent
            />
            <Step
              n="03"
              icon={Zap}
              title="You get a hot-lead alert"
              body="When a lead is ready to buy, your phone pings. You step in only to close — no inbox digging required."
            />
          </div>

          <div className="mt-12 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              href="/signup"
              className="inline-flex items-center gap-2 rounded-xl bg-brand-600 px-6 py-3.5 text-base font-semibold text-white shadow-lg shadow-brand-900/40 hover:bg-brand-700 focus:outline-none focus:ring-2 focus:ring-white/40"
            >
              Start Free Trial
              <ArrowRight className="h-4 w-4" />
            </Link>
            <p className="text-sm text-white/85">
              Setup in under 10 minutes · No credit card required
            </p>
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section id="features" className="py-20 sm:py-28">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <SectionHeading
            eyebrow="Built to close, not just chat"
            title={
              <>
                More replies. More customers.{" "}
                <span className="text-brand-500">More revenue.</span>
              </>
            }
            description="Every feature in Rocketeerio is built around one job: turning the leads you already paid for into paying customers."
          />

          <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map((f) => (
              <FeatureCard
                key={f.title}
                Icon={f.icon}
                title={f.title}
                desc={f.desc}
              />
            ))}
          </div>
        </div>
      </section>

      {/* WHO IT'S FOR */}
      <section className="bg-ink-50/60 py-20 sm:py-28 border-y border-ink-100">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <SectionHeading
            eyebrow="Built for"
            title={
              <>
                Built for businesses that{" "}
                <span className="text-brand-500">live and die</span> by Facebook
                leads.
              </>
            }
            description="If you run paid Facebook or Instagram ads and your customers message before they buy, Rocketeerio is built for you."
          />

          <div className="mt-14 grid gap-6 lg:grid-cols-3">
            {VERTICALS.map((v) => (
              <div
                key={v.title}
                className="rounded-2xl border border-ink-100 bg-white p-7 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all"
              >
                <span className="grid h-12 w-12 place-items-center rounded-xl bg-brand-50 text-brand-600">
                  <v.icon className="h-6 w-6" />
                </span>
                <h3 className="mt-5 text-xl font-bold text-ink-900">
                  {v.title}
                </h3>
                <p className="mt-3 text-ink-600 leading-relaxed">{v.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* SOCIAL PROOF */}
      <section className="py-20 sm:py-28">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <SectionHeading
            eyebrow="What our users say"
            title="The leads they paid for finally started closing."
            description="Real results from Rocketeerio customers across roofing, real estate, automotive, beauty, finance, and fitness."
          />

          <div className="mt-14 grid gap-6 lg:grid-cols-3">
            <Testimonial
              quote="We were spending $4K/mo on Facebook ads and converting maybe 1 in 20 leads. After Rocketeerio? 1 in 6. Same ad spend, three times the revenue."
              name="Marco D."
              role="Owner, Apex Roofing"
            />
            <Testimonial
              quote="I used to wake up to 30 unread messages. Now I wake up to a list of 3 hot leads ready to book. Game changer."
              name="Janelle R."
              role="Real Estate Broker"
              featured
            />
            <Testimonial
              quote="The AI replies sound like me. Customers don't even realize until I take over to close. Best $69 I spend every month."
              name="Tobias K."
              role="GM, MetroAuto Dealership"
            />
          </div>

          <div className="mt-10 text-center">
            <Link
              href="/testimonials"
              className="inline-flex items-center gap-1.5 text-sm font-semibold text-brand-600 hover:text-brand-700"
            >
              See more results
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* CTA BLOCK */}
      <section id="cta" className="py-20 sm:py-28">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="relative overflow-hidden rounded-3xl bg-ink-900 px-6 py-14 sm:px-12 sm:py-20 text-white shadow-2xl">
            <div
              aria-hidden
              className="absolute -top-32 -right-20 h-96 w-96 rounded-full bg-brand-500/30 blur-3xl"
            />
            <div
              aria-hidden
              className="absolute -bottom-32 -left-20 h-96 w-96 rounded-full bg-brand-500/20 blur-3xl"
            />

            <div className="relative grid items-center gap-10 lg:grid-cols-12">
              <div className="lg:col-span-7">
                <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-brand-200">
                  Stop losing leads
                </span>
                <h2 className="mt-4 text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight leading-tight">
                  Turn the leads you already paid for{" "}
                  <span className="text-brand-300">into paying customers.</span>
                </h2>
                <p className="mt-4 max-w-xl text-white/70 text-lg">
                  Every minute you wait, another Facebook lead goes cold and
                  another competitor closes the sale. Set up takes 10 minutes.
                </p>

                <div className="mt-8 flex flex-col sm:flex-row gap-3">
                  <Link
                    href="/signup"
                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-brand-600 px-6 py-3.5 text-base font-semibold text-white shadow-lg shadow-brand-900/50 hover:bg-brand-700 focus:outline-none focus:ring-2 focus:ring-white/40"
                  >
                    Start Free Trial
                    <ArrowRight className="h-4.5 w-4.5" />
                  </Link>
                  <Link
                    href="/pricing"
                    className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/20 bg-white/5 px-6 py-3.5 text-base font-semibold text-white hover:bg-white/10"
                  >
                    See pricing
                  </Link>
                </div>

                <div className="mt-6">
                  <TrustBadges variant="dark" />
                </div>
              </div>

              <div className="lg:col-span-5">
                <EmailCaptureForm
                  variant="dark"
                  source="home_cta"
                  headline="Free Guide: 5 Reasons Your Facebook Leads Go Cold"
                  description="The exact 7-page playbook our customers use to triple their conversion rate — yours free."
                  cta="Send me the guide"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="bg-ink-50/60 py-20 sm:py-28 border-t border-ink-100">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <SectionHeading
            eyebrow="FAQ"
            title="Questions, answered."
            description="Everything you need to know before starting your free trial."
          />
          <div className="mt-12">
            <FAQAccordion items={FAQ} />
          </div>

          <p className="mt-10 text-center text-sm text-ink-500">
            Still have questions?{" "}
            <a
              href="mailto:hello@rocketeerio.com"
              className="font-semibold text-brand-600 hover:text-brand-700"
            >
              Email us — we reply fast (obviously).
            </a>
          </p>
        </div>
      </section>
    </>
  );
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div>
      <p className="text-2xl sm:text-3xl font-bold text-ink-900 tracking-tight">
        {value}
      </p>
      <p className="text-xs sm:text-sm text-ink-500 mt-1">{label}</p>
    </div>
  );
}

function StatCard({
  number,
  text,
  highlight,
}: {
  number: string;
  text: string;
  highlight?: boolean;
}) {
  return (
    <div
      className={`rounded-2xl border p-6 ${
        highlight
          ? "border-brand-500 bg-brand-500 text-white shadow-lg shadow-brand-500/30"
          : "border-ink-100 bg-white"
      }`}
    >
      <p
        className={`text-3xl sm:text-4xl font-bold tracking-tight ${
          highlight ? "text-white" : "text-brand-600"
        }`}
      >
        {number}
      </p>
      <p
        className={`mt-2 text-sm leading-relaxed ${
          highlight ? "text-white/90" : "text-ink-600"
        }`}
      >
        {text}
      </p>
    </div>
  );
}

function Step({
  n,
  icon: Icon,
  title,
  body,
  accent,
}: {
  n: string;
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  body: string;
  accent?: boolean;
}) {
  return (
    <div
      className={`relative rounded-2xl border p-7 transition-transform hover:-translate-y-1 ${
        accent
          ? "border-brand-500/40 bg-gradient-to-br from-brand-500/15 to-transparent"
          : "border-white/10 bg-white/[0.04]"
      }`}
    >
      <div className="flex items-center justify-between">
        <span
          className={`text-xs font-bold tracking-widest ${
            accent ? "text-brand-300" : "text-white/40"
          }`}
        >
          STEP {n}
        </span>
        <span
          className={`grid h-11 w-11 place-items-center rounded-xl ${
            accent
              ? "bg-brand-500 text-white"
              : "bg-white/10 text-brand-200"
          }`}
        >
          <Icon className="h-5 w-5" />
        </span>
      </div>
      <h3 className="mt-5 text-xl font-bold text-white">{title}</h3>
      <p className="mt-2 text-white/70 leading-relaxed">{body}</p>
    </div>
  );
}

function FeatureCard({
  Icon,
  title,
  desc,
}: {
  Icon: React.ComponentType<{ className?: string }>;
  title: string;
  desc: string;
}) {
  return (
    <div className="group rounded-2xl border border-ink-100 bg-white p-7 hover:border-brand-200 hover:shadow-lg hover:shadow-brand-500/5 transition-all">
      <span className="inline-grid h-12 w-12 place-items-center rounded-xl bg-brand-50 text-brand-600 group-hover:bg-brand-500 group-hover:text-white transition-colors">
        <Icon className="h-6 w-6" />
      </span>
      <h3 className="mt-5 text-lg font-bold text-ink-900">{title}</h3>
      <p className="mt-2 text-ink-600 leading-relaxed">{desc}</p>
    </div>
  );
}

function Testimonial({
  quote,
  name,
  role,
  featured,
}: {
  quote: string;
  name: string;
  role: string;
  featured?: boolean;
}) {
  const initials = name
    .split(" ")
    .map((s) => s[0])
    .join("")
    .slice(0, 2);
  return (
    <figure
      className={`rounded-2xl border p-7 ${
        featured
          ? "border-brand-500 bg-brand-500 text-white shadow-xl shadow-brand-500/30"
          : "border-ink-100 bg-white"
      }`}
    >
      <div
        className={`flex items-center gap-1 ${
          featured ? "text-white" : "text-amber"
        }`}
      >
        {Array.from({ length: 5 }).map((_, i) => (
          <Star key={i} className="h-4 w-4 fill-current" />
        ))}
      </div>
      <blockquote
        className={`mt-4 text-lg leading-relaxed ${
          featured ? "text-white" : "text-ink-800"
        }`}
      >
        “{quote}”
      </blockquote>
      <figcaption className="mt-6 flex items-center gap-3">
        <span
          className={`grid h-10 w-10 place-items-center rounded-full text-sm font-semibold ${
            featured
              ? "bg-white/20 text-white"
              : "bg-ink-100 text-ink-700"
          }`}
        >
          {initials}
        </span>
        <div>
          <p
            className={`text-sm font-semibold ${
              featured ? "text-white" : "text-ink-900"
            }`}
          >
            {name}
          </p>
          <p
            className={`text-xs ${
              featured ? "text-white/80" : "text-ink-500"
            }`}
          >
            {role}
          </p>
        </div>
      </figcaption>
    </figure>
  );
}
