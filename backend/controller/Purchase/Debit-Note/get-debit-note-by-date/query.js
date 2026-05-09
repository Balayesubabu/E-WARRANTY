import { Provider, PurchaseInvoice } from "../../../../prisma/db-models.js";

const getProviderByUserId = async (user_id) => {
    const provider = await Provider.findFirst({
        where: {
            user_id: user_id,
            is_deleted: false
        }
    })
    return provider;
}

const getDebitNotesByDate = async (provider_id, franchise_id, staff_id, startDate, endDate) => {
    const debitNotes = await PurchaseInvoice.findMany({
        where: {
            provider_id: provider_id,
            invoice_type: "Debit_Note",
            franchise_id: franchise_id,
            ...(staff_id ? { staff_id: staff_id } : {}),
            is_deleted: false,
            invoice_date: {
                gte: startDate,
                lte: endDate
            }
        },
        include: {
            provider: true,
            provider:{
                include:{user:true}
            },
            provider_customer: true,
            franchise: true,
            staff: true,
            PurchaseInvoiceParty: true,
            PurchasePart: {
                include: {
                    franchise_inventory: true
                }
            },
            PurchaseService: {
                include: {
                    franchise_service: true
                }
            },
            PurchaseInvoiceTransactions: true,
            Transaction: true,
            PurchaseAdditionalCharges: true
        },
        orderBy: {
            invoice_date: 'desc'
        }
    });
    return debitNotes;
}

export { getProviderByUserId, getDebitNotesByDate };
