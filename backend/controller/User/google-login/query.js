import { Franchise, Owner, ProviderSubscription, prisma, User } from "../../../prisma/db-models.js";
import { ensureBusinessOwnerRole, ensureCustomerRole } from "../../../utils/resolveCanonicalRole.js";

const createOwnerFromGoogle = async ({ email, googleSub, givenName, familyName, fullName }) => {
  let first_name = givenName || null;
  let last_name = familyName || null;
  if (!first_name && fullName) {
    const parts = fullName.trim().split(/\s+/);
    first_name = parts[0] || null;
    last_name = parts.length > 1 ? parts.slice(1).join(" ") : null;
  }
  const companyName = first_name && last_name
    ? `${first_name} ${last_name}'s Business`
    : first_name
      ? `${first_name}'s Business`
      : "My Business";
  const businessOwnerRole = await ensureBusinessOwnerRole();
  const user = await User.create({
    data: {
      email: email.toLowerCase(),
      phone_number: null,
      first_name,
      last_name,
      user_type: "owner",
      auth_provider: "google",
      google_sub: googleSub,
      is_email_verified: true,
      profile_completed: false,
      is_active: true,
      role_id: businessOwnerRole.id,
    },
  });
  const owner = await Owner.create({
    data: {
      user_id: user.id,
      company_name: companyName,
      company_address: "To be completed",
      mode_of_service_offered: [],
    },
  });
  await Franchise.create({
    data: {
      provider_id: owner.id,
      name: "Main Branch",
      address: null,
      created_by_id: user.id,
      is_active: true,
      is_deleted: false,
    },
  });
  return user;
};

const createCustomerFromGoogle = async ({ email, googleSub, givenName, familyName, fullName }) => {
  let first_name = givenName || null;
  let last_name = familyName || null;
  if (!first_name && fullName) {
    const parts = fullName.trim().split(/\s+/);
    first_name = parts[0] || null;
    last_name = parts.length > 1 ? parts.slice(1).join(" ") : null;
  }
  return prisma.$transaction(async (tx) => {
    const role = await ensureCustomerRole(tx);
    const user = await tx.user.create({
      data: {
        email: email.toLowerCase(),
        phone_number: null,
        first_name,
        last_name,
        user_type: "customer",
        auth_provider: "google",
        google_sub: googleSub,
        is_email_verified: true,
        is_otp_verified: true,
        profile_completed: false,
        is_active: true,
        role_id: role.id,
      },
    });
    await tx.userRole.create({
      data: { user_id: user.id, role_id: role.id },
    });
    return user;
  });
};

const findUserByEmail = async (email) => {
  return User.findFirst({
    where: {
      email: {
        equals: email,
        mode: "insensitive",
      },
    },
  });
};

const updateGoogleAuthForUser = async (userId, googleSub) => {
  return User.update({
    where: { id: userId },
    data: {
      google_sub: googleSub,
      auth_provider: "google",
      is_email_verified: true,
    },
  });
};

const getOwnerByUserId = async (user_id) => {
  return Owner.findFirst({
    where: { user_id },
  });
};

const getFranchiseByOwnerId = async (owner_id) => {
  return Franchise.findFirst({
    where: { provider_id: owner_id },
    orderBy: { created_at: "asc" },
  });
};

const checkOwnerSubscription = async (owner_id) => {
  return ProviderSubscription.findFirst({
    where: {
      provider_id: owner_id,
      is_active: true,
      is_base_plan_active: true,
      end_date: {
        gt: new Date(),
      },
      subscription_plan: {
        is_base_plan: true,
      },
    },
  });
};

const upgradeUserToOwner = async (user, googleSub) => {
  const companyName = user.first_name && user.last_name
    ? `${user.first_name} ${user.last_name}'s Business`
    : user.first_name
      ? `${user.first_name}'s Business`
      : "My Business";

  const businessOwnerRole = await ensureBusinessOwnerRole();
  await User.update({
    where: { id: user.id },
    data: {
      user_type: "owner",
      google_sub: googleSub,
      auth_provider: "google",
      is_email_verified: true,
      profile_completed: false,
      role_id: businessOwnerRole.id,
    },
  });

  const owner = await Owner.create({
    data: {
      user_id: user.id,
      company_name: companyName,
      company_address: "To be completed",
      mode_of_service_offered: [],
    },
  });

  await Franchise.create({
    data: {
      provider_id: owner.id,
      name: "Main Branch",
      address: null,
      created_by_id: user.id,
      is_active: true,
      is_deleted: false,
    },
  });

  return User.findUnique({ where: { id: user.id } });
};

export {
  findUserByEmail,
  createCustomerFromGoogle,
  createOwnerFromGoogle,
  updateGoogleAuthForUser,
  getOwnerByUserId,
  getFranchiseByOwnerId,
  checkOwnerSubscription,
  upgradeUserToOwner,
};
