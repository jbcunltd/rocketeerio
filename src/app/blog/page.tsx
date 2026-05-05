import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, BookOpen, Calendar, Clock } from "lucide-react";
import { BLOG_POSTS } from "@/lib/site";
import { TrustSignals } from "@/components/trust-signals";
import { EmailCaptureForm } from "@/components/email-capture-form";
import { Breadcrumbs } from "@/components/breadcrumbs";

export const metadata: Metadata = {
  title: "Blog — Facebook lead conversion playbooks, guides & case studies",
  description:
    "Practical, no-fluff guides on Facebook lead automation, response speed, qualification flows, and turning paid social leads into paying customers.",
  alternates: { canonical: "https://rocketeerio.com/blog" },
};

const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

export default function BlogIndex() {
  const [featured, ...rest] = BLOG_POSTS;

  return (
    <>
      {/* HERO */}
      <section className="relative overflow-hidden border-b border-ink-100">
        <div aria-hidden className="absolute inset-0 bg-grid opacity-50" />
        <div aria-hidden className="absolute inset-x-0 top-0 h-[420px] bg-radial-fade" />
        <div className="relative mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 pt-8">
          <Breadcrumbs items={[{ name: "Blog" }]} />
        </div>
        <div className="relative mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 pt-6 pb-10 text-center">
          <span className="inline-flex items-center gap-2 rounded-full border border-brand-100 bg-brand-50 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-brand-700">
            <BookOpen className="h-3.5 w-3.5" />
            The Rocketeerio Blog
          </span>
          <h1 className="mt-5 text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-ink-900 leading-[1.05]">
            Playbooks for businesses that{" "}
            <span className="text-brand-500">refuse to lose another lead.</span>
          </h1>
          <p className="mt-5 mx-auto max-w-2xl text-lg text-ink-600">
            Practical, no-fluff guides on Facebook lead conversion, response
            speed, AI qualification, and the systems that turn paid social
            into predictable revenue.
          </p>
        </div>
      </section>

      {/* FEATURED */}
      <section className="py-14 sm:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <Link
            href={`/blog/${featured.slug}`}
            className="group grid items-center gap-8 rounded-3xl border border-ink-100 bg-white p-6 sm:p-10 shadow-sm hover:shadow-md transition-all lg:grid-cols-12"
          >
            <div className="lg:col-span-5">
              <div className="relative aspect-[4/3] overflow-hidden rounded-2xl bg-gradient-to-br from-brand-500 via-brand-600 to-brand-800 p-7 text-white">
                <div
                  aria-hidden
                  className="absolute -top-12 -right-12 h-48 w-48 rounded-full bg-white/15 blur-2xl"
                />
                <div className="relative flex h-full flex-col justify-between">
                  <span className="inline-flex w-fit items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-xs font-semibold uppercase tracking-wider">
                    Featured · {featured.category}
                  </span>
                  <p className="text-2xl font-bold leading-tight">
                    {featured.title}
                  </p>
                </div>
              </div>
            </div>
            <div className="lg:col-span-7">
              <div className="flex items-center gap-3 text-xs text-ink-500">
                <span className="inline-flex items-center gap-1">
                  <Calendar className="h-3.5 w-3.5" />
                  {formatDate(featured.date)}
                </span>
                <span className="inline-flex items-center gap-1">
                  <Clock className="h-3.5 w-3.5" />
                  {featured.readingTime}
                </span>
              </div>
              <h2 className="mt-3 text-2xl sm:text-3xl font-bold tracking-tight text-ink-900 group-hover:text-brand-600 transition-colors">
                {featured.title}
              </h2>
              <p className="mt-3 text-ink-600 leading-relaxed">
                {featured.description}
              </p>
              <span className="mt-5 inline-flex items-center gap-1.5 text-sm font-semibold text-brand-600">
                Read the full article
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </span>
            </div>
          </Link>
        </div>
      </section>

      {/* GRID */}
      <section className="pb-20 sm:pb-28">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h2 className="mb-8 text-xl font-bold text-ink-900">
            More from the playbook
          </h2>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {rest.map((post) => (
              <Link
                key={post.slug}
                href={`/blog/${post.slug}`}
                className="group flex flex-col rounded-2xl border border-ink-100 bg-white p-6 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all"
              >
                <span className="inline-flex w-fit items-center gap-2 rounded-full bg-brand-50 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wider text-brand-700">
                  {post.category}
                </span>
                <h3 className="mt-4 text-lg font-bold text-ink-900 leading-snug group-hover:text-brand-600 transition-colors">
                  {post.title}
                </h3>
                <p className="mt-2 text-sm text-ink-600 leading-relaxed line-clamp-3">
                  {post.description}
                </p>
                <div className="mt-5 flex items-center justify-between text-xs text-ink-500">
                  <span className="inline-flex items-center gap-1">
                    <Calendar className="h-3.5 w-3.5" />
                    {formatDate(post.date)}
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <Clock className="h-3.5 w-3.5" />
                    {post.readingTime}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* EMAIL CAPTURE */}
      <section className="border-t border-ink-100 py-16">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          <EmailCaptureForm
            source="blog_index"
            headline="Free Guide: 5 Reasons Your Facebook Leads Go Cold"
            description="Get our 7-page playbook — the same one we send to every new Rocketeerio customer — delivered straight to your inbox."
            cta="Send me the guide"
          />
        </div>
      </section>

      {/* CTA */}
      <section className="bg-ink-50/60 border-t border-ink-100 py-20">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-ink-900">
            Tired of reading?{" "}
            <span className="text-brand-500">Try the system.</span>
          </h2>
          <p className="mt-3 text-ink-600">
            Setup takes ten minutes. Most accounts get their first hot lead the
            same day.
          </p>
          <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-3">
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
              Compare plans
            </Link>
          </div>
          <div className="mt-5">
            <TrustSignals />
          </div>
        </div>
      </section>
    </>
  );
}
