/**
 * Razorpay Standard Checkout (checkout.js) — shared payment-method config.
 *
 * Explicitly enables card, UPI, netbanking, wallet, and EMI (where Razorpay offers it).
 * Methods must still be activated on the Razorpay Dashboard; values follow Razorpay’s
 * convention: 1 = show, 0 = hide.
 *
 * The `image` URL is loaded from Razorpay’s origin (https://api.razorpay.com). Browsers
 * block http://localhost/... from that context (loopback / mixed content). Production
 * should set VITE_RAZORPAY_CHECKOUT_IMAGE_URL and/or VITE_APP_BASE_URL (HTTPS) so the
 * logo is always a public HTTPS URL.
 *
 * @see https://razorpay.com/docs/payments/payment-gateway/web-integration/standard/configure-payment-methods/
 */

export const RAZORPAY_CHECKOUT_THEME = Object.freeze({
  color: "#1A7FC1",
});

/** Default methods to expose on Checkout (dashboard + eligibility rules still apply). */
export const RAZORPAY_CHECKOUT_METHODS = Object.freeze({
  card: 1,
  netbanking: 1,
  wallet: 1,
  upi: 1,
  emi: 1,
});

function trimEnv(key) {
  if (typeof import.meta === "undefined" || import.meta.env?.[key] == null) {
    return "";
  }
  return String(import.meta.env[key]).trim();
}

/**
 * Resolves the checkout logo URL Razorpay can fetch (HTTPS, non-loopback), or undefined.
 * @returns {string | undefined}
 */
export function getRazorpayCheckoutLogoUrl() {
  const explicit = trimEnv("VITE_RAZORPAY_CHECKOUT_IMAGE_URL");
  if (explicit) {
    return explicit;
  }

  const appBase = trimEnv("VITE_APP_BASE_URL");
  if (appBase.startsWith("https://")) {
    return `${appBase.replace(/\/+$/, "")}/ewarrantify-logo.png`;
  }

  if (typeof window === "undefined" || !window.location?.origin) {
    return undefined;
  }

  const { protocol, hostname, origin } = window.location;
  const isLoopback =
    hostname === "localhost" ||
    hostname === "127.0.0.1" ||
    hostname === "[::1]";

  if (isLoopback || protocol !== "https:") {
    return undefined;
  }

  return `${origin}/ewarrantify-logo.png`;
}

/**
 * @param {Record<string, unknown>} options - Razorpay Checkout options (key, amount, order_id, handler, …)
 * @returns {Record<string, unknown>} Same options with `method` merged in and a safe `image` when resolvable
 */
export function withRazorpayPaymentMethods(options) {
  if (!options || typeof options !== "object") {
    return options;
  }

  const callerImage =
    options.image !== undefined && options.image !== null ? String(options.image).trim() : "";
  const resolvedImage = callerImage.length > 0 ? callerImage : getRazorpayCheckoutLogoUrl();

  const out = {
    ...options,
    method: {
      ...RAZORPAY_CHECKOUT_METHODS,
      ...(options.method && typeof options.method === "object" ? options.method : {}),
    },
  };

  if (typeof resolvedImage === "string" && resolvedImage.length > 0) {
    out.image = resolvedImage;
  } else {
    delete out.image;
  }

  return out;
}
