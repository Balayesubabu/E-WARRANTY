/** Inline hints (emerald) for duplicate email/phone from owner APIs. */

export const DUPLICATE_EMAIL_HINT = "This email is already used";
export const DUPLICATE_PHONE_HINT = "This phone number is already used";

export const isDealerDuplicateError = (msg) =>
  /dealer already exists for provider/i.test(String(msg || ""));

export const isStaffCreateDuplicateError = (msg) =>
  /staff already exists/i.test(String(msg || ""));

export const isServiceCenterDuplicateError = (msg) =>
  /service center with this email or phone already exists/i.test(String(msg || ""));

/** Staff update: "Email x already in use." / "Phone x already in use." */
export function parseStaffUpdateConflictMessage(msg) {
  const s = String(msg || "");
  return {
    email: /email\s+.+\s+already in use/i.test(s) ? DUPLICATE_EMAIL_HINT : "",
    phone: /phone\s+.+\s+already in use/i.test(s) ? DUPLICATE_PHONE_HINT : "",
  };
}

/** When the API does not say whether email or phone conflicted. */
export function ambiguousEmailPhoneDuplicateHints() {
  return { email: DUPLICATE_EMAIL_HINT, phone: DUPLICATE_PHONE_HINT };
}

/** Dealer update may surface Prisma unique constraint text. */
export function parseDealerUpdateConflictMessage(msg) {
  const s = String(msg || "");
  if (!/unique constraint|duplicate key|violates unique/i.test(s)) {
    return { email: "", phone: "" };
  }
  const hasEmail = /\bemail\b/i.test(s);
  const hasPhone = /phone/i.test(s);
  if (hasEmail && !hasPhone) return { email: DUPLICATE_EMAIL_HINT, phone: "" };
  if (hasPhone && !hasEmail) return { email: "", phone: DUPLICATE_PHONE_HINT };
  return ambiguousEmailPhoneDuplicateHints();
}
