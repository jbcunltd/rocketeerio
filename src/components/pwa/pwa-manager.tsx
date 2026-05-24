"use client";

import Image from "next/image";
import { useEffect, useState } from "react";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
};

const INSTALL_DISMISSED_KEY = "rocketeerio-pwa-install-dismissed";

function isMobileViewport() {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(max-width: 768px)").matches || /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
}

export function PwaManager() {
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showInstallBanner, setShowInstallBanner] = useState(false);

  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;

    const registerServiceWorker = async () => {
      try {
        await navigator.serviceWorker.register("/sw.js", { scope: "/" });
      } catch (error) {
        console.error("[pwa] Failed to register service worker", error);
      }
    };

    if (document.readyState === "complete") {
      void registerServiceWorker();
    } else {
      window.addEventListener("load", registerServiceWorker, { once: true });
      return () => window.removeEventListener("load", registerServiceWorker);
    }
  }, []);

  useEffect(() => {
    const handleBeforeInstallPrompt = (event: Event) => {
      if (!isMobileViewport()) return;
      if (window.localStorage.getItem(INSTALL_DISMISSED_KEY) === "true") return;

      event.preventDefault();
      setInstallPrompt(event as BeforeInstallPromptEvent);
      setShowInstallBanner(true);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    return () => window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
  }, []);

  const dismissInstallPrompt = () => {
    window.localStorage.setItem(INSTALL_DISMISSED_KEY, "true");
    setShowInstallBanner(false);
    setInstallPrompt(null);
  };

  const installApp = async () => {
    if (!installPrompt) return;

    try {
      await installPrompt.prompt();
      await installPrompt.userChoice;
    } finally {
      dismissInstallPrompt();
    }
  };

  if (!showInstallBanner || !installPrompt) return null;

  return (
    <div className="fixed inset-x-4 bottom-4 z-50 rounded-2xl border border-white/20 bg-[#1B2A4A]/95 p-4 text-white shadow-2xl backdrop-blur md:hidden">
      <div className="flex items-start gap-3">
        <Image src="/icon-192.png" alt="" width={40} height={40} className="mt-0.5 rounded-xl" />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold">Install Rocketeerio</p>
          <p className="mt-1 text-xs leading-5 text-white/80">
            Add it to your home screen for faster access to your Live Inbox.
          </p>
          <div className="mt-3 flex gap-2">
            <button
              type="button"
              onClick={installApp}
              className="rounded-full bg-[#0084FF] px-4 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-[#006fd6]"
            >
              Install App
            </button>
            <button
              type="button"
              onClick={dismissInstallPrompt}
              className="rounded-full border border-white/20 px-4 py-2 text-xs font-semibold text-white/80 transition hover:bg-white/10 hover:text-white"
            >
              Not now
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
