"use client";

import { useEffect, useState } from "react";
import { Sparkles, X } from "lucide-react";
import { EmailCaptureForm } from "./email-capture-form";

const STORAGE_KEY = "rocketeerio:exit-intent-shown";
// Persist across sessions for a softer re-prompt cadence (7 days).
const COOLDOWN_MS = 7 * 24 * 60 * 60 * 1000;

function shouldShow(): boolean {
  if (typeof window === "undefined") return false;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return true;
    const last = Number(raw);
    if (Number.isNaN(last)) return true;
    return Date.now() - last > COOLDOWN_MS;
  } catch {
    return true;
  }
}

function markShown() {
  try {
    window.localStorage.setItem(STORAGE_KEY, String(Date.now()));
  } catch {
    /* no-op */
  }
}

function isMobile(): boolean {
  if (typeof window === "undefined") return false;
  // Touch-first or narrow viewport: use the timer trigger instead of mouseleave.
  return (
    window.matchMedia?.("(pointer: coarse)").matches ||
    window.innerWidth < 768
  );
}

export function ExitIntentPopup() {
  const [open, setOpen] = useState(false);
  const [armed, setArmed] = useState(false);

  // Arm only after the user has had a chance to engage with the page.
  useEffect(() => {
    if (!shouldShow()) return;
    const arm = () => setArmed(true);
    const t = window.setTimeout(arm, 4000);
    const onScroll = () => arm();
    window.addEventListener("scroll", onScroll, { passive: true, once: true });
    return () => {
      window.clearTimeout(t);
      window.removeEventListener("scroll", onScroll);
    };
  }, []);

  useEffect(() => {
    if (!armed) return;
    if (typeof window === "undefined") return;

    function trigger() {
      if (!shouldShow()) return;
      markShown();
      setOpen(true);
    }

    // Desktop: mouse moves toward the top of the viewport (exit intent).
    function onMouseLeave(e: MouseEvent) {
      if (e.clientY <= 0 && e.relatedTarget === null) trigger();
    }

    let timer: number | undefined;
    if (isMobile()) {
      // Mobile: time-based fallback after 30s of attention.
      timer = window.setTimeout(trigger, 30_000);
    } else {
      document.addEventListener("mouseleave", onMouseLeave);
    }

    // Either platform: hidden tab (likely leaving) is also a signal.
    function onVisibility() {
      if (document.visibilityState === "hidden") trigger();
    }
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      if (timer) window.clearTimeout(timer);
      document.removeEventListener("mouseleave", onMouseLeave);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [armed]);

  // ESC to close.
  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="exit-intent-title"
      className="fixed inset-0 z-[70] flex items-end sm:items-center justify-center p-4 animate-fade-in"
    >
      <div
        className="absolute inset-0 bg-ink-900/65 backdrop-blur-sm"
        onClick={() => setOpen(false)}
        aria-hidden
      />
      <div className="relative w-full max-w-lg overflow-hidden rounded-2xl bg-white shadow-2xl shadow-ink-900/40 animate-pop-in">
        <button
          type="button"
          aria-label="Close popup"
          onClick={() => setOpen(false)}
          className="absolute right-3 top-3 z-10 inline-flex h-9 w-9 items-center justify-center rounded-full bg-white/15 text-white hover:bg-white/25 focus:outline-none focus:ring-2 focus:ring-white/50"
        >
          <X className="h-4 w-4" />
        </button>
        <div className="bg-gradient-to-br from-brand-600 to-brand-700 px-6 py-6 text-white">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider">
            <Sparkles className="h-3 w-3" />
            Wait — before you go
          </span>
          <h2 id="exit-intent-title" className="mt-3 text-2xl font-bold leading-tight">
            Free Guide: 5 Reasons Your Facebook Leads Go Cold
          </h2>
          <p className="mt-2 text-sm text-white/90">
            The 7-page playbook 500+ businesses use to triple their conversion
            rate — yours instantly.
          </p>
        </div>
        <div className="p-6">
          <EmailCaptureForm
            source="exit_intent"
            headline="Drop your email — we'll send the guide instantly."
            description="No credit card. No spam. Unsubscribe in one click."
            cta="Get the free guide"
          />
        </div>
      </div>
    </div>
  );
}
