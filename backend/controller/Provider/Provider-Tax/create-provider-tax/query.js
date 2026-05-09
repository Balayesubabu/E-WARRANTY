import { Provider, ProviderTax } from "../../../../prisma/db-models.js";

const getProviderByUserId = async (user_id) => {
  const provider = await Provider.findFirst({
    where: {
      user_id: user_id,
    },
  });
  return provider;
};

const createProviderTax = async (provider_id, data) => {
  const providerTax = await ProviderTax.create({
    data: {
      provider_id: provider_id,
      tax_type: data.tax_type,
      tax_percentage: data.tax_percentage,
      tax_name: data.tax_name,
    },
  });
  return providerTax;
};

export { getProviderByUserId, createProviderTax };
