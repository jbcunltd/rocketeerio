"use client";

import { useEffect, useRef, useState } from "react";
import { MessageCircle, Send, X, Zap } from "lucide-react";

export function ChatWidget() {
  const [open, setOpen] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [pulse, setPulse] = useState(true);
  const dialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Stop the attention pulse after first interaction
    if (open) setPulse(false);
  }, [open]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const data = new FormData(form);
    const payload = {
      email: String(data.get("email") || ""),
      message: String(data.get("message") || ""),
      source: "chat_widget",
    };
    // Best-effort post; ignore errors so the widget stays UX-only
    try {
      fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      }).catch(() => {});
    } catch {
      /* no-op */
    }
    setSubmitted(true);
    form.reset();
  }

  return (
    <div
      aria-hidden={false}
      className="fixed bottom-5 right-4 sm:bottom-6 sm:right-6 z-[60] print:hidden"
    >
      {/* Panel */}
      {open && (
        <div
          role="dialog"
          aria-label="Chat with the Rocketeerio team"
          ref={dialogRef}
          className="mb-3 w-[min(92vw,360px)] origin-bottom-right overflow-hidden rounded-2xl border border-ink-100 bg-white shadow-2xl shadow-ink-900/20 animate-pop-in"
        >
          <header className="relative flex items-center gap-3 bg-brand-500 px-4 py-3 text-white">
            <span className="grid h-9 w-9 flex-none place-items-center rounded-full bg-white/15">
              <Zap className="h-4 w-4" />
            </span>
            <div className="min-w-0">
              <p className="text-sm font-semibold leading-tight">
                Chat with Rocketeerio
              </p>
              <p className="text-[11px] leading-tight text-white/80">
                We typically reply in under 60 seconds.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Close chat"
              className="absolute right-2 top-2 grid h-8 w-8 place-items-center rounded-full text-white/90 hover:bg-white/15"
            >
              <X className="h-4 w-4" />
            </button>
          </header>

          <div className="px-4 py-4">
            {submitted ? (
              <div className="text-center py-6">
                <div className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-brand-50 text-brand-600">
                  <Zap className="h-6 w-6" />
                </div>
                <p className="mt-3 text-sm font-semibold text-ink-900">
                  Got it — message received.
                </p>
                <p className="mt-1.5 text-xs text-ink-600">
                  We&apos;ll reply to your email shortly. Or grab time directly:{" "}
                  <a
                    href="mailto:hello@rocketeerio.com"
                    className="font-semibold text-brand-600 hover:text-brand-700"
                  >
                    hello@rocketeerio.com
                  </a>
                </p>
              </div>
            ) : (
              <>
                <div className="rounded-xl bg-ink-50 px-3.5 py-3 text-sm text-ink-800">
                  Hi there! Got a question about Rocketeerio? Drop your email
                  and a note — a real human (not a bot) will reply.
                </div>
                <form onSubmit={onSubmit} className="mt-3 space-y-2.5">
                  <label className="block">
                    <span className="sr-only">Email</span>
                    <input
                      type="email"
                      name="email"
                      required
                      placeholder="you@business.com"
                      className="w-full rounded-lg border border-ink-200 bg-white px-3 py-2 text-sm text-ink-900 placeholder:text-ink-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/30"
                    />
                  </label>
                  <label className="block">
                    <span className="sr-only">Message</span>
                    <textarea
                      name="message"
                      required
                      rows={3}
                      placeholder="What's on your mind?"
                      className="w-full resize-none rounded-lg border border-ink-200 bg-white px-3 py-2 text-sm text-ink-900 placeholder:text-ink-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/30"
                    />
                  </label>
                  <button
                    type="submit"
                    className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-700 focus:outline-none focus:ring-2 focus:ring-brand-500/40"
                  >
                    Send message
                    <Send className="h-3.5 w-3.5" />
                  </button>
                </form>
                <p className="mt-2 text-[11px] text-ink-500">
                  Prefer Messenger?{" "}
                  <a
                    href="https://m.me/rocketeerio"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-semibold text-brand-600 hover:text-brand-700"
                  >
                    Chat on Facebook
                  </a>
                </p>
              </>
            )}
          </div>
        </div>
      )}

      {/* Bubble */}
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-label={open ? "Close chat" : "Open chat"}
        aria-expanded={open}
        className="group relative inline-flex h-14 w-14 items-center justify-center rounded-full bg-brand-600 text-white shadow-xl shadow-brand-900/30 ring-2 ring-white hover:bg-brand-700 focus:outline-none focus:ring-4 focus:ring-brand-500/40 transition-colors"
      >
        {pulse && !open && (
          <span
            aria-hidden
            className="absolute inset-0 rounded-full bg-brand-500/60 animate-ping"
          />
        )}
        {open ? (
          <X className="relative h-6 w-6" />
        ) : (
          <MessageCircle className="relative h-6 w-6" />
        )}
        <span className="sr-only">Chat with us</span>
      </button>
    </div>
  );
}
