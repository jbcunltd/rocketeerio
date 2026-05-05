import { ReactNode } from "react";
import { Breadcrumbs } from "./breadcrumbs";

export function LegalLayout({
  title,
  effective,
  lastUpdated,
  children,
  breadcrumbName,
}: {
  title: string;
  effective: string;
  lastUpdated?: string;
  children: ReactNode;
  breadcrumbName?: string;
}) {
  const crumbName = breadcrumbName ?? title;
  return (
    <article className="relative">
      <div aria-hidden className="absolute inset-x-0 top-0 h-72 bg-radial-fade" />
      <div className="relative mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 pt-8">
        <Breadcrumbs items={[{ name: "Legal" }, { name: crumbName }]} />
      </div>
      <div className="relative mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 pt-6 pb-20">
        <span className="inline-flex items-center gap-2 rounded-full border border-brand-100 bg-brand-50 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-brand-700">
          Legal
        </span>
        <h1 className="mt-4 text-4xl sm:text-5xl font-bold tracking-tight text-ink-900">
          {title}
        </h1>
        <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-ink-500">
          <p>Effective {effective}</p>
          {lastUpdated && (
            <>
              <span aria-hidden className="text-ink-300">
                ·
              </span>
              <p>Last updated: {lastUpdated}</p>
            </>
          )}
        </div>
        <div className="prose-rocket mt-10">{children}</div>
      </div>
    </article>
  );
}
