import { Provider, SalesInvoiceTransactions } from "../../../../prisma/db-models.js";

const getProviderByUserId = async (user_id) => {
    const provider = await Provider.findFirst({
        where: {
            user_id: user_id
        }
    });
    return provider;
};

const searchPaymentInQuery = async (search_query, provider_id) => {
    const payment_ins = await SalesInvoiceTransactions.findMany({
        where: {
            sales_invoice: {
                provider_id: provider_id,
                OR: [
                    {
                        provider_customer: {
                            customer_name: {
                                contains: search_query,
                                mode: 'insensitive'
                            }
                        }
                    },
                    {
                        provider_customer: {
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
        },
        include: {
            sales_invoice: {
                include: {
                    provider: true,
                    provider_customer: true
                }
            }
        }
    });

    return payment_ins;
};

export { getProviderByUserId, searchPaymentInQuery };