import { User, Staff, ProviderDealer, ServiceCenter } from "../prisma/db-models.js";

/** User-facing message when an email is already tied to another login surface. */
export const GLOBAL_EMAIL_IN_USE_MESSAGE =
    "This email is already used for another account type. Please use a different email address.";

/**
 * Canonical form for cross-table email identity (case-insensitive uniqueness).
 * @param {unknown} raw
 * @returns {string} Lowercase trimmed address, or "" if missing / not a plausible email.
 */
export function normalizeEmailForIdentity(raw) {
    if (raw == null) return "";
    const s = String(raw).trim().toLowerCase();
    if (!s || !s.includes("@")) return "";
    return s;
}

/**
 * Whether this normalized email is already used on another account type.
 * Checks active (non-deleted) rows on User, Staff, ProviderDealer, and ServiceCenter.
 *
 * @param {string} normalizedEmail from {@link normalizeEmailForIdentity}
 * @param {{ excludeUserId?: string, excludeStaffId?: string, excludeDealerId?: string, excludeServiceCenterId?: string }} [exclude]
 * @returns {Promise<"user"|"staff"|"dealer"|"service_center"|null>} first conflict found, or null if available
 */
export async function findGlobalEmailLoginConflict(normalizedEmail, exclude = {}) {
    if (!normalizedEmail) return null;

    const user = await User.findFirst({
        where: {
            email: { equals: normalizedEmail, mode: "insensitive" },
            is_deleted: false,
            ...(exclude.excludeUserId ? { id: { not: exclude.excludeUserId } } : {}),
        },
        select: { id: true },
    });
    if (user) return "user";

    const staff = await Staff.findFirst({
        where: {
            email: { equals: normalizedEmail, mode: "insensitive" },
            is_deleted: false,
            ...(exclude.excludeStaffId ? { id: { not: exclude.excludeStaffId } } : {}),
        },
        select: { id: true },
    });
    if (staff) return "staff";

    const dealer = await ProviderDealer.findFirst({
        where: {
            email: { equals: normalizedEmail, mode: "insensitive" },
            is_deleted: false,
            ...(exclude.excludeDealerId ? { id: { not: exclude.excludeDealerId } } : {}),
        },
        select: { id: true },
    });
    if (dealer) return "dealer";

    const sc = await ServiceCenter.findFirst({
        where: {
            email: { equals: normalizedEmail, mode: "insensitive" },
            is_deleted: false,
            ...(exclude.excludeServiceCenterId ? { id: { not: exclude.excludeServiceCenterId } } : {}),
        },
        select: { id: true },
    });
    if (sc) return "service_center";

    return null;
}
