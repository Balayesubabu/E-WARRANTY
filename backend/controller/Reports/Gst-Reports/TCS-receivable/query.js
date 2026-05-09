import { Provider, SalesInvoice, PurchaseInvoice } from "../../../../prisma/db-models.js";

const getProviderByUserId = async (user_id) => {
    const provider = await Provider.findFirst({
        where: {
            user_id: user_id
        }
    });
    return provider;
}

// const getTCSReceivableByProviderId = async (provider_id, start_date, end_date) => {
//     const tcs_receivable = await SalesInvoice.findMany({
//         where: {
//             provider_id: provider_id,
//             invoice_date: {
//                 gte: new Date(start_date),
//                 lte: new Date(end_date)
//             },
//             is_deleted: false,
//             invoice_type: "Sales"
//         },
//         include: {
//             provider_customer: {
//                 select: {
//                     customer_name: true,
//                     customer_gstin_number: true,
//                     customer_pan_number: true
//                 }
//             },
//             SalesInvoiceTransactions: true
//         }
//     });
//     return tcs_receivable;
// }

const getTCSReceivableByProviderId = async (provider_id,franchise_id, start_date, end_date) => {
    const tcs_receivable = await PurchaseInvoice.findMany({
        where: {
            provider_id: provider_id,
            franchise_id: franchise_id,
            created_at: {
                gte: new Date(start_date),
                lte: new Date(end_date)
            },
            is_deleted: false,
            invoice_tcs_amount : {
                gt : 0
            },
            invoice_type: {
                in: ["Purchase", "Debit_Note"]
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
            PurchaseInvoiceTransactions: true
        }
    });
    return tcs_receivable;
}

export { getProviderByUserId, getTCSReceivableByProviderId };
