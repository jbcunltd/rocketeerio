import { useLocation } from "wouter";
import { Zap, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";

interface UpgradeBannerProps {
  resourceName: string;
  currentCount: number;
  limit: number;
  planName: string;
  nextPlanName?: string;
  /** Show when usage is above this percentage (default 80) */
  warningThreshold?: number;
}

export function UpgradeBanner({
  resourceName,
  currentCount,
  limit,
  planName,
  nextPlanName,
  warningThreshold = 80,
}: UpgradeBannerProps) {
  const [, navigate] = useLocation();

  // Don't show for unlimited plans
  if (!isFinite(limit)) return null;

  const percentage = Math.round((currentCount / limit) * 100);
  const isAtLimit = currentCount >= limit;
  const isNearLimit = percentage >= warningThreshold;

  if (!isAtLimit && !isNearLimit) return null;

  return (
    <div
      className={`flex items-center justify-between gap-3 px-4 py-3 rounded-lg border ${
        isAtLimit
          ? "bg-red-50 border-red-200 dark:bg-red-950/20 dark:border-red-800"
          : "bg-amber-50 border-amber-200 dark:bg-amber-950/20 dark:border-amber-800"
      }`}
    >
      <div className="flex items-center gap-2">
        <AlertTriangle
          className={`w-4 h-4 ${isAtLimit ? "text-red-500" : "text-amber-500"}`}
        />
        <p className="text-sm">
          {isAtLimit ? (
            <>
              <span className="font-medium">
                {resourceName} limit reached
              </span>{" "}
              ({currentCount}/{limit} on {planName} plan).
              {nextPlanName && ` Upgrade to ${nextPlanName} to unlock more.`}
            </>
          ) : (
            <>
              <span className="font-medium">
                {percentage}% of {resourceName} used
              </span>{" "}
              ({currentCount}/{limit}).
            </>
          )}
        </p>
      </div>
      <Button
        size="sm"
        variant={isAtLimit ? "default" : "outline"}
        onClick={() => navigate("/billing")}
        className="gap-1 shrink-0"
      >
        <Zap className="w-3 h-3" />
        Upgrade
      </Button>
    </div>
  );
}
