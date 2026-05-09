import {
    Provider,
    PurchaseInvoice
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

const getPurchaseReturnByDate = async (provider_id, franchise_id, staff_id, start_date, end_date) => {
    const purchaseReturns = await PurchaseInvoice.findMany({
        where: { 
            provider_id: provider_id,
            franchise_id: franchise_id,
            ...(staff_id ? { staff_id: staff_id } : {}),
            invoice_type: "Purchase_Return",
            is_deleted: false,
            invoice_date: {
                gte: new Date(start_date),
                lte: new Date(end_date)
            }
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
    return purchaseReturns;
};

export {
    getProviderByUserId,
    getPurchaseReturnByDate
};
