import { Check, ShieldCheck, RefreshCw } from "lucide-react";

export function TrustSignals({ className = "" }: { className?: string }) {
  return (
    <ul
      className={`flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-xs sm:text-sm text-ink-500 ${className}`}
    >
      <li className="inline-flex items-center gap-1.5">
        <Check className="h-4 w-4 text-mint" />
        No credit card required
      </li>
      <li className="inline-flex items-center gap-1.5">
        <RefreshCw className="h-4 w-4 text-brand-500" />
        14-day money-back guarantee
      </li>
      <li className="inline-flex items-center gap-1.5">
        <ShieldCheck className="h-4 w-4 text-ink-500" />
        SSL secured · Meta-compliant
      </li>
    </ul>
  );
}
