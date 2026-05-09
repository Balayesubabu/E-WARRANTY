import { Provider, SalesInvoice } from "../../../../prisma/db-models.js";

const getProviderByUserId = async (user_id) => {
  const provider = await Provider.findFirst({
    where: {
      user_id: user_id,
    },
  });
  return provider;
};

const getSalesInvoiceByDate = async (provider_id, franchise_id, start_date, end_date) => {
  const sales_invoice = await SalesInvoice.findMany({
    where: {
      invoice_type: {
        in: ["Sales", "Booking"],
      },
      provider_id: provider_id,
      franchise_id: franchise_id,
      created_at: {
        gte: new Date(start_date),
        lte: new Date(end_date),
      },
    },
    include: {
      provider: true,
      provider_customer: true,
      franchise: true,
      SalesPart: true,
      SalesService: true,
      SalesInvoiceTransactions: true,
      SalesPackage: true,
      SalesInvoiceParty: true,
      Transaction: true,
      SalesAdditionalCharges: true,
    },
  orderBy: {
    created_at: "desc",
  },
  });
  return sales_invoice;
};
const getInvoiceIdLinkedSalesInvoice = async (sales_invoice_id) => {
  const linkedSalesInvoices = await SalesInvoice.findFirst({
    where: {
      link_to: sales_invoice_id,
    },
  });
  return linkedSalesInvoices;
};

export { getProviderByUserId, getSalesInvoiceByDate,getInvoiceIdLinkedSalesInvoice };
