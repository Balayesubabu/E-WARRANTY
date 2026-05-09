import { Provider, ProviderCustomers } from "../../../prisma/db-models.js";

const getProviderByUserId = async (user_id) => {
  const provider = await Provider.findFirst({
    where: {
      user_id: user_id,
    },
  });
  return provider;
};

const searchCustomers = async (provider_id, searchText) => {
  const customers = await ProviderCustomers.findMany({
    where: {
      provider_id: provider_id,
      OR: [
        {
          customer_name: {
            contains: searchText,
            mode: "insensitive", // case insensitive
          },
        },
        {
          customer_phone: {
            contains: searchText,
          },
        },
      ],
    },
    orderBy: {
      customer_name: "asc",
    },
  });
  return customers;
};

export { getProviderByUserId, searchCustomers };
