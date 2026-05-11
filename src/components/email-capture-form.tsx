"use client";

import { useState } from "react";
import { ArrowRight, CheckCircle2, Loader2 } from "lucide-react";

interface EmailCaptureFormProps {
  variant?: "light" | "dark";
  source?: string;
  headline?: string;
  description?: string;
  cta?: string;
}

export function EmailCaptureForm({
  variant = "light",
  source = "homepage",
  headline = "Free Guide: 5 Reasons Your Facebook Leads Go Cold",
  description = "Get the 7-page playbook our customers use to turn Facebook leads into booked calls — sent to your inbox in seconds.",
  cta = "Send me the guide",
}: EmailCaptureFormProps) {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "ok" | "error">(
    "idle",
  );
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const isDark = variant === "dark";

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!email) return;
    setStatus("loading");
    setErrorMsg(null);
    try {
      const res = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, source }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(
          data.error ?? "That didn't go through. Please try again.",
        );
      }
      setStatus("ok");
      setEmail("");
    } catch (err) {
      setStatus("error");
      setErrorMsg(
        err instanceof Error
          ? err.message
          : "That didn't go through. Please try again.",
      );
    }
  }

  if (status === "ok") {
    return (
      <div
        className={`rounded-2xl p-6 ${
          isDark
            ? "bg-white/10 text-white border border-white/15"
            : "bg-brand-50 border border-brand-100 text-ink-900"
        }`}
      >
        <CheckCircle2
          className={`h-6 w-6 ${isDark ? "text-mint" : "text-brand-500"}`}
        />
        <h3 className="mt-2 text-lg font-bold">Check your inbox</h3>
        <p
          className={`mt-1 text-sm ${
            isDark ? "text-white/80" : "text-ink-700"
          }`}
        >
          The guide is on its way. While you wait, you can{" "}
          <a
            href="/api/auth/facebook"
            className={`underline ${
              isDark ? "text-white" : "text-brand-600 hover:text-brand-700"
            }`}
          >
            start with Facebook Login
          </a>
          .
        </p>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className={`rounded-2xl p-6 ${
        isDark
          ? "bg-white text-ink-900 shadow-2xl"
          : "border border-ink-100 bg-white shadow-sm"
      }`}
    >
      <p className="text-xs font-semibold uppercase tracking-wider text-brand-600">
        Free lead magnet
      </p>
      <h3 className="mt-2 text-lg font-bold text-ink-900">{headline}</h3>
      <p className="mt-2 text-sm text-ink-600">{description}</p>
      <label htmlFor={`email-${source}`} className="sr-only">
        Work email
      </label>
      <div className="mt-4 flex flex-col gap-2 sm:flex-row">
        <input
          id={`email-${source}`}
          name="email"
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@business.com"
          className="flex-1 rounded-lg border border-ink-200 bg-white px-4 py-3 text-sm text-ink-900 placeholder:text-ink-400 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20"
        />
        <button
          type="submit"
          disabled={status === "loading"}
          className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-brand-600 px-5 py-3 text-sm font-semibold text-white shadow-sm shadow-brand-500/30 hover:bg-brand-700 focus:outline-none focus:ring-2 focus:ring-brand-500/40 disabled:opacity-60"
        >
          {status === "loading" ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <>
              {cta}
              <ArrowRight className="h-4 w-4" />
            </>
          )}
        </button>
      </div>
      {status === "error" && errorMsg && (
        <p className="mt-2 text-xs text-rose">{errorMsg}</p>
      )}
      <p className="mt-3 text-[11px] text-ink-600">
        We&apos;ll email it instantly. No spam — unsubscribe anytime.
      </p>
    </form>
  );
}
