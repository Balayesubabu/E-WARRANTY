import { Provider, PurchaseInvoice } from "../../../../prisma/db-models.js";

const getProviderByUserId = async (user_id) => {
    const provider = await Provider.findFirst({
        where: {
            user_id: user_id
        }
    });
    return provider;
}

// const getTDSPayableByProviderId = async (provider_id, start_date, end_date) => {
//     const tds_payable = await PurchaseInvoice.findMany({
//         where: {
//             provider_id: provider_id,
//             invoice_date: {
//                 gte: new Date(start_date),
//                 lte: new Date(end_date)
//             },
//             is_deleted: false,
//             invoice_type: "Purchase"
//         },
//         include: {
//             provider_customer: {
//                 select: {
//                     customer_name: true,
//                     customer_gstin_number: true,
//                     customer_pan_number: true
//                 }
//             },
//             PurchaseInvoiceTransactions: true
//         }
//     });
//     return tds_payable;
// }

const getTDSPayableByProviderId = async (provider_id,franchise_id, start_date, end_date) => {
    const tds_payable = await PurchaseInvoice.findMany({
        where: {
            provider_id: provider_id,
            franchise_id: franchise_id,
            created_at: {
                gte: new Date(start_date),
                lte: new Date(end_date)
            },
            is_deleted: false,
            invoice_tds_amount : {
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
    return tds_payable;
}

export { getProviderByUserId, getTDSPayableByProviderId };