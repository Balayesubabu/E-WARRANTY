import {
    Provider,
    PurchaseInvoice,
    ProviderCustomers,
    FranchiseInventory
} from "../../../../prisma/db-models.js";

const getProviderByUserId = async (user_id) => {
    const provider = await Provider.findFirst({
        where: {
            user_id: user_id,
            is_deleted: false
        }
    })
    return provider;
}

const getPurchaseInvoiceById = async (debit_note_id) => {
    const debitNote = await PurchaseInvoice.findFirst({
        where: {
            id: debit_note_id,
            invoice_type: "Debit_Note",
            is_deleted: false
        },
        include: {
            PurchasePart: true,
            PurchaseService: true,
            PurchaseInvoiceTransactions: true,
            Transaction: true
        }
    });
    return debitNote;
}

const deletePurchaseInvoice = async (debit_note_id, user_id, tx) => {
    const deletedDebitNote = await tx.purchaseInvoice.update({
        where: {
            id: debit_note_id
        },
        data: {
            is_deleted: true,
            deleted_at: new Date(),
            deleted_by_id: user_id
        }
    });
    return deletedDebitNote;
}

const updateProviderCustomerFinalBalance = async (provider_customer_id, balance_difference, tx) => {
    const providerCustomer = await tx.providerCustomers.update({
        where: {
            id: provider_customer_id
        },
        data: {
            customer_final_balance: {
                increment: balance_difference // Increment for debit note deletion (reverse the debit note effect)
            }
        }
    });
    return providerCustomer;
}

const restoreFranchiseInventory = async (franchise_inventory_id, quantity, tx) => {
    const updatedInventory = await tx.franchiseInventory.update({
        where: {
            id: franchise_inventory_id
        },
        data: {
            product_quantity: {
                increment: quantity  // Increment for debit note deletion (restore items back to inventory)
            }
        }
    });
    return updatedInventory;
}

const revertProviderDebitNoteNumber = async (provider_id, tx) => {
    const updatedProvider = await tx.provider.update({
        where: {
            id: provider_id
        },
        data: {
            debit_note_invoice_number: {
                decrement: 1
            }
        }
    });
    return updatedProvider;
}

export {
    getProviderByUserId,
    getPurchaseInvoiceById,
    deletePurchaseInvoice,
    updateProviderCustomerFinalBalance,
    restoreFranchiseInventory,
    revertProviderDebitNoteNumber
};
