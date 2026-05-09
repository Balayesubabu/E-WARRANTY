import { Provider, SalesInvoice } from "../../../../prisma/db-models.js";

const getProviderByUserId = async (user_id) => {
    const provider = await Provider.findFirst({
        where: {
            user_id: user_id
        }
    });
    return provider;
}

const getTDSReceivableByProviderId = async (provider_id,franchise_id, start_date, end_date) => {
    const tds_receivable = await SalesInvoice.findMany({
        where: {
            provider_id: provider_id,
            franchise_id: franchise_id,
            invoice_date: {
                gte: new Date(start_date),
                lte: new Date(end_date)
            },
            is_deleted: false,
             invoice_tds_amount: { gt: 0 },
    invoice_type: {
        in: ["Sales", "Credit_Note"]
    }
        },
        include: {
            provider_customer: {
                select: {
                    customer_name: true,
                    customer_gstin_number: true,
                    customer_pan_number: true
                }
            },
            SalesInvoiceTransactions: true
        }
    });
    return tds_receivable;
}

export { getProviderByUserId, getTDSReceivableByProviderId };