import { PurchaseInvoiceTransactions, Provider } from "../../../../prisma/db-models.js";

const getProviderByUserId = async (user_id) => {
    const provider = await Provider.findFirst({
        where: {
            user_id: user_id
        }
    });
    return provider;
};

const getPaymentOutByDateQuery = async (start_date, end_date, provider_id, franchise_id) => {
    const payment_outs = await PurchaseInvoiceTransactions.findMany({
        where: {
            isActive: true,
            invoice_type: 'Payment_Out',
            purchase_invoice: {
                provider_id: provider_id,
                franchise_id: franchise_id
            },
            created_at: {
                gte: start_date,
                lte: end_date
            }
        },
        include: {
            purchase_invoice: {
                include: {
                    provider: true
                }
            }
        },
    orderBy: {
        created_at: "desc",
    }
    });
    return payment_outs;
};

export { getProviderByUserId, getPaymentOutByDateQuery };