/**
 * Facebook Pixel / Meta Conversions helper.
 *
 * The Pixel ID is read from the Vite env variable VITE_FB_PIXEL_ID
 * (set via Vercel environment variables as VITE_FB_PIXEL_ID).
 */

const FB_PIXEL_ID = import.meta.env.VITE_FB_PIXEL_ID as string | undefined;

/** Inject the Facebook Pixel base code into <head> (call once on app init). */
export function initFacebookPixel(): void {
  if (!FB_PIXEL_ID) return;
  if (typeof window === "undefined") return;
  // Prevent double-init
  if ((window as any).fbq) return;

  /* eslint-disable */
  (function (f: any, b: any, e: any, v: any, n?: any, t?: any, s?: any) {
    if (f.fbq) return;
    n = f.fbq = function () {
      n.callMethod ? n.callMethod.apply(n, arguments) : n.queue.push(arguments);
    };
    if (!f._fbq) f._fbq = n;
    n.push = n;
    n.loaded = !0;
    n.version = "2.0";
    n.queue = [];
    t = b.createElement(e);
    t.async = !0;
    t.src = v;
    s = b.getElementsByTagName(e)[0];
    s.parentNode.insertBefore(t, s);
  })(
    window,
    document,
    "script",
    "https://connect.facebook.net/en_US/fbevents.js"
  );
  /* eslint-enable */

  (window as any).fbq("init", FB_PIXEL_ID);
  (window as any).fbq("track", "PageView");
}

/** Track a standard or custom Facebook Pixel event. */
export function fbEvent(eventName: string, params?: Record<string, any>): void {
  if (!FB_PIXEL_ID) return;
  if (typeof window === "undefined" || !(window as any).fbq) return;
  if (params) {
    (window as any).fbq("track", eventName, params);
  } else {
    (window as any).fbq("track", eventName);
  }
}

/** Track a Facebook Pixel PageView (call on route change). */
export function fbPageView(): void {
  fbEvent("PageView");
}
