import { Provider, SalesInvoice } from "../../../../prisma/db-models.js";

const getProviderByUserId = async (user_id) => {
    const provider = await Provider.findFirst({
        where: {
            user_id: user_id
        }
    });
    return provider;
}

const getProformaInvoiceById = async (id) => {
    const proformaInvoice = await SalesInvoice.findFirst({
        where: {
            id: id,
            invoice_type: "Proforma_Invoice"
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
    });
    return proformaInvoice;
}

export { getProviderByUserId, getProformaInvoiceById };