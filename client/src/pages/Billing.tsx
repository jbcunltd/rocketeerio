import DashboardLayout from "@/components/DashboardLayout";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import {
  CreditCard, Check, TrendingUp, Crown, Zap,
  Star,
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
  const [billingPeriod, setBillingPeriod] = useState<"monthly" | "annual">("monthly");

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
      navigate("/billing", { replace: true });
    } else if (status === "cancelled") {
      toast.info("Checkout was cancelled. You can try again anytime.");
      navigate("/billing", { replace: true });
    }
  }, [search]);

  const handleSubscribe = async (planSlug: string) => {
    if (planSlug === "free") {
      toast.info("Free plan is active by default for new users.");
      return;
    }
    if (planSlug === "custom") {
      toast.info("Please contact sales for Custom enterprise pricing.");
      return;
    }
    setSelectedPlan(planSlug);
    try {
      const result = await createCheckout.mutateAsync({ planSlug });
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

  const planIcons: Record<string, typeof Star> = {
    free: Star,
    growth: TrendingUp,
    pro: Crown,
    scale: Zap,
    custom: Crown,
  };

  const planColors: Record<string, string> = {
    free: "border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900",
    growth: "border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900",
    pro: "border-2 border-purple-600 bg-gradient-to-br from-purple-50 to-white dark:from-purple-900/30 dark:to-gray-900 shadow-lg",
    scale: "border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900",
    custom: "border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900",
  };

  const planButtonColors: Record<string, string> = {
    free: "border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700",
    growth: "bg-purple-600 hover:bg-purple-700 text-white",
    pro: "bg-white border-2 border-purple-600 text-purple-600 hover:bg-purple-50 dark:bg-gray-800 dark:text-purple-400 dark:hover:bg-gray-700",
    scale: "bg-slate-900 hover:bg-slate-950 text-white dark:bg-slate-800 dark:hover:bg-slate-700",
    custom: "border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700",
  };

  // Annual discount: 20% off (monthly * 12 * 0.8)
  const getAnnualPrice = (monthlyPrice: string) => {
    const monthly = parseFloat(monthlyPrice);
    if (monthly === 0) return "0.00";
    return (monthly * 12 * 0.8).toFixed(2);
  };

  const getDisplayPrice = (monthlyPrice: string) => {
    if (billingPeriod === "monthly") {
      return parseFloat(monthlyPrice);
    } else {
      return parseFloat(getAnnualPrice(monthlyPrice)) / 12;
    }
  };

  return (
    <div className="flex flex-col gap-6 sm:gap-8 p-2 sm:p-4 md:p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Simple, Transparent Pricing</h1>
        <p className="text-muted-foreground mt-2 max-w-2xl mx-auto">
          Choose the perfect plan for your business. Scale up as you grow.
        </p>
      </div>

      {/* Billing Period Toggle */}
      <div className="flex items-center justify-center gap-4">
        <button
          onClick={() => setBillingPeriod("monthly")}
          className={`text-sm font-medium cursor-pointer transition-colors ${
            billingPeriod === "monthly"
              ? "text-foreground"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          Monthly
        </button>
        <button
          onClick={() => setBillingPeriod(billingPeriod === "monthly" ? "annual" : "monthly")}
          className={`relative inline-flex h-8 w-14 items-center rounded-full cursor-pointer border-2 transition-colors ${
            billingPeriod === "annual"
              ? "bg-purple-600 border-purple-600"
              : "bg-gray-300 border-gray-300 dark:bg-gray-600 dark:border-gray-600"
          }`}
        >
          <span
            className={`inline-block h-6 w-6 transform rounded-full bg-white shadow-md transition-transform ${
              billingPeriod === "annual" ? "translate-x-7" : "translate-x-1"
            }`}
          />
        </button>
        <button
          onClick={() => setBillingPeriod("annual")}
          className={`text-sm font-medium cursor-pointer transition-colors ${
            billingPeriod === "annual"
              ? "text-foreground"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          Annual
        </button>
        <span className={`ml-2 inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold transition-all ${
          billingPeriod === "annual"
            ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 visible opacity-100"
            : "invisible opacity-0"
        }`}>
          Save 20%
        </span>
      </div>

      {/* Current Subscription Status */}
      {currentSub && (
        <div className="rounded-xl border bg-card p-4 sm:p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-lg bg-green-100 dark:bg-green-900/30 flex items-center justify-center shrink-0">
              <CreditCard className="w-5 h-5 text-green-600" />
            </div>
            <div className="min-w-0">
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

      {/* Pricing Plans Grid */}
      {plansQuery.isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 sm:gap-6">
          {plans.map((plan) => {
            const Icon = planIcons[plan.slug] ?? Star;
            const isCurrentPlan = currentSub?.plan?.slug === plan.slug && currentSub?.status === "active";
            const isLoading = selectedPlan === plan.slug && createCheckout.isPending;
            const features = (plan.features as string[]) ?? [];
            const displayPrice = getDisplayPrice(plan.price);
            const annualPrice = getAnnualPrice(plan.price);

            return (
              <div
                key={plan.id}
                className={`relative rounded-xl border p-4 sm:p-6 transition-all hover:shadow-md flex flex-col ${
                  planColors[plan.slug] ?? "border-border"
                }`}
              >
                {plan.slug === "pro" && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-10">
                    <span className="inline-block bg-purple-600 text-white text-xs font-bold px-3 py-1 rounded-full whitespace-nowrap">
                      MOST POPULAR
                    </span>
                  </div>
                )}

                <div className="flex items-center gap-3 mb-4 pt-2">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                    plan.slug === "free" ? "bg-gray-100 dark:bg-gray-800" :
                    plan.slug === "growth" ? "bg-purple-100 dark:bg-purple-900/30" :
                    plan.slug === "pro" ? "bg-purple-100 dark:bg-purple-900/30" :
                    plan.slug === "scale" ? "bg-slate-100 dark:bg-slate-800" :
                    "bg-gray-100 dark:bg-gray-800"
                  }`}>
                    <Icon className={`w-5 h-5 ${
                      plan.slug === "free" ? "text-gray-600 dark:text-gray-400" :
                      plan.slug === "growth" ? "text-purple-600 dark:text-purple-400" :
                      plan.slug === "pro" ? "text-purple-600 dark:text-purple-400" :
                      plan.slug === "scale" ? "text-slate-700 dark:text-slate-300" :
                      "text-gray-600 dark:text-gray-400"
                    }`} />
                  </div>
                  <h3 className="text-lg font-semibold">{plan.name}</h3>
                </div>

                <div className="mb-6">
                  {plan.slug === "free" ? (
                    <div>
                      <span className="text-3xl font-bold">$0</span>
                      <span className="text-muted-foreground">/month</span>
                      <p className="text-xs text-muted-foreground mt-1">billed monthly</p>
                    </div>
                  ) : plan.slug === "custom" ? (
                    <div>
                      <span className="text-sm text-muted-foreground">Custom pricing</span>
                      <p className="text-xs text-muted-foreground mt-1">Contact sales</p>
                    </div>
                  ) : (
                    <div>
                      <span className="text-3xl font-bold">${displayPrice.toFixed(2)}</span>
                      <span className="text-muted-foreground">/month</span>
                      <p className="text-xs text-muted-foreground mt-1">
                        {billingPeriod === "annual"
                          ? `$${annualPrice}/year (billed annually)`
                          : "billed monthly"}
                      </p>
                    </div>
                  )}
                </div>

                <ul className="space-y-2.5 mb-6 flex-1">
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
                    className="w-full py-2.5 px-4 rounded-lg border-2 border-green-500 text-green-600 dark:text-green-400 font-medium text-sm cursor-default"
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
                    ) : plan.slug === "free" ? (
                      "Get Started Free"
                    ) : plan.slug === "custom" ? (
                      "Contact Sales"
                    ) : currentSub?.status === "active" ? (
                      "Upgrade"
                    ) : (
                      "Subscribe Now"
                    )}
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Feature Comparison Table */}
      <div className="mt-6 sm:mt-8 rounded-xl border bg-card shadow-sm overflow-hidden">
        <div className="p-4 sm:p-6 pb-4 border-b">
          <h3 className="text-xl font-semibold">Detailed Feature Comparison</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="px-6 py-3 text-left font-semibold">Feature</th>
                {plans.map((plan) => (
                  <th key={plan.id} className="px-6 py-3 text-center font-semibold">
                    {plan.name}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              <tr className="border-b">
                <td className="px-6 py-3 font-medium">Active Leads</td>
                <td className="px-6 py-3 text-center">100</td>
                <td className="px-6 py-3 text-center">1,000</td>
                <td className="px-6 py-3 text-center">5,000</td>
                <td className="px-6 py-3 text-center">20,000</td>
                <td className="px-6 py-3 text-center">Unlimited</td>
              </tr>
              <tr className="border-b">
                <td className="px-6 py-3 font-medium">AI Conversations/mo</td>
                <td className="px-6 py-3 text-center">50</td>
                <td className="px-6 py-3 text-center">500</td>
                <td className="px-6 py-3 text-center">2,500</td>
                <td className="px-6 py-3 text-center">10,000</td>
                <td className="px-6 py-3 text-center">Unlimited</td>
              </tr>
              <tr className="border-b">
                <td className="px-6 py-3 font-medium">Facebook Pages</td>
                <td className="px-6 py-3 text-center">1</td>
                <td className="px-6 py-3 text-center">1</td>
                <td className="px-6 py-3 text-center">3</td>
                <td className="px-6 py-3 text-center">10</td>
                <td className="px-6 py-3 text-center">Unlimited</td>
              </tr>
              <tr className="border-b">
                <td className="px-6 py-3 font-medium">Team Seats</td>
                <td className="px-6 py-3 text-center">1</td>
                <td className="px-6 py-3 text-center">2</td>
                <td className="px-6 py-3 text-center">5</td>
                <td className="px-6 py-3 text-center">Unlimited</td>
                <td className="px-6 py-3 text-center">Unlimited</td>
              </tr>
              <tr className="border-b">
                <td className="px-6 py-3 font-medium">Custom AI Persona</td>
                <td className="px-6 py-3 text-center">—</td>
                <td className="px-6 py-3 text-center">—</td>
                <td className="px-6 py-3 text-center"><Check className="w-4 h-4 mx-auto text-green-600" /></td>
                <td className="px-6 py-3 text-center"><Check className="w-4 h-4 mx-auto text-green-600" /></td>
                <td className="px-6 py-3 text-center"><Check className="w-4 h-4 mx-auto text-green-600" /></td>
              </tr>
              <tr className="border-b">
                <td className="px-6 py-3 font-medium">API Access</td>
                <td className="px-6 py-3 text-center">—</td>
                <td className="px-6 py-3 text-center">—</td>
                <td className="px-6 py-3 text-center"><Check className="w-4 h-4 mx-auto text-green-600" /></td>
                <td className="px-6 py-3 text-center"><Check className="w-4 h-4 mx-auto text-green-600" /></td>
                <td className="px-6 py-3 text-center"><Check className="w-4 h-4 mx-auto text-green-600" /></td>
              </tr>
              <tr className="border-b">
                <td className="px-6 py-3 font-medium">White-Label</td>
                <td className="px-6 py-3 text-center">—</td>
                <td className="px-6 py-3 text-center">—</td>
                <td className="px-6 py-3 text-center">—</td>
                <td className="px-6 py-3 text-center"><Check className="w-4 h-4 mx-auto text-green-600" /></td>
                <td className="px-6 py-3 text-center"><Check className="w-4 h-4 mx-auto text-green-600" /></td>
              </tr>
              <tr>
                <td className="px-6 py-3 font-medium">Support</td>
                <td className="px-6 py-3 text-center text-xs">Community</td>
                <td className="px-6 py-3 text-center text-xs">Email</td>
                <td className="px-6 py-3 text-center text-xs">Priority</td>
                <td className="px-6 py-3 text-center text-xs">Slack/Chat</td>
                <td className="px-6 py-3 text-center text-xs">Dedicated CSM</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Payment Methods Info */}
      <div className="rounded-xl border bg-card p-4 sm:p-6 shadow-sm">
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
                      ${parseFloat(payment.amount).toLocaleString()}
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
