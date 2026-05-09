const PATH = "/customer-register";

function trimEnv(key) {
  if (typeof import.meta === "undefined" || import.meta.env?.[key] == null) {
    return "";
  }
  return String(import.meta.env[key]).trim();
}

/**
 * Effective customer registration URL for UI checks when the API returns an empty
 * stored value but Vite knows the public app origin (build-time).
 *
 * @param {Record<string, unknown> | null | undefined} settings - Warranty settings from API
 * @returns {string}
 */
export function getEffectiveRegistrationUrl(settings) {
  const raw = settings && typeof settings.registration_url === "string" ? settings.registration_url.trim() : "";
  if (raw) {
    return raw;
  }
  const base = trimEnv("VITE_APP_BASE_URL").replace(/\/+$/, "");
  if (base.startsWith("https://")) {
    return `${base}${PATH}`;
  }
  if (typeof window !== "undefined" && window.location?.origin) {
    const { protocol, hostname } = window.location;
    const loopback =
      hostname === "localhost" || hostname === "127.0.0.1" || hostname === "[::1]";
    if (!loopback && (protocol === "https:" || protocol === "http:")) {
      return `${window.location.origin}${PATH}`;
    }
  }
  return "";
}
