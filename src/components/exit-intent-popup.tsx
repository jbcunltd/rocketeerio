"use client";

import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { EmailCaptureForm } from "./email-capture-form";

const STORAGE_KEY = "rocketeerio:exit-intent-shown";

export function ExitIntentPopup() {
  const [open, setOpen] = useState(false);
  const [armed, setArmed] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (sessionStorage.getItem(STORAGE_KEY) === "1") return;
    // Only arm after the user has scrolled or after 5s on the page
    const arm = () => setArmed(true);
    const t = window.setTimeout(arm, 5000);
    window.addEventListener("scroll", arm, { passive: true, once: true });
    return () => {
      window.clearTimeout(t);
      window.removeEventListener("scroll", arm);
    };
  }, []);

  useEffect(() => {
    if (!armed) return;
    if (typeof window === "undefined") return;

    function trigger() {
      if (sessionStorage.getItem(STORAGE_KEY) === "1") return;
      sessionStorage.setItem(STORAGE_KEY, "1");
      setOpen(true);
    }

    function onMouseLeave(e: MouseEvent) {
      // mouse moved out the top of the viewport
      if (e.clientY <= 0 && e.relatedTarget === null) trigger();
    }

    function onVisibility() {
      // mobile: tab/page hidden
      if (document.visibilityState === "hidden") trigger();
    }

    document.addEventListener("mouseleave", onMouseLeave);
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      document.removeEventListener("mouseleave", onMouseLeave);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [armed]);

  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="exit-intent-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in"
    >
      <div
        className="absolute inset-0 bg-ink-900/60 backdrop-blur-sm"
        onClick={() => setOpen(false)}
        aria-hidden
      />
      <div className="relative w-full max-w-lg overflow-hidden rounded-2xl bg-white shadow-2xl animate-pop-in">
        <button
          type="button"
          aria-label="Close"
          onClick={() => setOpen(false)}
          className="absolute right-3 top-3 inline-flex h-8 w-8 items-center justify-center rounded-full text-ink-500 hover:bg-ink-50 hover:text-ink-900"
        >
          <X className="h-4 w-4" />
        </button>
        <div className="bg-brand-500 px-6 py-5 text-white">
          <p className="text-xs font-semibold uppercase tracking-wider text-white/80">
            Wait — before you go
          </p>
          <h2 id="exit-intent-title" className="mt-1 text-xl font-bold">
            5 Reasons Your Facebook Leads Go Cold
          </h2>
          <p className="mt-1 text-sm text-white/85">
            Get the free guide we send to every new Rocketeerio customer.
          </p>
        </div>
        <div className="p-6">
          <EmailCaptureForm
            source="exit_intent"
            headline="Drop your email — we'll send the guide instantly."
            description="No credit card. No commitment. Just the playbook our customers use to triple their conversion rate."
            cta="Get the free guide"
          />
        </div>
      </div>
    </div>
  );
}
