import { Provider, SalesInvoice } from "../../../../prisma/db-models.js";

const getProviderByUserId = async (user_id) => {
  const provider = await Provider.findFirst({
    where: { user_id: user_id },
  });
  return provider;
};

const getProviderQuotation = async (provider_id) => {
  const providerQuotation = await SalesInvoice.findMany({
    where: {
      provider_id: provider_id,
      invoice_type: "Quotation",
    },
    include: {
      SalesPart: true,
      SalesService: true,
      SalesInvoiceParty: true,
      provider_customer: true,
      provider: true,
      SalesInvoiceTransactions: true,
      Transaction: true,
    },
    orderBy: {
      created_at: "desc",
    },
  });

  return providerQuotation;
};

export { getProviderByUserId, getProviderQuotation };
