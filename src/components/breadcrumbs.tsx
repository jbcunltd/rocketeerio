import Link from "next/link";
import { ChevronRight, Home } from "lucide-react";

export type Crumb = {
  name: string;
  href?: string;
};

const SITE_URL = "https://rocketeerio.com";

export function Breadcrumbs({
  items,
  className = "",
}: {
  items: Crumb[];
  className?: string;
}) {
  // Always prepend Home if not already
  const trail: Crumb[] =
    items[0]?.href === "/" ? items : [{ name: "Home", href: "/" }, ...items];

  const schema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: trail.map((c, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: c.name,
      item: c.href ? `${SITE_URL}${c.href === "/" ? "" : c.href}` : undefined,
    })),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
      />
      <nav
        aria-label="Breadcrumb"
        className={`text-sm ${className}`}
      >
        <ol className="flex flex-wrap items-center gap-1.5 text-ink-600">
          {trail.map((c, i) => {
            const isLast = i === trail.length - 1;
            return (
              <li key={`${c.name}-${i}`} className="flex items-center gap-1.5">
                {i === 0 ? (
                  c.href && !isLast ? (
                    <Link
                      href={c.href}
                      className="inline-flex items-center gap-1 font-medium text-ink-700 hover:text-brand-700 underline-offset-2 hover:underline"
                    >
                      <Home className="h-3.5 w-3.5" aria-hidden />
                      <span>{c.name}</span>
                    </Link>
                  ) : (
                    <span className="inline-flex items-center gap-1 font-semibold text-ink-900">
                      <Home className="h-3.5 w-3.5" aria-hidden />
                      <span>{c.name}</span>
                    </span>
                  )
                ) : isLast || !c.href ? (
                  <span aria-current="page" className="font-semibold text-ink-900">
                    {c.name}
                  </span>
                ) : (
                  <Link
                    href={c.href}
                    className="font-medium text-ink-700 hover:text-brand-700 underline-offset-2 hover:underline"
                  >
                    {c.name}
                  </Link>
                )}
                {!isLast && (
                  <ChevronRight
                    className="h-3.5 w-3.5 text-ink-300"
                    aria-hidden
                  />
                )}
              </li>
            );
          })}
        </ol>
      </nav>
    </>
  );
}
