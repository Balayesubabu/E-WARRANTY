import {
    Provider,
    PurchaseInvoice,
    PurchasePart,
    PurchaseService,
    PurchaseInvoiceParty,
    PurchaseInvoiceTransactions,
    Transaction
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

const getPurchaseOrderById = async (purchase_invoice_id) => {
    const purchaseOrder = await PurchaseInvoice.findFirst({
        where: {
            id: purchase_invoice_id,
            invoice_type: "Purchase_Order",
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
            staff: true
        }
    });
    return purchaseOrder;
};

const clearPurchaseOrder = async (purchase_invoice_id) => {
    // Delete all related transactions
    await Transaction.deleteMany({
        where: {
            purchase_invoice_id: purchase_invoice_id
        }
    });

    // Delete all purchase invoice transactions
    await PurchaseInvoiceTransactions.deleteMany({
        where: {
            purchase_invoice_id: purchase_invoice_id
        }
    });

    // Delete all purchase invoice parties
    await PurchaseInvoiceParty.deleteMany({
        where: {
            purchase_invoice_id: purchase_invoice_id
        }
    });

    // Delete all purchase parts
    await PurchasePart.deleteMany({
        where: {
            purchase_invoice_id: purchase_invoice_id
        }
    });

    // Delete all purchase services
    await PurchaseService.deleteMany({
        where: {
            purchase_invoice_id: purchase_invoice_id
        }
    });
};

const deletePurchaseOrder = async (purchase_invoice_id, deleted_by_id) => {
    const deletedPurchaseOrder = await PurchaseInvoice.update({
        where: {
            id: purchase_invoice_id
        },
        data: {
            is_deleted: true,
            deleted_at: new Date(),
            deleted_by_id: deleted_by_id
        }
    });
    return deletedPurchaseOrder;
};

const revertProviderPurchaseOrderNumber = async (provider_id) => {
    const provider = await Provider.findUnique({
        where: {
            id: provider_id
        }
    });

    if (provider && provider.purchase_order_invoice_number > 0) {
        await Provider.update({
            where: {
                id: provider_id
            },
            data: {
                purchase_order_invoice_number: {
                    decrement: 1
                }
            }
        });
    }
};

export {
    getProviderByUserId,
    getPurchaseOrderById,
    clearPurchaseOrder,
    deletePurchaseOrder,
    revertProviderPurchaseOrderNumber
};
