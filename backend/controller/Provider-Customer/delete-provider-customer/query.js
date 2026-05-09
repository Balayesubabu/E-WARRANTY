import {
  Provider,
  ProviderCustomers,
  ProviderCustomerVehicle,
} from "../../../prisma/db-models.js";

// ✅ Get Provider by user id
const getProviderByUserId = async (user_id) => {
  const provider = await Provider.findFirst({
    where: { user_id },
  });
  return provider;
};

// ✅ Get single customer by provider id and customer id
const getCustomerById = async (customer_id, provider_id) => {
  const customer = await ProviderCustomers.findFirst({
    where: { id: customer_id, provider_id },
  });
  return customer;
};

// ✅ Delete customer safely (first delete vehicles, then customer)
const deleteProviderCustomer = async (customer_id, provider_id) => {
  // 1. Delete all related vehicles first to avoid FK constraint error
  await ProviderCustomerVehicle.deleteMany({
    where: { provider_customer_id: customer_id },
  });

  // 2. Now delete the customer
  const deletedCustomer = await ProviderCustomers.delete({
    where: { id: customer_id },
  });

  return deletedCustomer;
};

export { getProviderByUserId, getCustomerById, deleteProviderCustomer };
