import { Provider, SalesInvoice } from "../../../../prisma/db-models.js";

const getProviderByUserId = async (user_id) => {
  const provider = await Provider.findFirst({
    where: {
      user_id: user_id,
    },
  });
  return provider;
};

const getProviderProformaInvoice = async (provider_id) => {
  const proformaInvoice = await SalesInvoice.findMany({
    where: {
      provider_id: provider_id,
      invoice_type: "Proforma_Invoice",
    },
    include: {
      provider: true,
      provider_customer: true,
      SalesPart: true,
      SalesService: true,
      SalesInvoiceParty: true,
      SalesInvoiceTransactions: true,
      Transaction: true,
      SalesAdditionalCharges: true,
    },
    orderBy: {
      created_at: "desc",
    },
  });
  return proformaInvoice;
};

export { getProviderByUserId, getProviderProformaInvoice };
