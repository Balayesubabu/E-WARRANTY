/**
 * Centralized status transition validation using existing Prisma enum values
 */

const WARRANTY_CODE_VALID_TRANSITIONS = {
  Inactive: ["Active", "Pending", "Expired"],
  Pending: ["Active", "Expired", "Inactive"],
  Active: ["Expired", "Inactive"],
  Expired: ["Inactive"],
};

const CLAIM_VALID_TRANSITIONS = {
  Submitted: ["Approved", "Rejected", "UnderReview", "AssignedToServiceCenter"],
  UnderReview: ["Approved", "Rejected", "Submitted"],
  AssignedToServiceCenter: ["InProgress", "Approved", "Rejected"],
  Approved: ["InProgress", "Rejected", "Repaired", "Replaced"],
  Rejected: ["Closed"],
  InProgress: ["Repaired", "Replaced", "Rejected", "SLABreached"],
  Repaired: ["Closed"],
  Replaced: ["Closed"],
  SLABreached: ["Repaired", "Replaced", "Closed"],
  Closed: [],
};

export const validateWarrantyCodeTransition = (fromStatus, toStatus) => {
  const from = String(fromStatus || "").trim();
  const to = String(toStatus || "").trim();
  if (!from || !to) return { valid: false, message: "Status values are required" };
  const allowed = WARRANTY_CODE_VALID_TRANSITIONS[from];
  if (!allowed) return { valid: false, message: `Unknown status: ${from}` };
  if (!allowed.includes(to)) return { valid: false, message: `Invalid transition: ${from} -> ${to}` };
  return { valid: true };
};

export const validateClaimTransition = (fromStatus, toStatus) => {
  const from = String(fromStatus || "").trim();
  const to = String(toStatus || "").trim();
  if (!from || !to) return { valid: false, message: "Status values are required" };
  const allowed = CLAIM_VALID_TRANSITIONS[from];
  if (!allowed) return { valid: false, message: `Unknown status: ${from}` };
  if (!allowed.includes(to)) return { valid: false, message: `Invalid transition: ${from} -> ${to}` };
  return { valid: true };
};
