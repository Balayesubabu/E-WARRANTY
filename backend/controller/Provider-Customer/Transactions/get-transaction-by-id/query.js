import { Provider, Transaction } from "../../../../prisma/db-models.js";

const getProviderByUserId = async (user_id) => {
    const provider = await Provider.findFirst({
        where: {
            user_id: user_id
        }
    });
    return provider;
}

const getTransactionById = async (transaction_id, provider_id) => {
    const transaction = await Transaction.findFirst({
        where: {
            id: transaction_id,
            provider_id: provider_id
        }
    });
    return transaction;
}
export { getProviderByUserId, getTransactionById };