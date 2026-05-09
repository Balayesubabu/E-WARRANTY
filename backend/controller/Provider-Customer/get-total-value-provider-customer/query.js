import { Provider, ProviderCustomers } from "../../../prisma/db-models.js";

const getProviderByUserId = async (user_id) => {
  const provider = await Provider.findFirst({
    where: {
      user_id: user_id,
    },
  });
  return provider;
};

const getProviderCustomersByProviderId = async (provider_id) => {
  const providerCustomers = await ProviderCustomers.findMany({
    where: {
      provider_id: provider_id,
    },
  });
  return providerCustomers;
};

export { getProviderByUserId, getProviderCustomersByProviderId };
