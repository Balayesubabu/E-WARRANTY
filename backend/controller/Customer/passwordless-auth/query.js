import { prisma, User, Staff, ProviderDealer, Provider, ServiceCenter } from "../../../prisma/db-models.js";
import { ensureCustomerRole } from "../../../utils/resolveCanonicalRole.js";
import {
    normalizeEmailForIdentity,
    findGlobalEmailLoginConflict,
    GLOBAL_EMAIL_IN_USE_MESSAGE,
} from "../../../utils/globalEmailIdentity.js";

export const findUserByEmailOrPhone = async (email, phone_number) => {
  const conditions = [];
  if (email) conditions.push({ email: { equals: email, mode: "insensitive" } });
  if (phone_number) conditions.push({ phone_number: phone_number });
  if (conditions.length === 0) return null;

  return User.findFirst({ where: { OR: conditions } });
};

export const detectExistingRole = async (email, phone_number) => {
  // Check if this email/phone belongs to an owner (User with Provider record) or platform admin
  const user = await findUserByEmailOrPhone(email, phone_number);
  if (user) {
    if (user.user_type === "owner") return "owner";
    if (user.user_type === "super_admin") return "super_admin";
    const provider = await Provider.findFirst({ where: { user_id: user.id } });
    if (provider) return "owner";
  }

  // Check Staff table
  const staffConditions = [];
  if (email) staffConditions.push({ email: { equals: email, mode: "insensitive" } });
  if (phone_number) staffConditions.push({ phone: phone_number });
  if (staffConditions.length > 0) {
    const staff = await Staff.findFirst({ where: { OR: staffConditions, is_deleted: false } });
    if (staff) return "staff";
  }

  // Check Dealer table
  const dealerConditions = [];
  if (email) dealerConditions.push({ email: { equals: email, mode: "insensitive" } });
  if (phone_number) dealerConditions.push({ phone_number: phone_number });
  if (dealerConditions.length > 0) {
    const dealer = await ProviderDealer.findFirst({ where: { OR: dealerConditions, is_deleted: false } });
    if (dealer) return "dealer";
  }

  const scConditions = [];
  if (email) scConditions.push({ email: { equals: email, mode: "insensitive" } });
  if (phone_number) scConditions.push({ phone: phone_number });
  if (scConditions.length > 0) {
    const sc = await ServiceCenter.findFirst({
      where: { OR: scConditions, is_deleted: false, is_active: true },
    });
    if (sc) return "service_center";
  }

  return null;
};

export const createCustomerUser = async ({ email, phone_number, country_code }) => {
  const emailNorm = normalizeEmailForIdentity(email);
  if (emailNorm) {
    const conflict = await findGlobalEmailLoginConflict(emailNorm, {});
    if (conflict) {
      const err = new Error(GLOBAL_EMAIL_IN_USE_MESSAGE);
      err.code = "GLOBAL_EMAIL_IN_USE";
      err.statusCode = 409;
      err.existingRole = conflict;
      throw err;
    }
  }

  return prisma.$transaction(async (tx) => {
    const role = await ensureCustomerRole(tx);
    const normalizedPhone = phone_number
      ? String(phone_number).trim().replace(/\s/g, "")
      : "";
    const data = {
      phone_number: normalizedPhone || null,
      user_type: "customer",
      auth_provider: "otp",
      is_active: true,
      profile_completed: false,
      created_at: new Date(),
      role_id: role.id,
    };
    if (emailNorm) data.email = emailNorm;
    if (country_code) data.country_code = country_code;

    const user = await tx.user.create({ data });
    await tx.userRole.create({
      data: { user_id: user.id, role_id: role.id },
    });
    return user;
  });
};

export const updateUserOtpAttempts = async (userId, attempts) => {
  return User.update({
    where: { id: userId },
    data: { otp_attempts: attempts },
  });
};

export const updateUserOtpRequestCount = async (userId) => {
  return User.update({
    where: { id: userId },
    data: {
      otp_request_count: { increment: 1 },
      otp_last_request: new Date(),
    },
  });
};

export const resetUserOtpAttempts = async (userId) => {
  return User.update({
    where: { id: userId },
    data: { otp_attempts: 0, otp: null, otp_expiry: null },
  });
};

export const setUserVerifiedAndProfile = async (userId) => {
  return User.update({
    where: { id: userId },
    data: {
      is_otp_verified: true,
      is_phone_verified: true,
      otp: null,
      otp_expiry: null,
      otp_attempts: 0,
    },
  });
};

export const completeUserProfile = async (userId, { first_name, last_name, email, city, phone_number }) => {
  const data = { profile_completed: true };
  if (first_name) data.first_name = first_name;
  if (last_name) data.last_name = last_name;
  if (email !== undefined && email !== null && String(email).trim()) {
    data.email = normalizeEmailForIdentity(email);
  }
  if (city !== undefined && city !== null && String(city).trim()) {
    data.city = String(city).trim();
  }
  if (phone_number !== undefined && phone_number !== null && String(phone_number).trim()) {
    const normalized = String(phone_number).trim().replace(/\s/g, "");
    if (normalized && !normalized.startsWith("temp_")) {
      data.phone_number = normalized;
    }
  }
  data.updated_at = new Date();

  return User.update({ where: { id: userId }, data });
};

export const findUserByPhoneExcluding = async (phone_number, excludeUserId) => {
  if (!phone_number || String(phone_number).startsWith("temp_")) return null;
  const normalized = String(phone_number).trim().replace(/\s/g, "");
  return User.findFirst({
    where: {
      phone_number: normalized,
      id: { not: excludeUserId },
    },
  });
};

export const findUserByEmailExcluding = async (email, excludeUserId) => {
  if (!email || !String(email).trim()) return null;
  return User.findFirst({
    where: {
      email: { equals: String(email).trim(), mode: "insensitive" },
      id: { not: excludeUserId },
    },
  });
};

export const getUserById = async (userId) => {
  return User.findUnique({ where: { id: userId } });
};
