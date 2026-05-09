import { Provider, SalesInvoice } from "../../../../prisma/db-models.js";

const getProviderByUserId = async (user_id) => {
    const provider = await Provider.findFirst({
        where: {
            user_id: user_id
        }
    })
    return provider;
}

const getCreditNoteById = async (credit_note_id, provider_id) => {
    const credit_note = await SalesInvoice.findFirst({
        where: {
            id: credit_note_id,
            provider_id: provider_id,
            invoice_type: "Credit_Note"
        },
        include: {
            provider: true,
            SalesPart: true,
            SalesService: true,
            SalesInvoiceParty: true,
            provider_customer: true,
            SalesInvoiceTransactions: true,
            Transaction: true,
            SalesAdditionalCharges: true,
            ProviderBank: true,
        }
    })
    return credit_note;
}
export { getProviderByUserId, getCreditNoteById };