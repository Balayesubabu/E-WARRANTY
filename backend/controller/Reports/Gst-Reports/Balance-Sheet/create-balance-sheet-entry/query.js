import { BalanceSheet, Provider } from "../../../../../prisma/db-models.js";

const getProviderByUserId = async (user_id) => {
  const provider = await Provider.findFirst({
    where: {
      user_id: user_id,
    },
  });
  return provider;
};

const createBalanceSheetEntry = async (provider_id, franchise_id,type, name, amount) => {
  const balance_sheet_entry = await BalanceSheet.create({
    data: {
      provider_id: provider_id,
      franchise_id: franchise_id,
      type: type,
      name: name,
      amount: amount,
    },
  });
  return balance_sheet_entry;
};

export { getProviderByUserId, createBalanceSheetEntry };
