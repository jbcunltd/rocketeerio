/**
 * Google Analytics 4 + Google Ads conversion tracking helper.
 *
 * Measurement IDs / Conversion IDs are read from Vite env variables:
 *   VITE_GA4_ID          — e.g. G-XXXXXXXXXX
 *   VITE_GOOGLE_ADS_ID   — e.g. AW-XXXXXXXXXX
 *
 * The existing hard-coded GA4 tag (G-4QD2CXZ9MS) in index.html is kept as a
 * fallback; this module adds the configurable layer on top.
 */

export const GA4_ID = import.meta.env.VITE_GA4_ID as string | undefined;
export const GOOGLE_ADS_ID = import.meta.env.VITE_GOOGLE_ADS_ID as string | undefined;

/** Inject the gtag.js script for GA4 and/or Google Ads (call once). */
export function initGtag(): void {
  if (typeof window === "undefined") return;

  // Determine the primary measurement ID for the gtag.js loader
  const primaryId = GA4_ID || GOOGLE_ADS_ID;
  if (!primaryId) return;

  // Avoid double-loading if the script is already present
  if (document.querySelector(`script[src*="googletagmanager.com/gtag/js?id=${primaryId}"]`)) return;

  const script = document.createElement("script");
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${primaryId}`;
  document.head.appendChild(script);

  window.dataLayer = window.dataLayer || [];
  function gtag(...args: any[]) {
    window.dataLayer!.push(args);
  }
  (window as any).gtag = gtag;

  gtag("js", new Date());

  if (GA4_ID) {
    gtag("config", GA4_ID, { send_page_view: true });
  }
  if (GOOGLE_ADS_ID) {
    gtag("config", GOOGLE_ADS_ID);
  }
}

/** Send a GA4 / Google Ads event. */
export function gtagEvent(
  action: string,
  params?: Record<string, any>
): void {
  if (typeof window === "undefined" || !(window as any).gtag) return;
  (window as any).gtag("event", action, params);
}

/** Track a pageview (call on route change). */
export function gtagPageView(url: string): void {
  if (GA4_ID) {
    gtagEvent("page_view", { page_path: url });
  }
}

/**
 * Fire a Google Ads conversion event.
 * Call this after a successful signup.
 *
 * Usage:
 *   gtagConversion("AW-XXXXXXXXX/CONVERSION_LABEL");
 */
export function gtagConversion(conversionLabel: string, value?: number): void {
  if (typeof window === "undefined" || !(window as any).gtag) return;
  const params: Record<string, any> = {
    send_to: conversionLabel,
  };
  if (value !== undefined) {
    params.value = value;
    params.currency = "USD";
  }
  (window as any).gtag("event", "conversion", params);
}

// Extend Window for TypeScript
declare global {
  interface Window {
    dataLayer?: any[];
  }
}
