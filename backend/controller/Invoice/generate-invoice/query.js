import { Provider, SalesInvoice, PurchaseInvoice } from "../../../prisma/db-models.js"

const getProviderByUserId = async (user_id) => {
    const provider = await Provider.findFirst({
        where: {
            user_id: user_id
        }
    })
    return provider;
}

const getInvoiceById = async (invoice_id) => {
    const sales_invoice = await SalesInvoice.findFirst({
        where: {
            id: invoice_id
        },
        include: {
            provider: true,
            provider_customer: true,
            franchise: true,
            staff: true,
            SalesPart: {
                include: {
                    franchise_inventory: true
                }
            },
            SalesService: {
                include: {
                    franchise_service: true
                }
            },
            SalesInvoiceTransactions: true,
            SalesCustomerVehicle: true,
            SalesPackage: true,
            SalesInvoiceParty: true,
            Transaction: true,
            SalesAdditionalCharges: true,
        }
    })

    const purchase_invoice = await PurchaseInvoice.findFirst({
        where: {
            id: invoice_id
        },
        include: {
            provider: true,
            provider_customer: true,
            franchise: true,
            staff: true,
            PurchasePart: true,
            PurchaseService: true,
            PurchaseInvoiceTransactions: true,
            PurchaseCustomerVehicle: true,
            PurchasePackage: true,
            PurchaseInvoiceParty: true,
            Transaction: true,
            PurchaseAdditionalCharges: true,
        }
    })

    if (sales_invoice) {
        return sales_invoice;
    }
    if (purchase_invoice) {
        return purchase_invoice;
    }
    return null;
}

export { getProviderByUserId, getInvoiceById };