import { Provider, SalesInvoice } from "../../../../prisma/db-models.js";

const getProviderByUserId = async (user_id) => {
    const provider = await Provider.findFirst({
        where: {
            user_id: user_id
        }
    });
    return provider;
};

const searchQuotationQuery = async (search_query, provider_id) => {
    const quotations = await SalesInvoice.findMany({
        where: {
            provider_id: provider_id,
            invoice_type: "Quotation",
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
        },
        include: {
            SalesPart: true,
            SalesService: true,
            SalesInvoiceParty: true,
            provider_customer: true,
            provider: true,
            SalesInvoiceTransactions: true,
            Transaction: true,
            SalesAdditionalCharges: true
        }
    });

    return quotations;
};

export { getProviderByUserId, searchQuotationQuery };