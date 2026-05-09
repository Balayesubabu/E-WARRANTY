import { BalanceSheet, Provider } from "../../../../../prisma/db-models.js";

const getProviderByUserId = async (user_id) => {
    const provider = await Provider.findFirst({
        where: {
            user_id: user_id
        }
    })
    return provider;
}

const deleteBalanceSheetEntry = async (balance_sheet_entry_id) => {
    const balance_sheet_entry = await BalanceSheet.delete({
        where: {
            id: balance_sheet_entry_id
        }
    })
    return balance_sheet_entry;
}

export {
    getProviderByUserId,
    deleteBalanceSheetEntry
}