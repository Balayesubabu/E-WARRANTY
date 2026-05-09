import {
    Provider,
    ProviderCustomers,
    PurchaseInvoice,
    PurchasePart,
    PurchaseService,
    PurchaseInvoiceTransactions,
    Transaction,
    FranchiseInventory,
    PurchaseInvoiceParty,
    Franchise
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

const getPurchaseInvoiceById = async (purchase_invoice_id, tx) => {
    const purchaseInvoice = await tx.purchaseInvoice.findFirst({
        where: { id: purchase_invoice_id },
        include: {
            PurchasePart: true,
            PurchaseService: true,
            PurchaseInvoiceParty: true,
            PurchaseInvoiceTransactions: true
        }
    });
    return purchaseInvoice;
};

const clearPurchaseInvoice = async (purchase_invoice_id, tx) => {
    // Delete purchase invoice party records
    await tx.purchaseInvoiceParty.deleteMany({
        where: { purchase_invoice_id: purchase_invoice_id }
    });

    // Delete purchase parts
    await tx.purchasePart.deleteMany({
        where: { purchase_invoice_id: purchase_invoice_id }
    });

    // Delete purchase services
    await tx.purchaseService.deleteMany({
        where: { purchase_invoice_id: purchase_invoice_id }
    });

    // Delete purchase invoice transactions
    await tx.purchaseInvoiceTransactions.deleteMany({
        where: { purchase_invoice_id: purchase_invoice_id }
    });

    // Delete related transactions
    await tx.transaction.deleteMany({
        where: {
            purchase_invoice_id: purchase_invoice_id
        }
    });
};

const deletePurchaseInvoice = async (purchase_invoice_id, tx) => {
    const purchaseInvoice = await tx.purchaseInvoice.delete({
        where: { id: purchase_invoice_id }
    });
    return purchaseInvoice;
};

const updateProviderCustomerFinalBalance = async (provider_customer_id, balance_difference, tx) => {
    const providerCustomer = await tx.providerCustomers.update({
        where: { id: provider_customer_id },
        data: { customer_final_balance: { increment: balance_difference } }
    });
    return providerCustomer;
};

const restoreFranchiseInventory = async (franchise_inventory_id, quantity, tx) => {
    const franchiseInventory = await tx.franchiseInventory.update({
        where: { id: franchise_inventory_id },
        data: { product_quantity: { increment: quantity } }
    });
    return franchiseInventory;
};

const revertProviderPurchaseInvoiceNumber = async (provider_id, tx) => {
    const provider = await tx.provider.update({
        where: { id: provider_id },
        data: { purchase_invoice_number: { decrement: 1 } }
    });
    return provider;
};

export {
    getProviderByUserId,
    getPurchaseInvoiceById,
    clearPurchaseInvoice,
    deletePurchaseInvoice,
    updateProviderCustomerFinalBalance,
    restoreFranchiseInventory,
    revertProviderPurchaseInvoiceNumber
};
