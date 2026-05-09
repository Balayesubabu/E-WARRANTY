import { Provider, SalesInvoice } from "../../../../prisma/db-models.js";

const getProviderByUserId = async (user_id) => {
  const provider = await Provider.findFirst({
    where: { user_id: user_id },
  });
  return provider;
};

const getProviderSalesReturn = async (provider_id, franchise_id) => {
  const sales_return = await SalesInvoice.findMany({
    where: {
      provider_id: provider_id,
      franchise_id: franchise_id,
      invoice_type: "Sales_Return",
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

  return sales_return;
};

const getProviderSalesInvoiceById = async (sales_invoice_id) => {
  const salesInvoice = await SalesInvoice.findFirst({
    where: {
      id: sales_invoice_id,
    },
  });
  return salesInvoice;
}

export { getProviderByUserId, getProviderSalesReturn, getProviderSalesInvoiceById};
