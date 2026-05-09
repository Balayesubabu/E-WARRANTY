import { User, Staff, ProviderDealer, ServiceCenter, Provider, Franchise } from "../../../prisma/db-models.js";

export const findUserByContact = async (email, phone) => {
  const conditions = [];
  if (email) conditions.push({ email: { equals: email, mode: "insensitive" } });
  if (phone) conditions.push({ phone_number: phone });
  if (conditions.length === 0) return null;
  return User.findFirst({ where: { OR: conditions } });
};

export const findStaffByContact = async (email, phone) => {
  const conditions = [];
  if (email) conditions.push({ email: { equals: email, mode: "insensitive" } });
  if (phone) conditions.push({ phone });
  if (conditions.length === 0) return null;
  return Staff.findFirst({
    where: { OR: conditions, is_deleted: false },
    include: { provider: { include: { user: true } } },
  });
};

export const findDealerByContact = async (email, phone) => {
  const conditions = [];
  if (email) conditions.push({ email: { equals: email, mode: "insensitive" } });
  if (phone) conditions.push({ phone_number: phone });
  if (conditions.length === 0) return null;
  return ProviderDealer.findFirst({
    where: { OR: conditions, is_deleted: false },
    include: { provider: { include: { user: true } } },
  });
};

export const findServiceCenterByContact = async (email, phone) => {
  const conditions = [];
  if (email) conditions.push({ email: { equals: email, mode: "insensitive" } });
  if (phone) conditions.push({ phone });
  if (conditions.length === 0) return null;
  return ServiceCenter.findFirst({
    where: { OR: conditions, is_deleted: false, is_active: true },
    include: { provider: { include: { user: true } } },
  });
};

/**
 * detectRole - Detects ALL roles associated with an email/phone
 * 
 * Real-world SaaS systems allow the same identity to have multiple roles:
 * - A person can be a Customer AND a Staff member at different organizations
 * - A business owner might also be a customer of another business
 * - This function supports context-aware authentication by collecting all roles
 * 
 * @param {string} email - User's email address
 * @param {string} phone - User's phone number
 * @returns {Object} - { multipleRoles: boolean, role?: string, record?: object, roles?: array }
 * 
 * If single role:  { multipleRoles: false, role: "staff", record: staffRecord }
 * If multiple:     { multipleRoles: true, roles: [{ role: "customer", record }, { role: "staff", record }] }
 */
export const detectRole = async (email, phone) => {
  const foundRoles = [];

  // Check User table (can be owner or customer)
  const user = await findUserByContact(email, phone);
  if (user) {
    // Determine if user is owner or customer
    if (user.user_type === "owner") {
      foundRoles.push({ role: "owner", record: user });
    } else {
      // Check if user has a Provider record (makes them an owner even if user_type isn't set)
      const provider = await Provider.findFirst({ where: { user_id: user.id } });
      if (provider) {
        foundRoles.push({ role: "owner", record: user });
      } else {
        // User exists but is not an owner, so they're a customer
        foundRoles.push({ role: "customer", record: user });
      }
    }
  }

  // Check Staff table (separate from User table)
  const staff = await findStaffByContact(email, phone);
  if (staff) {
    foundRoles.push({ role: "staff", record: staff });
  }

  // Check Dealer table (separate from User table)
  const dealer = await findDealerByContact(email, phone);
  if (dealer) {
    foundRoles.push({ role: "dealer", record: dealer });
  }

  // Check ServiceCenter table (separate from User table)
  const serviceCenter = await findServiceCenterByContact(email, phone);
  if (serviceCenter) {
    foundRoles.push({ role: "service_center", record: serviceCenter });
  }

  // No roles found
  if (foundRoles.length === 0) {
    return null;
  }

  // Single role - maintain backward compatibility with existing response structure
  if (foundRoles.length === 1) {
    return {
      multipleRoles: false,
      role: foundRoles[0].role,
      record: foundRoles[0].record,
    };
  }

  // Multiple roles found - return all for user selection
  return {
    multipleRoles: true,
    roles: foundRoles,
  };
};

export const getFranchiseForStaff = async (franchiseId) => {
  if (!franchiseId) return null;
  return Franchise.findUnique({ where: { id: franchiseId } });
};

export const getFranchiseForDealer = async (providerId) => {
  if (!providerId) return null;
  return Franchise.findFirst({
    where: { provider_id: providerId, is_deleted: false, is_active: true },
  });
};

export const getFranchiseForServiceCenter = async (providerId) => {
  if (!providerId) return null;
  return Franchise.findFirst({
    where: { provider_id: providerId, is_deleted: false, is_active: true },
    orderBy: { created_at: "asc" },
  });
};

export const getFranchiseForOwner = async (userId) => {
  const provider = await Provider.findFirst({ where: { user_id: userId } });
  if (!provider) return null;
  return Franchise.findFirst({
    where: { provider_id: provider.id, is_deleted: false, is_active: true },
  });
};
