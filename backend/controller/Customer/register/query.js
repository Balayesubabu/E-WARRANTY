import { prisma, User } from "../../../prisma/db-models.js";
import { ensureCustomerRole } from "../../../utils/resolveCanonicalRole.js";

const getCustomerByEmailOrPhoneNumber = async (email, phone_number) => {
  const conditions = [];
  if (email && String(email).trim()) {
    conditions.push({ email: { equals: String(email).trim(), mode: "insensitive" } });
  }
  if (phone_number) conditions.push({ phone_number: phone_number });
  if (conditions.length === 0) return null;

  const user = await User.findFirst({
    where: {
      OR: conditions,
      is_deleted: false,
    },
  });
  return user;
};

const createCustomer = async (data) => {
  return prisma.$transaction(async (tx) => {
    const userData = {
      first_name: data.first_name,
      last_name: data.last_name,
      password: data.password,
      email: data.email,
      country_code: data.country_code || "+91",
      phone_number: data.phone_number,
      user_type: "customer",
    };

    const role = await ensureCustomerRole(tx);

    const user = await tx.user.create({
      data: {
        ...userData,
        role_id: role.id,
      },
    });

    await tx.userRole.create({
      data: {
        user_id: user.id,
        role_id: role.id,
      },
    });

    return user;
  });
};

export { getCustomerByEmailOrPhoneNumber, createCustomer };
