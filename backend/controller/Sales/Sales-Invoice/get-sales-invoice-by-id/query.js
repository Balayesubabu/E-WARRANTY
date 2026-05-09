import { Provider, SalesInvoice } from "../../../../prisma/db-models.js";

const getProviderByUserId = async (user_id) => {
  const provider = await Provider.findFirst({
    where: {
      user_id: user_id,
    },
  });

  return provider;
};

const getSalesInvoiceById = async (sales_invoice_id) => {
  const salesInvoice = await SalesInvoice.findFirst({
    where: {
      id: sales_invoice_id,
    },
    include: {
      provider: true,
      provider:{
        include:{user:true}
      },
            
      provider_customer: true,
      franchise: true,
      SalesPart: true,
      SalesService: true,
      SalesInvoiceTransactions: true,
      SalesPackage: true,
      SalesInvoiceParty: true,
      Transaction: true,
      SalesAdditionalCharges: true,      
      // ProviderBankDetails: true,
      ProviderBank: true,
    },
  });

  return salesInvoice;
};

export { getProviderByUserId, getSalesInvoiceById };
