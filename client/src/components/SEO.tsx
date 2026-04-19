import { Helmet } from "react-helmet-async";

interface SEOProps {
  title?: string;
  description?: string;
  path?: string;
  type?: "website" | "article";
  image?: string;
  noindex?: boolean;
  /** Optional JSON-LD object(s) to inject in addition to the default SoftwareApplication schema. */
  schema?: Record<string, unknown> | Array<Record<string, unknown>>;
  /** When true, skip emitting the default SoftwareApplication schema (e.g. when a page provides its own primary schema). */
  skipDefaultSchema?: boolean;
}

const SITE_NAME = "Rocketeerio";
const SITE_URL = "https://rocketeerio.com";
const DEFAULT_TITLE =
  "Rocketeerio — Turn Facebook Leads Into Paying Customers";
const DEFAULT_DESCRIPTION =
  "Rocketeerio is the Facebook lead conversion system that replies to every message in seconds, qualifies the lead, and tells you exactly when to step in and close. Stop losing leads you already paid for.";
const DEFAULT_IMAGE = `${SITE_URL}/og-image.png`;

const DEFAULT_SOFTWARE_APPLICATION_SCHEMA = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "Rocketeerio",
  applicationCategory: "BusinessApplication",
  applicationSubCategory: "Lead Conversion System",
  operatingSystem: "Web",
  url: SITE_URL,
  description: DEFAULT_DESCRIPTION,
  offers: {
    "@type": "AggregateOffer",
    priceCurrency: "USD",
    lowPrice: "0",
    highPrice: "149",
    offerCount: "5",
  },
  creator: {
    "@type": "Organization",
    name: "Rocketeerio",
    url: SITE_URL,
    logo: `${SITE_URL}/android-chrome-512x512.png`,
  },
};

export default function SEO({
  title,
  description = DEFAULT_DESCRIPTION,
  path = "/",
  type = "website",
  image = DEFAULT_IMAGE,
  noindex = false,
  schema,
  skipDefaultSchema = false,
}: SEOProps) {
  const pageTitle = title ? `${title} | ${SITE_NAME}` : DEFAULT_TITLE;
  const canonicalUrl = `${SITE_URL}${path}`;

  const extraSchemas = schema
    ? Array.isArray(schema)
      ? schema
      : [schema]
    : [];

  return (
    <Helmet>
      {/* Basic meta */}
      <title>{pageTitle}</title>
      <meta name="description" content={description} />
      <link rel="canonical" href={canonicalUrl} />
      {noindex && <meta name="robots" content="noindex, nofollow" />}

      {/* Open Graph */}
      <meta property="og:site_name" content={SITE_NAME} />
      <meta property="og:title" content={pageTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:url" content={canonicalUrl} />
      <meta property="og:type" content={type} />
      <meta property="og:image" content={image} />
      <meta property="og:image:width" content="1200" />
      <meta property="og:image:height" content="630" />
      <meta property="og:image:alt" content={pageTitle} />
      <meta property="og:locale" content="en_US" />

      {/* Twitter Card */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={pageTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={image} />
      <meta name="twitter:image:alt" content={pageTitle} />

      {/* JSON-LD — default SoftwareApplication schema */}
      {!skipDefaultSchema && (
        <script type="application/ld+json">
          {JSON.stringify(DEFAULT_SOFTWARE_APPLICATION_SCHEMA)}
        </script>
      )}

      {/* JSON-LD — additional per-page schemas (FAQ, Article, BreadcrumbList, etc.) */}
      {extraSchemas.map((s, i) => (
        <script key={`schema-${i}`} type="application/ld+json">
          {JSON.stringify(s)}
        </script>
      ))}
    </Helmet>
  );
}
