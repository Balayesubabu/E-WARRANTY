import {
  Provider,
  ProviderCustomers,
  Transaction,
} from "../../../../prisma/db-models.js";

const getProviderByUserId = async (user_id) => {
  const provider = await Provider.findFirst({
    where: {
      user_id: user_id,
    },
  });
  return provider;
};

const getProviderCustomerById = async (provider_customer_id, provider_id) => {
  const provider_customer = await ProviderCustomers.findFirst({
    where: {
      id: provider_customer_id,
      provider_id: provider_id,
    },
  });
  return provider_customer;
};

const getProviderCustomerTransactions = async (
  provider_customer_id,
  provider_id
) => {
  const transactions = await Transaction.findMany({
    where: {
      provider_customer_id: provider_customer_id,
      provider_id: provider_id,
    },
    include: {
      sales_invoice: true,
      purchase_invoice: true,
    },
    // select: {
    //   sales_invoice: {
    //     select: {
    //       invoice_payment_status: true,
    //     },
    //   },
    //   purchase_invoice: {
    //     select: {
    //       invoice_payment_status: true,
    //     },
    //   },
    // },
    orderBy: {
      created_at: "desc",
    },
  });
  return transactions;
};

export {
  getProviderByUserId,
  getProviderCustomerById,
  getProviderCustomerTransactions,
};
