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

/** Indian GSM mobile: 10 digits, first digit 6–9. */
export function isValidIndianMobile(ten) {
  return Boolean(ten && /^[6-9]\d{9}$/.test(ten));
}

/**
 * Controlled input: digits only, max 10, handles paste with +91 or leading 0.
 */
export function sanitizeIndianNationalInput(raw) {
  let d = String(raw ?? "").replace(/\D/g, "");
  if (d.length >= 12 && d.startsWith("91")) d = d.slice(2);
  else if (d.length >= 11 && d.startsWith("0")) d = d.slice(1);
  return d.slice(0, 10);
}

/** Non-India country codes: national/significant digits only, ITU-friendly cap. */
export function sanitizeInternationalPhoneDigits(raw) {
  return String(raw ?? "").replace(/\D/g, "").slice(0, 15);
}

/** Prefer +91 when the stored value is a plain 10-digit Indian mobile (avoids mis-parsing digits as a fake country code). */
export function splitPhoneForOwnerForm(stored, allowedCountryCodes) {
  const defaultCodes = ["+91", "+1", "+44", "+61", "+81", "+971", "+65", "+86", "+49", "+33"];
  const codes = [...(allowedCountryCodes?.length ? allowedCountryCodes : defaultCodes)].sort(
    (a, b) => b.length - a.length
  );

  const s = String(stored ?? "").trim();
  if (!s || s.toLowerCase().startsWith("temp_")) {
    return { countryCode: "+91", nationalDigits: "" };
  }

  const indian10 = normalizeIndianMobile(s);
  if (indian10 && isValidIndianMobile(indian10)) {
    return { countryCode: "+91", nationalDigits: indian10 };
  }

  const allDigits = s.replace(/\D/g, "");
  if (allDigits.length === 10 && isValidIndianMobile(allDigits)) {
    return { countryCode: "+91", nationalDigits: allDigits };
  }
  if (allDigits.length === 12 && allDigits.startsWith("91") && isValidIndianMobile(allDigits.slice(2))) {
    return { countryCode: "+91", nationalDigits: allDigits.slice(2) };
  }
  if (allDigits.length === 11 && allDigits.startsWith("0") && isValidIndianMobile(allDigits.slice(1))) {
    return { countryCode: "+91", nationalDigits: allDigits.slice(1) };
  }

  if (s.startsWith("+")) {
    for (const code of codes) {
      if (s.startsWith(code)) {
        const rest = s.slice(code.length).replace(/\D/g, "");
        if (code === "+91") {
          const ten = normalizeIndianMobile(s) || sanitizeIndianNationalInput(rest);
          if (ten && isValidIndianMobile(ten)) {
            return { countryCode: "+91", nationalDigits: ten };
          }
        }
        return {
          countryCode: code,
          nationalDigits:
            code === "+91" ? sanitizeIndianNationalInput(rest) : sanitizeInternationalPhoneDigits(rest),
        };
      }
    }
  }

  if (allDigits.length >= 10) {
    const last10 = allDigits.slice(-10);
    if (isValidIndianMobile(last10)) {
      return { countryCode: "+91", nationalDigits: last10 };
    }
  }

  return { countryCode: "+91", nationalDigits: sanitizeIndianNationalInput(allDigits) };
}
