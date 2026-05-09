import { useState, useEffect, useCallback } from "react";
import { ShieldCheck, Loader2, CheckCircle, AlertTriangle, CreditCard } from "lucide-react";
import { toast } from "sonner";
import {
  getPlans,
  getProviderSubscribedModules,
  getRazorpayKey,
  createOrder,
  createProviderSubscription,
} from "../../services/subscriptionService";
import { withRazorpayPaymentMethods, RAZORPAY_CHECKOUT_THEME } from "../../utils/razorpayCheckout";

const loadRazorpayScript = () => {
  return new Promise((resolve) => {
    if (window.Razorpay) {
      resolve();
      return;
    }
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    script.onload = resolve;
    document.body.appendChild(script);
  });
};

export function SubscriptionPlans() {
  const [plans, setPlans] = useState([]);
  const [subscription, setSubscription] = useState(null);
  const [loading, setLoading] = useState(true);
  const [subscribing, setSubscribing] = useState(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [plansRes, subRes] = await Promise.allSettled([
        getPlans(),
        getProviderSubscribedModules().catch((e) => {
          if (e.response?.status === 403) return null;
          throw e;
        }),
      ]);
      const plansData = plansRes.status === "fulfilled" ? plansRes.value : [];
      const subData = subRes.status === "fulfilled" ? subRes.value : null;
      setPlans(Array.isArray(plansData) ? plansData : []);
      setSubscription(subData);
    } catch (err) {
      toast.error("Failed to load subscription data");
      setPlans([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleSubscribe = async (plan) => {
    if (!plan || plan.price === 0) {
      toast.info("This plan is free. Contact support for activation.");
      return;
    }
    setSubscribing(plan.id);
    try {
      await loadRazorpayScript();
      const keyRes = await getRazorpayKey();
      const keyId = typeof keyRes === "string" ? keyRes : keyRes?.key_id;
      if (!keyId) {
        toast.error("Payment service not configured");
        setSubscribing(null);
        return;
      }

      const amountPaise = Math.round((plan.price || 0) * 100); // Rupees to paise
      const shortPlanId = plan.id.slice(-8);
      const shortTimestamp = Date.now().toString(36);
      const receipt = `sub_${shortPlanId}_${shortTimestamp}`;
      const orderData = await createOrder(amountPaise, "INR", receipt);

      const orderId = orderData?.id || orderData?.order_id;
      if (!orderId) {
        toast.error("Failed to create order");
        setSubscribing(null);
        return;
      }

      const options = withRazorpayPaymentMethods({
        key: keyId,
        amount: amountPaise,
        currency: "INR",
        name: "E-Warrantify",
        description: `${plan.name} - ${plan.description || ""}`,
        order_id: orderId,
        theme: { ...RAZORPAY_CHECKOUT_THEME },
        handler: async (response) => {
          try {
            const startDate = new Date();
            const endDate = new Date();
            endDate.setDate(endDate.getDate() + 30);

            await createProviderSubscription({
              subscription_plan_ids: [plan.id],
              start_date: startDate.toISOString(),
              end_date: endDate.toISOString(),
              amount_paid: plan.price,
              order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              total_branches: 1,
            });
            toast.success("Subscription activated successfully!");
            fetchData();
          } catch (e) {
            toast.error(e.response?.data?.message || "Failed to activate subscription");
          } finally {
            setSubscribing(null);
          }
        },
      });

      const rzp = new window.Razorpay(options);
      rzp.on("payment.failed", () => {
        toast.error("Payment failed");
        setSubscribing(null);
      });
      rzp.open();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to start payment");
      setSubscribing(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-[#1A7FC1]" />
      </div>
    );
  }

  const hasActiveSubscription = subscription && (subscription.moduleAccess?.length > 0 || subscription.isTrial);
  const needsUpgrade = !hasActiveSubscription;

  return (
    <div className="p-4 lg:p-6 max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-xl lg:text-2xl font-bold text-slate-800">Subscription & Plans</h1>
        <p className="text-sm text-slate-500">
          {hasActiveSubscription
            ? "You have an active subscription"
            : "Choose a plan to continue using E-Warrantify"}
        </p>
      </div>

      {needsUpgrade && (
        <div className="mb-6 p-4 rounded-lg bg-amber-50 border border-amber-200 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <p className="font-medium text-amber-800">Subscription required</p>
            <p className="text-sm text-amber-700">
              Your trial has ended or subscription has expired. Subscribe to a plan to continue.
            </p>
          </div>
        </div>
      )}

      {hasActiveSubscription && (
        <div className="mb-6 p-4 rounded-lg bg-emerald-50 border border-emerald-200 flex items-center gap-3">
          <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0" />
          <div>
            <p className="font-medium text-emerald-800">
              {subscription.isTrial ? "Trial period active" : "Active subscription"}
            </p>
            <p className="text-sm text-emerald-700">
              {subscription.moduleAccess?.length || 0} modules available
            </p>
          </div>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {plans
          .filter((p) => p.is_active !== false && !p.is_deleted)
          .map((plan) => (
            <div
              key={plan.id}
              className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="flex items-center gap-2 mb-3">
                <ShieldCheck className="w-5 h-5 text-[#1A7FC1]" />
                <h2 className="font-semibold text-slate-800">{plan.name}</h2>
              </div>
              <p className="text-sm text-slate-600 mb-4 line-clamp-2">{plan.description}</p>
              <div className="mb-4">
                <span className="text-2xl font-bold text-[#1A7FC1]">
                  ₹{plan.price === 0 ? "0" : plan.price}
                </span>
                <span className="text-sm text-slate-500 ml-1">/ month</span>
              </div>
              {plan.is_base_plan && (
                <span className="inline-block text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded mb-3">
                  Base plan
                </span>
              )}
              <button
                onClick={() => handleSubscribe(plan)}
                disabled={subscribing === plan.id}
                className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg bg-[#1A7FC1] text-white font-medium hover:bg-[#166EA8] disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {subscribing === plan.id ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <CreditCard className="w-4 h-4" />
                )}
                {plan.price === 0 ? "Contact Support" : "Subscribe"}
              </button>
            </div>
          ))}
      </div>

      {plans.length === 0 && (
        <p className="text-center text-slate-500 py-8">No plans available. Contact support.</p>
      )}
    </div>
  );
}
