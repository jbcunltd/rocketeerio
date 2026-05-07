import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Compass, Flag, Heart, Rocket, Users } from "lucide-react";
import { SectionHeading } from "@/components/section-heading";
import { TrustSignals } from "@/components/trust-signals";
import { Breadcrumbs } from "@/components/breadcrumbs";

export const metadata: Metadata = {
  title: "About Rocketeerio — The story behind the lead conversion system",
  description:
    "Why Rocketeerio exists, who it's for, and the mission driving us: make sure no business ever loses another paid lead to a slow reply.",
  alternates: { canonical: "https://rocketeerio.com/about" },
  openGraph: {
    title: "About Rocketeerio",
    description:
      "Why Rocketeerio exists — and the mission to make sure no business ever loses a paid lead to a slow reply.",
    url: "https://rocketeerio.com/about",
    images: [
      {
        url: "/api/og?title=Built%20so%20you%20never%20lose%20another%20paid%20lead&eyebrow=ABOUT%20US&kicker=The%20mission%20behind%20Rocketeerio.",
        width: 1200,
        height: 630,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    images: [
      "/api/og?title=Built%20so%20you%20never%20lose%20another%20paid%20lead&eyebrow=ABOUT%20US&kicker=The%20mission%20behind%20Rocketeerio.",
    ],
  },
};

const VALUES = [
  {
    icon: Rocket,
    title: "Built for speed",
    body:
      "Every product decision starts with one question: does this make a lead get a reply faster? If the answer is no, we don't ship it.",
  },
  {
    icon: Heart,
    title: "Owner-friendly",
    body:
      "Most of our customers are running their business, not a tech department. Setup has to be ten minutes, not ten weeks.",
  },
  {
    icon: Flag,
    title: "Honest pricing",
    body:
      "No annual lock-in, no hidden seat fees, no calls-with-sales just to see a number. The pricing page is the pricing page.",
  },
  {
    icon: Users,
    title: "Built in public",
    body:
      "We ship weekly, share our roadmap openly, and respond to feedback fast. Customers help shape the product they pay for.",
  },
];

export default function AboutPage() {
  return (
    <>
      {/* HERO */}
      <section className="relative overflow-hidden border-b border-ink-100">
        <div aria-hidden className="absolute inset-0 bg-grid opacity-50" />
        <div aria-hidden className="absolute inset-x-0 top-0 h-[420px] bg-radial-fade" />
        <div className="relative mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 pt-8">
          <Breadcrumbs items={[{ name: "About" }]} />
        </div>
        <div className="relative mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 pt-6 pb-12 text-center">
          <span className="inline-flex items-center gap-2 rounded-full border border-brand-100 bg-brand-50 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-brand-700">
            About Rocketeerio
          </span>
          <h1 className="mt-5 text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-ink-900 leading-[1.05]">
            We built Rocketeerio because{" "}
            <span className="text-brand-500">
              we were the ones losing the leads.
            </span>
          </h1>
          <p className="mt-5 text-lg text-ink-700">
            Every business owner spends thousands on Facebook ads only to watch
            half the leads go cold in their inbox. We refused to keep doing
            that — so we built the fix. Rocketeerio is now in early access for
            businesses that depend on fast Facebook and Instagram follow-up.
          </p>
        </div>
      </section>

      {/* STORY */}
      <section className="py-20 sm:py-24">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          <div className="prose-rocket">
            <h2>The two-hour reply that started everything.</h2>
            <p>
              Back in 2024, we were running Facebook ads for a small home
              services business. The ad performance was actually great —
              cost-per-lead was under $8, leads were rolling in. But the close
              rate was abysmal. We were getting 40 leads a week and closing
              maybe four jobs.
            </p>
            <p>
              When we dug into the data, the answer was uncomfortable: the
              average first reply was going out two hours after the lead
              messaged. By that time, every one of those prospects had already
              messaged a competitor — and most of them had already booked.
            </p>
            <p>
              We tried hiring a virtual assistant. It worked for two weeks until
              they took a sick day. We tried a chatbot. It replied fast, but it
              replied <em>like a chatbot</em> — and customers ghosted. We tried
              a hybrid system held together with Zapier and prayer. It broke
              every other Tuesday.
            </p>

            <h2>So we built what we wished existed.</h2>
            <p>
              Rocketeerio was born out of one stubborn belief: a business owner
              shouldn&apos;t have to choose between sleeping and closing leads.
              The tech to fix this — instant replies, AI qualification, smart
              routing — already exists. It just hadn&apos;t been packaged for
              non-technical owners running ads on Facebook.
            </p>
            <p>
              Today, Rocketeerio replies to leads in under 60 seconds, qualifies
              them in your tone of voice, and only escalates the ones that are
              actually ready to buy. Our customers run roofing companies,
              dealerships, real estate teams, gyms, and clinics — businesses
              where the next sale is one Facebook DM away.
            </p>
          </div>
        </div>
      </section>

      {/* MISSION */}
      <section className="bg-ink-900 text-white py-20 sm:py-24">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-10 lg:grid-cols-12 items-center">
            <div className="lg:col-span-4">
              <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-brand-200">
                <Compass className="h-3.5 w-3.5" />
                Our mission
              </span>
              <h2 className="mt-4 text-3xl sm:text-4xl font-bold tracking-tight">
                Make sure no business ever loses another paid lead to a slow
                reply.
              </h2>
            </div>
            <div className="lg:col-span-8">
              <p className="text-lg text-white/80 leading-relaxed">
                We measure success not by how many businesses sign up, but by
                how many leads they convert that they would have otherwise
                lost. Every dashboard we build, every feature we ship, every
                support reply we send is in service of that one number.
              </p>
              <p className="mt-4 text-lg text-white/80 leading-relaxed">
                If we&apos;re not measurably making your Facebook ad budget
                work harder, we&apos;ve failed. That&apos;s the standard. That&apos;s
                why the money-back guarantee exists.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* VALUES */}
      <section className="py-20 sm:py-28">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <SectionHeading
            eyebrow="What we believe"
            title="The principles behind the product."
            description="Four values we won't compromise on, even when it would be easier to."
          />

          <div className="mt-14 grid gap-6 sm:grid-cols-2">
            {VALUES.map((v) => (
              <div
                key={v.title}
                className="rounded-2xl border border-ink-100 bg-white p-7 hover:border-brand-200 hover:shadow-md transition-all"
              >
                <span className="inline-grid h-12 w-12 place-items-center rounded-xl bg-brand-50 text-brand-600">
                  <v.icon className="h-6 w-6" />
                </span>
                <h3 className="mt-5 text-xl font-bold text-ink-900">
                  {v.title}
                </h3>
                <p className="mt-2 text-ink-600 leading-relaxed">{v.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FOUNDER */}
      <section className="bg-ink-50/60 border-y border-ink-100 py-20 sm:py-24">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <SectionHeading
            eyebrow="Founder"
            title="Built by people who&#39;ve actually run the ads."
          />

          <div className="mt-12 grid items-center gap-10 lg:grid-cols-12">
            <div className="lg:col-span-4">
              <div className="relative mx-auto h-44 w-44 lg:h-56 lg:w-56">
                <div className="absolute inset-0 rounded-full bg-gradient-to-br from-brand-500 to-brand-700 shadow-xl shadow-brand-500/30" />
                <div className="absolute inset-0 grid place-items-center text-5xl font-bold text-white">
                  JC
                </div>
              </div>
            </div>
            <div className="lg:col-span-8">
              <p className="text-xs font-semibold uppercase tracking-wider text-ink-500">
                Founder &amp; CEO
              </p>
              <h3 className="mt-2 text-2xl font-bold text-ink-900">
                Jandrick Climaco
              </h3>
              <p className="mt-4 text-ink-600 leading-relaxed">
                Spent the last decade running Facebook ads for service
                businesses across SEA and North America. Got tired of watching
                great campaigns die in the inbox. Started Rocketeerio in 2024
                with a small team in Cebu and a single goal: every paid lead
                gets a reply, fast.
              </p>
              <Link
                href="mailto:hello@rocketeerio.com"
                className="mt-5 inline-flex items-center gap-1.5 text-sm font-semibold text-brand-600 hover:text-brand-700"
              >
                Say hi
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 sm:py-28">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-ink-900">
            Ready to stop losing leads?
          </h2>
          <p className="mt-4 text-lg text-ink-600">
            Try Rocketeerio free for 14 days. The first hot lead usually
            arrives the same day you set it up.
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
            <TrustSignals />
          </div>
          <p className="mt-6 text-sm text-ink-600">
            Want to see what customers actually say?{" "}
            <Link
              href="/testimonials"
              className="font-semibold text-brand-700 hover:text-brand-800 underline-offset-2 hover:underline"
            >
              See the early-access results page
            </Link>
            .
          </p>
        </div>
      </section>
    </>
  );
}
