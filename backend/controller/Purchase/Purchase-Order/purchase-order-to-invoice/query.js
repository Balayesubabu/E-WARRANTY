import {
    Provider,
    PurchaseInvoice,
    PurchasePart,
    PurchaseService,
    PurchaseInvoiceParty,
    PurchaseInvoiceTransactions,
    FranchiseInventory,
    ProviderCustomers,
    Transaction,
    QuickSettings
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

const getPurchaseOrderById = async (provider_id, franchise_id, purchase_invoice_id) => {
    const purchaseOrder = await PurchaseInvoice.findFirst({
        where: {
            id: purchase_invoice_id,
            provider_id: provider_id,
            franchise_id: franchise_id,
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

const updatePurchaseInvoiceStatus = async (purchase_invoice_id, tx) => {
  return tx.purchaseInvoice.update({
    where: { id: purchase_invoice_id },
    data: {
      invoice_type: "Purchase_Order",
      invoice_status: "Purchase_Order_Converted",
      updated_at: new Date(),
    },
  });
};

// const updateFranchiseInventory = async (franchise_inventory_id, quantity, tx) => {
//     const updatedInventory = await tx.franchiseInventory.update({
//         where: {
//             id: franchise_inventory_id
//         },
//         data: {
//             product_quantity: {
//                 increment: quantity
//             },
//             updated_at: new Date()
//         }
//     });
//     return updatedInventory;
// };

const createPurchaseParts = async (purchase_invoice_id, data, tx) => {
  const purchasePart = await tx.purchasePart.create({
    data: {
      purchase_invoice_id: purchase_invoice_id,
      franchise_inventory_id: data.franchise_inventory_id,
      part_name: data.part_name,
      part_hsn_code: data.part_hsn_code,
      part_description: data.part_description,
      part_purchase_price: data.part_purchase_price,
      part_quantity: data.part_quantity,
      part_discount_percentage: 0,
      part_discount_amount: 0,
      part_mesuring_unit: data.part_mesuring_unit,
      part_gst_percentage: data.part_gst_percentage,
      part_gst_amount: data.part_gst_amount,
      part_total_price: data.part_total_price,
    },
  });
  return purchasePart;
};

const updateFranchiseInventory = async (
  franchise_inventory_id,provider_id,franchise_id,
  quantity,
  tx
) => {
  const franchiseInventory = await tx.franchiseInventory.update({
    where: { id: franchise_inventory_id, provider_id: provider_id, franchise_id: franchise_id },
    data: { product_quantity: { increment: quantity } },
  });
  return franchiseInventory;
};

const createPurchaseServices = async (purchase_invoice_id, data, tx) => {
  const purchaseService = await tx.purchaseService.create({
    data: {
      purchase_invoice_id: purchase_invoice_id,
      franchise_service_id: data.franchise_service_id,
      service_name: data.service_name,
      service_sac_number: data.service_sac_number,
      service_description: data.service_description,
      service_discount_percentage: 0,
      service_discount_amount: 0,
      service_price: data.service_price,
      service_gst_percentage: data.service_gst_percentage,
      service_gst_amount: data.service_gst_amount,
      service_total_price: data.service_total_price,
    },
  });
  return purchaseService;
};

const updateCustomerBalance = async (provider_customer_id, amount, tx) => {
    const updatedCustomer = await tx.providerCustomers.update({
        where: {
            id: provider_customer_id
        },
        data: {
            customer_final_balance: {
                decrement: amount
            },
            updated_at: new Date()
        }
    });
    return updatedCustomer;
};

const createPurchaseInvoiceTransactions = async (purchase_invoice_id, total_amount, tx) => {
    const purchaseInvoiceTransaction = await tx.purchaseInvoiceTransactions.create({
        data: {
            purchase_invoice_id: purchase_invoice_id,
            invoice_type: "Purchase",
            amount: total_amount,
            total_amount: total_amount,
            pending_amount: total_amount,
            paid_amount: 0,
            transaction_type: "Online",
            transaction_status: "Pending",
            transaction_id: `PO_CONV_${Date.now()}`,
            created_at: new Date(),
            updated_at: new Date()
        }
    });
    return purchaseInvoiceTransaction;
};

const createTransactions = async (purchase_invoice_id, total_amount, provider_id, provider_customer_id, tx) => {
        const transaction = await tx.transaction.create({
            data: {
                provider_id: provider_id,
                provider_customer_id: provider_customer_id,
                purchase_invoice_id: purchase_invoice_id,
                invoice_type: "Purchase",
                amount: total_amount,
                transaction_type: "Online",
                transaction_status: "Pending",
                transaction_id: `PO_CONV_${Date.now()}`,
                created_at: new Date(),
                updated_at: new Date()
            }
        });
        return transaction;
    }


const getLatestInvoiceNumber = async (provider_id,franchise_id) => {
  const invoice_num = await QuickSettings.findFirst({
    where: {
      provider_id: provider_id,
      franchise_id: franchise_id,
      invoice_type: "Purchase",
    },
    orderBy: {
      sequence_number: "desc",
    },
  })
  return invoice_num
}

const updateQuickSettings = async (provider_id, franchise_id, sequence_number, prefix, tx) => {
    const quickSettings = await tx.quickSettings.findFirst({
        where: {
            provider_id: provider_id,
            franchise_id: franchise_id,
            invoice_type: "Purchase"
        }
    });

    if (!quickSettings) {
        return await QuickSettings.create({
            data: {
                provider_id: provider_id,
                franchise_id: franchise_id,
                invoice_type: "Purchase",
                prefix: prefix,
                sequence_number: sequence_number
            }
        });
    }
    else{
        return await QuickSettings.update({
        where: {
            id: quickSettings.id
        },  
        data: {
            prefix: prefix,
            sequence_number: sequence_number
        },
    });
    }
}

const createPurchaseInvoice = async (provider_id, franchise_id, staff_id, data, invoice_number, tx) => {
  const purchaseInvoice = await tx.purchaseInvoice.create({
    data: {
      provider_id,
      provider_customer_id: data.provider_customer_id,
      franchise_id,
      invoice_number,
      invoice_type: "Purchase",
      invoice_status: "New",
      invoice_date: new Date(),
      is_invoice_fully_paid: data.is_invoice_fully_paid,
      invoice_additional_discount_percentage: data.invoice_additional_discount_percentage || 0,
      invoice_additional_discount_amount: data.invoice_additional_discount_amount || 0,
      invoice_tds_percentage: data.invoice_tds_percentage || 0,
      invoice_tcs_percentage: data.invoice_tcs_percentage || 0,
      invoice_shipping_charges: data.invoice_shipping_charges || 0,
      is_auto_round_off: data.is_auto_round_off || false,
      auto_round_off_amount: data.auto_round_off_amount || 0,
      invoice_advance_amount: data.invoice_advance_amount || 0,
      advance_payment_type: data.advance_payment_type || null,
      advance_amount_online_transaction_id: data.advance_amount_online_transaction_id || null,
      advance_payment_date: data.advance_payment_date ? new Date(data.advance_payment_date) : null,
      invoice_payment_status: data.invoice_payment_status || "Unpaid",
      terms_and_conditions: data.terms_and_conditions || [],
      additional_notes: data.additional_notes || [],
      due_date_terms: data.due_date_terms || null,
      due_date: data.due_date ? new Date(data.due_date) : null,
      invoice_total_amount: data.invoice_total_amount || 0,
      invoice_discount_amount: data.invoice_discount_amount || 0,
      invoice_gst_amount: data.invoice_gst_amount || 0,
      invoice_tds_amount: data.invoice_tds_amount || 0,
      invoice_tcs_amount: data.invoice_tcs_amount || 0,
      invoice_pending_amount: data.invoice_pending_amount || 0,
      invoice_paid_amount: data.invoice_paid_amount || 0,
      invoice_total_tax_amount: data.invoice_total_tax_amount || 0,
      invoice_total_parts_amount: data.invoice_total_parts_amount || 0,
      invoice_total_parts_tax_amount: data.invoice_total_parts_tax_amount || 0,
      invoice_total_services_amount: data.invoice_total_services_amount || 0,
      invoice_total_services_tax_amount: data.invoice_total_services_tax_amount || 0,
      invoice_total_parts_services_amount: data.invoice_total_parts_services_amount || 0,
      invoice_total_parts_services_tax_amount: data.invoice_total_parts_services_tax_amount || 0,
      created_by: staff_id || provider_id,
    }
  });

  return purchaseInvoice;
};

const createPurchaseInvoiceParty = async (purchase_invoice_id, partyData, tx) => {
    const purchaseInvoiceParty = await tx.purchaseInvoiceParty.create({
      data: {
        purchase_invoice_id: purchase_invoice_id,
        ...partyData
      }
    });
    return purchaseInvoiceParty;
};

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
  getPurchaseOrderById,
  updatePurchaseInvoiceStatus,
  updateFranchiseInventory,
  updateCustomerBalance,
  createPurchaseInvoice,
  createPurchaseInvoiceParty,
  createTransactions,
  getLatestInvoiceNumber,
  updateQuickSettings,
    createPurchaseInvoiceTransactions,
    createPurchaseParts,
    createPurchaseServices,
    createFranchiseInventoryTransaction,
    getAllDataPurchaseInvoiceById,
    updateUrl

}; 