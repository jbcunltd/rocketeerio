/**
 * Root-level loading UI. Rendered as a Suspense fallback while
 * server components stream / data is fetched. Keeps perceived
 * performance high without flashing a blank page.
 */
export default function RootLoading() {
  return (
    <div
      role="status"
      aria-live="polite"
      aria-busy="true"
      className="min-h-[60vh] w-full"
    >
      <span className="sr-only">Loading…</span>

      {/* Hero skeleton */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16">
        <div className="mx-auto max-w-3xl text-center">
          <div className="mx-auto h-6 w-44 rounded-full bg-ink-100 animate-pulse" />
          <div className="mx-auto mt-6 h-12 w-full max-w-xl rounded-xl bg-ink-100 animate-pulse" />
          <div className="mx-auto mt-4 h-12 w-full max-w-md rounded-xl bg-ink-100 animate-pulse" />
          <div className="mx-auto mt-8 h-5 w-2/3 max-w-md rounded bg-ink-100 animate-pulse" />
          <div className="mx-auto mt-3 h-5 w-1/2 max-w-sm rounded bg-ink-100 animate-pulse" />
          <div className="mt-8 flex justify-center gap-3">
            <div className="h-12 w-40 rounded-xl bg-ink-100 animate-pulse" />
            <div className="h-12 w-32 rounded-xl bg-ink-100 animate-pulse" />
          </div>
        </div>

        {/* Card grid skeleton */}
        <div className="mt-16 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <div
              key={i}
              className="h-44 rounded-2xl border border-ink-100 bg-ink-50/60 animate-pulse"
            />
          ))}
        </div>
      </div>
    </div>
  );
}
