import { Provider, SalesInvoice } from "../../../../prisma/db-models.js";

const getProviderByUserId = async (user_id) => {
  const provider = await Provider.findFirst({
    where: {
      user_id: user_id,
    },
  });
  return provider;
};

const getProviderSalesInvoiceByCustomer = async (
  provider_id,
  franchise_id,
  provider_customer_id
) => {
  const providerSalesInvoice = await SalesInvoice.findMany({
    where: {
      invoice_type: {
        in: ["Sales", "Booking"],
      },
      invoice_payment_status:{
        notIn: ["Paid"]
      },
      provider_id: provider_id,
      franchise_id: franchise_id,
      provider_customer_id: provider_customer_id
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
      created_at: "asc",
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

export { getProviderByUserId, getProviderSalesInvoiceByCustomer, getInvoiceIdLinkedSalesInvoice};