import { BalanceSheet, Provider,Expenses,SalesInvoice,PurchaseInvoice, FranchiseInventory } from "../../../../../prisma/db-models.js";

const getProviderByUserId = async (user_id) => {
  const provider = await Provider.findFirst({
    where: {
      user_id: user_id,
    },
  });
  return provider;
};

const getProviderBalanceSheet = async (provider_id, franchise_id) => {
  const balance_sheet = await BalanceSheet.findMany({
    where: {
      provider_id: provider_id,
      franchise_id: franchise_id,
    },
    select: {
      id: true,
      type: true,
      name: true,
      amount: true,
    },
  });
  return balance_sheet;
};

const getSalesTotalTransactions = async (provider_id,franchise_id) => {
  const SalesTransactions = await SalesInvoice.findMany({
    where: {
        provider_id: provider_id,
        franchise_id: franchise_id,
        invoice_type: 'Sales'
    }
  });
  return SalesTransactions;
};
const getPurchaseTotalTransactions = async (provider_id,franchise_id) => {
  const PurchaseTransactions = await PurchaseInvoice.findMany({
    where: {
        provider_id: provider_id,
        franchise_id: franchise_id,
        invoice_type: 'Purchase'
    }
  });
  return PurchaseTransactions;
};

const getExpensesTotal = async (provider_id, franchise_id) => {
    const expenses = await Expenses.findMany({
        where: {
            provider_id: provider_id,
            franchise_id: franchise_id,
            is_deleted: false,
            is_active: true
        },
    });
    return expenses;
};

const getStockTotal = async (provider_id, franchise_id) => {
    const stockEntries = await FranchiseInventory.findMany({
        where: {
            provider_id: provider_id,
            franchise_id: franchise_id
        },
    });
    return stockEntries;
};

const getInvoiceIdLinkedPurchaseInvoice = async (purchase_invoice_id) => {
  const linkedInvoices = await PurchaseInvoice.findFirst({
    where: {
      link_to: purchase_invoice_id,
    },
  });
  return linkedInvoices;
};

export { getProviderByUserId, getProviderBalanceSheet,getSalesTotalTransactions,getPurchaseTotalTransactions,getExpensesTotal,getStockTotal,getInvoiceIdLinkedPurchaseInvoice };
