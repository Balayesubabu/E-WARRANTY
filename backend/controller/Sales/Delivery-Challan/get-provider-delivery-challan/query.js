import { Provider, SalesInvoice } from "../../../../prisma/db-models.js";

const getProviderByUserId = async (user_id) => {
  const provider = await Provider.findFirst({
    where: { user_id: user_id },
  });
  return provider;
};

const getProviderDeliveryChallan = async (provider_id) => {
  const deliveryChallan = await SalesInvoice.findMany({
    where: {
      provider_id: provider_id,
      invoice_type: "Delivery_Challan",
    },
    include: {
      provider: true,
      SalesPart: true,
      SalesService: true,
      SalesInvoiceParty: true,
      provider_customer: true,
      SalesInvoiceTransactions: true,
      Transaction: true,
    },
    orderBy: {
      created_at: "desc",
    },
  });

  return deliveryChallan;
};

export { getProviderByUserId, getProviderDeliveryChallan };
