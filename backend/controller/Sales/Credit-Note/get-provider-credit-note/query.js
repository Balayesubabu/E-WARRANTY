import { Provider, SalesInvoice } from "../../../../prisma/db-models.js";

const getProviderByUserId = async (user_id) => {
  const provider = await Provider.findFirst({
    where: { user_id: user_id },
  });
  return provider;
};

const getProviderCreditNote = async (provider_id, franchise_id) => {
  const credit_notes = await SalesInvoice.findMany({
    where: {
      provider_id: provider_id,
      franchise_id: franchise_id,
      invoice_type: "Credit_Note",
    },
    include: {
      provider: true,
      provider_customer: true,
      SalesInvoiceParty: true,
      SalesPart: true,
      SalesService: true,
      SalesInvoiceTransactions: true,
      Transaction: true,
    },
    orderBy: {
      created_at: "desc",
    },
  });

  return credit_notes;
};

const getProviderSalesInvoiceById = async (sales_invoice_id) => {
  const salesInvoice = await SalesInvoice.findFirst({
    where: {
      id: sales_invoice_id,
    },
  });
  return salesInvoice;
};

export { getProviderByUserId, getProviderCreditNote,getProviderSalesInvoiceById };
