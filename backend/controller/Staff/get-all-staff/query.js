import { Provider, Staff } from "../../../prisma/db-models.js";

const getProviderByUserId = async (user_id) => {
  const provider = await Provider.findFirst({
    where: {
      user_id: user_id,
    },
  });
  return provider;
};

const getAllStaffByProviderId = async (provider_id,franchise_id) => {
  const staff = await Staff.findMany({
    where: {
      provider_id: provider_id,
      franchise_id: franchise_id
    },
    include: {
      provider: true,
      franchise: true,
    },
  });
  return staff;
};

export { getProviderByUserId, getAllStaffByProviderId };
