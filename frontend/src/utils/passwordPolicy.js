/** Shared rules for portal passwords (dealer / staff / service center). Keep in sync with backend/utils/passwordPolicy.js */

export const PASSWORD_HINT_TEXT =
  "Use at least 8 characters with uppercase, lowercase, a number, and a special character (e.g. !@#$).";

export const PASSWORD_POLICY_REJECT_MESSAGE =
  "Password must be at least 8 characters and include uppercase, lowercase, a number, and a special character.";

export function isPasswordStrong(password) {
  if (!password || typeof password !== "string") return false;
  if (password.length < 8) return false;
  if (!/[A-Z]/.test(password)) return false;
  if (!/[a-z]/.test(password)) return false;
  if (!/[0-9]/.test(password)) return false;
  if (!/[^A-Za-z0-9]/.test(password)) return false;
  return true;
}

/** For optional initial passwords (e.g. service center): empty is allowed. */
export function isOptionalPasswordValid(password) {
  if (password === undefined || password === null || String(password).trim() === "") return true;
  return isPasswordStrong(String(password));
}
