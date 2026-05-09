import { Provider, SalesInvoice } from "../../../../prisma/db-models.js";

/**
 * Fetch provider details by user_id
 * @param {string} user_id
 * @returns {Promise<Provider|null>}
 */
const getProviderByUserId = async (user_id) => {
  return await Provider.findFirst({
    where: { user_id },
  });
};

/**
 * Fetch all sales invoices for a given provider
 * @param {string} provider_id
 * @returns {Promise<SalesInvoice[]>}
 */
const getProviderSalesInvoice = async (provider_id) => {
  return await SalesInvoice.findMany({
    where: {
      invoice_type: "Sales",
      provider_id,
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
  });
};

export { getProviderByUserId, getProviderSalesInvoice };
