import DashboardLayout from "@/components/DashboardLayout";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import {
  CreditCard, Check, Rocket, TrendingUp, Crown,
  AlertCircle, Loader2, ExternalLink, XCircle, Clock,
  Receipt
} from "lucide-react";
import { useState, useEffect } from "react";
import { useLocation, useSearch } from "wouter";
import { toast } from "sonner";

export default function Billing() {
  return (
    <DashboardLayout>
      <BillingContent />
    </DashboardLayout>
  );
}

function BillingContent() {
  const { user } = useAuth();
  const search = useSearch();
  const [, navigate] = useLocation();
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);

  const plansQuery = trpc.billing.plans.useQuery();
  const subscriptionQuery = trpc.billing.currentSubscription.useQuery();
  const paymentHistoryQuery = trpc.billing.paymentHistory.useQuery();
  const createCheckout = trpc.billing.createCheckout.useMutation();
  const cancelSubscription = trpc.billing.cancelSubscription.useMutation();

  // Handle checkout callback from PayMongo
  useEffect(() => {
    const params = new URLSearchParams(search);
    const status = params.get("status");
    if (status === "success") {
      toast.success("Payment successful! Your subscription is now active.");
      subscriptionQuery.refetch();
      paymentHistoryQuery.refetch();
      // Clean URL
      navigate("/billing", { replace: true });
    } else if (status === "cancelled") {
      toast.info("Checkout was cancelled. You can try again anytime.");
      navigate("/billing", { replace: true });
    }
  }, [search]);

  const handleSubscribe = async (planSlug: string) => {
    setSelectedPlan(planSlug);
    try {
      const result = await createCheckout.mutateAsync({ planSlug });
      // Redirect to PayMongo checkout
      window.location.href = result.checkoutUrl;
    } catch (error: any) {
      toast.error(error.message || "Failed to create checkout session");
      setSelectedPlan(null);
    }
  };

  const handleCancel = async () => {
    if (!confirm("Are you sure you want to cancel your subscription? You will lose access to premium features at the end of your billing period.")) {
      return;
    }
    try {
      await cancelSubscription.mutateAsync();
      toast.success("Subscription cancelled successfully.");
      subscriptionQuery.refetch();
      paymentHistoryQuery.refetch();
    } catch (error: any) {
      toast.error(error.message || "Failed to cancel subscription");
    }
  };

  const plans = plansQuery.data ?? [];
  const currentSub = subscriptionQuery.data;
  const payments = paymentHistoryQuery.data ?? [];

  const planIcons: Record<string, typeof Rocket> = {
    starter: Rocket,
    growth: TrendingUp,
    scale: Crown,
  };

  const planColors: Record<string, string> = {
    starter: "border-blue-200 bg-blue-50/50 dark:border-blue-900 dark:bg-blue-950/30",
    growth: "border-green-200 bg-green-50/50 dark:border-green-900 dark:bg-green-950/30 ring-2 ring-green-500/20",
    scale: "border-purple-200 bg-purple-50/50 dark:border-purple-900 dark:bg-purple-950/30",
  };

  const planButtonColors: Record<string, string> = {
    starter: "bg-blue-600 hover:bg-blue-700 text-white",
    growth: "bg-green-600 hover:bg-green-700 text-white",
    scale: "bg-purple-600 hover:bg-purple-700 text-white",
  };

  return (
    <div className="flex flex-col gap-8 p-4 md:p-8 max-w-6xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Billing & Plans</h1>
        <p className="text-muted-foreground mt-1">
          Manage your subscription and view payment history
        </p>
      </div>

      {/* Current Subscription Status */}
      {currentSub && (
        <div className="rounded-xl border bg-card p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-lg bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
              <CreditCard className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold">Current Subscription</h2>
              <p className="text-sm text-muted-foreground">Your active plan details</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="rounded-lg border p-4">
              <p className="text-sm text-muted-foreground">Plan</p>
              <p className="text-lg font-semibold">{currentSub.plan?.name ?? "Unknown"}</p>
            </div>
            <div className="rounded-lg border p-4">
              <p className="text-sm text-muted-foreground">Status</p>
              <div className="flex items-center gap-2 mt-0.5">
                <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  currentSub.status === "active"
                    ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                    : currentSub.status === "past_due"
                    ? "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400"
                    : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                }`}>
                  {currentSub.status === "active" && <Check className="w-3 h-3" />}
                  {currentSub.status === "past_due" && <AlertCircle className="w-3 h-3" />}
                  {currentSub.status === "cancelled" && <XCircle className="w-3 h-3" />}
                  {currentSub.status.charAt(0).toUpperCase() + currentSub.status.slice(1).replace("_", " ")}
                </span>
              </div>
            </div>
            <div className="rounded-lg border p-4">
              <p className="text-sm text-muted-foreground">Current Period</p>
              <p className="text-sm font-medium">
                {currentSub.currentPeriodStart
                  ? new Date(currentSub.currentPeriodStart).toLocaleDateString()
                  : "—"}{" "}
                to{" "}
                {currentSub.currentPeriodEnd
                  ? new Date(currentSub.currentPeriodEnd).toLocaleDateString()
                  : "—"}
              </p>
            </div>
          </div>

          {currentSub.status === "active" && (
            <div className="mt-4 pt-4 border-t">
              <button
                onClick={handleCancel}
                disabled={cancelSubscription.isPending}
                className="text-sm text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 font-medium disabled:opacity-50"
              >
                {cancelSubscription.isPending ? (
                  <span className="flex items-center gap-2">
                    <Loader2 className="w-3 h-3 animate-spin" /> Cancelling...
                  </span>
                ) : (
                  "Cancel Subscription"
                )}
              </button>
            </div>
          )}
        </div>
      )}

      {/* Pricing Plans */}
      <div>
        <h2 className="text-xl font-semibold mb-4">
          {currentSub ? "Switch Plan" : "Choose a Plan"}
        </h2>

        {plansQuery.isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {plans.map((plan) => {
              const Icon = planIcons[plan.slug] ?? Rocket;
              const isCurrentPlan = currentSub?.plan?.slug === plan.slug && currentSub?.status === "active";
              const isLoading = selectedPlan === plan.slug && createCheckout.isPending;
              const features = (plan.features as string[]) ?? [];

              return (
                <div
                  key={plan.id}
                  className={`relative rounded-xl border p-6 transition-all hover:shadow-md ${
                    planColors[plan.slug] ?? "border-border"
                  }`}
                >
                  {plan.slug === "growth" && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                      <span className="bg-green-600 text-white text-xs font-bold px-3 py-1 rounded-full">
                        MOST POPULAR
                      </span>
                    </div>
                  )}

                  <div className="flex items-center gap-3 mb-4">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                      plan.slug === "starter" ? "bg-blue-100 dark:bg-blue-900/30" :
                      plan.slug === "growth" ? "bg-green-100 dark:bg-green-900/30" :
                      "bg-purple-100 dark:bg-purple-900/30"
                    }`}>
                      <Icon className={`w-5 h-5 ${
                        plan.slug === "starter" ? "text-blue-600" :
                        plan.slug === "growth" ? "text-green-600" :
                        "text-purple-600"
                      }`} />
                    </div>
                    <h3 className="text-lg font-semibold">{plan.name}</h3>
                  </div>

                  <div className="mb-6">
                    <span className="text-3xl font-bold">
                      ₱{parseFloat(plan.price).toLocaleString()}
                    </span>
                    <span className="text-muted-foreground">/month</span>
                  </div>

                  <ul className="space-y-3 mb-6">
                    {features.map((feature, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm">
                        <Check className="w-4 h-4 text-green-500 mt-0.5 shrink-0" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>

                  {isCurrentPlan ? (
                    <button
                      disabled
                      className="w-full py-2.5 px-4 rounded-lg border-2 border-green-500 text-green-600 font-medium text-sm cursor-default"
                    >
                      <span className="flex items-center justify-center gap-2">
                        <Check className="w-4 h-4" /> Current Plan
                      </span>
                    </button>
                  ) : (
                    <button
                      onClick={() => handleSubscribe(plan.slug)}
                      disabled={isLoading || createCheckout.isPending}
                      className={`w-full py-2.5 px-4 rounded-lg font-medium text-sm transition-colors disabled:opacity-50 ${
                        planButtonColors[plan.slug] ?? "bg-primary text-primary-foreground hover:bg-primary/90"
                      }`}
                    >
                      {isLoading ? (
                        <span className="flex items-center justify-center gap-2">
                          <Loader2 className="w-4 h-4 animate-spin" /> Redirecting...
                        </span>
                      ) : (
                        <span className="flex items-center justify-center gap-2">
                          <ExternalLink className="w-4 h-4" />
                          {currentSub?.status === "active" ? "Switch to " : "Subscribe to "}{plan.name}
                        </span>
                      )}
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Payment Methods Info */}
      <div className="rounded-xl border bg-card p-6 shadow-sm">
        <div className="flex items-center gap-3 mb-3">
          <CreditCard className="w-5 h-5 text-muted-foreground" />
          <h3 className="font-semibold">Accepted Payment Methods</h3>
        </div>
        <p className="text-sm text-muted-foreground mb-3">
          Payments are securely processed by PayMongo. We accept the following payment methods:
        </p>
        <div className="flex flex-wrap gap-3">
          {["Visa", "Mastercard", "GCash", "Maya", "GrabPay"].map((method) => (
            <span
              key={method}
              className="inline-flex items-center px-3 py-1.5 rounded-lg border bg-muted/50 text-sm font-medium"
            >
              {method}
            </span>
          ))}
        </div>
      </div>

      {/* Payment History */}
      {payments.length > 0 && (
        <div className="rounded-xl border bg-card shadow-sm">
          <div className="p-6 pb-4">
            <div className="flex items-center gap-3">
              <Receipt className="w-5 h-5 text-muted-foreground" />
              <h3 className="font-semibold">Payment History</h3>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-t border-b text-left text-xs text-muted-foreground">
                  <th className="px-6 py-3 font-medium">Date</th>
                  <th className="px-6 py-3 font-medium">Description</th>
                  <th className="px-6 py-3 font-medium">Amount</th>
                  <th className="px-6 py-3 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {payments.map((payment) => (
                  <tr key={payment.id} className="border-b last:border-0">
                    <td className="px-6 py-3 text-sm">
                      {new Date(payment.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-3 text-sm">
                      {payment.description ?? "Payment"}
                    </td>
                    <td className="px-6 py-3 text-sm font-medium">
                      ₱{parseFloat(payment.amount).toLocaleString()}
                    </td>
                    <td className="px-6 py-3">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${
                        payment.status === "paid"
                          ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                          : payment.status === "pending"
                          ? "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400"
                          : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                      }`}>
                        {payment.status === "paid" && <Check className="w-3 h-3" />}
                        {payment.status === "pending" && <Clock className="w-3 h-3" />}
                        {payment.status === "failed" && <XCircle className="w-3 h-3" />}
                        {payment.status.charAt(0).toUpperCase() + payment.status.slice(1)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
