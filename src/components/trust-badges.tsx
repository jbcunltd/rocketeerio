import { CheckCircle2, CreditCard, Lock, RefreshCw, ShieldCheck, X } from "lucide-react";

type Variant = "light" | "dark" | "compact";

const BADGES = [
  { Icon: CreditCard, label: "No credit card required" },
  { Icon: RefreshCw, label: "Cancel anytime" },
  { Icon: ShieldCheck, label: "14-day money-back guarantee" },
  { Icon: Lock, label: "SSL secured" },
];

export function TrustBadges({
  variant = "light",
  className = "",
  items,
}: {
  variant?: Variant;
  className?: string;
  items?: { Icon: React.ComponentType<{ className?: string }>; label: string }[];
}) {
  const list = items ?? BADGES;
  const isDark = variant === "dark";
  const isCompact = variant === "compact";

  const wrapper = isCompact
    ? "flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-xs sm:justify-start"
    : "flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-sm sm:justify-start";

  const itemColor = isDark
    ? "text-white/85"
    : "text-ink-700";

  const iconColor = isDark
    ? "text-mint"
    : "text-brand-600";

  return (
    <ul
      className={`${wrapper} ${className}`}
      aria-label="Trust signals"
    >
      {list.map(({ Icon, label }) => (
        <li
          key={label}
          className={`inline-flex items-center gap-1.5 font-medium ${itemColor}`}
        >
          <Icon className={`h-4 w-4 ${iconColor}`} aria-hidden />
          <span>{label}</span>
        </li>
      ))}
    </ul>
  );
}

export function SecuritySection({ className = "" }: { className?: string }) {
  const points = [
    {
      Icon: ShieldCheck,
      title: "Meta-compliant by design",
      body:
        "Built directly on the official Messenger Platform APIs — no risky workarounds, no Page bans.",
    },
    {
      Icon: Lock,
      title: "Bank-grade encryption",
      body:
        "All lead data is encrypted in transit (TLS 1.3) and at rest (AES-256). SOC 2 controls in progress.",
    },
    {
      Icon: CheckCircle2,
      title: "GDPR + CCPA ready",
      body:
        "Granular consent, data export, and deletion baked in. Your customers' data stays your customers' data.",
    },
    {
      Icon: X,
      title: "No long-term contracts",
      body:
        "Month-to-month, cancel anytime, full refund inside 14 days. Zero handcuffs.",
    },
  ];
  return (
    <section className={`py-16 sm:py-20 bg-ink-50/60 border-y border-ink-100 ${className}`}>
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <span className="inline-flex items-center gap-2 rounded-full border border-brand-100 bg-brand-50 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-brand-700">
            <ShieldCheck className="h-3.5 w-3.5" />
            Security &amp; trust
          </span>
          <h2 className="mt-4 text-3xl sm:text-4xl font-bold tracking-tight text-ink-900">
            Your leads, your data, your business — protected.
          </h2>
          <p className="mt-3 mx-auto max-w-2xl text-ink-600">
            Rocketeerio is built with security-minded defaults for teams that
            depend on paid Meta leads every day.
          </p>
        </div>
        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {points.map(({ Icon, title, body }) => (
            <div
              key={title}
              className="rounded-2xl border border-ink-100 bg-white p-6 text-left"
            >
              <span className="inline-grid h-11 w-11 place-items-center rounded-xl bg-brand-50 text-brand-700">
                <Icon className="h-5 w-5" />
              </span>
              <h3 className="mt-4 text-base font-bold text-ink-900">{title}</h3>
              <p className="mt-2 text-sm text-ink-600 leading-relaxed">{body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
