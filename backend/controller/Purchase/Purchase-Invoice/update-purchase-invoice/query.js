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
    Franchise,
    PurchaseAdditionalCharges,
    FranchiseInventoryTransaction
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
    })
    return provider;
}

const getPurchaseInvoiceById = async (purchase_invoice_id, provider_id, franchise_id) => {
    const purchaseInvoice = await PurchaseInvoice.findFirst({
        where: {
            id: purchase_invoice_id,
            provider_id: provider_id,
            franchise_id: franchise_id
        },
        include: {
            PurchasePart: true,
            PurchaseService: true,
            PurchaseInvoiceParty: true,
            PurchaseInvoiceTransactions: true
        }
    })
    return purchaseInvoice;
}

const getFranchiseInventoryById = async (franchise_inventory_id) => {
    const franchiseInventory = await FranchiseInventory.findFirst({
        where: {
            id: franchise_inventory_id
        }
    })
    return franchiseInventory;
}

const updatePurchaseInvoice = async ( purchase_invoice_id, provider_id, franchise_id, staff_id, data, tx) => {

    console.log("purchase_invoice_id", purchase_invoice_id);
    console.log("provider_id", provider_id);
    console.log("staff_id", staff_id);
    console.log("franchise_id", franchise_id);
    

    const purchaseInvoice = await tx.purchaseInvoice.update({
        where: {
            id: purchase_invoice_id,
            provider_id: provider_id,
            franchise_id: franchise_id
        },
        data: {
            provider_customer_id: data.provider_customer_id,
            // franchise_id: franchise_id,
            // original_invoice_number: data.original_invoice_number,
            invoice_type: data.invoice_type,
            invoice_status: data.invoice_status,
            invoice_date: data.invoice_date,
            is_invoice_fully_paid: data.is_invoice_fully_paid,
            invoice_additional_discount_percentage: data.invoice_additional_discount_percentage,
            invoice_additional_discount_amount: data.invoice_additional_discount_amount,
            invoice_tds_percentage: data.invoice_tds_percentage,
            invoice_tcs_percentage: data.invoice_tcs_percentage,
            invoice_shipping_charges: data.invoice_shipping_charges,
            is_auto_round_off: data.is_auto_round_off,
            auto_round_off_amount: data.auto_round_off_amount,
            invoice_advance_amount: data.invoice_advance_amount,
            advance_payment_type: data.advance_payment_type,
            advance_amount_online_transaction_id: data.advance_amount_online_transaction_id,
            advance_payment_date: data.advance_payment_date,
            invoice_payment_status: data.invoice_payment_status,
            terms_and_conditions: data.terms_and_conditions,
            additional_notes: data.additional_notes,
            due_date_terms: data.due_date_terms,
            due_date: data.due_date,
            invoice_total_amount: data.invoice_total_amount,
            invoice_discount_amount: data.invoice_discount_amount,
            invoice_gst_amount: data.invoice_gst_amount,
            invoice_tds_amount: data.invoice_tds_amount,
            invoice_tcs_amount: data.invoice_tcs_amount,
            invoice_pending_amount: data.invoice_pending_amount,
            invoice_paid_amount: data.invoice_paid_amount,
            invoice_total_tax_amount: data.invoice_total_tax_amount,
            invoice_total_parts_amount: data.invoice_total_parts_amount,
            invoice_total_parts_tax_amount: data.invoice_total_parts_tax_amount,
            invoice_total_services_amount: data.invoice_total_services_amount,
            invoice_total_services_tax_amount: data.invoice_total_services_tax_amount,
            invoice_total_parts_services_amount: data.invoice_total_parts_services_amount,
            invoice_total_parts_services_tax_amount: data.invoice_total_parts_services_tax_amount,
            updated_by: staff_id ? staff_id : provider_id
        }
    })
    return purchaseInvoice;
}

const updateProviderCustomerFinalBalance = async (provider_customer_id, provider_id, franchise_id, balance_difference, tx) => {
    const providerCustomer = await tx.providerCustomers.update({
        where: {
            id: provider_customer_id,
            provider_id: provider_id,
        },
        data: {
            customer_final_balance: {
                decrement: balance_difference
            }
        }
    })
    return providerCustomer;
}

const createPurchaseInvoiceParty = async (purchase_invoice_id, data, tx) => {
    const purchaseInvoiceParty = await tx.purchaseInvoiceParty.create({
        data: {
            purchase_invoice_id: purchase_invoice_id,
            type: data.type,
            party_name: data.party_name,
            party_country_code: data.party_country_code,
            party_phone: data.party_phone,
            party_email: data.party_email,
            party_address: data.party_address,
            party_city: data.party_city,
            party_state: data.party_state,
            party_pincode: data.party_pincode,
            party_gstin_number: data.party_gstin_number,
            party_vehicle_number: data.party_vehicle_number
        }
    })
    return purchaseInvoiceParty;
}

const createPurchaseParts = async (purchase_invoice_id, data, tx) => {
    const purchaseParts = await tx.purchasePart.create({
        data: {
            purchase_invoice_id: purchase_invoice_id,
            franchise_inventory_id: data.franchise_inventory_id,
            part_name: data.part_name,
            part_hsn_code: data.part_hsn_code,
            part_description: data.part_description,
            part_purchase_price: data.part_purchase_price,
            part_quantity: data.part_quantity,
            part_discount_percentage: data.part_discount_percentage,
            part_discount_amount: data.part_discount_amount,
            part_mesuring_unit: data.part_mesuring_unit,
            part_gst_percentage: data.part_gst_percentage,
            part_gst_amount: data.part_gst_amount,
            part_total_price: data.part_total_price
        }
    })
    return purchaseParts;
}

