import { Provider, PurchaseInvoice } from "../../../../prisma/db-models.js";

const getProviderByUserId = async (user_id) => {
    const provider = await Provider.findFirst({
        where: {
            user_id: user_id
        }
    });
    return provider;
};

const searchPurchaseInvoiceQuery = async (search_query, provider_id, staff_id, franchise_id) => {
    const purchase_invoices = await PurchaseInvoice.findMany({
        where: {
            provider_id: provider_id,
            franchise_id: franchise_id,
            ...(staff_id ? { staff_id: staff_id } : {}),
            invoice_type: "Purchase",
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
            provider_customer: true,
            PurchasePart: true,
            PurchaseService: true,
            PurchaseAdditionalCharges: true,
            PurchaseInvoiceParty: true,
            provider: true,
            PurchaseInvoiceTransactions: true,
            Transaction: true,
            PurchaseAdditionalCharges: true
        }
    });

    return purchase_invoices;
};

export { getProviderByUserId, searchPurchaseInvoiceQuery };