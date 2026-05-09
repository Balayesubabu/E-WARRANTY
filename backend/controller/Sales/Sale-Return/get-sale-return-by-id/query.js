import { Provider, SalesInvoice } from "../../../../prisma/db-models.js";

const getProviderByUserId = async (user_id) => {
  const provider = await Provider.findFirst({
    where: {
      user_id: user_id,
    },
  });
  return provider;
};

const getSaleReturnById = async (id) => {
  const sales_return = await SalesInvoice.findFirst({
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
  return sales_return;
};

const getInvoiceIdLinkedSalesInvoice = async (sales_invoice_id) => {
  const linkedInvoices = await SalesInvoice.findFirst({
    where: {
      link_to: sales_invoice_id,
    },
  });
  return linkedInvoices;
};

export { getProviderByUserId, getSaleReturnById,getInvoiceIdLinkedSalesInvoice };
