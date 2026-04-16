import { useEffect } from "react";
import { useLocation } from "wouter";
import { initFacebookPixel, fbPageView } from "@/lib/facebook-pixel";
import { initGtag, gtagPageView } from "@/lib/gtag";

/**
 * TrackingPixels — drop this once in the app tree.
 *
 * On mount it initialises Facebook Pixel, GA4, and Google Ads.
 * On every route change it fires pageview events for all active pixels.
 */
export default function TrackingPixels() {
  const [location] = useLocation();

  // Initialise pixels once
  useEffect(() => {
    initFacebookPixel();
    initGtag();
  }, []);

  // Fire pageview on every route change
  useEffect(() => {
    fbPageView();
    gtagPageView(location);
  }, [location]);

  // Render the Facebook Pixel noscript fallback
  const fbPixelId = import.meta.env.VITE_FB_PIXEL_ID as string | undefined;

  if (!fbPixelId) return null;

  return (
    <noscript>
      <img
        height="1"
        width="1"
        style={{ display: "none" }}
        src={`https://www.facebook.com/tr?id=${fbPixelId}&ev=PageView&noscript=1`}
        alt=""
      />
    </noscript>
  );
}
