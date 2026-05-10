/**
 * Portal password rules — mirror frontend/src/utils/passwordPolicy.js
 */

export const PASSWORD_POLICY_MESSAGE =
  "Password must be at least 8 characters and include Uppercase, lowercase, a number, and a special character.";

export function isPortalPasswordStrong(password) {
  if (!password || typeof password !== "string") return false;
  if (password.length < 8) return false;
  if (!/[A-Z]/.test(password)) return false;
  if (!/[a-z]/.test(password)) return false;
  if (!/[0-9]/.test(password)) return false;
  if (!/[^A-Za-z0-9]/.test(password)) return false;
  return true;
}

/** When password is omitted or blank, OK. Otherwise must meet policy. */
export function validateOptionalPortalPassword(password) {
  if (password === undefined || password === null || String(password).trim() === "") {
    return { ok: true };
  }
  if (!isPortalPasswordStrong(String(password))) {
    return { ok: false, message: PASSWORD_POLICY_MESSAGE };
  }
  return { ok: true };
}

export function assertRequiredPortalPassword(password) {
  if (!isPortalPasswordStrong(password)) {
    return { ok: false, message: PASSWORD_POLICY_MESSAGE };
  }
  return { ok: true };
}
