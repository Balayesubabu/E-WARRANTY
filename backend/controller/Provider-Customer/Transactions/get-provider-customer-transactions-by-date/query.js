import { Provider, ProviderCustomers, Transaction } from "../../../../prisma/db-models.js";

const getProviderByUserId = async (user_id) => {
    const provider = await Provider.findFirst({
        where: {
            user_id: user_id
        }
    });
    return provider;
}

const getProviderCustomerById = async (provider_customer_id, provider_id) => {
    const provider_customer = await ProviderCustomers.findFirst({
        where: {
            id: provider_customer_id,
            provider_id: provider_id
        }
    });
    return provider_customer;
}

const getProviderCustomerTransactionsByDate = async (provider_customer_id, provider_id, start_date, end_date) => {
    const startDateTime = new Date(start_date);
    const endDateTime = new Date(end_date);
    const transactions = await Transaction.findMany({
        where: {
            provider_customer_id: provider_customer_id,
            provider_id: provider_id,
            created_at: {
                gte: startDateTime,
                lte: endDateTime
            }
        },
        include: {
      sales_invoice: true,
      purchase_invoice: true,
    },
        orderBy: {
            created_at: "desc"
        }
    })
    return transactions;
}

export { getProviderByUserId, getProviderCustomerById, getProviderCustomerTransactionsByDate };