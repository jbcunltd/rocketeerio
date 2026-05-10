import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import Script from "next/script";
import "./globals.css";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { FloatingCTA } from "@/components/floating-cta";
import { ExitIntentPopup } from "@/components/exit-intent-popup";
import { ConditionalChrome } from "@/components/conditional-chrome";
import { RevealOnScroll } from "@/components/reveal-on-scroll";
import { MessengerChatPlugin } from "@/components/messenger-chat-plugin";
import { SkipToContent } from "@/components/skip-to-content";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
  preload: true,
  fallback: [
    "ui-sans-serif",
    "system-ui",
    "-apple-system",
    "Segoe UI",
    "Roboto",
    "Helvetica",
    "Arial",
    "sans-serif",
  ],
});

const SITE_URL = "https://rocketeerio.com";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "Hire Josh for Sales — Your AI Sales Hire",
    template: "%s | Rocketeerio",
  },
  description:
    "Josh replies to every Facebook and Instagram lead in under 60 seconds. He qualifies them. He pings you when one's hot.",
  keywords: [
    "facebook leads not converting",
    "auto reply facebook leads",
    "facebook lead follow up automation",
    "messenger lead qualification",
    "facebook lead automation",
    "AI lead conversion",
  ],
  authors: [{ name: "Rocketeerio" }],
  creator: "Rocketeerio",
  publisher: "Rocketeerio",
  alternates: {
    canonical: SITE_URL,
  },
  openGraph: {
    type: "website",
    url: SITE_URL,
    siteName: "Rocketeerio",
    title: "Hire Josh for Sales — Your AI Sales Hire",
    description:
      "Josh replies to every Facebook and Instagram lead in under 60 seconds. He qualifies them. He pings you when one's hot.",
    locale: "en_US",
    images: [
      {
        url: "/api/og?title=Hire%20Josh%20%E2%80%94%20Your%20AI%20Sales%20Hire&eyebrow=ROCKETEERIO&kicker=Josh%20replies%20to%20every%20Meta%20lead%20in%20under%2060%20seconds.",
        width: 1200,
        height: 630,
        alt: "Hire Josh for Sales — Your AI Sales Hire",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Hire Josh for Sales — Your AI Sales Hire",
    description:
      "Josh replies to every Facebook and Instagram lead in under 60 seconds. He qualifies them. He pings you when one's hot.",
    images: [
      "/api/og?title=Hire%20Josh%20%E2%80%94%20Your%20AI%20Sales%20Hire&eyebrow=ROCKETEERIO&kicker=Josh%20replies%20to%20every%20Meta%20lead%20in%20under%2060%20seconds.",
    ],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
      { url: "/icon.svg", type: "image/svg+xml" },
    ],
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
  },
  manifest: "/site.webmanifest",
  verification: {
    google: "_Kq_4GEBvuLla0OqTCLNjvYB1hkl19fUWpOupXJ-8YY",
  },
};

export const viewport: Viewport = {
  themeColor: "#0084FF",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const orgSchema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "Rocketeerio",
    url: SITE_URL,
    logo: `${SITE_URL}/logo.svg`,
    description:
      "Rocketeerio is an AI manpower agency. Josh replies to Meta leads in under 60 seconds, qualifies them, and alerts you when one is hot.",
    sameAs: ["https://www.facebook.com/rocketeerio"],
    contactPoint: [
      {
        "@type": "ContactPoint",
        email: "hello@rocketeerio.com",
        contactType: "customer support",
        availableLanguage: ["English"],
      },
    ],
  };

  const websiteSchema = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "Rocketeerio",
    url: SITE_URL,
    potentialAction: {
      "@type": "SearchAction",
      target: `${SITE_URL}/blog?q={search_term_string}`,
      "query-input": "required name=search_term_string",
    },
  };

  return (
    <html lang="en" className={`${inter.variable} h-full antialiased`}>
      <head>
        {/* Performance: preconnect + DNS prefetch hints for external origins */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="dns-prefetch" href="https://www.facebook.com" />
        <link rel="dns-prefetch" href="https://m.me" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(orgSchema) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteSchema) }}
        />
      </head>
      <body className="min-h-full flex flex-col bg-white text-ink-900 font-sans">
        <SkipToContent />
        <ConditionalChrome>
          <SiteHeader />
        </ConditionalChrome>
        <RevealOnScroll />
        <main id="main-content" tabIndex={-1} className="flex-1 focus:outline-none">
          {children}
        </main>
        <ConditionalChrome>
          <SiteFooter />
          <FloatingCTA />
          <ExitIntentPopup />
          <MessengerChatPlugin />
        </ConditionalChrome>
      <Script
        src="https://www.googletagmanager.com/gtag/js?id=G-4QD2CXZ9MS"
        strategy="afterInteractive"
      />
      <Script id="ga4-init" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', 'G-4QD2CXZ9MS');
        `}
      </Script>
      </body>
    </html>
  );
}
