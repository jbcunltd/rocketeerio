import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, CheckCircle2, Clock, MessageCircle, ShieldCheck, TrendingUp } from "lucide-react";
import { SectionHeading } from "@/components/section-heading";
import { TrustSignals } from "@/components/trust-signals";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { TrustBadges } from "@/components/trust-badges";

export const metadata: Metadata = {
  title: "Early Access Results — Rocketeerio",
  description:
    "Rocketeerio is in early access. See the honest lead-response promises we are validating before customer case studies are published.",
  alternates: { canonical: "https://rocketeerio.com/testimonials" },
  openGraph: {
    title: "Early Access Results — Rocketeerio",
    description:
      "No placeholder testimonials or inflated customer counts — just the early-access lead-response promises Rocketeerio is validating.",
    url: "https://rocketeerio.com/testimonials",
    images: [
      {
        url: "/api/og?title=Early%20access%20results&eyebrow=ROCKETEERIO&kicker=Honest%20lead-response%20promises%20we%20are%20validating%20now.",
        width: 1200,
        height: 630,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    images: [
      "/api/og?title=Early%20access%20results&eyebrow=ROCKETEERIO&kicker=Honest%20lead-response%20promises%20we%20are%20validating%20now.",
    ],
  },
};

const PROMISES = [
  {
    Icon: Clock,
    value: "<60s",
    label: "First-reply target",
    body: "New Facebook and Instagram leads should get a fast, relevant first reply instead of waiting in an inbox.",
  },
  {
    Icon: TrendingUp,
    value: "24/7",
    label: "Lead coverage",
    body: "Josh stays available after hours, on weekends, and while the team is busy closing work.",
  },
  {
    Icon: MessageCircle,
    value: "Meta",
    label: "Supported channels",
    body: "Early access focuses on Facebook Messenger, Instagram DMs, and Facebook Lead Ads.",
  },
  {
    Icon: ShieldCheck,
    value: "14d",
    label: "Refund window",
    body: "The money-back guarantee is standardized to 14 days across the site.",
  },
];

export default function TestimonialsPage() {
  return (
    <>
      {/* HERO */}
      <section className="relative overflow-hidden border-b border-ink-100">
        <div aria-hidden className="absolute inset-0 bg-grid opacity-50" />
        <div aria-hidden className="absolute inset-x-0 top-0 h-[420px] bg-radial-fade" />
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-8">
          <Breadcrumbs items={[{ name: "Early Access Results" }]} />
        </div>
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-6 pb-12 text-center">
          <span className="inline-flex items-center gap-2 rounded-full border border-brand-100 bg-brand-50 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-brand-700">
            Now in early access
          </span>
          <h1 className="mt-5 text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-ink-900 leading-[1.05]">
            Honest results will be published <span className="text-brand-500">when they are real.</span>
          </h1>
          <p className="mt-5 mx-auto max-w-2xl text-lg text-ink-700">
            We removed placeholder testimonials, invented press logos, fabricated review counts, and unverified performance claims. This page now shows the promises Rocketeerio is validating during early access.
          </p>

          <div className="mt-7">
            <TrustSignals />
          </div>
        </div>
      </section>

      {/* HONEST PROMISES */}
      <section className="bg-ink-900 text-white py-14">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 gap-y-8 sm:gap-x-6 lg:grid-cols-4">
            {PROMISES.map(({ Icon, value, label }) => (
              <div key={label} className="text-center">
                <span className="mx-auto inline-grid h-11 w-11 place-items-center rounded-xl bg-white/10 text-brand-200">
                  <Icon className="h-5 w-5" aria-hidden />
                </span>
                <p className="mt-4 text-3xl sm:text-4xl font-bold tracking-tight text-brand-300">
                  {value}
                </p>
                <p className="mt-1 text-sm text-white/85">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FEEDBACK POLICY */}
      <section className="py-20 sm:py-28">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <SectionHeading
            eyebrow="Feedback policy"
            title="No named testimonials until customers approve them."
            description="Rocketeerio will only publish testimonials, review counts, case studies, or performance lifts when they come from real customers, use permissioned names or approved anonymization, and are backed by measured results."
          />

          <div className="mt-14 grid gap-6 lg:grid-cols-3">
            <HonestyCard
              title="No fabricated names"
              body="The former named testimonials have been removed. We will not attribute quotes to people who have not provided them."
            />
            <HonestyCard
              title="No fake press strip"
              body="The site no longer implies coverage by publications or brands that have not actually covered Rocketeerio."
            />
            <HonestyCard
              title="No inflated metrics"
              body="Customer counts, review counts, conversion lifts, lead volumes, and uptime claims will stay off the site until they are real and measured."
            />
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-ink-50/60 border-y border-ink-100 py-20 sm:py-28">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 text-center">
          <span className="inline-flex items-center gap-2 rounded-full bg-brand-50 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-brand-700">
            <CheckCircle2 className="h-3.5 w-3.5" />
            Early access
          </span>
          <h2 className="mt-5 text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-ink-900">
            Want to test the system while results are being validated?
          </h2>
          <p className="mt-5 text-lg text-ink-700">
            Start with fast Meta lead replies, 24/7 coverage, and hot-lead routing. If it does not work for your business within 14 days, the guarantee is clear.
          </p>
          <div className="mt-7 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              href="/signup"
              className="inline-flex items-center gap-2 rounded-xl bg-brand-600 px-6 py-3.5 text-base font-semibold text-white shadow-lg shadow-brand-500/30 hover:bg-brand-700 focus:outline-none focus:ring-2 focus:ring-brand-500/40"
            >
              Hire Josh
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/pricing"
              className="inline-flex items-center gap-2 rounded-xl border border-ink-300 bg-white px-6 py-3.5 text-base font-semibold text-ink-900 hover:bg-ink-50 hover:border-brand-500"
            >
              See pricing
            </Link>
          </div>
          <div className="mt-5">
            <TrustBadges variant="light" className="justify-center" />
          </div>
        </div>
      </section>
    </>
  );
}

function HonestyCard({ title, body }: { title: string; body: string }) {
  return (
    <div className="rounded-2xl border border-ink-100 bg-white p-7 shadow-sm">
      <span className="inline-grid h-11 w-11 place-items-center rounded-xl bg-brand-50 text-brand-700">
        <CheckCircle2 className="h-5 w-5" aria-hidden />
      </span>
      <h3 className="mt-5 text-lg font-bold text-ink-900">{title}</h3>
      <p className="mt-2 text-ink-600 leading-relaxed">{body}</p>
    </div>
  );
}
