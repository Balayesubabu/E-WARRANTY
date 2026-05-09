import { Provider, Transaction, SalesInvoice, PurchaseInvoice } from "../../../prisma/db-models.js";

const getProviderByUserId = async (user_id) => {
  const provider = await Provider.findFirst({
    where: {
      user_id: user_id,
    },
  });
  return provider;
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
}

export { getProviderByUserId, getSalesTotalTransactions,getPurchaseTotalTransactions };
