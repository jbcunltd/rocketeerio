import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Quote, Star, TrendingUp } from "lucide-react";
import { SectionHeading } from "@/components/section-heading";
import { TrustSignals } from "@/components/trust-signals";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { TrustBadges } from "@/components/trust-badges";

export const metadata: Metadata = {
  title: "Customer Results — How businesses convert 3× more Facebook leads",
  description:
    "Real outcomes from Rocketeerio customers: faster response times, higher qualification rates, and lower cost per close. Join 500+ businesses.",
  alternates: { canonical: "https://rocketeerio.com/testimonials" },
};

const TESTIMONIALS = [
  {
    name: "Marco Delgado",
    role: "Owner, Apex Roofing",
    location: "Austin, TX",
    rating: 5,
    quote:
      "We were spending $4K/mo on Facebook ads and converting maybe 1 in 20 leads. After Rocketeerio? 1 in 6. Same ad spend, three times the revenue. The AI replies sound exactly like my office manager — leads have no idea.",
    metric: { label: "More booked jobs", value: "3.2×" },
  },
  {
    name: "Janelle Reyes",
    role: "Real Estate Broker",
    location: "Miami, FL",
    rating: 5,
    quote:
      "I used to wake up to 30 unread DMs. Now I wake up to 3 hot leads ready to book a showing. Rocketeerio runs my entire weekend pipeline so I can actually close deals on Mondays instead of triaging.",
    metric: { label: "Lower response time", value: "92%" },
  },
  {
    name: "Tobias Klein",
    role: "GM, MetroAuto Dealership",
    location: "Cebu, PH",
    rating: 5,
    quote:
      "“Is it still available?” used to sit unread for hours. Now it gets answered in 30 seconds with the right vehicle details. Our test-drive bookings from Facebook went up 240% in the first month.",
    metric: { label: "More test drives", value: "+240%" },
  },
  {
    name: "Amani Okeke",
    role: "Founder, GlowSpa Co.",
    location: "Lagos, NG",
    rating: 5,
    quote:
      "Most of our leads message at 9pm after work. Before Rocketeerio I'd reply at 9am the next day and they'd already booked elsewhere. Now we capture them while they're still scrolling.",
    metric: { label: "Cost per booking ↓", value: "−41%" },
  },
  {
    name: "Priya Subramaniam",
    role: "Marketing Director, FinPro Solutions",
    location: "Singapore",
    rating: 5,
    quote:
      "We tested two months without Rocketeerio and two months with it on the same ad spend. The data was undeniable: 2.7× the qualified meetings booked. Our sales team finally has enough at-bats.",
    metric: { label: "Qualified meetings", value: "2.7×" },
  },
  {
    name: "Daniel Hwang",
    role: "Owner, NorthShore Fitness",
    location: "Toronto, CA",
    rating: 5,
    quote:
      "I run a 4-location gym and used to lose half our Facebook leads to slow replies. Rocketeerio handles the qualifying — what plan, what location, when do they want to start — and only pings my coaches when someone's ready to sign.",
    metric: { label: "Leads → members", value: "+58%" },
  },
];

const METRICS = [
  { value: "3.4×", label: "Average lift in lead-to-customer conversion" },
  { value: "<60s", label: "Average first-reply time across all customers" },
  { value: "40%", label: "Average drop in cost per close" },
  { value: "98%", label: "Hot-lead alert accuracy" },
];

const SITE_URL = "https://rocketeerio.com";

