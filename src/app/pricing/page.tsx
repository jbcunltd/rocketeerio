import type { Metadata } from "next";
import Link from "next/link";
import { PricingClient } from "./pricing-client";
import { TrustSignals } from "@/components/trust-signals";
import { FAQAccordion, type FAQItem } from "@/components/faq-accordion";
import { SectionHeading } from "@/components/section-heading";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { SecuritySection } from "@/components/trust-badges";
import { ArrowRight, CheckCircle2, ShieldCheck, RefreshCw } from "lucide-react";

export const metadata: Metadata = {
  title: "Pricing — Simple plans built to scale with you",
  description:
    "Three clear plans for Rocketeerio. Start free, scale to Pro, or run an Agency. 14-day money-back guarantee. No credit card required to start.",
  alternates: { canonical: "https://rocketeerio.com/pricing" },
  openGraph: {
    title: "Rocketeerio Pricing — Starter, Pro, Agency",
    description:
      "Pick the plan that matches your lead volume. Save 20% on annual billing. 14-day money-back guarantee.",
    url: "https://rocketeerio.com/pricing",
    images: [
      {
        url: "/api/og?title=Simple%2C%20transparent%20pricing&eyebrow=PRICING&kicker=Start%20free.%20Scale%20to%20Pro.%20Cancel%20anytime.",
        width: 1200,
        height: 630,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    images: [
      "/api/og?title=Simple%2C%20transparent%20pricing&eyebrow=PRICING&kicker=Start%20free.%20Scale%20to%20Pro.%20Cancel%20anytime.",
    ],
  },
};

const FAQ: FAQItem[] = [
  {
    q: "What counts as an active lead?",
    a: "An active lead is any unique person who messaged your Page or filled out a Lead Ad form within the billing month. Existing contacts you've already converted don't count again unless they message you anew.",
  },
  {
    q: "Can I switch plans anytime?",
    a: "Yes. Upgrade, downgrade, or cancel from your dashboard with one click. We'll prorate the difference automatically.",
  },
  {
    q: "Is there a free trial?",
    a: "Yes — 14 days of Pro, free, no credit card required. After the trial you can drop to Starter or pick the plan that fits your volume.",
  },
  {
    q: "What's covered by the money-back guarantee?",
    a: "If Josh does not reply faster, qualify cleaner, or route hot leads to you within 14 days, email us and we refund 100% — no forms, no friction.",
  },
  {
    q: "Do you offer discounts for agencies or multi-location businesses?",
    a: "Yes. The Agency plan includes white-label, sub-accounts, and shared billing. For 25+ locations, contact us for a custom plan.",
  },
];

export default function PricingPage() {
  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: FAQ.map(({ q, a }) => ({
      "@type": "Question",
      name: q,
      acceptedAnswer: { "@type": "Answer", text: a },
    })),
  };

  const offerSchema = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: "Rocketeerio",
    description:
      "AI-powered Facebook lead conversion system. Auto-reply, qualify, and close more leads.",
    brand: { "@type": "Brand", name: "Rocketeerio" },
    offers: {
      "@type": "AggregateOffer",
      priceCurrency: "USD",
      lowPrice: "39",
      highPrice: "249",
      offerCount: 3,
      url: "https://rocketeerio.com/pricing",
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
        dangerouslySetInnerHTML={{ __html: JSON.stringify(offerSchema) }}
      />

      {/* HERO */}
      <section className="relative overflow-hidden border-b border-ink-100">
        <div aria-hidden className="absolute inset-0 bg-grid opacity-50" />
        <div aria-hidden className="absolute inset-x-0 top-0 h-[420px] bg-radial-fade" />
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-8">
          <Breadcrumbs items={[{ name: "Pricing" }]} />
        </div>
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-6 pb-10 text-center">
          <span className="inline-flex items-center gap-2 rounded-full border border-brand-100 bg-brand-50 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-brand-700">
            Pricing
          </span>
          <h1 className="mt-5 text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-ink-900 leading-[1.05]">
            Simple pricing.{" "}
            <span className="text-brand-500">Built to grow with you.</span>
          </h1>
          <p className="mt-5 mx-auto max-w-2xl text-lg text-ink-700">
            Start free. Close more deals. Scale when you&apos;re ready. Every
            plan includes instant replies, AI qualification, and hot-lead alerts.
            Rocketeerio is now in early access for teams that depend on fast Meta lead follow-up.
          </p>
          <div className="mt-7">
            <TrustSignals />
          </div>
        </div>
      </section>

      <PricingClient />

      {/* GUARANTEE */}
      <section className="py-16 sm:py-20">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-6 sm:grid-cols-3">
            <GuaranteeCard
              Icon={RefreshCw}
              title="14-day money back"
              body="If Josh does not reply faster, qualify cleaner, or route hot leads to you within 14 days, get every cent back. No forms, no friction."
            />
            <GuaranteeCard
              Icon={ShieldCheck}
              title="Meta-compliant by design"
              body="Built directly on Messenger Platform APIs. No risky workarounds, no risk to your Page."
            />
            <GuaranteeCard
              Icon={CheckCircle2}
              title="Cancel anytime, instantly"
              body="Month-to-month, no contracts. Pause or cancel with a single click in your dashboard."
            />
          </div>
        </div>
      </section>

      {/* COMPARISON TABLE */}
      <section className="bg-ink-50/60 border-y border-ink-100 py-20 sm:py-28">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <SectionHeading
            eyebrow="Plan comparison"
            title="Everything that comes with each plan."
            description="Side-by-side, no asterisks, no surprises."
          />

          <div className="mt-12 overflow-x-auto">
            <table className="min-w-full overflow-hidden rounded-2xl border border-ink-100 bg-white text-sm">
              <thead>
                <tr className="bg-ink-50 text-ink-700">
                  <th className="px-5 py-4 text-left font-semibold">Feature</th>
                  <th className="px-5 py-4 text-center font-semibold">Starter</th>
                  <th className="px-5 py-4 text-center font-semibold text-brand-700">
                    Pro <span className="ml-1 inline-block rounded-full bg-brand-500 px-2 py-0.5 text-[10px] uppercase tracking-wider text-white">Popular</span>
                  </th>
                  <th className="px-5 py-4 text-center font-semibold">Agency</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ink-100 text-ink-700">
                {COMPARISON.map((row, i) => (
                  <tr key={i} className="hover:bg-ink-50/40">
                    <td className="px-5 py-3.5 font-medium text-ink-900">
                      {row.feature}
                    </td>
                    <Cell value={row.starter} />
                    <Cell value={row.pro} highlight />
                    <Cell value={row.agency} />
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* SECURITY / TRUST */}
      <SecuritySection />

      {/* RELATED READING */}
      <section className="py-16 sm:py-20">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-ink-900">
            Want to know if Rocketeerio is right for you?
          </h2>
          <p className="mt-3 text-ink-700">
            Read these short guides before you pick a plan — they cover the
            specific Facebook lead problems Rocketeerio is built to fix.
          </p>
          <ul className="mt-6 grid gap-3 sm:grid-cols-2">
            <li>
              <Link
                href="/blog/responding-to-leads-under-60-seconds"
                className="group flex items-start gap-3 rounded-xl border border-ink-100 bg-white p-4 hover:border-brand-300 hover:shadow-sm transition"
              >
                <span className="mt-1 grid h-7 w-7 flex-none place-items-center rounded-md bg-brand-50 text-brand-700 text-xs font-bold">1</span>
                <div>
                  <p className="font-semibold text-ink-900 group-hover:text-brand-700">
                    The magic of responding in under 60 seconds
                  </p>
                  <p className="text-sm text-ink-600">Why sub-60 second response time triples conversion.</p>
                </div>
              </Link>
            </li>
            <li>
              <Link
                href="/blog/why-facebook-leads-arent-converting"
                className="group flex items-start gap-3 rounded-xl border border-ink-100 bg-white p-4 hover:border-brand-300 hover:shadow-sm transition"
              >
                <span className="mt-1 grid h-7 w-7 flex-none place-items-center rounded-md bg-brand-50 text-brand-700 text-xs font-bold">2</span>
                <div>
                  <p className="font-semibold text-ink-900 group-hover:text-brand-700">
                    Why your Facebook leads aren&apos;t converting
                  </p>
                  <p className="text-sm text-ink-600">7 fixes that turn cold leads into customers.</p>
                </div>
              </Link>
            </li>
            <li>
              <Link
                href="/blog/qualify-facebook-leads-without-lifting-a-finger"
                className="group flex items-start gap-3 rounded-xl border border-ink-100 bg-white p-4 hover:border-brand-300 hover:shadow-sm transition"
              >
                <span className="mt-1 grid h-7 w-7 flex-none place-items-center rounded-md bg-brand-50 text-brand-700 text-xs font-bold">3</span>
                <div>
                  <p className="font-semibold text-ink-900 group-hover:text-brand-700">
                    Qualify leads without lifting a finger
                  </p>
                  <p className="text-sm text-ink-600">The qualification flow our Pro customers use.</p>
                </div>
              </Link>
            </li>
            <li>
              <Link
                href="/blog/ultimate-guide-facebook-lead-automation-2025"
                className="group flex items-start gap-3 rounded-xl border border-ink-100 bg-white p-4 hover:border-brand-300 hover:shadow-sm transition"
              >
                <span className="mt-1 grid h-7 w-7 flex-none place-items-center rounded-md bg-brand-50 text-brand-700 text-xs font-bold">4</span>
                <div>
                  <p className="font-semibold text-ink-900 group-hover:text-brand-700">
                    Ultimate guide to Facebook lead automation
                  </p>
                  <p className="text-sm text-ink-600">The complete 2025 playbook — free.</p>
                </div>
              </Link>
            </li>
          </ul>
          <div className="mt-8">
            <Link
              href="/testimonials"
              className="inline-flex items-center gap-1.5 text-sm font-semibold text-brand-700 hover:text-brand-800"
            >
              See real customer results <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-20 sm:py-28 bg-ink-50/40 border-t border-ink-100">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <SectionHeading
            eyebrow="Pricing FAQ"
            title="Everything else you might be wondering."
          />
          <div className="mt-12">
            <FAQAccordion items={FAQ} />
          </div>
        </div>
      </section>
    </>
  );
}

function GuaranteeCard({
  Icon,
  title,
  body,
}: {
  Icon: React.ComponentType<{ className?: string }>;
  title: string;
  body: string;
}) {
  return (
    <div className="rounded-2xl border border-ink-100 bg-white p-7 text-center sm:text-left">
      <span className="inline-grid h-12 w-12 place-items-center rounded-xl bg-brand-50 text-brand-600">
        <Icon className="h-6 w-6" />
      </span>
      <h3 className="mt-4 text-lg font-bold text-ink-900">{title}</h3>
      <p className="mt-2 text-sm text-ink-600 leading-relaxed">{body}</p>
    </div>
  );
}

function Cell({
  value,
  highlight,
}: {
  value: string | boolean;
  highlight?: boolean;
}) {
  return (
    <td
      className={`px-5 py-3.5 text-center ${
        highlight ? "bg-brand-50/40" : ""
      }`}
    >
      {typeof value === "boolean" ? (
        value ? (
          <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-brand-500 text-white">
            <CheckCircle2 className="h-4 w-4" />
          </span>
        ) : (
          <span className="text-ink-300">—</span>
        )
      ) : (
        <span className="text-sm text-ink-800">{value}</span>
      )}
    </td>
  );
}

const COMPARISON: { feature: string; starter: string | boolean; pro: string | boolean; agency: string | boolean }[] = [
  { feature: "Active leads / month", starter: "500", pro: "5,000", agency: "Unlimited" },
  { feature: "Connected Facebook Pages", starter: "1", pro: "5", agency: "Unlimited" },
  { feature: "Instant Messenger replies", starter: true, pro: true, agency: true },
  { feature: "AI qualification flows", starter: "1 flow", pro: "Unlimited", agency: "Unlimited" },
  { feature: "Instagram DM support", starter: false, pro: true, agency: true },
  { feature: "Hot-lead SMS alerts", starter: false, pro: true, agency: true },
  { feature: "CRM integrations", starter: "Email only", pro: "HubSpot, GHL, Pipedrive", agency: "All + Webhooks" },
  { feature: "Team seats", starter: "1", pro: "5", agency: "Unlimited" },
  { feature: "White-label dashboard", starter: false, pro: false, agency: true },
  { feature: "Sub-accounts (clients)", starter: false, pro: false, agency: "Unlimited" },
  { feature: "Priority support", starter: false, pro: true, agency: "Dedicated CSM" },
];
