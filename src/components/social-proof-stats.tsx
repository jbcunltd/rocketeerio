import { TrendingUp, Users, Zap, ShieldCheck } from "lucide-react";

const STATS = [
  {
    Icon: Users,
    value: "500+",
    label: "businesses running on Rocketeerio",
  },
  {
    Icon: Zap,
    value: "10,000+",
    label: "leads qualified every month",
  },
  {
    Icon: TrendingUp,
    value: "3×",
    label: "faster lead response time",
  },
  {
    Icon: ShieldCheck,
    value: "98%",
    label: "platform uptime over the last year",
  },
];

export function SocialProofStats({
  className = "",
  variant = "light",
}: {
  className?: string;
  variant?: "light" | "dark";
}) {
  const isDark = variant === "dark";
  return (
    <section
      className={`py-14 sm:py-16 ${
        isDark
          ? "bg-ink-900 text-white"
          : "bg-white border-y border-ink-100"
      } ${className}`}
      aria-labelledby="social-proof-heading"
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <p
            className={`text-xs font-semibold uppercase tracking-[0.2em] ${
              isDark ? "text-brand-200" : "text-brand-700"
            }`}
          >
            By the numbers
          </p>
          <h2
            id="social-proof-heading"
            className={`mt-3 text-2xl sm:text-3xl font-bold tracking-tight ${
              isDark ? "text-white" : "text-ink-900"
            }`}
          >
            Join{" "}
            <span className={isDark ? "text-brand-300" : "text-brand-600"}>
              500+ businesses
            </span>{" "}
            closing more Facebook leads, faster.
          </h2>
        </div>
        <div className="mt-10 grid grid-cols-2 gap-6 sm:gap-10 lg:grid-cols-4">
          {STATS.map(({ Icon, value, label }) => (
            <div key={label} className="text-center">
              <span
                className={`inline-grid h-12 w-12 place-items-center rounded-xl ${
                  isDark
                    ? "bg-white/10 text-brand-200"
                    : "bg-brand-50 text-brand-700"
                }`}
              >
                <Icon className="h-5 w-5" aria-hidden />
              </span>
              <p
                className={`mt-4 text-3xl sm:text-4xl font-bold tracking-tight ${
                  isDark ? "text-white" : "text-ink-900"
                }`}
              >
                {value}
              </p>
              <p
                className={`mt-1 text-sm ${
                  isDark ? "text-white/70" : "text-ink-600"
                }`}
              >
                {label}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
