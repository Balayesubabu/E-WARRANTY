import { Provider, ProviderCustomers } from "../../../prisma/db-models.js";

const getProviderByUserId = async (user_id) => {
  const provider = await Provider.findFirst({
    where: {
      user_id: user_id,
    },
  });
  return provider;
};

const getCustomerByPhone = async (provider_id, phone) => {
  const customer = await ProviderCustomers.findMany({
    where: {
      provider_id: provider_id,
      customer_phone: {
        contains: phone,
      },
    },
    orderBy: {
      customer_phone: "asc",
    },
  });
  return customer;
};

export { getProviderByUserId, getCustomerByPhone };
