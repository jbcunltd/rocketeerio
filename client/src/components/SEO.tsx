import { Helmet } from "react-helmet-async";

interface SEOProps {
  title?: string;
  description?: string;
  path?: string;
  type?: "website" | "article";
  image?: string;
  noindex?: boolean;
}

const SITE_NAME = "Rocketeerio";
const SITE_URL = "https://rocketeerio.com";
const DEFAULT_TITLE =
  "Rocketeerio — Reply First. Win More Sales.";
const DEFAULT_DESCRIPTION =
  "Stop losing leads you already paid for. Rocketeerio replies instantly to your Facebook and Instagram messages and alerts you when it's time to close.";
const DEFAULT_IMAGE = `${SITE_URL}/og-image.png`;

export default function SEO({
  title,
  description = DEFAULT_DESCRIPTION,
  path = "/",
  type = "website",
  image = DEFAULT_IMAGE,
  noindex = false,
}: SEOProps) {
  const pageTitle = title ? `${title} | ${SITE_NAME}` : DEFAULT_TITLE;
  const canonicalUrl = `${SITE_URL}${path}`;

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
      <meta property="og:locale" content="en_US" />

      {/* Twitter Card */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={pageTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={image} />

      {/* JSON-LD Structured Data — SoftwareApplication */}
      <script type="application/ld+json">
        {JSON.stringify({
          "@context": "https://schema.org",
          "@type": "SoftwareApplication",
          name: "Rocketeerio",
          applicationCategory: "BusinessApplication",
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
          aggregateRating: {
            "@type": "AggregateRating",
            ratingValue: "4.8",
            ratingCount: "120",
          },
          creator: {
            "@type": "Organization",
            name: "Rocketeerio",
            url: SITE_URL,
          },
        })}
      </script>
    </Helmet>
  );
}
