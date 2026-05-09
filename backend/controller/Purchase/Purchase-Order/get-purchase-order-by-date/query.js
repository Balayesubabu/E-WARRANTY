import {
    Provider,
    PurchaseInvoice,
    PurchasePart,
    PurchaseService,
    PurchaseInvoiceParty,
    PurchaseInvoiceTransactions
} from "../../../../prisma/db-models.js";

const getProviderByUserId = async (user_id) => {
    const provider = await Provider.findFirst({
        where: {
            user_id: user_id,
            is_deleted: false
        },
        include: {
            user: true
        }
    });
    return provider;
};

const getPurchaseOrderByDate = async (provider_id, franchise_id, staff_id, start_date, end_date) => {
    const purchaseOrders = await PurchaseInvoice.findMany({
        where: {
            provider_id: provider_id,
            franchise_id: franchise_id,
            ...(staff_id ? { staff_id: staff_id } : {}),
            invoice_type: "Purchase_Order",
            invoice_date: {
                gte: new Date(start_date),
                lte: new Date(end_date)
            },
            is_deleted: false
        },
        include: {
            PurchasePart: {
                include: {
                    franchise_inventory: {
                        include: {
                            franchise: true,
                            //category: true
                        }
                    }
                }
            },
            PurchaseService: {
                include: {
                    franchise_service: {
                        include: {
                            franchise: true
                        }
                    }
                }
            },
            PurchaseInvoiceParty: true,
            PurchaseInvoiceTransactions: true,
            provider_customer: {
                include: {
                    CustomerCategory: true
                }
            },
            franchise: true,
            staff: true,
            PurchaseAdditionalCharges: true,
            provider: true,
            provider:{
                include:{user:true}
            }
        },
        orderBy: {
            invoice_date: 'desc'
        }
    });
    return purchaseOrders;
};

export {
    getProviderByUserId,
    getPurchaseOrderByDate
};
