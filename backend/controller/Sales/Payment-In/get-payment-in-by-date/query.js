import { Provider, SalesInvoiceTransactions } from "../../../../prisma/db-models.js";

const getProviderByUserId = async (user_id) => {
    const provider = await Provider.findFirst({
        where: {
            user_id: user_id
        }
    });
    return provider;
};

const getPaymentInByDateQuery = async (start_date, end_date, provider_id, franchise_id) => {
    const payment_ins = await SalesInvoiceTransactions.findMany({
        where: {
            isActive: true,
            invoice_type: 'Payment_In',
            sales_invoice: {
                provider_id: provider_id,
                franchise_id: franchise_id
            },
            created_at: {
                gte: new Date(start_date),
                lte: new Date(end_date)
            }
        },
        include: {
            sales_invoice: {
                include: {
                    provider: true,
                    provider_customer: true
                }
            }
        },
    orderBy: {
      created_at: "desc",
    },
    });

    return payment_ins;
};

export { getProviderByUserId, getPaymentInByDateQuery };