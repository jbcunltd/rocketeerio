"use client";

import { useEffect } from "react";

// Extend window to include FB global
declare global {
  interface Window {
    fbAsyncInit?: () => void;
    FB?: {
      init: (config: { appId: string; xfbml: boolean; version: string }) => void;
    };
  }
}

export function MessengerChatPlugin() {
  const pageId = process.env.NEXT_PUBLIC_FB_PAGE_ID;

  useEffect(() => {
    if (!pageId) return;

    // Initialize the Facebook SDK
    window.fbAsyncInit = function () {
      if (window.FB) {
        window.FB.init({
          appId: "YOUR_APP_ID", // Meta will handle this via the plugin
          xfbml: true,
          version: "v18.0",
        });
      }
    };

    // Load the Facebook SDK script
    const script = document.createElement("script");
    script.async = true;
    script.defer = true;
    script.crossOrigin = "anonymous";
    script.src = "https://connect.facebook.net/en_US/sdk.js#xfbml=1&version=v18.0";
    document.body.appendChild(script);

    return () => {
      // Cleanup: remove script if component unmounts
      if (script.parentNode) {
        script.parentNode.removeChild(script);
      }
    };
  }, [pageId]);

  // Don't render if page ID is not set
  if (!pageId) {
    return null;
  }

  return (
    <div
      id="fb-root"
      className="print:hidden"
      suppressHydrationWarning
    >
      {/* Meta Messenger Chat Plugin */}
      <div
        className="fb-customerchat"
        data-page_id={pageId}
        data-attribution="setup_tool"
        data-theme_color="#0084FF"
        data-logged_in_greeting="Hi! 👋 Want to see how Rocketeerio qualifies your leads automatically? Ask me anything."
        data-logged_out_greeting="Hi! 👋 Want to see how Rocketeerio qualifies your leads automatically? Ask me anything."
      />
    </div>
  );
}
