import { Provider, PurchaseInvoiceTransactions } from "../../../../prisma/db-models.js";

const getProviderByUserId = async (user_id) => {
    const provider = await Provider.findFirst({
        where: {
            user_id: user_id
        }
    });
    return provider;
};

const searchPaymentOutQuery = async (search_query, provider_id, franchise_id) => {
    const payment_outs = await PurchaseInvoiceTransactions.findMany({
        where: {
            OR: [
                {
                    purchase_invoice: {
                        provider_id: provider_id,
                        franchise_id: franchise_id,
                        OR: [
                            {
                                provider_customer: {
                                    customer_name: {
                                        contains: search_query,
                                        mode: 'insensitive'
                                    },
                                    customer_phone: {
                                        contains: search_query,
                                        mode: 'insensitive'
                                    }
                                }
                            },
                            {
                                invoice_number: {
                                    contains: search_query,
                                    mode: 'insensitive'
                                }
                            }
                        ]
                    }
                }
            ]
        },
        include: {
            purchase_invoice: {
                include: {
                    provider: true
                }
            }
        }
    });

    return payment_outs;
};

export { getProviderByUserId, searchPaymentOutQuery };