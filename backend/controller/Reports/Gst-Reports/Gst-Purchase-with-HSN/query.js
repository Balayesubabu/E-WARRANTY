import { Provider, PurchaseInvoice } from "../../../../prisma/db-models.js";

const getProviderByUserId = async (user_id) => {
    const provider = await Provider.findFirst({
        where: {
            user_id: user_id
        }
    });
    return provider;
}

const getPurchaseInvoicesByProviderId = async (provider_id, franchise_id, start_date, end_date) => {
    const purchase_invoices = await PurchaseInvoice.findMany({
        where: {
            provider_id: provider_id,
            franchise_id: franchise_id,
            invoice_date: {
                gte: new Date(start_date),
                lte: new Date(end_date)
            },
            is_deleted: false,
            invoice_type: "Purchase"
        },
        include: {
            provider_customer: {
                select: {
                    customer_name: true,
                    customer_gstin_number: true,
                    customer_phone: true,
                    customer_email: true,
                    customer_state: true
                }
            },
            franchise: {
                select: {
                    state: true
                }
            },
            PurchasePart: {
                include: {
                    franchise_inventory: {
                        select: {
                            product_hsn_code: true,
                        }
                    }
                }
            },
            PurchaseService: {
                include: {
                    franchise_service: {
                        select: {
                            service_sac_code: true,
                        }
                    }
                }
            }
        }
    });
    return purchase_invoices;
}

export { getProviderByUserId, getPurchaseInvoicesByProviderId };