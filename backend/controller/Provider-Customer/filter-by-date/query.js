import { Provider, ProviderCustomers } from "../../../prisma/db-models.js";

const getProviderByUserId = async (user_id) => {
  return await Provider.findFirst({
    where: { user_id },
  });
};

const getProviderCustomersByProviderId = async (provider_id) => {
  return await ProviderCustomers.findMany({
    where: { provider_id },
  });
};

const getProviderCustomersByDate = async (
  provider_id,
  start_date,
  end_date
) => {
  return await ProviderCustomers.findMany({
    where: {
      provider_id,
      created_at: {
        gte: new Date(start_date),
        lte: new Date(end_date),
      },
    },
  });
};

export {
  getProviderByUserId,
  getProviderCustomersByProviderId,
  getProviderCustomersByDate,
};
