import Link from "next/link";
import { ArrowLeft, ArrowRight } from "lucide-react";

export const metadata = {
  title: "Page not found",
  robots: { index: false, follow: false },
};

export default function NotFound() {
  return (
    <section className="relative">
      <div aria-hidden className="absolute inset-x-0 top-0 h-72 bg-radial-fade" />
      <div className="relative mx-auto max-w-2xl px-4 sm:px-6 lg:px-8 py-24 text-center">
        <span className="inline-flex items-center gap-2 rounded-full border border-brand-100 bg-brand-50 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-brand-700">
          404 · Page not found
        </span>
        <h1 className="mt-5 text-5xl sm:text-6xl font-bold tracking-tight text-ink-900">
          This page went cold.
        </h1>
        <p className="mt-4 text-lg text-ink-600">
          But your Facebook leads don&apos;t have to. Head back to the homepage
          or check our latest playbooks.
        </p>
        <div className="mt-7 flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-xl bg-brand-500 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-brand-500/25 hover:bg-brand-600"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to homepage
          </Link>
          <Link
            href="/blog"
            className="inline-flex items-center gap-2 rounded-xl border border-ink-200 bg-white px-5 py-3 text-sm font-semibold text-ink-800 hover:bg-ink-50"
          >
            Read the blog
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}
