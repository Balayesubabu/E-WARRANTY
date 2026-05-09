import { Provider, Transaction } from "../../../prisma/db-models.js";

const getProviderByUserId = async (user_id) => {
    const provider = await Provider.findFirst({
        where: {
            user_id: user_id
        }
    });
    return provider;
}

const getTransactionsByType = async (provider_id, type) => {
    const transactions = await Transaction.findMany({
        where: {
            provider_id: provider_id,
            transaction_type: type
        }
    });
    return transactions;
}
export { getProviderByUserId, getTransactionsByType };