import { Provider, PurchaseInvoice, SalesInvoice, Transaction } from "../../../prisma/db-models.js";

const getProviderByUserId = async (user_id) => {
  const provider = await Provider.findFirst({
    where: {
      user_id: user_id,
    },
  });
  return provider;
};

const transactionsByInvoiceType = async (provider_id,franchise_id,startDate,endDate,invoice_type) => {
  const whereClause = {
    provider_id: provider_id,
    franchise_id: franchise_id,
    invoice_type:invoice_type
  };

  if (startDate && endDate) {
    whereClause.created_at = {
      gte: new Date(startDate), // greater than or equal to startDate
      lte: new Date(endDate),   // less than or equal to endDate
    };
  } else if (startDate) {
    whereClause.created_at = {
      gte: new Date(startDate),
    };
  } else if (endDate) {
    whereClause.created_at = {
      lte: new Date(endDate),
    };
  }
  let salesInvoices = [];
  whereClause.invoice_type = invoice_type;
  if(invoice_type === "Sales" || invoice_type === "Credit_Note"){
    salesInvoices = await SalesInvoice.findMany({
    where: whereClause,
    include: {
      provider_customer: true,
    },
    orderBy: {
      created_at: "desc", 
    },
  });
  return salesInvoices;
}
  let purchaseInvoices = [];
  if(invoice_type === "Purchase" || invoice_type === "Debit_Note"){
  purchaseInvoices = await PurchaseInvoice.findMany({
    where: whereClause,
    include: {
      provider_customer: true,
    },
    orderBy: {
      created_at: "desc", 
    },
  });
  return purchaseInvoices;
}
  const transactions = [...salesInvoices, ...purchaseInvoices];
  transactions.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  return transactions;
    
};

export { getProviderByUserId, transactionsByInvoiceType };