const updateFranchiseInventory = async (franchise_inventory_id, provider_id, franchise_id, quantity, tx) => {
    const franchiseInventory = await tx.franchiseInventory.update({
        where: {
            id: franchise_inventory_id,
            provider_id: provider_id,
            franchise_id: franchise_id
        },
        data: {
            product_quantity: {
                increment: quantity
            }
        }
    })
    return franchiseInventory;
}

const createPurchaseServices = async (purchase_invoice_id, data, tx) => {
    const purchaseServices = await tx.purchaseService.create({
        data: {
            purchase_invoice_id: purchase_invoice_id,
            franchise_service_id: data.franchise_service_id,
            service_name: data.service_name,
            service_description: data.service_description,
            service_discount_percentage: data.service_discount_percentage,
            service_discount_amount: data.service_discount_amount,
            service_price: data.service_price,
            service_gst_percentage: data.service_gst_percentage,
            service_gst_amount: data.service_gst_amount,
            service_total_price: data.service_total_price
        }
    })
    return purchaseServices;
}

const createPurchaseInvoiceTransactions = async (
  purchase_invoice_id,
  data,
  tx
) => {
  const purchaseInvoiceTransaction =
    await tx.purchaseInvoiceTransactions.create({
      data: {
        purchase_invoice_id: purchase_invoice_id,
        invoice_type: data.invoice_type,
        amount: data.amount,
        total_amount: data.total_amount,
        pending_amount: data.pending_amount,
        paid_amount: data.paid_amount,
        transaction_type: data.transaction_type,
        transaction_status: data.transaction_status,
        transaction_id: data.transaction_id,
      },
    });
  return purchaseInvoiceTransaction;
};

const createTransactions = async (purchase_invoice_id, data, tx) => {
  const transactions = await tx.transaction.create({
    data: {
      purchase_invoice_id,
      provider_id: data.provider_id,
      provider_customer_id: data.provider_customer_id,
      invoice_type: data.invoice_type,
      amount: data.amount,
      money_out: data.money_out,
      transaction_type: data.transaction_type,
      transaction_status: data.transaction_status,
      transaction_id: data.transaction_id,
    },
  });
  return transactions;
};


const clearPurchaseInvoice = async (purchase_invoice_id) => {
    // Delete purchase invoice parties
    await PurchaseInvoiceParty.deleteMany({
        where: {
            purchase_invoice_id: purchase_invoice_id
        }
    });

    // Delete purchase parts
    await PurchasePart.deleteMany({
        where: {
            purchase_invoice_id: purchase_invoice_id
        }
    });

    // Delete purchase services
    await PurchaseService.deleteMany({
        where: {
            purchase_invoice_id: purchase_invoice_id
        }
    });

    // Delete purchase invoice transactions
    await PurchaseInvoiceTransactions.deleteMany({
        where: {
            purchase_invoice_id: purchase_invoice_id
        }
    });

    // Delete transactions
    await Transaction.deleteMany({
        where: {
            purchase_invoice_id: purchase_invoice_id
        }
    });

    // Delete additional charges
    await PurchaseAdditionalCharges.deleteMany({
        where: {
            purchase_invoice_id: purchase_invoice_id
        }
    });

    await FranchiseInventoryTransaction.deleteMany({
        where: {
            purchase_invoice_id: purchase_invoice_id
        }
    });
}

const getPurchaseInvoiceTransactions = async (purchase_invoice_id, provider_id, franchise_id) => {
    const purchaseInvoiceTransactions = await PurchaseInvoiceTransactions.findMany({
        where: {
            purchase_invoice_id: purchase_invoice_id,
        }
    })
    return purchaseInvoiceTransactions;
}

const restoreFranchiseInventory = async (franchise_inventory_id, provider_id, franchise_id, quantity) => {
    const franchiseInventory = await FranchiseInventory.update({
        where: {
            id: franchise_inventory_id,
            provider_id: provider_id,
            franchise_id: franchise_id
        },
        data: {
            product_quantity: {
                increment: quantity
            }
        }
    })
    return franchiseInventory;
}

const createPurchaseAdditionalCharges = async (purchase_invoice_id, data, tx) => {
    const purchaseAdditionalCharges = await tx.purchaseAdditionalCharges.create({
        data: {
            purchase_invoice_id,
            name: data.name,
            amount: data.amount,
            gst_percentage: data.gst_percentage,
            gst_amount: data.gst_amount,
            total_amount: data.total_amount
        }
    })
    return purchaseAdditionalCharges;
}

const createFranchiseInventoryTransaction = (provider_id, purchase_invoice_id, data, tx) => {
  const inventoryTransaction = tx.franchiseInventoryTransaction.create({
    data: {
      purchase_invoice_id: purchase_invoice_id,
      provider_id: provider_id,
      franchise_id: data.franchise_id,
      franchise_inventory_id: data.franchise_inventory_id,
      action: data.action,      
      quantity: data.quantity,
      stock_changed_by: data.stock_changed_by,
      closing_stock: data.closing_stock,
    },
  });
  return inventoryTransaction;
}

export {
    getProviderByUserId,
    getPurchaseInvoiceById,
    getFranchiseInventoryById,
    updatePurchaseInvoice,
    updateProviderCustomerFinalBalance,
    createPurchaseParts,
    updateFranchiseInventory,
    createPurchaseServices,
    createPurchaseInvoiceParty,
    clearPurchaseInvoice,
    getPurchaseInvoiceTransactions,
    restoreFranchiseInventory,
    createPurchaseAdditionalCharges,
    createPurchaseInvoiceTransactions,
    createTransactions,
    createFranchiseInventoryTransaction
};