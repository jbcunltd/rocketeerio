"use client";

import { useEffect } from "react";
import Link from "next/link";
import { ArrowLeft, RefreshCw } from "lucide-react";

export default function RouteError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Surface to logging in production
    console.error("[route error]", error);
  }, [error]);

  return (
    <div className="mx-auto flex min-h-[60vh] max-w-xl flex-col items-center justify-center px-4 py-16 text-center">
      <span className="inline-flex items-center gap-2 rounded-full border border-ink-200 bg-white px-3 py-1 text-xs font-semibold uppercase tracking-wider text-ink-700">
        Something went sideways
      </span>
      <h1 className="mt-5 text-3xl font-bold tracking-tight text-ink-900 sm:text-4xl">
        We hit a small snag.
      </h1>
      <p className="mt-3 text-base leading-relaxed text-ink-600">
        Don&apos;t worry — your data is safe. Try refreshing this page, or head
        back to the homepage and we&apos;ll get you sorted.
      </p>
      <div className="mt-8 flex flex-col gap-3 sm:flex-row">
        <button
          type="button"
          onClick={() => reset()}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-brand-600 px-5 py-3 text-sm font-semibold text-white shadow-sm shadow-brand-500/30 hover:bg-brand-700 focus:outline-none focus:ring-2 focus:ring-brand-500/40"
        >
          <RefreshCw className="h-4 w-4" />
          Try again
        </button>
        <Link
          href="/"
          className="inline-flex items-center justify-center gap-2 rounded-xl border border-ink-200 bg-white px-5 py-3 text-sm font-semibold text-ink-800 hover:bg-ink-50"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to homepage
        </Link>
      </div>
      {error?.digest && (
        <p className="mt-6 text-[11px] text-ink-400">
          Reference: {error.digest}
        </p>
      )}
    </div>
  );
}
