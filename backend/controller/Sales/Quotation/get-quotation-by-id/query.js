import { Provider, SalesInvoice } from "../../../../prisma/db-models.js";

const getProviderByUserId = async (user_id) => {
  const provider = await Provider.findFirst({
    where: {
      user_id: user_id,
    },
  });
  return provider;
};

const getQuotationById = async (id) => {
  const quotation = await SalesInvoice.findFirst({
    where: {
      id: id,
    },
    include: {
      SalesPart: true,
      SalesService: true,
      SalesInvoiceParty: true,
      provider_customer: true,
      provider: true,
      SalesInvoiceTransactions: true,
      Transaction: true,
      SalesAdditionalCharges: true,
      ProviderBank: true,
    },
  });
  return quotation;
};

export { getProviderByUserId, getQuotationById };
