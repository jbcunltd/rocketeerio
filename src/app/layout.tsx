import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { FloatingCTA } from "@/components/floating-cta";
import { ExitIntentPopup } from "@/components/exit-intent-popup";
import { ConditionalChrome } from "@/components/conditional-chrome";
import { RevealOnScroll } from "@/components/reveal-on-scroll";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const SITE_URL = "https://rocketeerio.com";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "Rocketeerio — AI-Powered Facebook Lead Conversion System",
    template: "%s | Rocketeerio",
  },
  description:
    "Rocketeerio instantly auto-replies to your Facebook leads, qualifies them automatically, and tells you exactly when to step in and close. Stop losing leads to slow replies.",
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
    title: "Rocketeerio — AI-Powered Facebook Lead Conversion System",
    description:
      "Auto-reply to Facebook leads in under 60 seconds, qualify them with AI, and step in only when they're ready to buy.",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: "Rocketeerio — AI-Powered Facebook Lead Conversion",
    description:
      "Auto-reply, qualify, and convert Facebook leads on autopilot. Built for businesses that live and die by paid social.",
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
      "AI-powered Facebook lead conversion system that instantly auto-replies, qualifies leads, and alerts you when to close.",
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

  return (
    <html lang="en" className={`${inter.variable} h-full antialiased`}>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(orgSchema) }}
        />
      </head>
      <body className="min-h-full flex flex-col bg-white text-ink-900 font-sans">
        <ConditionalChrome>
          <SiteHeader />
        </ConditionalChrome>
        <RevealOnScroll />
        <main className="flex-1">{children}</main>
        <ConditionalChrome>
          <SiteFooter />
          <FloatingCTA />
          <ExitIntentPopup />
        </ConditionalChrome>
      </body>
    </html>
  );
}
