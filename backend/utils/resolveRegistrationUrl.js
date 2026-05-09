/**
 * Customer self-registration path (must match frontend route in App.jsx).
 */
const CUSTOMER_REGISTER_PATH = "/customer-register";
const CUSTOMER_AUTH_PATH = "/customer-auth";

import os from "os";

function parseOrigin(value) {
  if (!value) return "";
  try {
    // value can be a full URL (referer) or an origin (origin header)
    const u = new URL(value);
    return u.origin;
  } catch {
    return "";
  }
}

function resolveBaseFromRequest(req) {
  if (!req || !req.headers) return "";

  // Prefer Origin header (sent by browsers on CORS requests)
  const origin = parseOrigin(req.headers.origin);
  if (origin) return origin;

  // Fallback: Referer header
  const referer = parseOrigin(req.headers.referer);
  if (referer) return referer;

  // Fallback: Host header (last resort; assumes backend knows correct protocol)
  const host = String(req.headers["x-forwarded-host"] || req.headers.host || "").trim();
  if (!host) return "";
  const proto = String(req.headers["x-forwarded-proto"] || "").trim() || (req.protocol || "http");
  return `${proto}://${host}`;
}

function isLoopbackOrigin(origin) {
  try {
    const u = new URL(origin);
    const host = (u.hostname || "").toLowerCase();
    return host === "localhost" || host === "127.0.0.1" || host === "[::1]";
  } catch {
    return false;
  }
}

function getLanIpv4() {
  // Optional override if you ever want to force a specific IP.
  const forced = String(process.env.QR_FRONTEND_LAN_IP || "").trim();
  if (forced) return forced;

  const n = os.networkInterfaces();
  for (const name of Object.keys(n)) {
    for (const a of n[name] || []) {
      if (a && a.family === "IPv4" && !a.internal) {
        return a.address;
      }
    }
  }
  return "";
}

function replaceLoopbackWithLan(origin) {
  try {
    const u = new URL(origin);
    const lan = getLanIpv4();
    if (!lan) return origin;
    u.hostname = lan;
    return u.origin;
  } catch {
    return origin;
  }
}

/**
 * When provider warranty settings omit registration_url, QR and settings APIs
 * fall back to the public SPA origin from FRONTEND_URL (same as CORS in server.js).
 *
 * @param {string | null | undefined} stored - ProviderWarrantySetting.registration_url
 * @param {{ for_qr?: boolean } | undefined} options
 * @returns {string} Full URL or "" if neither stored nor FRONTEND_URL is usable
 */
export function resolveRegistrationUrl(stored, options) {
  const s = typeof stored === "string" ? stored.trim() : "";
  if (s) {
    return s;
  }
  const forQr = options?.for_qr === true;
  const envBase = forQr
    ? (process.env.QR_FRONTEND_URL || process.env.MOBILE_FRONTEND_URL || process.env.FRONTEND_URL || "")
    : (process.env.FRONTEND_URL || "");
  const base = String(envBase).trim().replace(/\/+$/, "");
  if (!base) {
    return "";
  }
  return `${base}${CUSTOMER_REGISTER_PATH}`;
}

/**
 * Like resolveRegistrationUrl(), but prefers the current frontend origin inferred
 * from the incoming HTTP request. This avoids hardcoding LAN IPs in env vars.
 *
 * @param {string | null | undefined} stored
 * @param {import("express").Request} req
 * @param {{ for_qr?: boolean } | undefined} options
 */
export function resolveRegistrationUrlFromRequest(stored, req, options) {
  const s = typeof stored === "string" ? stored.trim() : "";
  if (s) return s;

  let reqBase = resolveBaseFromRequest(req).replace(/\/+$/, "");
  // If frontend was opened via localhost, prefer LAN IP so QR scans work on mobile.
  if (reqBase && isLoopbackOrigin(reqBase)) {
    reqBase = replaceLoopbackWithLan(reqBase);
  }
  if (reqBase) {
    return `${reqBase}${CUSTOMER_REGISTER_PATH}`;
  }

  return resolveRegistrationUrl(stored, options);
}

/**
 * Resolve the customer login route (`/customer-auth`) from the incoming request.
 * This avoids hardcoding a LAN IP in emails.
 *
 * @param {import("express").Request} req
 * @returns {string} Full URL or "" if not resolvable
 */
export function resolveCustomerAuthUrlFromRequest(req) {
  let reqBase = resolveBaseFromRequest(req).replace(/\/+$/, "");
  if (reqBase && isLoopbackOrigin(reqBase)) {
    reqBase = replaceLoopbackWithLan(reqBase);
  }
  if (reqBase) {
    return `${reqBase}${CUSTOMER_AUTH_PATH}`;
  }

  const base = String(process.env.FRONTEND_URL || "").trim().replace(/\/+$/, "");
  if (!base) return "";
  return `${base}${CUSTOMER_AUTH_PATH}`;
}
