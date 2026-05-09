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

const getPurchaseOrderById = async (purchase_invoice_id, provider_id, franchise_id) => {
    const purchaseOrder = await PurchaseInvoice.findFirst({
        where: {
            id: purchase_invoice_id,
            provider_id: provider_id,
            invoice_type: "Purchase_Order",
            franchise_id: franchise_id,
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
        }
    });
    console.log("purchaseOrder",purchaseOrder);
    return purchaseOrder;

};

export {
    getProviderByUserId,
    getPurchaseOrderById
};