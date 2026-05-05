import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowRight, Calendar, Clock } from "lucide-react";
import { BLOG_POSTS } from "@/lib/site";
import { BLOG_BODIES } from "@/lib/blog-content";
import { TrustSignals } from "@/components/trust-signals";

type Params = Promise<{ slug: string }>;

export function generateStaticParams() {
  return BLOG_POSTS.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Params;
}): Promise<Metadata> {
  const { slug } = await params;
  const post = BLOG_POSTS.find((p) => p.slug === slug);
  if (!post) return {};
  const url = `https://rocketeerio.com/blog/${post.slug}`;
  return {
    title: post.title,
    description: post.description,
    keywords: post.keywords,
    alternates: { canonical: url },
    openGraph: {
      title: post.title,
      description: post.description,
      url,
      type: "article",
      publishedTime: post.date,
    },
    twitter: {
      card: "summary_large_image",
      title: post.title,
      description: post.description,
    },
  };
}

const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

export default async function BlogArticle({ params }: { params: Params }) {
  const { slug } = await params;
  const post = BLOG_POSTS.find((p) => p.slug === slug);
  if (!post) return notFound();
  const body = BLOG_BODIES[post.slug];

  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: "https://rocketeerio.com/" },
      { "@type": "ListItem", position: 2, name: "Blog", item: "https://rocketeerio.com/blog" },
      {
        "@type": "ListItem",
        position: 3,
        name: post.title,
        item: `https://rocketeerio.com/blog/${post.slug}`,
      },
    ],
  };

  const articleSchema = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: post.title,
    description: post.description,
    datePublished: post.date,
    author: { "@type": "Organization", name: "Rocketeerio" },
    publisher: {
      "@type": "Organization",
      name: "Rocketeerio",
      logo: {
        "@type": "ImageObject",
        url: "https://rocketeerio.com/logo.svg",
      },
    },
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": `https://rocketeerio.com/blog/${post.slug}`,
    },
  };

  const others = BLOG_POSTS.filter((p) => p.slug !== post.slug).slice(0, 3);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema) }}
      />

      <article className="relative">
        {/* Soft top */}
        <div aria-hidden className="absolute inset-x-0 top-0 h-72 bg-radial-fade" />

        <div className="relative mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 pt-12 pb-20">
          {/* Breadcrumbs */}
          <nav aria-label="Breadcrumb" className="mb-5">
            <ol className="flex flex-wrap items-center gap-1.5 text-xs text-ink-500">
              <li>
                <Link href="/" className="hover:text-ink-900">
                  Home
                </Link>
              </li>
              <li aria-hidden className="text-ink-300">/</li>
              <li>
                <Link href="/blog" className="hover:text-ink-900">
                  Blog
                </Link>
              </li>
              <li aria-hidden className="text-ink-300">/</li>
              <li className="truncate text-ink-700" aria-current="page">
                {post.title}
              </li>
            </ol>
          </nav>

          <Link
            href="/blog"
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-brand-600 hover:text-brand-700"
          >
            <ArrowLeft className="h-4 w-4" />
            All articles
          </Link>

          <header className="mt-6">
            <span className="inline-flex w-fit items-center gap-2 rounded-full bg-brand-50 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wider text-brand-700">
              {post.category}
            </span>
            <h1 className="mt-4 text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-ink-900 leading-tight">
              {post.title}
            </h1>
            <p className="mt-4 text-lg text-ink-600 leading-relaxed">
              {post.description}
            </p>
            <div className="mt-5 flex items-center gap-4 text-xs text-ink-500">
              <span className="inline-flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5" />
                {formatDate(post.date)}
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5" />
                {post.readingTime}
              </span>
            </div>
          </header>

          {/* Body */}
          <div className="prose-rocket mt-10">{body}</div>

          {/* In-article CTA */}
          <aside className="mt-14 rounded-2xl border border-brand-100 bg-brand-50 p-7">
            <p className="text-xs font-semibold uppercase tracking-wider text-brand-700">
              Stop reading. Start closing.
            </p>
            <h3 className="mt-2 text-2xl font-bold text-ink-900">
              See your first lead get qualified in real time.
            </h3>
            <p className="mt-2 text-ink-700">
              Connect your Facebook Page in two clicks. The free trial does the
              rest.
            </p>
            <div className="mt-5 flex flex-col sm:flex-row gap-3">
              <Link
                href="/signup"
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-brand-500 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-brand-500/25 hover:bg-brand-600"
              >
                Start Free Trial
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/pricing"
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-ink-200 bg-white px-5 py-3 text-sm font-semibold text-ink-800 hover:bg-ink-50"
              >
                See pricing
              </Link>
            </div>
            <div className="mt-4">
              <TrustSignals className="justify-start" />
            </div>
          </aside>
        </div>
      </article>

      {/* RELATED */}
      <section className="border-t border-ink-100 bg-ink-50/50 py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-xl font-bold text-ink-900">Related articles</h2>
          <p className="mt-1 text-sm text-ink-600">
            More on the same topics from the Rocketeerio playbook.
          </p>
          <div className="mt-6 grid gap-6 md:grid-cols-3">
            {others.map((p) => (
              <Link
                key={p.slug}
                href={`/blog/${p.slug}`}
                className="group flex flex-col rounded-2xl border border-ink-100 bg-white p-6 hover:shadow-md transition-all"
              >
                <span className="inline-flex w-fit items-center gap-2 rounded-full bg-brand-50 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wider text-brand-700">
                  {p.category}
                </span>
                <h3 className="mt-3 text-base font-bold text-ink-900 leading-snug group-hover:text-brand-600 transition-colors">
                  {p.title}
                </h3>
                <p className="mt-2 text-sm text-ink-600 line-clamp-2">
                  {p.description}
                </p>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
