/**
 * Convert warranty days to human-readable label
 * @param {number} days - Warranty duration in days
 * @returns {string} e.g. "3 Months", "1 Year", "45 Days"
 */
export function daysToReadableLabel(days) {
  if (!days || days < 1) return "1 Year";
  if (days >= 365 && days % 365 === 0) {
    const years = days / 365;
    return years === 1 ? "1 Year" : `${years} Years`;
  }
  if (days >= 30 && days % 30 === 0) {
    const months = days / 30;
    return months === 1 ? "1 Month" : `${months} Months`;
  }
  return days === 1 ? "1 Day" : `${days} Days`;
}

/**
 * Convert years and months to total days
 * @param {number} years
 * @param {number} months
 * @returns {number} Total days (years * 365 + months * 30)
 */
export function yearsMonthsToDays(years = 0, months = 0) {
  return (years || 0) * 365 + (months || 0) * 30;
}

/**
 * Convert years and months to readable label
 * @param {number} years
 * @param {number} months
 * @returns {string} e.g. "1 Year 6 Months", "2 Years", "6 Months"
 */
export function yearsMonthsToReadableLabel(years = 0, months = 0) {
  const y = parseInt(years, 10) || 0;
  const m = parseInt(months, 10) || 0;
  if (y === 0 && m === 0) return "1 Year";
  const parts = [];
  if (y > 0) parts.push(y === 1 ? "1 Year" : `${y} Years`);
  if (m > 0) parts.push(m === 1 ? "1 Month" : `${m} Months`);
  return parts.join(" ") || "1 Year";
}

/** Min/max warranty days for validation */
export const WARRANTY_DAYS_MIN = 1;
export const WARRANTY_DAYS_MAX = 3650; // ~10 years

/** Max years (approx 10 years) */
export const WARRANTY_YEARS_MAX = 10;
/** Max months (0–11) */
export const WARRANTY_MONTHS_MAX = 11;
