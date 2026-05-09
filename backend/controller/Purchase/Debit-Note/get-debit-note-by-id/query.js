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

const getDebitNoteById = async (debit_note_id, provider_id, franchise_id) => {
    const debitNote = await PurchaseInvoice.findFirst({
        where: {
            id: debit_note_id,
             provider_id: provider_id,
            franchise_id: franchise_id,
            invoice_type: "Debit_Note",
            is_deleted: false
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
        }
    });
    return debitNote;
}

export { getProviderByUserId, getDebitNoteById };