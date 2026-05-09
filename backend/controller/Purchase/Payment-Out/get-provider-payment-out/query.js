import { Provider, PurchaseInvoiceTransactions } from "../../../../prisma/db-models.js";

const getProviderByUserId = async (user_id) => {
    const provider = await Provider.findFirst({
        where: {
            user_id: user_id,
            is_deleted: false
        }
    });
    return provider;
}

const getProviderPaymentOut = async (provider_id, franchise_id) => {
    const paymentOut = await PurchaseInvoiceTransactions.findMany({
        where: {
            invoice_type: "Payment_Out",
            isActive: true,
            purchase_invoice: {
                provider_id: provider_id,
                franchise_id: franchise_id,
                is_deleted: false
            }
        },
        include: {
            purchase_invoice: {
                include: {
                    provider: {
                        include: {
                            user: true
                        }
                    },
                    provider_customer: true,
                    franchise: true,
                    PurchaseInvoiceParty: {
                        where: {
                            type: "Bill_To"
                        }
                    }
                }
            }
        },
        orderBy: {
            created_at: 'desc'
        }
    });
    return paymentOut;
}

export { getProviderByUserId, getProviderPaymentOut };