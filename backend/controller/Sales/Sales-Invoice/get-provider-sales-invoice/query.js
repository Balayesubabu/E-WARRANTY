import { Provider, SalesInvoice } from "../../../../prisma/db-models.js";

const getProviderByUserId = async (user_id) => {
  const provider = await Provider.findFirst({
    where: {
      user_id: user_id,
    },
  });

  return provider;
};

const getProviderSalesInvoice = async (provider_id, franchise_id) => {
  const providerSalesInvoice = await SalesInvoice.findMany({
      where: {
      invoice_type: {
        in: ["Sales", "Booking"],
      },
      provider_id: provider_id,
      franchise_id: franchise_id,
    },
    include: {
      // provider: true,
      // provider: {
      //   include: {
      //     ProviderBankDetails: true,
      //   },
      // },
      provider: true,
      ProviderBank: true,
      provider_customer: true,
      franchise: true,
      SalesPart: true,
      SalesService: true,
      SalesInvoiceTransactions: true,
      SalesPackage: true,
      SalesInvoiceParty: true,
      Transaction: true,
      SalesAdditionalCharges: true,
      //ProviderBankDetails: true,
    },
    orderBy: {
      created_at: "desc",
    },
  });

  return providerSalesInvoice;
};

const getInvoiceIdLinkedSalesInvoice = async (sales_invoice_id) => {
  const linkedSalesInvoices = await SalesInvoice.findFirst({
    where: {
      link_to: sales_invoice_id,
    },
  });
  return linkedSalesInvoices;
};

export { getProviderByUserId, getProviderSalesInvoice, getInvoiceIdLinkedSalesInvoice };
