import {
    Provider,
    PurchaseInvoice,
    PurchasePart,
    PurchaseService,
    PurchaseInvoiceParty,
    PurchaseInvoiceTransactions,
    FranchiseInventory,
    ProviderCustomers,
    PurchaseAdditionalCharges
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

const getPurchaseReturnById = async (purchase_invoice_id) => {
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
            PurchaseInvoiceTransactions: true,
            provider_customer: {
                include: {
                    CustomerCategory: true
                }
            },
            franchise: true,
            staff: true,
            PurchaseAdditionalCharges: true
        }
    });
    return purchaseReturn;
};

const getFranchiseInventoryById = async (franchise_inventory_id) => {
    const franchiseInventory = await FranchiseInventory.findFirst({
        where: {
            id: franchise_inventory_id,
            product_is_deleted: false
        },
        include: {
            franchise: true,
            //category: true
        }
    });
    return franchiseInventory;
};

const updatePurchaseReturn = async (purchase_invoice_id, provider_id, franchise_id, data, staff_id, tx) => {
    const updatedPurchaseReturn = await tx.purchaseInvoice.update({
        where: {
            id: purchase_invoice_id,
            provider_id: provider_id,
            franchise_id : franchise_id
        },
        data:  {
            provider_id,
            provider_customer_id: data.provider_customer_id,
            franchise_id: franchise_id,
            invoice_number: data.invoice_number,
            // original_invoice_number: data.original_invoice_number,
            invoice_type: "Purchase_Return",
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
            updated_by: staff_id ? staff_id : provider_id,
            link_to: data.link_to,
            apply_tds: data.apply_tds,
            apply_tcs: data.apply_tcs

        }
    });
    return updatedPurchaseReturn;
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

const createPurchaseParts = async (purchase_invoice_id, partData, tx) => {
    const createdPart = await PurchasePart.create({
        data: {
            ...partData,
            purchase_invoice_id: purchase_invoice_id
        }
    });
    return createdPart;
};

const updateFranchiseInventory = async (franchise_inventory_id, quantity_change, tx) => {
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

const createPurchaseServices = async (purchase_invoice_id, serviceData, tx) => {
    const createdService = await PurchaseService.create({
        data: {
            ...serviceData,
            purchase_invoice_id: purchase_invoice_id
        }
    });
    return createdService;
};

const createPurchaseInvoiceParty = async (purchase_invoice_id, partyData, tx) => {
    const createdParty = await PurchaseInvoiceParty.create({
        data: {
            ...partyData,
            purchase_invoice_id: purchase_invoice_id
        }
    });
    return createdParty;
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

    await PurchaseAdditionalCharges.deleteMany({
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

const getPurchaseReturnTransactions = async (purchase_invoice_id) => {
    const transactions = await PurchaseInvoiceTransactions.findMany({
        where: {
            purchase_invoice_id: purchase_invoice_id
        }
    });
    return transactions;
};

const restoreFranchiseInventory = async (franchise_inventory_id, quantity_change) => {
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
};

const getAllDataPurchaseInvoiceById = async (purchase_invoice_id) => {
  const purchaseInvoice = await PurchaseInvoice.findFirst({
    where: {
      id: purchase_invoice_id
    },
    include: {
      provider: true,
      provider:{
        include:{user:true}
      },
      provider_customer: true,
      franchise: true,
      PurchasePart: true,
      PurchaseService: true,
      PurchaseInvoiceParty: true,
      PurchaseInvoiceTransactions: true,
      PurchasePackage: true,
      Transaction: true,
      PurchaseAdditionalCharges: true,
      ProviderBank: true,
    },
  });
  return purchaseInvoice;
};

const getAllDataPurchaseInvoiceById1 = async (purchase_invoice_id, purchaseId) => {
  const purchaseInvoice = await PurchaseInvoice.findFirst({
    where: {
      id: purchase_invoice_id
    },
    include: {
      provider: true,
      provider:{
        include:{user:true}
      },
      provider_customer: true,
      franchise: true,
      PurchasePart: true,
      PurchaseService: true,
      PurchaseInvoiceParty: true,
      PurchaseInvoiceTransactions: true,
      PurchasePackage: true,
      Transaction: true,
      PurchaseAdditionalCharges: true,
      ProviderBank: true,
    },
  });
  const linkedPurchaseInvoice = await PurchaseInvoice.findFirst({
    where: {
      id: purchaseId
    },
  });
  purchaseInvoice.linked_invoice_number = linkedPurchaseInvoice.invoice_number;
  purchaseInvoice.linked_invoice_total_amount = linkedPurchaseInvoice.invoice_total_amount;
  purchaseInvoice.linked_invoice_type = linkedPurchaseInvoice.invoice_type;
  return purchaseInvoice;
};

const updateUrl = async (purchase_invoice_id, url) => {
  const updatedInvoice = await PurchaseInvoice.update({
    where: {
      id: purchase_invoice_id,
    },
    data: {
      invoice_pdf_url: url,
    },
  });
  return updatedInvoice;
};

export {
    getProviderByUserId,
    getPurchaseReturnById,
    getFranchiseInventoryById,
    updatePurchaseReturn,
    updateProviderCustomerFinalBalance,
    createPurchaseParts,
    updateFranchiseInventory,
    createPurchaseServices,
    createPurchaseInvoiceParty,
    clearPurchaseReturn,
    getPurchaseReturnTransactions,
    restoreFranchiseInventory,
    createPurchaseAdditionalCharges,
    getAllDataPurchaseInvoiceById,
    getAllDataPurchaseInvoiceById1,
    updateUrl
};
