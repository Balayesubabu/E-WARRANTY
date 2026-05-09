import { getStaffPermissions } from "./staffService";

let cachedPermissions = null;
let cachedStaffId = null;

/**
 * Build permission map from staff profile (StaffRolePermission array).
 * Use this when staff loads their profile (get-staff-profile) which includes abilities.
 */
export const setStaffPermissionsFromProfile = (staffId, staff) => {
  const permMap = {};
  const list = staff?.StaffRolePermission || [];
  list.forEach((p) => {
    // Only sub_module_id: staff see/use only the abilities owner assigned
    if (p.sub_module_id) permMap[p.sub_module_id] = p.access_type || "Read";
  });
  cachedPermissions = permMap;
  cachedStaffId = staffId;
  return permMap;
};

/**
 * Fetch and cache the current staff member's permissions (owner viewing a staff).
 * Returns a map like { "sub_module_id": "Read", "module_id": "Write" }
 */
export const loadStaffPermissions = async (staffId) => {
  if (cachedStaffId === staffId && cachedPermissions) {
    return cachedPermissions;
  }
  try {
    const res = await getStaffPermissions(staffId);
    const data = res?.data;
    const permMap = {};
    if (data?.StaffRolePermission) {
      data.StaffRolePermission.forEach((p) => {
        if (p.sub_module_id) permMap[p.sub_module_id] = p.access_type;
        if (p.module_id) permMap[p.module_id] = p.access_type;
      });
    }
    cachedPermissions = permMap;
    cachedStaffId = staffId;
    return permMap;
  } catch {
    return {};
  }
};

export const clearPermissionCache = () => {
  cachedPermissions = null;
  cachedStaffId = null;
};

/**
 * Check if the current user (from localStorage) has access to a specific module.
 * For non-staff users (owner, dealer, customer), always returns true.
 * For staff, checks against their cached permissions.
 *
 * @param {string} moduleId - The module ID to check
 * @param {string} requiredAccess - "Read" or "Write"
 * @returns {boolean}
 */
export const hasModuleAccess = (moduleId, requiredAccess = "Read") => {
  try {
    const user = JSON.parse(localStorage.getItem("user") || "{}");
    const userType = user?.user_type || user?.role;
    if (userType !== "staff") return true;
  } catch {
    return true;
  }

  if (!cachedPermissions) return false;

  const access = cachedPermissions[moduleId];
  if (!access) return false;
  if (requiredAccess === "Read") return true; // Write implies Read
  return access === "Write";
};

/**
 * Check if user has access to a sub-module.
 * Falls back to checking parent module access.
 */
export const hasSubModuleAccess = (subModuleId, moduleId, requiredAccess = "Read") => {
  try {
    const user = JSON.parse(localStorage.getItem("user") || "{}");
    const userType = user?.user_type || user?.role;
    if (userType !== "staff") return true;
  } catch {
    return true;
  }

  if (!cachedPermissions) return false;

  const subAccess = cachedPermissions[subModuleId];
  if (subAccess) {
    if (requiredAccess === "Read") return true;
    return subAccess === "Write";
  }

  // Fall back to module-level access
  if (moduleId) return hasModuleAccess(moduleId, requiredAccess);
  return false;
};

// Well-known module IDs from seed data
export const MODULE_IDS = {
  SALES: "550e8400-e29b-41d4-a716-446655440000",
  PURCHASE: "550e8400-e29b-41d4-a716-446655440001",
  MANAGE_PARTNERS: "550e8400-e29b-41d4-a716-446655440002",
  MANAGE: "550e8400-e29b-41d4-a716-446655440003",
  BOOKINGS: "550e8400-e29b-41d4-a716-446655440004",
  ACCOUNTS: "550e8400-e29b-41d4-a716-446655440005",
  STAFF: "550e8400-e29b-41d4-a716-446655440006",
  DASHBOARD: "550e8400-e29b-41d4-a716-446655440007",
  E_WARRANTY: "550e8400-e29b-41d4-a716-446655440008",
  OTHER_EXPENSES: "550e8400-e29b-41d4-a716-446655440009",
};

export const SUB_MODULE_IDS = {
  CODE_GENERATION: "550e8400-e29b-41d4-a716-446655440121",
  DEALERS: "550e8400-e29b-41d4-a716-446655440122",
  REGISTRATION: "550e8400-e29b-41d4-a716-446655440123",
  ACTIVE_CUSTOMERS: "550e8400-e29b-41d4-a716-446655440124",
  WARRANTY_SETTINGS: "550e8400-e29b-41d4-a716-446655440125",
};
