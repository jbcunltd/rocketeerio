"use client";

import Link from "next/link";
import { useState } from "react";
import { ArrowRight, CheckCircle2, Sparkles } from "lucide-react";

type Plan = {
  name: string;
  monthly: number;
  annual: number;
  blurb: string;
  features: string[];
  cta: string;
  highlighted?: boolean;
};

const PLANS: Plan[] = [
  {
    name: "Starter",
    monthly: 49,
    annual: 39,
    blurb: "For solo operators just starting to spend on Facebook ads.",
    features: [
      "Up to 500 active leads / month",
      "1 Facebook Page",
      "Instant Messenger replies",
      "1 AI qualification flow",
      "Email support",
      "Basic analytics",
    ],
    cta: "Start Free Trial",
  },
  {
    name: "Pro",
    monthly: 99,
    annual: 79,
    blurb: "For growing businesses running serious ad spend.",
    features: [
      "Up to 5,000 active leads / month",
      "5 Facebook Pages",
      "Messenger + Instagram DMs",
      "Unlimited AI qualification flows",
      "Hot-lead SMS alerts",
      "HubSpot, GoHighLevel, Pipedrive integrations",
      "Up to 5 team seats",
      "Priority support",
    ],
    cta: "Start Free Trial",
    highlighted: true,
  },
  {
    name: "Agency",
    monthly: 249,
    annual: 199,
    blurb: "For agencies managing leads for multiple clients.",
    features: [
      "Unlimited active leads",
      "Unlimited Facebook Pages",
      "Everything in Pro",
      "White-label dashboard",
      "Unlimited sub-accounts",
      "Webhooks + custom integrations",
      "Unlimited team seats",
      "Dedicated CSM",
    ],
    cta: "Contact Sales",
  },
];

export function PricingClient() {
  const [annual, setAnnual] = useState(true);

  return (
    <section className="py-12 sm:py-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Toggle */}
        <div className="flex justify-center">
          <div className="inline-flex items-center gap-1 rounded-full border border-ink-200 bg-white p-1 shadow-sm">
            <button
              type="button"
              onClick={() => setAnnual(false)}
              className={`rounded-full px-5 py-2 text-sm font-semibold transition-colors ${
                !annual ? "bg-ink-900 text-white" : "text-ink-600"
              }`}
              aria-pressed={!annual}
            >
              Monthly
            </button>
            <button
              type="button"
              onClick={() => setAnnual(true)}
              className={`relative rounded-full px-5 py-2 text-sm font-semibold transition-colors ${
                annual ? "bg-ink-900 text-white" : "text-ink-600"
              }`}
              aria-pressed={annual}
            >
              Annual
              <span className="absolute -top-2 -right-2 rounded-full bg-mint px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-ink-900">
                Save 20%
              </span>
            </button>
          </div>
        </div>

        <div className="mt-12 grid gap-6 lg:grid-cols-3">
          {PLANS.map((plan) => {
            const price = annual ? plan.annual : plan.monthly;
            return (
              <div
                key={plan.name}
                className={`relative rounded-2xl border p-7 sm:p-8 transition-all ${
                  plan.highlighted
                    ? "border-brand-500 bg-white shadow-2xl shadow-brand-500/20 lg:scale-[1.02]"
                    : "border-ink-100 bg-white shadow-sm"
                }`}
              >
                {plan.highlighted && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-brand-500 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-white shadow-md">
                    <Sparkles className="mr-1 inline h-3 w-3" />
                    Most popular
                  </span>
                )}

                <h3 className="text-lg font-bold text-ink-900">{plan.name}</h3>
                <p className="mt-2 text-sm text-ink-600 min-h-[2.5rem]">
                  {plan.blurb}
                </p>

                <div className="mt-6 flex items-baseline gap-1">
                  <span className="text-5xl font-bold tracking-tight text-ink-900">
                    ${price}
                  </span>
                  <span className="text-ink-500 text-sm">/mo</span>
                </div>
                <p className="mt-1 text-xs text-ink-600">
                  {annual
                    ? `Billed annually — $${price * 12}/yr`
                    : "Billed monthly"}
                </p>

                <Link
                  href="/signup"
                  className={`mt-6 inline-flex w-full items-center justify-center gap-2 rounded-xl px-5 py-3 text-sm font-semibold transition-colors ${
                    plan.highlighted
                      ? "bg-brand-600 text-white shadow-lg shadow-brand-500/30 hover:bg-brand-700 focus:outline-none focus:ring-2 focus:ring-brand-500/40"
                      : "border border-ink-300 bg-white text-ink-900 hover:bg-ink-50 hover:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/40"
                  }`}
                >
                  {plan.cta}
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <p className="mt-2 text-center text-[11px] text-ink-600">
                  No credit card · Cancel anytime · 14-day money back
                </p>

                <ul className="mt-7 space-y-3">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-start gap-2.5 text-sm text-ink-700">
                      <CheckCircle2 className="mt-0.5 h-4.5 w-4.5 flex-none text-brand-500" />
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
