import { Provider, Transaction } from "../../../../prisma/db-models.js";

const getProviderByUserId = async (user_id) => {
    const provider = await Provider.findFirst({
        where: {
            user_id: user_id
        }
    });
    return provider;
}

const getInvoiceDataByTransactionId = async (transaction_id, provider_id) => {
    const invoice_data = await Transaction.findFirst({
        where: {
            id: transaction_id,
            provider_id: provider_id
        },
        include: {
      sales_invoice: true,
      purchase_invoice: true,
    },
    });
    return invoice_data;
}
export { getProviderByUserId, getInvoiceDataByTransactionId };