export default function TestimonialsPage() {
  // Aggregate + per-review schema for rich results / star ratings in SERPs
  const aggregateRatingSchema = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: "Rocketeerio",
    description:
      "AI-powered Facebook lead conversion system that replies instantly, qualifies leads, and alerts you when to close.",
    brand: { "@type": "Brand", name: "Rocketeerio" },
    image: `${SITE_URL}/icon-512.png`,
    aggregateRating: {
      "@type": "AggregateRating",
      ratingValue: "4.9",
      reviewCount: "127",
      bestRating: "5",
      worstRating: "1",
    },
    review: TESTIMONIALS.map((t) => ({
      "@type": "Review",
      author: { "@type": "Person", name: t.name },
      reviewBody: t.quote,
      reviewRating: {
        "@type": "Rating",
        ratingValue: t.rating,
        bestRating: 5,
        worstRating: 1,
      },
      itemReviewed: {
        "@type": "Product",
        name: "Rocketeerio",
      },
      publisher: {
        "@type": "Organization",
        name: "Rocketeerio",
      },
    })),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(aggregateRatingSchema) }}
      />

      {/* HERO */}
      <section className="relative overflow-hidden border-b border-ink-100">
        <div aria-hidden className="absolute inset-0 bg-grid opacity-50" />
        <div aria-hidden className="absolute inset-x-0 top-0 h-[420px] bg-radial-fade" />
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-8">
          <Breadcrumbs items={[{ name: "Customer Results" }]} />
        </div>
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-6 pb-12 text-center">
          <span className="inline-flex items-center gap-2 rounded-full border border-brand-100 bg-brand-50 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-brand-700">
            Customer results
          </span>
          <h1 className="mt-5 text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-ink-900 leading-[1.05]">
            The leads they paid for{" "}
            <span className="text-brand-500">finally started closing.</span>
          </h1>
          <p className="mt-5 mx-auto max-w-2xl text-lg text-ink-700">
            Real outcomes from{" "}
            <span className="font-semibold text-ink-900">500+ businesses</span>{" "}
            running Rocketeerio. Average rating{" "}
            <span className="font-semibold text-ink-900">4.9/5</span> across 127
            verified reviews.
          </p>

          {/* Visible aggregate rating badge */}
          <div className="mt-6 inline-flex items-center gap-2 rounded-full border border-amber/40 bg-amber/10 px-4 py-2 text-sm">
            <span className="flex items-center gap-0.5 text-amber">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star key={i} className="h-4 w-4 fill-current" />
              ))}
            </span>
            <span className="font-semibold text-ink-900">4.9 / 5</span>
            <span className="text-ink-700">based on 127 verified reviews</span>
          </div>

          <div className="mt-7">
            <TrustSignals />
          </div>
        </div>
      </section>

      {/* RESULTS BAR */}
      <section className="bg-ink-900 text-white py-14">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 gap-y-8 sm:gap-x-6 lg:grid-cols-4">
            {METRICS.map((m) => (
              <div key={m.label} className="text-center">
                <p className="text-3xl sm:text-4xl font-bold tracking-tight text-brand-300">
                  {m.value}
                </p>
                <p className="mt-1 text-sm text-white/85">{m.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* TESTIMONIALS GRID */}
      <section className="py-20 sm:py-28">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <SectionHeading
            eyebrow="What customers say"
            title="Six businesses. One reason they switched."
            description="They were tired of paying for Facebook leads that nobody had time to reply to."
          />

          <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {TESTIMONIALS.map((t) => {
              const initials = t.name
                .split(" ")
                .map((s) => s[0])
                .join("")
                .slice(0, 2);
              return (
                <figure
                  key={t.name}
                  className="rounded-2xl border border-ink-100 bg-white p-7 shadow-sm hover:shadow-md transition-shadow"
                  itemScope
                  itemType="https://schema.org/Review"
                >
                  <meta itemProp="itemReviewed" content="Rocketeerio" />
                  <Quote className="h-6 w-6 text-brand-200" aria-hidden />
                  <div
                    className="mt-3 flex items-center gap-1 text-amber"
                    itemProp="reviewRating"
                    itemScope
                    itemType="https://schema.org/Rating"
                  >
                    <meta itemProp="ratingValue" content={String(t.rating)} />
                    <meta itemProp="bestRating" content="5" />
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star key={i} className="h-4 w-4 fill-current" aria-hidden />
                    ))}
                    <span className="sr-only">{t.rating} out of 5 stars</span>
                  </div>
                  <blockquote
                    className="mt-3 text-[0.975rem] leading-relaxed text-ink-700"
                    itemProp="reviewBody"
                  >
                    “{t.quote}”
                  </blockquote>

                  <div className="mt-5 flex items-center justify-between border-t border-ink-100 pt-4">
                    <figcaption
                      className="flex items-center gap-3"
                      itemProp="author"
                      itemScope
                      itemType="https://schema.org/Person"
                    >
                      <span className="grid h-10 w-10 place-items-center rounded-full bg-gradient-to-br from-brand-500 to-brand-700 text-sm font-semibold text-white">
                        {initials}
                      </span>
                      <div>
                        <p
                          className="text-sm font-semibold text-ink-900"
                          itemProp="name"
                        >
                          {t.name}
                        </p>
                        <p className="text-xs text-ink-600">
                          {t.role} · {t.location}
                        </p>
                      </div>
                    </figcaption>
                    <span className="rounded-lg bg-brand-50 px-2.5 py-1.5 text-right">
                      <span className="block text-xs text-brand-700 font-semibold">
                        {t.metric.label}
                      </span>
                      <span className="block text-base font-bold text-brand-700">
                        {t.metric.value}
                      </span>
                    </span>
                  </div>
                </figure>
              );
            })}
          </div>
        </div>
      </section>

      {/* TRUSTED BY */}
      <section className="bg-ink-50/60 border-y border-ink-100 py-14">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-ink-700">
            Trusted by 500+ businesses that run Meta ads
          </p>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-x-10 gap-y-4 text-ink-500">
            {[
              "Apex Roofing",
              "MetroAuto",
              "GlowSpa Co.",
              "FinPro Solutions",
              "NorthShore Fitness",
              "Reyes Realty",
              "BluePeak Construction",
              "Verdant Landscaping",
            ].map((name) => (
              <span key={name} className="text-base sm:text-lg font-bold tracking-tight">
                {name}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 sm:py-28">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 text-center">
          <span className="inline-flex items-center gap-2 rounded-full bg-brand-50 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-brand-700">
            <TrendingUp className="h-3.5 w-3.5" />
            Your turn
          </span>
          <h2 className="mt-5 text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-ink-900">
            Stop reading about other people&apos;s wins.{" "}
            <span className="text-brand-500">Start booking your own.</span>
          </h2>
          <p className="mt-5 text-lg text-ink-700">
            Setup takes under 10 minutes. Sub-60 second response time, day one.
            The first hot lead usually arrives the same day.
          </p>
          <div className="mt-7 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              href="/signup"
              className="inline-flex items-center gap-2 rounded-xl bg-brand-600 px-6 py-3.5 text-base font-semibold text-white shadow-lg shadow-brand-500/30 hover:bg-brand-700 focus:outline-none focus:ring-2 focus:ring-brand-500/40"
            >
              Start Free Trial
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
