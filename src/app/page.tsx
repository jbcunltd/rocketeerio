import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  Bell,
  BriefcaseBusiness,
  CheckCircle2,
  Clock3,
  Filter,
  Hammer,
  Home as HomeIcon,
  MessageSquare,
  PlayCircle,
  Rocket,
  ShieldCheck,
  Sparkles,
  Target,
  Truck,
  Zap,
} from "lucide-react";
import { ChatPreview } from "@/components/chat-preview";
import { SectionHeading, Eyebrow } from "@/components/section-heading";
import { FAQAccordion, type FAQItem } from "@/components/faq-accordion";
import { TrustBadges } from "@/components/trust-badges";

const FAQ: FAQItem[] = [
  {
    q: "How fast does Josh reply to a Facebook lead?",
    a: "Josh replies in under 60 seconds. The moment a lead messages your Facebook Page, Instagram account, or fills out a Lead Ad form, he sends a personalized reply, asks your qualifying questions, and keeps the conversation moving — even if it is 2am.",
  },
  {
    q: "Will Josh sound like a robot or like my business?",
    a: "Josh is trained on your business, your tone, your offer, your pricing rules, and your follow-up standards. He should sound direct, helpful, and on-brand — and he will never pretend to be human if someone asks.",
  },
  {
    q: "Do I need to be technical to hire Josh?",
    a: "No. You connect your Facebook Page, answer a few setup questions about your business, and train Josh on how you qualify a lead. Setup takes about 10 minutes — no developers, no Zapier spaghetti.",
  },
  {
    q: "What channels does Josh work in?",
    a: "Josh works where your Meta leads show up: Facebook Messenger, Instagram DMs, and Facebook Lead Ads. If a lead starts the conversation on Meta, Josh can reply, qualify, and alert you when they are hot.",
  },
  {
    q: "How does the hot-lead alert work?",
    a: "When a lead hits your qualifying criteria — budget, timeline, location, and intent — Josh pings your phone, summarizes the conversation, and tells you it is time to step in and close.",
  },
  {
    q: "What's the money-back guarantee?",
    a: "14 days, no questions asked. If Josh does not reply faster, qualify cleaner, or keep hot leads from going cold, email us and we refund 100%.",
  },
];

const FEATURES = [
  {
    icon: Zap,
    title: "60-second first replies",
    desc: "Josh replies to every new Meta lead in under 60 seconds, before that lead starts buying from someone else.",
  },
  {
    icon: Filter,
    title: "Qualification that protects your time",
    desc: "Budget, timeline, location, intent. Josh asks the questions you would ask so only serious leads reach your desk.",
  },
  {
    icon: Bell,
    title: "Hot-lead alerts when it matters",
    desc: "When a lead is ready to buy, Josh pings you with the context you need to step in and close.",
  },
  {
    icon: MessageSquare,
    title: "Messenger + Instagram coverage",
    desc: "Josh works the Facebook and Instagram inboxes where your paid Meta leads already start conversations.",
  },
  {
    icon: Sparkles,
    title: "Trained on your way of selling",
    desc: "Train Josh on your offer, pricing, service area, availability, and standards so he works the inbox your way.",
  },
  {
    icon: ShieldCheck,
    title: "Honest early access",
    desc: "No fake stats and no fake testimonials. Josh is in early access, backed by a 14-day money-back guarantee.",
  },
];

const VERTICALS = [
  {
    icon: Hammer,
    title: "Contractors",
    body:
      "Quote requests come in at 9pm. Whoever replies first books the job. Josh replies in seconds — even when you are on a roof, in a truck, or asleep.",
  },
  {
    icon: HomeIcon,
    title: "Real estate",
    body:
      "Buyers DM about listings on weekends. Reply Monday and the showing is already booked with another agent. Josh keeps your lead warm until you can take over.",
  },
  {
    icon: Truck,
    title: "Auto & dealerships",
    body:
      '"Is it still available?" If you take six hours to answer, they have already test-driven a different car at another lot. Josh answers before the lead goes cold.',
  },
];

