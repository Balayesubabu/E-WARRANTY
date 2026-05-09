import { Expenses, Provider, PurchaseInvoice, SalesInvoice} from "../../../prisma/db-models.js";

const getProviderByUserId = async (user_id) => {
  const provider = await Provider.findFirst({
    where: {
      user_id: user_id,
    },
  });
  return provider;
};

// const getAllTransactions = async (provider_id,franchise_id,startDate,endDate) => {
//   const whereClause = {
//     provider_id: provider_id,
//   };

//   if (startDate && endDate) {
//     whereClause.created_at = {
//       gte: new Date(startDate), // greater than or equal to startDate
//       lte: new Date(endDate),   // less than or equal to endDate
//     };
//   } else if (startDate) {
//     whereClause.created_at = {
//       gte: new Date(startDate),
//     };
//   } else if (endDate) {
//     whereClause.created_at = {
//       lte: new Date(endDate),
//     };
//   }
//   const transactions = await Transaction.findMany({
//     where: whereClause,
//     include: {
//       provider_customer: true,
//     },
//     orderBy: {
//       created_at: "desc",
//     },
//   });
//   return transactions;
// };

const getAllTransactions = async (provider_id,franchise_id,startDate,endDate) => {
  const whereClause = {
    provider_id: provider_id,
    franchise_id: franchise_id
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
  }
  else if (endDate) {
    whereClause.created_at = {
      lte: new Date(endDate),
    };
  }
  const salesInvoice = await SalesInvoice.findMany({
    where: whereClause,
    include: {
      provider_customer: true,
      SalesInvoiceTransactions:{
        where:{invoice_type:"Payment_In"}
      }
    },
    orderBy: {
      created_at: "desc",
    },
  });
  const purchaseInvoice = await PurchaseInvoice.findMany({
    where: whereClause,
    include: {
      provider_customer: true,
      PurchaseInvoiceTransactions:{
        where:{invoice_type:"Payment_Out"}
      }
    },
    orderBy: {
      created_at: "desc",
    },
  });
  const transactions = [...salesInvoice, ...purchaseInvoice];
  // Sort transactions by created_at in descending order
  // transactions.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  return transactions;
};

const getInvoiceIdLinkedSalesInvoice = async (sales_invoice_id) => {
  const linkedSalesInvoices = await SalesInvoice.findFirst({
    where: {
      link_to: sales_invoice_id,
    },
  });
  return linkedSalesInvoices;
};

const getInvoiceIdLinkedPurchaseInvoice = async (purchase_invoice_id) => {
  const linkedPurchaseInvoices = await PurchaseInvoice.findFirst({
    where: {
      link_to: purchase_invoice_id,
    },
  });
  return linkedPurchaseInvoices;
};

const getExpenses = async (provider_id,franchise_id,startDate,endDate) => {
  const whereClause = {
    provider_id: provider_id,
    franchise_id: franchise_id
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
  }
  else if (endDate) {
    whereClause.created_at = {
      lte: new Date(endDate),
    };
  }
  const expenses = await Expenses.findMany({
    where: whereClause,
    include: {
      expense_category: true,
    },
    orderBy: {
      created_at: "desc",
    },
  });
  expenses.forEach(expense => {
    expense.invoice_type = "Expense";
  });
  return expenses;
};

export { getProviderByUserId, getAllTransactions,getInvoiceIdLinkedSalesInvoice,getInvoiceIdLinkedPurchaseInvoice,getExpenses };
