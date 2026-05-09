// query.js
import { BalanceSheet, Provider } from "../../../../../prisma/db-models.js";

const getProviderByUserId = async (user_id) => {
  const provider = await Provider.findFirst({
    where: {
      user_id: user_id,
    },
  });
  return provider;
};

const createBalanceSheetEntry = async (provider_id, type, name, amount) => {
  const balance_sheet_entry = await BalanceSheet.create({
    data: {
      provider_id: provider_id,
      type: type,
      name: name,
      amount: amount,
    },
  });
  return balance_sheet_entry;
};

// ✅ Function to get total liabilities
const getProviderTotalLiabilities = async (provider_id, franchise_id) => {
  const liabilities = await BalanceSheet.findMany({
    where: {
      provider_id: provider_id,
      franchise_id: franchise_id,
      type: {
        in: ["Capital", "Tax_Payable", "Loans"],
      },
    },
    select: {
      amount: true,
    },
  });

  // Sum up all amounts
  const total = liabilities.reduce((sum, entry) => sum + entry.amount, 0);

  return Number(total.toFixed(2));
};

export {
  getProviderByUserId,
  createBalanceSheetEntry,
  getProviderTotalLiabilities,
};