const RESPONSIBILITIES = [
  "Reply to every Facebook and Instagram lead in under 60 seconds.",
  "Ask your qualifying questions about budget, timeline, location, and intent.",
  "Follow up without forgetting, drifting, or leaving the inbox unattended.",
  "Escalate hot leads with a plain-English summary so you know when to step in.",
  "Represent your business honestly and never pretend to be human if someone asks.",
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
    name: "Josh by Rocketeerio",
    description:
      "AI sales staff for Facebook and Instagram leads. Josh replies in under 60 seconds, qualifies leads, and pings you when one is hot.",
    brand: { "@type": "Brand", name: "Rocketeerio" },
    offers: {
      "@type": "AggregateOffer",
      priceCurrency: "USD",
      lowPrice: "0",
      highPrice: "199",
      offerCount: 3,
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

        <div className="relative mx-auto max-w-7xl px-4 pb-12 pt-10 sm:px-6 sm:pb-16 sm:pt-16 lg:px-8 lg:pb-24 lg:pt-20">
          <div className="grid items-start gap-7 lg:grid-cols-12 lg:gap-x-12 lg:gap-y-8">
            <div className="lg:col-span-7">
              <Eyebrow>AI manpower for Meta leads</Eyebrow>

              <h1 className="mt-5 text-[2rem] font-bold leading-[1.08] tracking-tight text-ink-900 text-balance break-words sm:text-5xl sm:leading-[1.05] lg:text-[3.75rem]">
                Every Facebook lead you don&apos;t reply to is buying from someone else.
              </h1>

              <p className="mt-5 max-w-2xl text-base leading-relaxed text-ink-700 sm:text-lg">
                Josh replies to every lead in under 60 seconds. He qualifies them.
                He pings you when one&apos;s hot. Hire him for less than minimum wage.
              </p>
            </div>

            <div id="josh-demo" className="scroll-mt-24 lg:col-span-5 lg:row-span-2">
              <ChatPreview />
            </div>

            <div className="lg:col-span-7">
              <div className="flex flex-col items-stretch gap-3 sm:flex-row sm:items-center">
                <Link
                  href="/signup"
                  className="group inline-flex w-full items-center justify-center gap-2 rounded-xl bg-brand-600 px-6 py-3.5 text-base font-semibold text-white shadow-lg shadow-brand-500/30 transition-all hover:bg-brand-700 hover:shadow-xl hover:shadow-brand-500/40 focus:outline-none focus:ring-2 focus:ring-brand-500/40 sm:w-auto"
                >
                  Hire Josh
                  <ArrowRight className="h-4.5 w-4.5 transition-transform group-hover:translate-x-0.5" />
                </Link>
                <Link
                  href="#josh-demo"
                  className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-ink-300 bg-white px-6 py-3.5 text-base font-semibold text-ink-900 transition-colors hover:border-brand-500 hover:bg-ink-50 sm:w-auto"
                >
                  <PlayCircle className="h-5 w-5 text-brand-600" aria-hidden />
                  Watch Josh work
                </Link>
              </div>

              <p className="mt-3 text-sm font-semibold text-ink-700">
                14-day money-back guarantee · No questions asked
              </p>
              <div className="mt-5">
                <TrustBadges variant="light" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* INSTANT PROOF STRIP */}
      <section className="border-y border-ink-100 bg-ink-50/40 py-7" aria-label="Instant proof">
        <div className="mx-auto grid max-w-7xl gap-4 px-4 text-center sm:px-6 md:grid-cols-3 lg:px-8">
          <ProofItem icon={Clock3} text="60-second first-reply guarantee" />
          <ProofItem icon={CheckCircle2} text="In early access · No fake stats, no fake testimonials" />
          <ProofItem icon={ShieldCheck} text="14-day money-back guarantee · No questions asked" />
        </div>
      </section>

      {/* MEET JOSH */}
      <section className="py-16 sm:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid items-center gap-10 lg:grid-cols-12 lg:gap-14">
            <div className="lg:col-span-5">
              <div className="relative overflow-hidden rounded-[2rem] border border-ink-100 bg-ink-50 shadow-xl shadow-brand-900/10">
                <Image
                  src="/josh-cover.jpg"
                  alt="Josh, Rocketeerio's AI sales staff"
                  width={900}
                  height={1100}
                  className="h-[420px] w-full object-cover sm:h-[520px]"
                  priority
                />
                <div className="absolute inset-x-5 bottom-5 rounded-2xl border border-white/30 bg-white/90 p-4 shadow-lg backdrop-blur">
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand-700">
                    Available now
                  </p>
                  <p className="mt-1 text-lg font-bold text-ink-900">
                    Josh is ready to work your inbox.
                  </p>
                </div>
              </div>
            </div>

            <div className="lg:col-span-7">
              <Eyebrow>YOUR FIRST HIRE</Eyebrow>
              <h2 className="mt-4 text-3xl font-bold leading-tight tracking-tight text-ink-900 sm:text-4xl lg:text-5xl">
                Meet Josh. AI sales staff. Real teammate.
              </h2>
              <div className="mt-6 space-y-4 text-lg leading-relaxed text-ink-700">
                <p>
                  Hi. I&apos;m Josh — Rocketeerio&apos;s first hire. I work the inbox so
                  you don&apos;t have to. I reply to every lead in under 60 seconds. I
                  ask the questions you&apos;d ask. I never miss a message, never
                  forget a follow-up, and I&apos;ll never pretend to be human if
                  someone asks.
                </p>
                <p>
                  When a lead&apos;s ready to buy, I tap you on the shoulder. I&apos;m not
                  a chatbot. I&apos;m an AI sales teammate trained on your business.
                  Hire me, train me on your way of doing things, and I&apos;ll work
                  your Facebook inbox like it&apos;s the only job I have. Because it
                  is.
                </p>
              </div>
              <p className="mt-5 text-base font-semibold text-ink-900">
                — Josh, AI Sales Staff · Rocketeerio
              </p>

              <div className="mt-8 rounded-2xl border border-ink-100 bg-white p-6 shadow-sm">
                <div className="flex items-center gap-3">
                  <span className="grid h-11 w-11 place-items-center rounded-xl bg-brand-50 text-brand-600">
                    <BriefcaseBusiness className="h-5 w-5" />
                  </span>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-700">
                      Job description
                    </p>
                    <h3 className="text-lg font-bold text-ink-900">
                      Josh&apos;s responsibilities
                    </h3>
                  </div>
                </div>
                <ul className="mt-5 grid gap-3 text-sm leading-relaxed text-ink-700 sm:grid-cols-2">
                  {RESPONSIBILITIES.map((item) => (
                    <li key={item} className="flex gap-2">
                      <CheckCircle2 className="mt-0.5 h-4 w-4 flex-none text-brand-600" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* PROBLEM / SOLUTION */}
      <section className="bg-ink-50/60 py-16 sm:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid items-start gap-12 lg:grid-cols-12 lg:gap-16">
            <div className="lg:col-span-5">
              <Eyebrow>The real cost of slow replies</Eyebrow>
              <h2 className="mt-4 text-3xl font-bold leading-tight tracking-tight text-ink-900 sm:text-4xl lg:text-[2.75rem]">
                You&apos;re not losing leads because of bad ads.{' '}
                <span className="text-brand-500">
                  You&apos;re losing them because nobody replied in time.
                </span>
              </h2>
              <p className="mt-5 text-lg leading-relaxed text-ink-600">
                Every Facebook lead that messages your page is comparing you to
                two or three other businesses at the same time. Whoever replies
                first usually wins the sale — and every unanswered minute makes
                your lead colder.
              </p>
            </div>

            <div className="lg:col-span-7">
              <div className="grid gap-4 sm:grid-cols-3">
                <StatCard
                  number="<60s"
                  text="Josh replies before your lead starts shopping harder."
                />
                <StatCard
                  number="24/7"
                  text="Your inbox stays staffed after hours, weekends, and holidays."
                  highlight
                />
                <StatCard
                  number="$0"
                  text="The return on every Facebook lead nobody answered."
                />
              </div>

              <div className="mt-6 rounded-2xl border border-ink-100 bg-white p-6 shadow-sm">
                <div className="flex items-start gap-4">
                  <span className="grid h-12 w-12 flex-none place-items-center rounded-xl bg-brand-50 text-brand-600">
                    <Target className="h-6 w-6" />
                  </span>
                  <div>
                    <h3 className="text-lg font-bold text-ink-900">
                      Josh is not here to chat for the sake of chatting.
                    </h3>
                    <p className="mt-2 leading-relaxed text-ink-600">
                      Josh replies, qualifies, follows up, and alerts you when a
                      lead is ready to buy. You step in only when the conversation
                      is worth your time.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section
        id="how-it-works"
        className="relative overflow-hidden bg-ink-900 py-20 text-white sm:py-28"
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
              How Josh works
            </span>
            <h2 className="mt-4 text-3xl font-bold leading-tight tracking-tight sm:text-4xl lg:text-5xl">
              Three steps. Zero missed leads.
            </h2>
            <p className="mt-4 max-w-xl text-lg text-white/70">
              Lead comes in. Josh qualifies. You close. That&apos;s the whole system.
            </p>
          </div>

          <div className="mt-12 grid gap-6 lg:grid-cols-3">
            <Step
              n="01"
              icon={MessageSquare}
              title="A lead messages your Page"
              body="From Facebook Lead Ads, Messenger, or Instagram DMs. Josh sees the lead the second it arrives."
            />
            <Step
              n="02"
              icon={Sparkles}
              title="Josh replies & qualifies"
              body="Josh responds in your brand voice, asks the right qualifying questions, and keeps the lead engaged 24/7."
              accent
            />
            <Step
              n="03"
              icon={Zap}
              title="Josh sends a hot-lead alert"
              body="When a lead is ready to buy, your phone pings. You step in to close — no inbox digging required."
            />
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section id="features" className="py-20 sm:py-28">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <SectionHeading
            eyebrow="Built to stop lead loss"
            title={
              <>
                Your Facebook inbox gets staffed.{' '}
                <span className="text-brand-500">Your leads stop going cold.</span>
              </>
            }
            description="Every feature is built around Josh's job: reply fast, qualify clearly, follow up consistently, and alert you when a lead is ready to buy."
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
      <section className="border-y border-ink-100 bg-ink-50/60 py-20 sm:py-28">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <SectionHeading
            eyebrow="Built for"
            title={
              <>
                Built for businesses that{' '}
                <span className="text-brand-500">live and die</span> by Facebook leads.
              </>
            }
            description="If you run paid Facebook or Instagram ads and your customers message before they buy, Josh can work the inbox where your money is currently leaking."
          />

          <div className="mt-14 grid gap-6 lg:grid-cols-3">
            {VERTICALS.map((v) => (
              <div
                key={v.title}
                className="rounded-2xl border border-ink-100 bg-white p-7 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md"
              >
                <span className="grid h-12 w-12 place-items-center rounded-xl bg-brand-50 text-brand-600">
                  <v.icon className="h-6 w-6" />
                </span>
                <h3 className="mt-5 text-xl font-bold text-ink-900">
                  {v.title}
                </h3>
                <p className="mt-3 leading-relaxed text-ink-600">{v.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* EARLY ACCESS HONESTY */}
      <section className="py-20 sm:py-28">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <div className="rounded-3xl border border-ink-100 bg-white p-8 text-center shadow-sm sm:p-12">
            <SectionHeading
              eyebrow="Early access"
              title="No fake stats. No fake testimonials."
              description="Rocketeerio is publishing honest early-access positioning while Josh gets put to work. Customer names, numbers, and case studies will only appear when they are real, permissioned, and measured."
              align="center"
            />
          </div>
        </div>
      </section>

      {/* CTA BLOCK */}
      <section id="cta" className="py-20 sm:py-28">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="relative overflow-hidden rounded-3xl bg-ink-900 px-6 py-14 text-center text-white shadow-2xl sm:px-12 sm:py-20">
            <div
              aria-hidden
              className="absolute -top-32 -right-20 h-96 w-96 rounded-full bg-brand-500/30 blur-3xl"
            />
            <div
              aria-hidden
              className="absolute -bottom-32 -left-20 h-96 w-96 rounded-full bg-brand-500/20 blur-3xl"
            />

            <div className="relative mx-auto max-w-3xl">
              <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-brand-200">
                Stop losing leads
              </span>
              <h2 className="mt-4 text-3xl font-bold leading-tight tracking-tight sm:text-4xl lg:text-5xl">
                Stop losing leads. Hire Josh today.
              </h2>
              <p className="mx-auto mt-4 max-w-2xl text-lg text-white/75">
                Every minute you wait, another Facebook lead goes cold. Setup takes 10 minutes.
              </p>

              <div className="mt-8">
                <Link
                  href="/signup"
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-brand-600 px-6 py-3.5 text-base font-semibold text-white shadow-lg shadow-brand-900/50 transition-colors hover:bg-brand-700 focus:outline-none focus:ring-2 focus:ring-white/40"
                >
                  Hire Josh — Start Free Trial
                  <ArrowRight className="h-4.5 w-4.5" />
                </Link>
              </div>

              <p className="mt-5 text-sm font-semibold text-white/85">
                No credit card · Cancel anytime · 14-day money-back guarantee
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="border-t border-ink-100 bg-ink-50/60 py-20 sm:py-28">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <SectionHeading
            eyebrow="FAQ"
            title="Questions, answered."
            description="Everything you need to know before hiring Josh."
          />
          <div className="mt-12">
            <FAQAccordion items={FAQ} />
          </div>

          <p className="mt-10 text-center text-sm text-ink-500">
            Still have questions?{' '}
            <a
              href="mailto:hello@rocketeerio.com"
              className="font-semibold text-brand-600 hover:text-brand-700"
            >
              Email us — Josh will not pretend to be human, but the team replies fast.
            </a>
          </p>
        </div>
      </section>
    </>
  );
}

function ProofItem({
  icon: Icon,
  text,
}: {
  icon: React.ComponentType<{ className?: string }>;
  text: string;
}) {
  return (
    <div className="flex items-center justify-center gap-2 text-sm font-semibold text-ink-800">
      <Icon className="h-4 w-4 flex-none text-brand-600" aria-hidden />
      <span>{text}</span>
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
        className={`text-3xl font-bold tracking-tight sm:text-4xl ${
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
            accent ? "bg-brand-500 text-white" : "bg-white/10 text-brand-200"
          }`}
        >
          <Icon className="h-5 w-5" />
        </span>
      </div>
      <h3 className="mt-5 text-xl font-bold text-white">{title}</h3>
      <p className="mt-2 leading-relaxed text-white/70">{body}</p>
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
    <div className="group rounded-2xl border border-ink-100 bg-white p-7 transition-all hover:border-brand-200 hover:shadow-lg hover:shadow-brand-500/5">
      <span className="inline-grid h-12 w-12 place-items-center rounded-xl bg-brand-50 text-brand-600 transition-colors group-hover:bg-brand-500 group-hover:text-white">
        <Icon className="h-6 w-6" />
      </span>
      <h3 className="mt-5 text-lg font-bold text-ink-900">{title}</h3>
      <p className="mt-2 leading-relaxed text-ink-600">{desc}</p>
    </div>
  );
}
