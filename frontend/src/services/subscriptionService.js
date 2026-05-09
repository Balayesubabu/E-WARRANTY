import api from "../utils/api";

/**
 * Get all subscription plans (public)
 */
export const getPlans = async () => {
  const res = await api.get("/subscription/");
  return res.data?.data ?? res.data;
};

/**
 * Get provider's subscribed modules - 403 if subscription expired
 * Requires owner auth (verifyLoginToken)
 */
export const getProviderSubscribedModules = async () => {
  const res = await api.get("/subscription/provider-subscribed-modules");
  return res.data?.data ?? res.data;
};

/**
 * Get Razorpay key for checkout (public key only)
 */
export const getRazorpayKey = async () => {
  const res = await api.get("/subscription/razorpay-key");
  return res.data?.data?.key_id ?? res.data?.key_id;
};

/**
 * Create Razorpay order - returns { id, amount, currency, ... }
 * @param {number} amountPaise - Amount in paise (e.g. ₹199 = 19900)
 */
export const createOrder = async (amountPaise, currency = "INR", receipt) => {
  const res = await api.post("/subscription/create-order-subscription", {
    amount: Math.round(amountPaise),
    currency,
    receipt: receipt || `rcpt_${Date.now()}`,
  });
  return res.data?.data ?? res.data;
};

/**
 * Confirm subscription after payment - verify order and create ProviderSubscription
 */
export const createProviderSubscription = async (payload) => {
  const res = await api.post("/subscription/create-provider-subscription", payload);
  return res.data?.data ?? res.data;
};
