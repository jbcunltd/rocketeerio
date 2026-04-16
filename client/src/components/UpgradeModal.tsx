import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";
import { Rocket, ArrowRight, Zap } from "lucide-react";

interface UpgradeModalProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  message?: string;
  currentPlan?: string;
  nextPlan?: string | null;
  resourceName?: string;
  currentCount?: number;
  limit?: number;
}

const PLAN_DISPLAY: Record<string, { name: string; price: string; color: string }> = {
  free: { name: "Free", price: "$0", color: "text-gray-500" },
  growth: { name: "Growth", price: "$29/mo", color: "text-blue-500" },
  pro: { name: "Pro", price: "$79/mo", color: "text-purple-500" },
  scale: { name: "Scale", price: "$149/mo", color: "text-orange-500" },
  custom: { name: "Custom", price: "Contact us", color: "text-emerald-500" },
};

export function UpgradeModal({
  open,
  onClose,
  title,
  message,
  currentPlan = "free",
  nextPlan,
  resourceName,
  currentCount,
  limit,
}: UpgradeModalProps) {
  const [, navigate] = useLocation();
  const next = nextPlan ? PLAN_DISPLAY[nextPlan] : PLAN_DISPLAY.growth;
  const current = PLAN_DISPLAY[currentPlan] || PLAN_DISPLAY.free;

  const defaultTitle = `Upgrade to ${next?.name || "a higher plan"}`;
  const defaultMessage = resourceName
    ? `You've reached the ${resourceName} limit on your ${current.name} plan${limit ? ` (${currentCount}/${limit})` : ""}. Upgrade to unlock more.`
    : `Unlock more features by upgrading to the ${next?.name} plan.`;

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) onClose(); }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-2 mb-2">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center">
              <Rocket className="w-5 h-5 text-white" />
            </div>
            <DialogTitle className="text-lg">
              {title || defaultTitle}
            </DialogTitle>
          </div>
          <DialogDescription className="text-sm text-muted-foreground">
            {message || defaultMessage}
          </DialogDescription>
        </DialogHeader>

        <div className="flex items-center justify-center gap-4 py-4">
          <div className="text-center p-3 rounded-lg bg-muted/50">
            <p className="text-xs text-muted-foreground">Current</p>
            <p className={`font-semibold ${current.color}`}>{current.name}</p>
            <p className="text-xs text-muted-foreground">{current.price}</p>
          </div>
          <ArrowRight className="w-5 h-5 text-muted-foreground" />
          <div className="text-center p-3 rounded-lg bg-primary/5 border border-primary/20">
            <p className="text-xs text-muted-foreground">Recommended</p>
            <p className={`font-semibold ${next?.color || "text-blue-500"}`}>{next?.name || "Growth"}</p>
            <p className="text-xs text-muted-foreground">{next?.price || "$29/mo"}</p>
          </div>
        </div>

        <DialogFooter className="flex gap-2 sm:gap-2">
          <Button variant="outline" onClick={onClose}>
            Maybe later
          </Button>
          <Button
            onClick={() => {
              onClose();
              navigate("/billing");
            }}
            className="gap-2"
          >
            <Zap className="w-4 h-4" />
            Upgrade Now
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/**
 * Hook-friendly helper to parse TRPC plan limit errors and show upgrade modal.
 * Usage:
 *   const { showUpgrade, upgradeProps } = usePlanLimitError();
 *   // In mutation onError:
 *   if (error.data?.code === 'FORBIDDEN') showUpgrade(error.message);
 *   // In JSX:
 *   <UpgradeModal {...upgradeProps} />
 */
export function parsePlanLimitError(errorMessage: string): {
  resourceName?: string;
  currentPlan?: string;
  nextPlan?: string;
} | null {
  // Pattern: "You've reached the X limit for the Y plan (n/m). Upgrade to Z to unlock more."
  const match = errorMessage.match(
    /reached the (.+?) limit for the (.+?) plan.*?Upgrade to (.+?) to/
  );
  if (!match) return null;
  return {
    resourceName: match[1],
    currentPlan: match[2].toLowerCase(),
    nextPlan: match[3].toLowerCase(),
  };
}
