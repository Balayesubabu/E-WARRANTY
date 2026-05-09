import { BalanceSheet, Provider } from "../../../../../prisma/db-models.js";

const getProviderByUserId = async (user_id) => {
    const provider = await Provider.findFirst({
        where: {
            user_id: user_id
        }
    })
    return provider;
}

const updateBalanceSheetEntry = async (balance_sheet_entry_id, name, amount, date) => {
    const balance_sheet_entry = await BalanceSheet.update({
        where: {
            id: balance_sheet_entry_id
        },
        data: {
            name: name,
            amount: amount,
            created_at: date,
            updated_at: new Date()
        }
    })
    return balance_sheet_entry;
};
const checkBalanceSheetEntry = async (balance_sheet_entry_id) => {
    const balance_sheet_entry = await BalanceSheet.findFirst({
        where: {
            id: balance_sheet_entry_id
        }
    });
    return balance_sheet_entry;
};

export {
    getProviderByUserId,
    updateBalanceSheetEntry,
    checkBalanceSheetEntry
}