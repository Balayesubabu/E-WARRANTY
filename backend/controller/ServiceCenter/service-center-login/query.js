import { ServiceCenter, Franchise } from "../../../prisma/db-models.js";

const getServiceCenterByEmailOrPhone = async (email, phone) => {
  const conditions = [];
  if (email) conditions.push({ email: { equals: email, mode: "insensitive" } });
  if (phone) conditions.push({ phone: { equals: phone, mode: "insensitive" } });
  if (conditions.length === 0) return null;

  return ServiceCenter.findFirst({
    where: {
      OR: conditions,
      is_deleted: false,
      is_active: true,
    },
    include: { provider: true },
  });
};

const getFranchiseByProviderId = async (provider_id) => {
  return Franchise.findFirst({
    where: {
      provider_id,
      is_deleted: false,
      is_active: true,
    },
    orderBy: { created_at: "asc" },
  });
};

export { getServiceCenterByEmailOrPhone, getFranchiseByProviderId };
