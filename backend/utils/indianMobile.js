/**
 * Normalize input to a 10-digit Indian mobile national number (+91 / leading 0 supported).
 * @returns {string|null}
 */
export function normalizeIndianMobile(input) {
  const d = String(input ?? "").replace(/\D/g, "");
  if (d.length === 12 && d.startsWith("91")) return d.slice(2);
  if (d.length === 11 && d.startsWith("0")) return d.slice(1);
  if (d.length === 10) return d;
  return null;
}

/** GSM-style Indian mobile: 10 digits, first digit 6–9. */
export function isValidIndianMobile(ten) {
  return Boolean(ten && /^[6-9]\d{9}$/.test(ten));
}
