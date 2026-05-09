import {
    Provider,
    PurchaseInvoice,
    PurchasePart,
    PurchaseService,
    PurchaseInvoiceParty,
    FranchiseInventory,
    ProviderCustomers
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

const getPurchaseReturnById = async (purchase_invoice_id, tx) => {
    const purchaseReturn = await PurchaseInvoice.findFirst({
        where: {
            id: purchase_invoice_id,
            invoice_type: "Purchase_Return",
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
            provider_customer: {
                include: {
                    CustomerCategory: true
                }
            },
            franchise: true,
            staff: true
        }
    });
    return purchaseReturn;
};

const clearPurchaseReturn = async (purchase_invoice_id, tx) => {
    // Delete related records
    await PurchasePart.deleteMany({
        where: {
            purchase_invoice_id: purchase_invoice_id
        }
    });

    await PurchaseService.deleteMany({
        where: {
            purchase_invoice_id: purchase_invoice_id
        }
    });

    await PurchaseInvoiceParty.deleteMany({
        where: {
            purchase_invoice_id: purchase_invoice_id
        }
    });

    return true;
};

const deletePurchaseReturn = async (purchase_invoice_id, tx) => {
    const deletedPurchaseReturn = await PurchaseInvoice.update({
        where: {
            id: purchase_invoice_id
        },
        data: {
            is_deleted: true
        }
    });
    return deletedPurchaseReturn;
};

const updateProviderCustomerFinalBalance = async (provider_customer_id, balance_difference, tx) => {
    const updatedCustomer = await ProviderCustomers.update({
        where: {
            id: provider_customer_id
        },
        data: {
            customer_final_balance: {
                increment: balance_difference
            }
        }
    });
    return updatedCustomer;
};

const restoreFranchiseInventory = async (franchise_inventory_id, quantity_change, tx) => {
    const updatedInventory = await FranchiseInventory.update({
        where: {
            id: franchise_inventory_id
        },
        data: {
            product_quantity: {
                increment: quantity_change
            }
        }
    });
    return updatedInventory;
};

const revertProviderPurchaseReturnNumber = async (provider_id, tx) => {
    // Decrement the purchase return invoice number counter when deleting a purchase return
    const updatedProvider = await Provider.update({
        where: {
            id: provider_id
        },
        data: {
            purchase_return_invoice_number: {
                decrement: 1
            }
        }
    });
    return updatedProvider;
};

export {
    getProviderByUserId,
    getPurchaseReturnById,
    clearPurchaseReturn,
    deletePurchaseReturn,
    updateProviderCustomerFinalBalance,
    restoreFranchiseInventory,
    revertProviderPurchaseReturnNumber
};
